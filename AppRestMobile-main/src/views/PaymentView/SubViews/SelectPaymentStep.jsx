/* eslint-disable react-hooks/exhaustive-deps */
import React, {useMemo, useCallback, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {ProgressSteps, ProgressStep} from 'react-native-progress-steps';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../../providers/ThemeProvider';
import Utils from '../../../helpers/utils/Utils';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import CheckBox from '@react-native-community/checkbox';
import ProductQuantityPicker from '../../../components/products/ProductQuantityPicker';
import InstantImage from '../../../components/products/InstantImage';
import {
  setPaymentStep,
  setIsSplit as setIsSplitRedux,
  setSplitType as setSplitTypeRedux,
  setSelectedProductIds as setSelectedProductIdsRedux,
  setSplitCount as setSplitCountRedux,
  setSelectedSplits as setSelectedSplitsRedux,
  setTotalSplitAmount as setTotalSplitAmountRedux,
  setUnpaidSplits as setUnpaidSplitsRedux,
} from '../../../redux/slice/paymentFlowSlice';
import {PAYMENT_STATUS, buildPaymentPayload, buildSplitsPayload} from '../../../helpers/utils/OrderUtils';
import {useGlobalSocket} from '../../../providers/GlobalSocketProvider';
import useToast from '../../../hooks/general/useToast';
import {setWaiterCalled} from '../../../redux/slice/companySlice';
import {capturePayment, getPaymentType} from '../../../services/payment/paymentService';
import ProductService from '../../../services/api/ProductService';

/** Utils */
const arraysEqual = (a = [], b = []) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/** Fila de producto (memo) */
const ProductRow = React.memo(function ProductRow({
  product,
  selected,
  disabled,
  onToggle,
  styles,
  colors,
  font_type,
  language,
  companyIcon,
  showCheckbox,
  isInPayment = false,
}) {
  // Debug: log para verificar image_url
  if (__DEV__) {
    console.log(`🖼️ [ProductRow] ${product.name_es}: ${product.image_url?.substring(0, 60)}...`);
  }
  
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onToggle}
      activeOpacity={disabled ? 1 : 0.85}
      style={[
        styles.productItem, 
        disabled && {opacity: 0.5},
        isInPayment && styles.productInPayment
      ]}
      disabled={disabled}>
      {showCheckbox && (
        <CheckBox
          value={selected}
          onValueChange={disabled ? undefined : onToggle}
          tintColors={{true: colors.button, false: colors.text}}
          disabled={disabled}
        />
      )}

      <View style={styles.productImageContainer}>
        <InstantImage
          source={{uri: product.image_url || companyIcon}}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.productInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.productName}>
            {language === 'es'
              ? product.name_es
              : product.name_en || product.name_es}{' '}
            x{product.quantity}
          </Text>
          {product.customizations && product.customizations.length > 0 && (
            <View style={styles.customizationsContainer}>
              {product.customizations.map((customization, index) => {
                // Usar precio con impuestos si está disponible, sino usar precio normal
                const priceToShow = customization.price_with_taxes ?? customization.precio;
                
                return (
                  <Text key={index} style={styles.customization}>
                    • {customization.descripcion}
                    {priceToShow > 0 && (
                      <Text style={styles.customizationPrice}>
                        {' '}
                        (+
                        {Utils.formatCurrency(
                          priceToShow,
                          customization.currency || 'CRC',
                        )}
                        )
                      </Text>
                    )}
                  </Text>
                );
              })}
            </View>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.productPrice}>
            {Utils.formatCurrency(
              product.totalLine || product.total_line || 0,
              product.currency || 'CRC',
            )}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: re-render if product, selected, or disabled changes
  return (
    prevProps.product.internalId === nextProps.product.internalId &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isInPayment === nextProps.isInPayment
  );
});

/** Lista de productos (memo) */
const ProductList = React.memo(function ProductList({
  products,
  selectedIdsSet,
  onToggle,
  styles,
  colors,
  font_type,
  language,
  companyIcon,
  showCheckbox,
  productsInPayment = [],
}) {
  const renderItem = useCallback(
    ({item: p}) => {
      const disabled =
        (p.totalLine || p.total_line) === 0 ||
        p.status_payment === PAYMENT_STATUS.PAGADO;
      const selected = selectedIdsSet.has(p.internalId);
      const isInPayment = productsInPayment.includes(p.internalId);
      return (
        <ProductRow
          product={p}
          selected={selected}
          disabled={disabled}
          onToggle={() => onToggle(p, selected, disabled)}
          styles={styles}
          colors={colors}
          font_type={font_type}
          language={language}
          companyIcon={companyIcon}
          showCheckbox={showCheckbox}
          isInPayment={isInPayment}
        />
      );
    },
    [
      selectedIdsSet,
      onToggle,
      styles,
      colors,
      font_type,
      language,
      companyIcon,
      showCheckbox,
      productsInPayment,
    ],
  );

  // Usar ScrollView en lugar de FlatList para evitar el warning de VirtualizedLists anidados
  return (
    <View>
      {products.map((product, index) => (
        <View key={String(product.internalId)}>
          {renderItem({item: product, index})}
        </View>
      ))}
    </View>
  );
});

/** Grid de splits iguales (memo) */
const EqualSplitGrid = React.memo(function EqualSplitGrid({
  splitCount,
  paidSplits,
  selectedSplits,
  isBlocked,
  onToggle,
  amountPerSplit,
  styles,
  colors,
  sizes,
  font_type,
  t,
  onSplitCountChange,
}) {
  const splitArray = useMemo(
    () => Array.from({length: splitCount}, (_, i) => i),
    [splitCount],
  );
  return (
    <View style={styles.splitGridContainer}>
      <View style={{zIndex: 10000}}>
        <View style={{marginBottom: 20}}>
          {!isBlocked && (
            <ProductQuantityPicker
              quantity={splitCount}
              setQuantity={onSplitCountChange}
              inline
            />
          )}
        </View>
        {!isBlocked && (
          <Text style={styles.subtitle}>{t('how_many_parts')}</Text>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
        }}>
        {splitArray.map(i => {
          const isChecked = selectedSplits.includes(i);
          const isPaid = paidSplits.includes(i);
          const isDisabled = isBlocked && isPaid;
          const bg = isDisabled
            ? '#ccc'
            : isChecked
            ? colors.button
            : colors.white;
          const bc = isDisabled
            ? '#ccc'
            : isChecked
            ? colors.button
            : colors.text;
          const fg = isDisabled
            ? colors.text
            : isChecked
            ? colors.white
            : colors.text;

          return (
            <TouchableOpacity
              key={i}
              onPress={() => (!isDisabled ? onToggle(i, isChecked) : undefined)}
              disabled={isDisabled}
              style={{
                flexBasis: '30%',
                margin: '1.5%',
                padding: 20,
                backgroundColor: bg,
                borderColor: bc,
                borderWidth: 1,
                borderRadius: sizes.borderRadius,
                opacity: isDisabled ? 0.6 : 1,
                position: 'relative',
              }}>
              <Text
                style={{
                  color: fg,
                  fontFamily: font_type.semibold,
                  fontSize: 18,
                  textAlign: 'center',
                }}>
                {t('account')} {i + 1}:{' '}
                {Utils.formatCurrency(amountPerSplit, 'CRC')}
              </Text>

              {isPaid && isBlocked && (
                <View
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    backgroundColor: colors.button,
                    borderRadius: 20,
                    width: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: colors.white,
                    zIndex: 999,
                  }}>
                  <Text
                    style={{color: 'white', fontSize: 14, fontWeight: 'bold'}}>
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

/** Componente principal */
const SelectPaymentStep = ({
  tablet,
  handleDatafono,
  handleSelectedPaymentMethod,
  setTotalAmount,
  baseBag,
  orderConfirmedApiId,
  totalAmount,
  captureFullPayment,
}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const paymentFlow = useSelector(state => state.paymentFlow, shallowEqual);
  const {language} = useSelector(state => state.settings);
  const tableData = useSelector(state => state.company.tableData, shallowEqual);
  const {companySelected, waiterCalled} = useSelector(state => state.company, shallowEqual);
  const serverIp = useSelector(state => state.store.serverIp);
  const apiToken = useSelector(state => state.auth.apiToken);
  const baseCompany = useSelector(state => state.company, shallowEqual);

  const {colors, font_type, sizes} = useTheme();
  const {requestHelp} = useGlobalSocket();
  const {showWaiterToast} = useToast();

  /** Estilos dependientes de tema (memo) */
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.white,
          width: '100%',
          padding: 20,
        },
        section: {
          flex: 1,
          backgroundColor: colors.white,
          width: '100%',
          paddingTop: 50,
        },
        title: {
          fontSize: 35,
          fontFamily: font_type.semibold,
          color: colors.text,
          marginBottom: 20,
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        subtitle: {
          fontSize: 18,
          fontFamily: font_type.regular,
          color: colors.text,
          marginBottom: 30,
          textAlign: 'center',
        },
        buttonRow: {
          flexDirection: 'row',
          gap: 20,
          justifyContent: 'center',
          paddingHorizontal: 80,
          marginTop: 20,
        },
        button: {
          paddingVertical: 12,
          width: 200,
          alignItems: 'center',
          borderRadius: sizes.borderRadius,
          borderWidth: 1,
        },
        buttonText: {
          fontSize: 16,
          fontFamily: font_type.regular,
          textTransform: 'uppercase',
          paddingHorizontal: 20,
          paddingVertical: 10,
        },
        message: {
          fontSize: 20,
          fontFamily: font_type.semibold,
          textTransform: 'uppercase',
          paddingHorizontal: 20,
          paddingVertical: 10,
          alignSelf: 'center',
          marginBottom: 30,
        },
        paymentOption: {
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: colors.text,
          borderRadius: sizes.borderRadius,
          padding: 20,
          alignItems: 'center',
          justifyContent: 'center',
          width: 300,
          marginBottom: 20,
        },
        icon: {width: 200, height: 70, resizeMode: 'cover'},
        disabledPaymentOption: {opacity: 0.5, backgroundColor: '#f5f5f5'},
        disabledIcon: {opacity: 0.3},
        productItem: {
          flexDirection: 'row',
          marginBottom: 15,
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: 100,
          paddingRight: 20,
        },
        productImageContainer: {
          width: '25%',
          padding: 5,
          height: 100,
          overflow: 'hidden',
        },
        productImage: {width: '85%', height: '85%', resizeMode: 'contain'},
        productInfo: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        nameContainer: {flex: 1},
        quantityContainer: {
          paddingTop: 35,
          alignItems: 'center',
          width: 200,
          paddingRight: 60,
        },
        productName: {
          fontSize: 16,
          fontFamily: font_type.semibold,
          color: colors.text,
          marginBottom: 8,
        },
        productPrice: {
          fontSize: 16,
          color: colors.secondary,
          fontFamily: font_type.semibold,
          marginTop: 12,
        },
        customizationsContainer: {
          marginTop: 5,
          // paddingLeft: 10,
        },
        customization: {
          fontFamily: font_type.lite,
          fontSize: 12,
          color: colors.text,
          opacity: 0.8,
          marginBottom: 2,
        },
        customizationPrice: {
          fontFamily: font_type.semibold,
          fontSize: 12,
          color: colors.secondary,
        },
        splitGridContainer: {
          width: '80%',
          alignSelf: 'center',
        },
        productInPayment: {
          backgroundColor: colors.button + '20', // 20% opacity
          borderColor: colors.button,
          borderWidth: 2,
          borderRadius: sizes.borderRadius,
        },
      }),
    [colors, font_type, sizes],
  );

  /** Derivados / flags de paso */
  const baseAmount = useMemo(
    () => tablet?.order?.balance || tablet?.order?.totalBag || 0,
    [tablet?.order?.balance, tablet?.order?.totalBag],
  );
  const maxSplits = useMemo(
    () => (tableData?.numberOfDiners || 1) + 1,
    [tableData?.numberOfDiners],
  );

  const isSplit = paymentFlow.isSplit;
  const splitType = paymentFlow.splitType; // 'equal' | 'products'
  const splitCount = paymentFlow.splits.splitCount || 2;
  const selectedSplits = paymentFlow.splits.selectedSplits || [];
  const paidSplits = paymentFlow.splits.paidSplits || [];
  const isBlocked = paymentFlow.splits.isBlocked;
  const selectedProductIds = paymentFlow.products.selectedProductIds || [];

  const activeStep = paymentFlow.step || 0;
  const step2Active = activeStep === 1;
  const step3Active = activeStep === 2;

  /** Cálculos diferidos (solo cuando el paso lo necesita) */
  const splitCalculationBase = useMemo(
    () =>
      isBlocked && (paymentFlow.splits.totalSplitAmount || 0) > 0
        ? paymentFlow.splits.totalSplitAmount
        : baseAmount,
    [isBlocked, paymentFlow.splits.totalSplitAmount, baseAmount],
  );
  const amountPerSplit = useMemo(
    () => (splitCount > 0 ? splitCalculationBase / splitCount : 0),
    [splitCalculationBase, splitCount],
  );

  const selectedIdsSet = useMemo(() => {
    // Cambiar la condición para que funcione también en paso 3
    if (!(isSplit && splitType === 'products')) {
      return new Set();
    }
    return new Set(selectedProductIds);
  }, [isSplit, splitType, selectedProductIds]);

  const unpaidProducts = useMemo(() => {
    // Cambiar la condición para que funcione también en paso 3
    if (!(isSplit && splitType === 'products')) {
      return [];
    }
    
    const rawProducts = (tablet?.order?.products || []).filter(
      p => p.status_payment === PAYMENT_STATUS.PENDIENTE,
    );
    
    // 🔥 ACTUALIZAR image_url con la versión local si existe
    return rawProducts.map(product => {
      // Buscar el producto original en ProductService para obtener image_url actualizada
      const originalProduct = ProductService.getProductBySku(product.sku);
      
      if (originalProduct && originalProduct.image_url) {
        return {
          ...product,
          image_url: originalProduct.image_url, // Ya debería estar como file://
        };
      }
      
      return product;
    });
  }, [isSplit, splitType, tablet?.order?.products]);

  // Obtener productos en proceso de pago
  const productsInPayment = paymentFlow.productsInPayment || [];

  const selectedTotal = useMemo(() => {
    // Cambiar la condición para que funcione también en paso 3
    if (!(isSplit && splitType === 'products')) {
      return 0;
    }
    return unpaidProducts.reduce((acc, p) => {
      if (selectedIdsSet.has(p.internalId)) {
        return acc + (p.totalLine || p.total_line || 0);
      }
      return acc;
    }, 0);
  }, [isSplit, splitType, unpaidProducts, selectedIdsSet]);

  const totalToPay = useMemo(() => {
    if (!isSplit) {
      return baseAmount;
    }
    if (splitType === 'products') {
      return selectedTotal;
    }
    return amountPerSplit * selectedSplits.length;
  }, [
    isSplit,
    splitType,
    baseAmount,
    selectedTotal,
    amountPerSplit,
    selectedSplits.length,
  ]);

  const validateTotal = useMemo(() => {
    if (paymentFlow?.splits?.isBlocked) {
      const paid_len = paymentFlow.splits.paidSplits?.length || 0;
      const count = paymentFlow.splits.splitCount || 1;
      const total_split = paymentFlow.splits.totalSplitAmount || 0;
      const split_value = count > 0 ? total_split / count : 0;
      const unpaid_total = total_split - split_value * paid_len;
      return Math.max(unpaid_total, 0);
    }
    return baseAmount;
  }, [
    paymentFlow?.splits?.isBlocked,
    paymentFlow?.splits?.paidSplits?.length,
    paymentFlow?.splits?.splitCount,
    paymentFlow?.splits?.totalSplitAmount,
    baseAmount,
  ]);

  const isStep2Complete = useMemo(() => {
    if (!isSplit) {
      return true;
    }
    if (splitType === 'products') {
      return selectedProductIds.length > 0;
    }
    if (splitType === 'equal') {
      return selectedSplits.length > 0;
    }
    return true;
  }, [isSplit, splitType, selectedProductIds.length, selectedSplits.length]);

  /** Efectos */
  useEffect(() => {
    if (isBlocked && isSplit && activeStep < 1) {
      dispatch(setPaymentStep(1));
    }
  }, [isBlocked, isSplit, activeStep, dispatch]);

  // Mantener totalSplitAmount/unpaidSplits solo si el Step 2 está activo
  useEffect(() => {
    if (step2Active && isSplit && splitType === 'equal') {
      if (!isBlocked && paymentFlow.splits.totalSplitAmount !== baseAmount) {
        dispatch(setTotalSplitAmountRedux(baseAmount));
      }
      const count = splitCount;
      const selected = selectedSplits;
      const paid = paidSplits;
      const arr = Array.from({length: count}, (_, i) => i);
      const filtered = arr.filter(
        num => !paid.includes(num) && !selected.includes(num),
      );
      if (!arraysEqual(filtered, paymentFlow.splits.unpaidSplits || [])) {
        dispatch(setUnpaidSplitsRedux(filtered));
      }
    }
  }, [
    step2Active,
    isSplit,
    splitType,
    isBlocked,
    baseAmount,
    splitCount,
    selectedSplits,
    paidSplits,
    paymentFlow.splits.totalSplitAmount,
    paymentFlow.splits.unpaidSplits,
    dispatch,
  ]);

  // Reportar total al padre solo cuando el Step 3 está activo
  useEffect(() => {
    if (step3Active) {
      setTotalAmount?.(totalToPay);
    }
  }, [step3Active, totalToPay, setTotalAmount]);

  /** Handlers optimizados (sin transiciones para mejor rendimiento) */
  const gotoStep = useCallback(n => dispatch(setPaymentStep(n)), [dispatch]);

  const onSetSinglePayment = useCallback(() => {
    if (isSplit) {
      dispatch(setIsSplitRedux(false));
    }
    if (splitType !== 'equal') {
      dispatch(setSplitTypeRedux('equal'));
    }
  }, [dispatch, isSplit, splitType]);

  const onSetSplitPayment = useCallback(() => {
    if (!isSplit) {
      dispatch(setIsSplitRedux(true));
    }
    // Establecer "Por productos" por defecto y avanzar al paso 2
    if (splitType !== 'products') {
      dispatch(setSplitTypeRedux('products'));
    }
    // Limpiar splits de división igual si existían
    if (selectedSplits.length) {
      dispatch(setSelectedSplitsRedux([]));
    }
    // Ir directamente al paso 2 (selección de productos)
    setTimeout(() => {
      gotoStep(1);
    }, 100);
  }, [dispatch, isSplit, splitType, selectedSplits.length, gotoStep]);

  const onSetEqualSplit = useCallback(() => {
    if (splitType !== 'equal') {
      dispatch(setSplitTypeRedux('equal'));
    }
    if (paymentFlow.products.selectedProductIds?.length) {
      dispatch(setSelectedProductIdsRedux([]));
    }
  }, [dispatch, splitType, paymentFlow.products.selectedProductIds?.length]);

  const onSetProductsSplit = useCallback(() => {
    if (splitType !== 'products') {
      dispatch(setSplitTypeRedux('products'));
    }
    if (splitCount !== 2) {
      dispatch(setSplitCountRedux(2));
    }
    if (selectedSplits.length) {
      dispatch(setSelectedSplitsRedux([]));
    }
  }, [dispatch, splitType, splitCount, selectedSplits.length]);

  const onSplitCountChange = useCallback(
    value => {
      const safe = Math.max(2, Math.min(value, maxSplits));
      if (safe !== splitCount) {
        dispatch(setSplitCountRedux(safe));
        if (selectedSplits.length) {
          dispatch(setSelectedSplitsRedux([]));
        }
      }
    },
    [dispatch, splitCount, maxSplits, selectedSplits.length],
  );

  const onToggleSplit = useCallback(
    (index, isChecked) => {
      const current = paymentFlow.splits.selectedSplits || [];
      const next = isChecked
        ? current.filter(x => x !== index)
        : [...current, index];
      if (!arraysEqual(current, next)) {
        dispatch(setSelectedSplitsRedux(next));
      }
    },
    [dispatch, paymentFlow.splits.selectedSplits],
  );

  const onToggleProduct = useCallback(
    (p, selected, disabled) => {
      if (disabled) {
        return;
      }
      const arr = paymentFlow.products.selectedProductIds || [];
      const next = selected
        ? arr.filter(id => id !== p.internalId)
        : [...arr, p.internalId];
      if (!arraysEqual(arr, next)) {
        dispatch(setSelectedProductIdsRedux(next));
      }
    },
    [dispatch, paymentFlow.products.selectedProductIds],
  );

  /** Manual payment handler - calls waiter and creates manual payment in API */
  const [creatingManualPayment, setCreatingManualPayment] = useState(false);
  
  const handleManualPayment = useCallback(async () => {
    // 1. Llamar al mesero
    if (!waiterCalled) {
      requestHelp(tableData.table.id, tableData.table.name);
      dispatch(setWaiterCalled(true));
      showWaiterToast(t('calling_description'), t('calling_title'));
    }

    // 2. Crear el pago manual en el API
    if (!orderConfirmedApiId || creatingManualPayment) {
      console.log('[ManualPayment] No hay orden confirmada o ya se está procesando');
      return;
    }

    try {
      setCreatingManualPayment(true);
      console.log('[ManualPayment] Iniciando creación de pago manual...');

      // Construir el payload del pago
      const payloadData = buildPaymentPayload({
        baseBag,
        baseCompany,
        paymentMethod: null, // No es loyalty
        user: null,
        loyaltyCardType: null,
        totalPlanAmount: 0,
        redeemPoints: false,
        selectedProductIds: paymentFlow?.isSplit && paymentFlow?.splitType === 'products' 
          ? paymentFlow.products.selectedProductIds 
          : null,
      });

      // Obtener el tipo de pago
      const paymentType = getPaymentType(paymentFlow);

      // Construir splits si aplica
      const splits = buildSplitsPayload(paymentFlow, paymentType);

      // Llamar al servicio de captura de pago con source = 3 (manual)
      const response = await capturePayment({
        serverIp,
        apiToken,
        amount: totalAmount,
        sendData: payloadData.detalle,
        orderId: orderConfirmedApiId,
        loyaltyInfo: null,
        userBalance: null,
        redeemedAmount: 0,
        source: 3, // 3 = Pago Manual
        paymentType,
        splits,
        proccessPayment: false,
      });

      console.log('[ManualPayment] ✅ Pago manual creado exitosamente:', response.paymentId);
      
      // Mostrar notificación de éxito
      showWaiterToast(
        t('manual_payment_created'),
        t('confirm') // Usar 'confirm' como título de éxito
      );

      // Si hay una función de callback para procesar el pago completo, llamarla
      if (captureFullPayment) {
        await captureFullPayment();
      }

    } catch (error) {
      console.error('[ManualPayment] ❌ Error al crear pago manual:', error);
      showWaiterToast(
        t('manual_payment_error'),
        t('error')
      );
    } finally {
      setCreatingManualPayment(false);
    }
  }, [
    waiterCalled, 
    requestHelp, 
    tableData, 
    dispatch, 
    showWaiterToast, 
    t,
    orderConfirmedApiId,
    creatingManualPayment,
    baseBag,
    baseCompany,
    paymentFlow,
    serverIp,
    apiToken,
    totalAmount,
    captureFullPayment,
  ]);

  /** UI flags */
  const isEqualSplit = isSplit && splitType === 'equal';

  return (
    <View style={styles.container}>
      <ProgressSteps
        completedStepIconColor={colors.button}
        activeStepIconBorderColor={colors.button}
        activeStepNumColor={colors.text}
        completedProgressBarColor={colors.text}
        activeLabelColor={colors.text}
        labelFontFamily={font_type.regular}
        borderWidth={1}
        marginBottom={0}
        topOffset={0}
        activeStep={activeStep}>
        {/* Paso 1: Selección */}
        <ProgressStep
          label={t('step_division')}
          buttonNextText={t('next')}
          buttonFillColor={colors.button}
          buttonPreviousText={t('back')}
          buttonBorderColor={colors.text}
          buttonPreviousTextColor={colors.text}
          buttonHorizontalOffset={100}
          buttonBottomOffset={20}
          onNext={() => {
            const nextStep = isSplit ? activeStep + 1 : activeStep + 2; // si no divide, salta directo a método de pago
            gotoStep(nextStep);
          }}
          onPrevious={() => gotoStep(Math.max(activeStep - 1, 0))}>
          <View style={styles.section}>
            <Text style={styles.title}>
              {!isBlocked ? t('select_how_to_pay') : t('blocked')}
            </Text>
            <Text style={styles.subtitle}>
              {t('pending_payment')}:{' '}
              {Utils.formatCurrency(validateTotal, 'CRC')}
            </Text>

            {!isBlocked && (
              <>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.button,
                      {
                        backgroundColor: !isSplit
                          ? colors.button
                          : colors.white,
                        borderColor: !isSplit ? colors.button : colors.text,
                      },
                    ]}
                    onPress={onSetSinglePayment}>
                    <Text
                      style={[
                        styles.buttonText,
                        {color: !isSplit ? colors.white : colors.text},
                      ]}>
                      {t('single_account')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.button,
                      {
                        backgroundColor: isSplit ? colors.button : colors.white,
                        borderColor: isSplit ? colors.button : colors.text,
                      },
                    ]}
                    onPress={onSetSplitPayment}>
                    <Text
                      style={[
                        styles.buttonText,
                        {color: isSplit ? colors.white : colors.text},
                      ]}>
                      {t('split_accounts')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Temporalmente oculto - va directo a selección de productos */}
                {false && isSplit && (
                  <View style={[styles.buttonRow, {marginTop: 10}]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.button,
                        {
                          backgroundColor:
                            splitType === 'equal'
                              ? colors.button
                              : colors.white,
                          borderColor:
                            splitType === 'equal' ? colors.button : colors.text,
                        },
                      ]}
                      onPress={onSetEqualSplit}>
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color:
                              splitType === 'equal'
                                ? colors.white
                                : colors.text,
                          },
                        ]}>
                        {t('split_equally')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.button,
                        {
                          backgroundColor:
                            splitType === 'products'
                              ? colors.button
                              : colors.white,
                          borderColor:
                            splitType === 'products'
                              ? colors.button
                              : colors.text,
                        },
                      ]}
                      onPress={onSetProductsSplit}>
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color:
                              splitType === 'products'
                                ? colors.white
                                : colors.text,
                          },
                        ]}>
                        {t('select_products')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </ProgressStep>

        {/* Paso 2: Opcional (config del split) */}
        <ProgressStep
          label={t('step_split_options')}
          buttonNextText={t('next')}
          buttonFillColor={colors.button}
          buttonPreviousText={t('back')}
          buttonBorderColor={colors.text}
          buttonPreviousTextColor={colors.text}
          buttonHorizontalOffset={100}
          buttonBottomOffset={20}
          buttonNextDisabled={isSplit && !isStep2Complete}
          onNext={() => gotoStep(activeStep + 1)}
          onPrevious={() => gotoStep(Math.max(activeStep - 1, 0))}>
          <View style={styles.section}>
            {step2Active && isSplit ? (
              <>
                <Text style={styles.title}>
                  {splitType === 'equal'
                    ? t('split_equally')
                    : t('select_products')}
                </Text>
                {splitType === 'equal' ? (
                  <>
                    <Text style={[styles.subtitle, {marginBottom: 20}]}>
                      {t('total_selected')}:{' '}
                      {Utils.formatCurrency(
                        amountPerSplit * selectedSplits.length,
                        'CRC',
                      )}
                    </Text>
                    <EqualSplitGrid
                      splitCount={splitCount}
                      paidSplits={paidSplits}
                      selectedSplits={selectedSplits}
                      isBlocked={isBlocked}
                      onToggle={onToggleSplit}
                      amountPerSplit={amountPerSplit}
                      styles={styles}
                      colors={colors}
                      sizes={sizes}
                      font_type={font_type}
                      t={t}
                      onSplitCountChange={onSplitCountChange}
                    />
                  </>
                ) : (
                  <>
                    <Text style={[styles.subtitle, {marginBottom: 40}]}>
                      {t('total_selected')}:{' '}
                      {Utils.formatCurrency(selectedTotal, 'CRC')}
                    </Text>
                    <ProductList
                      products={unpaidProducts}
                      selectedIdsSet={selectedIdsSet}
                      onToggle={onToggleProduct}
                      styles={styles}
                      colors={colors}
                      font_type={font_type}
                      language={language}
                      companyIcon={
                        companySelected?.settings?.icon_default_food_url
                      }
                      showCheckbox
                      productsInPayment={productsInPayment}
                    />
                  </>
                )}
              </>
            ) : (
              <Text style={styles.message}>{t('only_split')}</Text>
            )}
          </View>
        </ProgressStep>

        {/* Paso 3: Método de pago */}
        <ProgressStep
          label={t('step_payment_method')}
          buttonFinishText={''}
          buttonFillColor={'transparent'}
          buttonPreviousText={t('back')}
          buttonBorderColor={colors.text}
          buttonPreviousTextColor={colors.text}
          buttonHorizontalOffset={100}
          buttonBottomOffset={20}
          onNext={() => gotoStep(activeStep + 1)}
          onPrevious={() => {
            const prevStep = isSplit ? activeStep - 1 : activeStep - 2;
            gotoStep(Math.max(prevStep, 0));
          }}>
          <View style={styles.section}>
            {step3Active && (
              <>
                <Text style={[styles.title, {textTransform: 'uppercase'}]}>
                  {t('select_payment_method')}
                </Text>
                <Text style={[styles.subtitle, {marginBottom: 20}]}>
                  {t('total_selected')}:{' '}
                  {Utils.formatCurrency(totalToPay, 'CRC')}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 15,
                    marginTop: isEqualSplit ? 10 : 40,
                    flexWrap: 'wrap',
                  }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.paymentOption}
                    onPress={handleDatafono}>
                    <Text
                      style={{
                        fontSize: 26,
                        color: colors.text,
                        fontFamily: font_type.semibold,
                        textTransform: 'uppercase',
                      }}>
                      {t('card_payment')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.paymentOption}
                    onPress={() => handleSelectedPaymentMethod('sup')}>
                    <Image
                      source={require('../../../assets/images/spiceup.png')}
                      style={styles.icon}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.paymentOption}
                    onPress={handleManualPayment}>
                    <Text
                      style={{
                        fontSize: 26,
                        color: colors.text,
                        fontFamily: font_type.semibold,
                        textTransform: 'uppercase',
                      }}>
                      {t('manual_payment')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ProgressStep>
      </ProgressSteps>
    </View>
  );
};

export default React.memo(SelectPaymentStep);
