/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-catch-shadow */
/* eslint-disable no-shadow */
import React, {useState, useCallback, useEffect, useRef, useMemo} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {useSelector, useDispatch, shallowEqual} from 'react-redux';
import {useTranslation} from 'react-i18next';
import createStyles from './styles';
import {useTheme} from '../../providers/ThemeProvider';
import {useIsFocused} from '@react-navigation/native';

// Custom Hooks
import {usePaymentData} from '../../hooks/payment/usePaymentData';
import {useQRPayment} from '../../hooks/payment/useQRPayment';
import {useLoyaltyManagement} from '../../hooks/payment/useLoyaltyManagement';

// Components
import PaymentMethods from './components/PaymentMethods';
import ConfirmDialog from '../../components/general/modals/ConfirmDialog';

// Redux actions
import {clearBag} from '../../redux/slice/bagSlice';
import {setPaymentStep} from '../../redux/slice/paymentFlowSlice';
import {setCurrentView} from '../../redux/slice/settingsSlice';

// Services
import {
  capturePayment as capturePaymentService,
  getPaymentType,
} from '../../services/payment/paymentService';
import {cancelPayment as cancelPaymentService} from '../../services/order/orderService';

import {
  buildPaymentPayload,
  mapRefactorOrder,
  calculateCorrectTotal,
  buildSplitsPayload,
  calculateRemainingAmount,
  buildLoyaltyContext,
} from '../../helpers/utils/OrderUtils';

const PaymentView = ({navigation, setOnlyPaymentEnabled}) => {
  const dispatch = useDispatch();
  const {t} = useTranslation();

  // Establecer y mantener la vista actual como 'payment' sólo cuando esta pantalla está enfocada
  const isFocused = useIsFocused();
  const currentView = useSelector(state => state.settings.currentView);
  useEffect(() => {
    if (isFocused) {
      dispatch(setCurrentView('payment'));
    }
  }, [isFocused, dispatch]);
  const companySelected = useSelector(
    state => state.company.companySelected,
    (prev, next) => prev?.id === next?.id,
  );

  // Autocorrección: si estando enfocada alguien cambia currentView, volver a 'payment'
  useEffect(() => {
    if (isFocused && currentView !== 'payment') {
      dispatch(setCurrentView('payment'));
    }
  }, [isFocused, currentView, dispatch]);

  // Redux selectors
  const serverIp = useSelector(state => state.store.serverIp);
  const apiToken = useSelector(state => state.auth.apiToken);
  const baseCompany = useSelector(state => state.company, shallowEqual);
  const paymentFlow = useSelector(state => state.paymentFlow, shallowEqual);

  // Custom hooks
  const {
    orderData,
    baseBag,
    baseAmount,
    currency,
    loadingOrder,
    orderError,
    fetchOrderData,
  } = usePaymentData();

  const {
    loading,
    error,
    user,
    tempUser,
    loyaltyToken,
    tokenValidated,
    accumulateUser,
    isAccumulatingPoints,
    idNumber,
    setError,
    setUser,
    setLoyaltyToken,
    setTokenValidated,
    setAccumulateUser,
    setIsAccumulatingPoints,
    setIdNumber,
    setLoading,
    handleLoyaltyPlan,
    resetLoyaltyState,
  } = useLoyaltyManagement({serverIp, apiToken, t});

  // Theme
  const {colors, sizes, font_type, dimensions, commonStyles} = useTheme();

  // Estilos optimizados con useMemo
  const styles = useMemo(() => {
    return createStyles({
      colors,
      sizes,
      font_type,
      dimensions,
      commonStyles,
    });
  }, [colors, sizes, font_type, dimensions, commonStyles]);

  // Derivados básicos de la orden para validación
  const hasItems =
    Array.isArray(orderData?.items) && orderData.items.length > 0;
  const balanceToPay = Number(orderData?.balance || 0);

  // Desbloquear UI externa si la orden está vacía o sin saldo pendiente
  useEffect(() => {
    if (!hasItems || balanceToPay <= 0) {
      setOnlyPaymentEnabled(false);
    }
  }, [hasItems, balanceToPay, setOnlyPaymentEnabled]);

  // Estado de elegibilidad para gating asíncrono
  // checking: mostrando loader; allowed: render normal; blocked: orden vacía o balance 0
  const [eligibilityStatus, setEligibilityStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    // Mientras se carga la orden, seguimos en checking
    if (loadingOrder || !orderData) {
      setEligibilityStatus('checking');
      return () => {
        cancelled = true;
      };
    }

    // Validación asíncrona (pequeño defer para no bloquear render)
    setEligibilityStatus('checking');
    const id = setTimeout(() => {
      if (cancelled) {
        return;
      }
      const ok = hasItems && balanceToPay > 0;
      setEligibilityStatus(ok ? 'allowed' : 'blocked');
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [loadingOrder, orderData, hasItems, balanceToPay]);

  // Local states
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loyaltyCardType, setLoyaltyCardType] = useState(null);
  const [paymentFulfilled, setPaymentFulfilled] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPlanAmount, setTotalPlanAmount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [datafonoResponse, setDatafonoResponse] = useState(null);
  const [showAccumulateDialog, setShowAccumulateDialog] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState(null);

  // Inicializar totalAmount UNA sola vez
  const totalInitRef = useRef(false);
  useEffect(() => {
    if (!totalInitRef.current && baseAmount > 0) {
      setTotalAmount(baseAmount);
      totalInitRef.current = true;
    }
  }, [baseAmount]);

  // QR Payment hook
  const {
    qrPaymentUrl,
    qrLoading,
    qrError,
    paymentId,
    paymentStatus,
    showCancelDialog,
    cancelLoading,
    generateQRUrl,
    resetQRPayment,
    handleCancelPayment: handleManualCancelPayment,
    setShowCancelDialog,
    setCancelLoading,
  } = useQRPayment({
    paymentFlow,
    serverIp,
    apiToken,
    orderConfirmedApiId: orderData?.id,
    baseCompany,
    baseBag,
    isAccumulatingPoints,
    accumulateUser,
    baseAmount,
    navigation,
    setOnlyPaymentEnabled,
    user,
    redeemPoints,
    totalPlanAmount,
  });

  // Disparar generación del QR cuando se seleccione tarjeta
  useEffect(() => {
    if (paymentMethod === 'card') {
      setOnlyPaymentEnabled(true);
      generateQRUrl(totalAmount);
    }
  }, [paymentMethod, generateQRUrl, totalAmount, setOnlyPaymentEnabled]);

  const handleRemoveBag = () => {
    setVisible(true);
  };

  // Confirmar cancelación
  const confirmCancelPayment = async () => {
    try {
      setCancelLoading(true);
      await cancelPaymentService({serverIp, apiToken, paymentId});
      // Refrescar datos de la orden después de cancelar el pago
      await fetchOrderData?.();
      resetPaymentMethod();
    } catch (error) {
      try {
        await fetchOrderData?.();
      } catch (_) {}
      resetPaymentMethod();
    } finally {
      setCancelLoading(false);
      setShowCancelDialog(false);
    }
  };

  const keepPaying = () => {
    setShowCancelDialog(false);
  };

  const handleSelectedPaymentMethod = type => {
    setPaymentMethod('loyalty');
    setLoyaltyCardType(type);
  };

  const handleDatafono = async () => {
    setShowAccumulateDialog(true);
  };

  const handleAccumulatePoints = () => {
    setShowAccumulateDialog(false);
    setIsAccumulatingPoints(true);
    setPaymentMethod('loyalty');
    setLoyaltyCardType('accumulate');
  };

  const handleSkipPoints = () => {
    setShowAccumulateDialog(false);
    setIsAccumulatingPoints(false);
    setOnlyPaymentEnabled(true);
    setPaymentMethod('card');
  };

  const handleCancelAccumulate = () => {
    setShowAccumulateDialog(false);
    resetPaymentMethod();
  };

  const handleConfirmAccumulate = () => {
    setIsAccumulatingPoints(true);
    setLoyaltyToken(null);
    setOnlyPaymentEnabled(true);
    setPaymentMethod('card');
  };

  const handlePoints = () => {
    setRedeemPoints(false);
    setTotalPlanAmount(0);
    setAccumulateUser(user);
    setTotalAmount(totalAmount);
    setOnlyPaymentEnabled(true);
    setPaymentMethod('card');
  };

  const resetPaymentMethod = useCallback(() => {
    setPaymentMethod(null);
    setLoyaltyCardType(null);
    resetLoyaltyState();
    resetQRPayment();

    const correctTotal = calculateCorrectTotal({
      paymentFlow,
      baseAmount,
      baseBag,
    });

    setTotalAmount(correctTotal);
    setShowAccumulateDialog(false);
    setOnlyPaymentEnabled(false);
    dispatch(setPaymentStep(0));
    try {
      fetchOrderData?.();
    } catch (_) {}
  }, [
    baseAmount,
    dispatch,
    paymentFlow,
    baseBag,
    setOnlyPaymentEnabled,
    resetLoyaltyState,
    resetQRPayment,
    fetchOrderData,
  ]);

  // Wrapper para exponer a PaymentMethods (actualiza estado con el valor calculado)
  const handleCalculateRemainingAmount = useCallback(() => {
    const {remaining, planAmount} = calculateRemainingAmount({
      user,
      totalAmount,
    });
    setTotalPlanAmount(planAmount);
    return remaining;
  }, [user, totalAmount]);

  const captureFullPayment = useCallback(
    async (usePoints = true) => {
      try {
        setLoading(true);

        // Determinar si necesitamos filtrar productos seleccionados (se resuelve en buildPaymentPayload)
        const payload = buildPaymentPayload({
          baseBag,
          baseCompany,
          paymentMethod: usePoints ? 'loyalty' : paymentMethod,
          user,
          loyaltyCardType,
          totalPlanAmount,
          redeemPoints,
          selectedProductIds:
            paymentFlow.isSplit && paymentFlow.splitType === 'products'
              ? paymentFlow.products.selectedProductIds || []
              : null,
        });

        const paymentType = getPaymentType(paymentFlow);

        const {loyaltyInfo, userBalance, redeemedAmount} = buildLoyaltyContext({
          usePoints,
          user,
          isAccumulatingPoints,
          accumulateUser,
          totalPlanAmount,
          totalAmount,
        });

        const splits = buildSplitsPayload(paymentFlow, paymentType);

        const {order} = await capturePaymentService({
          serverIp,
          apiToken,
          amount: totalAmount,
          sendData: payload.detalle || [],
          orderId: orderData?.id,
          source: 4, // datafono
          paymentType,
          loyaltyInfo,
          userBalance,
          redeemedAmount,
          splits,
        });

        if (order && order.invoice) {
          setPaymentResponse(order);
        }

        const refactor_order = mapRefactorOrder(order, null, {
          totalAmount: order.amount || totalAmount,
          fallbackPrefix: 'Loyalty',
          paymentMethod: 'loyalty',
        });

        if (paymentFlow.isSplit) {
          setDatafonoResponse(refactor_order);
          setPaymentFulfilled(true);
        } else {
          navigation.navigate('ThankYou', {
            order: refactor_order,
            paymentResponse: order,
            fully: order.balance_order === 0 || order.balance_order === null,
            setOnlyPaymentEnabled,
          });
        }
      } catch (err) {
        console.error('Error en captureFullPayment:', err);
        setError(t('payment_error'));
        resetPaymentMethod();
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      totalAmount,
      totalPlanAmount,
      paymentFlow,
      serverIp,
      apiToken,
      orderData,
      baseCompany,
      baseAmount,
      navigation,
      setOnlyPaymentEnabled,
      t,
      paymentMethod,
      isAccumulatingPoints,
      accumulateUser,
      resetPaymentMethod,
      baseBag,
      loyaltyCardType,
      redeemPoints,
      setError,
      setLoading,
    ],
  );

  useEffect(() => {
    if (paymentFulfilled === true && paymentFlow.isSplit) {
      navigation.navigate('ThankYou', {
        order: datafonoResponse,
        paymentResponse,
        setOnlyPaymentEnabled,
        fully: false,
      });
    }
  }, [
    paymentFulfilled,
    paymentFlow.isSplit,
    navigation,
    datafonoResponse,
    paymentResponse,
    setOnlyPaymentEnabled,
  ]);

  const showInitialLoader = loadingOrder || eligibilityStatus === 'checking';
  const canRenderPayment =
    !showInitialLoader &&
    !orderError &&
    !!orderData &&
    eligibilityStatus === 'allowed' &&
    !!baseBag &&
    baseBag.totalBag !== undefined;

  return (
    <View style={styles.container}>
      {showInitialLoader && (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      )}

      {!showInitialLoader && (orderError || !orderData) && (
        <View style={styles.centeredContainer}>
          <Text style={styles.loadingText}>
            {orderError || t('error_loading_order')}
          </Text>
        </View>
      )}

      {!showInitialLoader && eligibilityStatus === 'blocked' && (
        <View style={styles.centeredContainer}>
          <Text style={styles.loadingText}>{t('empty_order_message')}</Text>
        </View>
      )}

      {!showInitialLoader && (!baseBag || baseBag.totalBag === undefined) && (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {t('loading_payment_data') || 'Inicializando datos de pago...'}
          </Text>
        </View>
      )}

      {canRenderPayment && loading && (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('getting_info')}</Text>
        </View>
      )}

      {canRenderPayment && !loading && (
        <PaymentMethods
          // Payment method states
          paymentMethod={paymentMethod}
          loyaltyCardType={loyaltyCardType}
          // Loyalty states
          user={user}
          tempUser={tempUser}
          accumulateUser={accumulateUser}
          loyaltyToken={loyaltyToken}
          tokenValidated={tokenValidated}
          loading={loading}
          error={error}
          idNumber={idNumber}
          isAccumulatingPoints={isAccumulatingPoints}
          // QR states
          qrPaymentUrl={qrPaymentUrl}
          qrLoading={qrLoading}
          qrError={qrError}
          paymentStatus={paymentStatus}
          paymentId={paymentId}
          showCancelDialog={showCancelDialog}
          cancelLoading={cancelLoading}
          setShowCancelDialog={setShowCancelDialog}
          // Dialog states
          showAccumulateDialog={showAccumulateDialog}
          // Amounts and data
          totalAmount={totalAmount}
          currency={currency}
          baseBag={baseBag}
          orderConfirmedApiId={orderData?.id}
          // Actions
          setPaymentMethod={setPaymentMethod}
          setIdNumber={setIdNumber}
          handleLoyaltyPlan={handleLoyaltyPlan}
          resetPaymentMethod={resetPaymentMethod}
          handleDatafono={handleDatafono}
          handleSelectedPaymentMethod={handleSelectedPaymentMethod}
          handlePoints={handlePoints}
          setTotalAmount={setTotalAmount}
          captureFullPayment={captureFullPayment}
          setLoading={setLoading}
          setRedeemPoints={setRedeemPoints}
          setUser={setUser}
          setAccumulateUser={setAccumulateUser}
          setTokenValidated={setTokenValidated}
          setLoyaltyToken={setLoyaltyToken}
          handleManualCancelPayment={handleManualCancelPayment}
          confirmCancelPayment={confirmCancelPayment}
          keepPaying={keepPaying}
          handleRemoveBag={handleRemoveBag}
          handleAccumulatePoints={handleAccumulatePoints}
          handleSkipPoints={handleSkipPoints}
          handleCancelAccumulate={handleCancelAccumulate}
          handleConfirmAccumulate={handleConfirmAccumulate}
          calculateRemainingAmount={handleCalculateRemainingAmount}
          setOnlyPaymentEnabled={setOnlyPaymentEnabled}
          companySelected={companySelected}
          // Navigation
          navigation={navigation}
        />
      )}

      {canRenderPayment && (
        <ConfirmDialog
          visible={visible}
          onCancel={() => setVisible(false)}
          onConfirm={() => {
            setVisible(false);
            dispatch(clearBag());
            setTimeout(() => {
              navigation.navigate('VideoView');
            }, 200);
          }}
        />
      )}
    </View>
  );
};

export default PaymentView;
