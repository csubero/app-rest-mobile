/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {useTheme} from '../../providers/ThemeProvider';
import {useGlobalSocket} from '../../providers/GlobalSocketProvider';
import {clearBag} from '../../redux/slice/bagSlice';
import {clearTableData, clearWaiterData} from '../../redux/slice/companySlice';
import {
  markSplitAsPaid,
  resetPaymentFlow,
  blockSplits,
  unblockSplits,
  setPaidSplits,
  setTotalSplitAmount,
  setSplitCount,
  setIsSplit,
  setSplitType,
} from '../../redux/slice/paymentFlowSlice';
import {resetCopilot, setCurrentView} from '../../redux/slice/settingsSlice';
import {useIsFocused} from '@react-navigation/native';
import {getOrderDetails} from '../../services/order/orderService';
import {PAYMENT_STATUS, STATUS} from '../../helpers/utils/OrderUtils';
import DynamicSurveyForm from '../../components/thankyou/DynamicSurveyForm';
import {submitReject} from '../../services/payment/surveyService';
import {SunmiPrinterHelper} from '../../helpers/printer/SunmiPrinterHelper';
import Constants from '../../helpers/config/Constants';
import {createStyles} from './styles';

const WAIT_TIME_SECONDS = 3;
const THANKS_TIME_SECONDS = 2;
const SURVEY_CHOICE_TIMEOUT_SECONDS = 60; // 1 minuto para responder

const ThankYou = ({route, navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {
    endOrderHelp,
    requestHelp,
    cancelAllSockets,
    // Removed isMultitabletBlocked - no longer blocking tablets
  } = useGlobalSocket();
  const {order, fully, setOnlyPaymentEnabled, paymentResponse} = route.params;
  // Fallback seguro para función recibida por params (evitar no-serializable)
  const setOnlyPaymentEnabledFn =
    typeof setOnlyPaymentEnabled === 'function'
      ? setOnlyPaymentEnabled
      : () => {};
  const {colors, font_type, dimensions, sizes} = useTheme();

  // Establecer y mantener la vista actual como 'thankyou' sólo cuando esta pantalla está enfocada
  const isFocused = useIsFocused();
  const currentView = useSelector(state => state.settings.currentView);
  useEffect(() => {
    if (isFocused) {
      dispatch(setCurrentView('thankyou'));
    }
  }, [isFocused, dispatch]);

  // Autocorrección: si estando enfocada alguien cambia currentView, volver a 'thankyou'
  useEffect(() => {
    if (isFocused && currentView !== 'thankyou') {
      dispatch(setCurrentView('thankyou'));
    }
  }, [isFocused, currentView, dispatch]);

  const {companySelected, pointOfSaleSelected, tableData} = useSelector(
    state => state.company,
  );
  const paymentFlow = useSelector(state => state.paymentFlow);
  const {orderConfirmedApiExternalId, orderConfirmedApiId} = useSelector(
    state => state.bag,
  );
  const {serverIp} = useSelector(state => state.store);
  const {apiToken} = useSelector(state => state.auth);

  const [showSurveyThanks, setShowSurveyThanks] = useState(false);
  const [redirectType, setRedirectType] = useState(null);
  const [surveyStep, setSurveyStep] = useState('cta'); // 'cta' | 'choice' | 'form' | 'thanks'
  const [countdown, setCountdown] = useState(WAIT_TIME_SECONDS);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderApiData, setOrderApiData] = useState(null); // Para datos de la API
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Crear estilos usando la función
  const styles = createStyles(colors, dimensions, font_type, sizes);

  // console.log(tableData);

  const generalData = {
    table_number: tableData?.table?.name || '000',
    order_series: orderConfirmedApiExternalId || 'FAC',
    order_number: orderConfirmedApiExternalId || 'FAC-000-0000',
  };

  const handleCallWaiter = async () => {
    try {
      if (tableData?.table?.id && tableData?.table?.name) {
        console.log('[ThankYou] Llamando al mesero por error');
        requestHelp(tableData.table.id, tableData.table.name);
      }
    } catch (error) {
      console.error('[ThankYou] Error al llamar mesero:', error);
    }
  };

  // Helpers robustos para verificar estados (numéricos o string)
  const isItemPaid = item => {
    const k = item?.payment_status?.key;
    const d = item?.payment_status?.display || item?.payment_status?.name;
    return (
      k === PAYMENT_STATUS.PAGADO ||
      k === 'PAGADO' ||
      d === 'Pagado' ||
      d === 'Completado'
    );
  };

  const isItemCanceled = item => {
    const k = item?.status?.key;
    const d = item?.status?.display || item?.status?.name;
    return k === STATUS.CANCELADO || k === 'CANCELADO' || d === 'Cancelado';
  };

  // Función para obtener los datos de la orden desde la API
  const fetchOrderData = async orderId => {
    try {
      const rawOrderData = await getOrderDetails({
        serverIp,
        apiToken,
        orderId,
      });

      setOrderApiData(rawOrderData);

      // Sincronizar payment_split con Redux state
      if (rawOrderData.payment_split) {
        const {split_count, total_split_amount, paying_splits} =
          rawOrderData.payment_split;

        console.log('[ThankYou] Sincronizando payment_split:', {
          split_count,
          total_split_amount,
          paying_splits,
        });

        // Actualizar el estado de Redux con los datos del payment_split
        dispatch(setSplitCount(split_count || 2));
        dispatch(setTotalSplitAmount(total_split_amount || 0));
        dispatch(setPaidSplits(paying_splits || []));
        if (!paymentFlow.splits.isBlocked) {
          dispatch(setIsSplit(true));
          dispatch(setSplitType('equal'));
          dispatch(blockSplits());
        }
      }

      return rawOrderData;
    } catch (error) {
      console.error('[ThankYou] Error al obtener datos de orden:', error);
      return null;
    }
  };

  // Función para obtener datos de orden desde múltiples fuentes
  const getOrderData = async () => {
    console.log('[ThankYou] Obteniendo datos de orden desde múltiples fuentes');
    console.log('[ThankYou] Parámetros recibidos:', {
      hasPaymentResponse: !!paymentResponse,
      hasOrder: !!order,
      orderConfirmedApiId,
      paymentResponseStructure: paymentResponse
        ? {
            hasOrder: !!paymentResponse.order,
            hasInvoice: !!paymentResponse.invoice,
            directInvoice: !!paymentResponse.invoice,
          }
        : null,
    });

    // 1. Intentar usar paymentResponse si está disponible
    if (paymentResponse && paymentResponse.invoice) {
      console.log(
        '[ThankYou] Usando datos del paymentResponse (invoice directo)',
      );
      setOrderApiData(paymentResponse);
      return paymentResponse;
    } else if (paymentResponse && paymentResponse.order) {
      console.log(
        '[ThankYou] Usando datos del paymentResponse (order anidado)',
      );
      setOrderApiData(paymentResponse.order);
      return paymentResponse.order;
    }

    // 2. Intentar obtener desde API si tenemos orderConfirmedApiId
    if (orderConfirmedApiId) {
      console.log('[ThankYou] Obteniendo datos desde API');
      return await fetchOrderData(orderConfirmedApiId);
    }

    // 3. Si no tenemos nada, usar null
    console.log('[ThankYou] No hay fuente de datos de orden disponible');
    return null;
  };

  const finalizePayment = async () => {
    try {
      setIsProcessingPayment(true);
      setHasError(false);
      setErrorMessage('');

      // Actualizar todos los productos a pagado y preparado
      await updateAllProductsStatus();

      // Llamar al mesero para que retire la tablet antes de limpiar la mesa
      if (tableData?.table?.id && tableData?.table?.name) {
        console.log('[ThankYou] Llamando al mesero para retirar tablet');
        endOrderHelp(tableData.table.id, tableData.table.name);
      }

      dispatch(clearBag());
      dispatch(clearTableData());
      dispatch(clearWaiterData());
      dispatch(unblockSplits());
      dispatch(resetPaymentFlow());
      dispatch(resetCopilot());
      setOnlyPaymentEnabledFn(false);

      // Removed multitablet blocking check - always show survey
      setRedirectType('survey');
      setSurveyStep('cta');
      setCountdown(WAIT_TIME_SECONDS);
      setIsProcessingPayment(false);

      // Cancelar todos los sockets cuando se navega a la encuesta (pago completo)
      console.log(
        '[ThankYou] Cancelando sockets - Navegando a encuesta (pago completo)',
      );
      cancelAllSockets();
    } catch (error) {
      console.error('❌ Error en finalizePayment:', error);

      // Configurar estado de error
      setIsProcessingPayment(false);
      setHasError(true);
      setErrorMessage(
        error.message ||
          'Error al procesar el pago. Por favor, solicite ayuda al mesero.',
      );

      // Intentar llamar al mesero incluso si hay error
      if (tableData?.table?.id && tableData?.table?.name) {
        console.log(
          '[ThankYou] Llamando al mesero para retirar tablet (con error)',
        );
        try {
          endOrderHelp(tableData.table.id, tableData.table.name);
        } catch (helpError) {
          console.error('❌ Error al llamar mesero:', helpError);
        }
      }
    }
  };

  const resetPaymentSimple = () => {
    // Reactivar botones cuando se regresa al pago
    setOnlyPaymentEnabledFn(false);
    setRedirectType('payment');
    setCountdown(WAIT_TIME_SECONDS);
  };

  const handleThank = async () => {
    // Mostrar loader inmediatamente al entrar mientras se procesa la lógica
    setIsProcessingPayment(true);
    let invoiceData = null;

    // Intentar obtener la factura desde diferentes fuentes
    if (paymentResponse && paymentResponse.invoice) {
      invoiceData = paymentResponse.invoice;
      console.log(
        '[ThankYou] Datos de factura encontrados desde paymentResponse:',
        {
          id: invoiceData.id,
          series: invoiceData.series,
          number: invoiceData.number,
          total: invoiceData.total,
        },
      );
    } else if (
      orderApiData &&
      orderApiData.invoices &&
      orderApiData.invoices.length > 0
    ) {
      // Fallback: usar la factura más reciente de la orden
      invoiceData = orderApiData.invoices[orderApiData.invoices.length - 1];
      console.log(
        '[ThankYou] Datos de factura encontrados desde orderApiData:',
        {
          id: invoiceData.id,
          series: invoiceData.series,
          number: invoiceData.number,
          total: invoiceData.total,
        },
      );
    } else {
      console.log('[ThankYou] No se encontraron datos de factura');
    }

    if (!Constants.DEV_PRINTER && invoiceData) {
      try {
        console.log('🖨️ Iniciando impresión de factura...');
        SunmiPrinterHelper.printInvoice(
          invoiceData,
          companySelected,
          pointOfSaleSelected,
        );
      } catch (error) {
        console.error('🚨 Error al imprimir la factura:', error);
        console.error('🚨 Stack trace:', error.stack);
      }
    } else if (!invoiceData) {
      console.log('[ThankYou] No hay datos de factura para imprimir');
    }

    //Aca se finaliza todo el pago
    if (!paymentFlow.isSplit) {
      await finalizePayment();
      return;
    }

    //Aca se finaliza si el pago es en partes iguales
    if (paymentFlow.splitType === 'equal') {
      dispatch(markSplitAsPaid());
      dispatch(blockSplits());
      dispatch(resetPaymentFlow());

      const totalSplits = paymentFlow.splits.splitCount || 1;
      const paid = [...paymentFlow.splits.paidSplits];
      const selected = [...paymentFlow.splits.selectedSplits];
      const totalPagados = new Set([...paid, ...selected]).size;

      if (totalPagados >= totalSplits) {
        // Si es el último split, actualizar todos los productos y finalizar
        await finalizePayment();
      } else {
        // Si no es el último split, solo redirigir al pago
        setIsProcessingPayment(false);
        resetPaymentSimple();
      }
    } else {
      //Aca se finaliza si el pago es por productos seleccionados

      console.log('[ThankYou] Finalizando pago por productos seleccionados');

      dispatch(resetPaymentFlow());

      setTimeout(async () => {
        let currentOrderData = orderApiData;

        // Siempre obtener datos frescos para estar seguros
        if (orderConfirmedApiId) {
          currentOrderData = await fetchOrderData(orderConfirmedApiId);
        }

        // Si tenemos datos de la API, usarlos
        let productsToCheck = [];

        if (currentOrderData && currentOrderData.items) {
          // Usar datos de la API
          productsToCheck = currentOrderData.items.filter(
            item =>
              !isItemPaid(item) &&
              !isItemCanceled(item) &&
              (item.total_line || 0) > 0,
          );
        } else {
          console.log(
            '[ThankYou] No se pudieron obtener datos de la API para verificar',
          );
        }

        console.log(
          '[ThankYou] Productos sin pagar restantes:',
          productsToCheck.length,
        );

        if (productsToCheck.length === 0) {
          finalizePayment();
        } else {
          setIsProcessingPayment(false);
          resetPaymentSimple();
        }
      }, 100);
    }
  };

  // Función para actualizar todos los productos de la orden a pagado y preparado
  const updateAllProductsStatus = async () => {
    try {
      console.log('[ThankYou] Iniciando actualización de productos...');

      // Obtener datos frescos de la API
      let currentOrderData = orderApiData;
      if (orderConfirmedApiId && !currentOrderData) {
        currentOrderData = await fetchOrderData(orderConfirmedApiId);
      }

      if (!currentOrderData) {
        console.log(
          '[ThankYou] No hay datos de orden disponibles para actualizar',
        );
        // Si no tenemos datos, asumir que ya están actualizados y continuar
        return;
      }

      // Trabajar con datos de la API
      console.log(
        '[ThankYou] Productos en la orden (API):',
        currentOrderData.items,
      );

      // Filtrar solo productos que no estén pagados Y que no estén cancelados
      const unpaidProducts = (currentOrderData.items || []).filter(
        item => !isItemPaid(item) && !isItemCanceled(item),
      );

      console.log(
        '[ThankYou] Productos pendientes de pago (API):',
        unpaidProducts.length,
      );

      if (unpaidProducts.length === 0) {
        console.log(
          '[ThankYou] No hay productos por actualizar - todos están pagados',
        );
        return; // No hay productos por actualizar
      }

      console.log(
        '[ThankYou] Actualización de productos completada (delegado a la API)',
      );
    } catch (error) {
      console.error(
        '[ThankYou] Error al actualizar estados de productos:',
        error,
      );
      // No lanzar el error para evitar romper el flujo
    }
  };

  // Redirección segura después de mostrar el mensaje de gracias
  useEffect(() => {
    if (
      redirectType === 'survey' &&
      surveyStep === 'thanks' &&
      countdown <= 0
    ) {
      // Reactivar botones antes de ir a VideoView
      setOnlyPaymentEnabledFn(false);
      // Restablecer vista por defecto
      dispatch(setCurrentView('menu'));
      navigation.reset({
        index: 0,
        routes: [{name: 'VideoView'}],
      });
    }
  }, [redirectType, surveyStep, countdown, navigation]);

  const handleSurveySend = () => {
    // Cancelar sockets cuando se envía la encuesta completada
    console.log('[ThankYou] Cancelando sockets - Encuesta enviada');
    cancelAllSockets();

    setShowSurveyThanks(true);
    setSurveyStep('thanks');
    setCountdown(THANKS_TIME_SECONDS);
  };

  useEffect(() => {
    // Cargar datos de la orden al montar el componente
    const initOrderData = async () => {
      await getOrderData();
    };

    initOrderData();
  }, [orderConfirmedApiId, paymentResponse]);

  // Limpiar función no serializable de params y habilitar controles al entrar
  useEffect(() => {
    setOnlyPaymentEnabledFn(true);
    // Quitar función de params para evitar warning de navegación
    if (setOnlyPaymentEnabled) {
      try {
        navigation.setParams({setOnlyPaymentEnabled: undefined});
      } catch (_) {}
    }
    handleThank();
  }, []);

  useEffect(() => {
    if (!redirectType) {
      return;
    }

    if (countdown <= 0) {
      if (redirectType === 'payment') {
        navigation.reset({
          index: 0,
          routes: [{name: 'Index', params: {goToPayment: true}}],
        });
        return;
      }

      if (redirectType === 'survey') {
        if (surveyStep === 'cta') {
          setSurveyStep('choice');
          setCountdown(SURVEY_CHOICE_TIMEOUT_SECONDS); // 1 minuto para elegir

          // Cancelar todos los sockets cuando se muestra la encuesta
          console.log('[ThankYou] Cancelando sockets - Mostrando encuesta');
          cancelAllSockets();
        } else if (surveyStep === 'choice') {
          // Auto-ejecutar "No" si no responde en 1 minuto
          console.log(
            '[ThankYou] Tiempo agotado, ejecutando "No" automáticamente',
          );
          handleSurveyChoice('no');
        } else if (surveyStep === 'thanks') {
          // Reactivar botones antes de ir a VideoView
          setOnlyPaymentEnabledFn(false);
          // Restablecer vista por defecto
          dispatch(setCurrentView('menu'));
          navigation.reset({
            index: 0,
            routes: [{name: 'VideoView'}],
          });
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, redirectType, surveyStep]);

  const handleSurveyChoice = async answer => {
    if (answer === 'yes') {
      setSurveyStep('form');
    } else {
      // Cancelar sockets también cuando se rechaza la encuesta
      console.log('[ThankYou] Cancelando sockets - Encuesta rechazada');
      cancelAllSockets();

      try {
        await submitReject({
          serverIp,
          apiToken,
          generalData,
        });
      } catch (e) {
        console.error('[ThankYou] Error enviando rechazo de encuesta:', e);
      } finally {
        // Reactivar botones antes de ir a VideoView (siempre)
        setOnlyPaymentEnabledFn(false);
        // Restablecer vista por defecto
        dispatch(setCurrentView('menu'));
        navigation.reset({
          index: 0,
          routes: [{name: 'VideoView'}],
        });
      }
    }
  };

  // Mostrar loader en esquina excepto cuando se está en la UI de encuesta o hay error
  const showCornerLoader =
    !hasError &&
    !(
      redirectType === 'survey' &&
      (surveyStep === 'choice' ||
        surveyStep === 'form' ||
        surveyStep === 'thanks')
    );

  return (
    <View style={styles.container}>
      {/* Mostrar error si hay problemas */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Image
            source={{
              uri: companySelected.settings.logo_url,
              cache: 'force-cache',
            }}
            style={styles.logo}
          />
          <Text style={styles.mainText}>{t('thanks')}</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.callWaiterButton}
            onPress={handleCallWaiter}>
            <Text style={styles.buttonText}>
              {t('call_waiter') || 'Llamar Mesero'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loader discreto en esquina superior derecha (oculto durante encuesta) */}
      {showCornerLoader && (
        <View style={styles.loaderCorner} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Mostrar formulario de encuesta si es necesario */}
      {redirectType === 'survey' &&
        surveyStep === 'form' &&
        !showSurveyThanks &&
        !isProcessingPayment &&
        !hasError && (
          <DynamicSurveyForm
            onSubmit={() => handleSurveySend()}
            colors={colors}
            font_type={font_type}
            dimensions={dimensions}
            sizes={sizes}
            generalData={generalData}
          />
        )}

      {/* Mostrar mensaje de agradecimiento por encuesta */}
      {redirectType === 'survey' &&
        showSurveyThanks &&
        !isProcessingPayment &&
        !hasError && (
          <Text style={[styles.mainText2]}>
            ¡Gracias! Valoramos su respuesta.
          </Text>
        )}

      {/* Mostrar pantalla normal de gracias */}
      {(redirectType !== 'survey' || surveyStep === 'cta') &&
      !isProcessingPayment &&
      !hasError ? (
        <>
          <Image
            source={{
              uri: companySelected.settings.logo_url,
              cache: 'force-cache',
            }}
            style={styles.logo}
          />
          <Text style={styles.mainText}>{t('thanks')}</Text>
          <Text style={styles.subText}>{fully ? '' : ''}</Text>
          <Text style={styles.mainText}>{t('enjoy')}</Text>
          <Text style={[styles.mainText, {color: colors.primary}]}>
            {redirectType === 'survey' || isProcessingPayment
              ? ''
              : redirectType === 'payment'
              ? ''
              : fully
              ? `${t('payment_completed') || 'Pago completado'}`
              : ''}
          </Text>
        </>
      ) : null}

      {/* Mostrar opciones de encuesta */}
      {redirectType === 'survey' &&
        surveyStep === 'choice' &&
        !isProcessingPayment &&
        !hasError && (
          <>
            <Text style={styles.mainText2}>
              {t('would_you_like_yo_answer')}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleSurveyChoice('no')}>
                <Text style={styles.secondaryButtonText}>{t('no')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleSurveyChoice('yes')}>
                <Text style={styles.primaryButtonText}>{t('yes')}</Text>
              </TouchableOpacity>
            </View>
            {/* <Text style={[styles.subText, {color: colors.secondary}]}>
            {countdown > 0 ? `Tiempo para decidir: ${countdown}s` : 'Procesando...'}
          </Text> */}
          </>
        )}
      {/* sin overlay duplicado */}
    </View>
  );
};

export default ThankYou;
