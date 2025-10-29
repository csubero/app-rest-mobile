// src/hooks/useQRPayment.js
import {useState, useCallback, useRef, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {
  capturePayment as capturePaymentService,
  getPaymentType,
} from '../../services/payment/paymentService';
import {useOrderEvent} from '../../hooks/config/useSocketEvent';
import {useGlobalSocket} from '../../providers/GlobalSocketProvider';
import {
  ORDER_EVENTS,
  buildPaymentPayload,
  mapRefactorOrder,
  PAYMENT_STATUS,
} from '../../helpers/utils/OrderUtils';
import {
  setProductsInPayment,
  clearProductsInPayment,
} from '../../redux/slice/paymentFlowSlice';

export const useQRPayment = ({
  paymentFlow,
  serverIp,
  apiToken,
  orderConfirmedApiId,
  baseCompany,
  baseBag,
  isAccumulatingPoints,
  accumulateUser,
  navigation,
  setOnlyPaymentEnabled,
  user,
  redeemPoints,
  totalPlanAmount,
}) => {
  const dispatch = useDispatch();
  const {sendProductsPaymentStatus} = useGlobalSocket();
  const [qrPaymentUrl, setQrPaymentUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('waiting');
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [currentTotalAmount, setCurrentTotalAmount] = useState(null);

  const qrInFlightRef = useRef(false);
  const paymentIdRef = useRef(null);

  useEffect(() => {
    paymentIdRef.current = paymentId;
  }, [paymentId]);

  // Construir payload para iniciar pago
  const processData = useCallback(() => {
    if (!baseBag?.products) {
      throw new Error('baseBag o baseBag.products no está definido');
    }
    if (!baseCompany?.pointOfSaleSelected) {
      throw new Error('baseCompany o pointOfSaleSelected no está definido');
    }

    let selectedProductIds = null;
    if (paymentFlow.isSplit && paymentFlow.splitType === 'products') {
      selectedProductIds = paymentFlow.products.selectedProductIds || [];
    }

    return buildPaymentPayload({
      baseBag,
      baseCompany,
      paymentMethod: 'card',
      user: accumulateUser || user || null,
      loyaltyCardType: accumulateUser ? 'accumulate' : null,
      totalPlanAmount: totalPlanAmount || 0,
      redeemPoints: redeemPoints || false,
      selectedProductIds,
    });
  }, [
    baseBag,
    baseCompany,
    accumulateUser,
    user,
    totalPlanAmount,
    redeemPoints,
    paymentFlow.isSplit,
    paymentFlow.splitType,
    paymentFlow.products.selectedProductIds,
  ]);

  // Generar QR
  const generateQRUrl = useCallback(
    async totalAmount => {
      if (qrInFlightRef.current || qrPaymentUrl) return;

      try {
        qrInFlightRef.current = true;
        setQrLoading(true);
        setQrError(false);
        setCurrentTotalAmount(totalAmount);

        const payload = processData();
        const paymentType = getPaymentType(paymentFlow);

        // Bloquear productos que van a ser pagados
        const productsToBlock = payload.detalle.map(item => item.internalId);
        dispatch(setProductsInPayment(productsToBlock));
        
        // Enviar estado a otras tablets por WebSocket
        sendProductsPaymentStatus(productsToBlock);

        const paymentData = {
          serverIp,
          apiToken,
          amount: totalAmount,
          sendData: payload.detalle,
          orderId: orderConfirmedApiId,
          source:
            redeemPoints && totalPlanAmount > 0
              ? '5'
              : baseCompany.pointOfSaleSelected.source.key,
          paymentType,
          paymentSplit: paymentFlow.splits,
        };

        if (paymentType === 'split_equal') {
          paymentData.splits = {
            payingSplits: paymentFlow.splits.selectedSplits,
            splitCount: paymentFlow.splits.splitCount,
            selectedSplitsCount: paymentFlow.splits.selectedSplits.length,
            totalSplitAmount: paymentFlow.splits.totalSplitAmount,
          };
        }

        // Datos de loyalty
        if (redeemPoints && user) {
          paymentData.loyaltyInfo = {
            redeem: true,
            numero_tarjeta: user.card_number,
            userId: user.id,
            clientName: user.name || user.client_name,
            pointsToRedeem: totalPlanAmount,
            totalOrderAmount: totalAmount,
          };
          paymentData.userBalance = user.balance;
          paymentData.redeemedAmount = totalPlanAmount;
        }

        if (isAccumulatingPoints && accumulateUser) {
          paymentData.loyaltyInfo = {
            accumulate: true,
            userId: accumulateUser.id,
            numero_tarjeta: accumulateUser.card_number,
            clientName: accumulateUser.name || accumulateUser.client_name,
            totalOrderAmount: totalAmount,
          };
          paymentData.userBalance = accumulateUser.balance;
          paymentData.redeemedAmount = 0;
        }

        const {order, paymentId: createdPaymentId} =
          await capturePaymentService(paymentData);

        setPaymentResponse(order);

        if (!order.url) {
          const refactor_order = mapRefactorOrder(order, null, {
            totalAmount,
            fallbackPrefix: 'Direct',
            paymentMethod: 'card',
          });

          navigation.navigate('ThankYou', {
            order: refactor_order,
            paymentResponse: order,
            fully: false,
            setOnlyPaymentEnabled,
          });
          return;
        }

        setQrPaymentUrl(order.url);
        setPaymentId(createdPaymentId);
      } catch (error) {
        console.error('Error generating QR URL:', error);
        setQrError(true);
      } finally {
        setQrLoading(false);
        qrInFlightRef.current = false;
      }
    },
    [
      qrPaymentUrl,
      paymentFlow,
      serverIp,
      apiToken,
      orderConfirmedApiId,
      baseCompany,
      isAccumulatingPoints,
      accumulateUser,
      navigation,
      setOnlyPaymentEnabled,
      processData,
      redeemPoints,
      totalPlanAmount,
      user,
      sendProductsPaymentStatus,
    ],
  );

  // Handlers de eventos de pago
  const handlePaymentCompletion = useCallback(
    (data, totalAmount) => {
      try {
        const currentPaymentId = paymentIdRef.current;
        const payment = data.order?.payments?.find(
          p => p.id === currentPaymentId,
        );
        if (!payment) {
          console.error('No se encontró el pago con ID:', currentPaymentId);
          return;
        }

        // Desbloquear productos al completar el pago
        dispatch(clearProductsInPayment());
        // Enviar estado vacío a otras tablets
        sendProductsPaymentStatus([]);

        const refactor_order = mapRefactorOrder(data.order, payment, {
          totalAmount,
          qrUrl: qrPaymentUrl,
          fallbackPrefix: 'QR',
          paymentMethod: 'qr',
        });

        navigation.navigate('ThankYou', {
          order: refactor_order,
          paymentResponse: data,
          fully: false,
          setOnlyPaymentEnabled,
        });
      } catch (error) {
        console.error('Error procesando pago desde WebSocket:', error);
      }
    },
    [navigation, setOnlyPaymentEnabled, qrPaymentUrl, dispatch, sendProductsPaymentStatus],
  );

  const handlePaymentInit = useCallback(() => {
    setPaymentStatus('scanning');
  }, []);

  const handlePaymentProcessed = useCallback(
    (data, totalAmount) => {
      if (data.payment_status === 3) {
        setPaymentStatus('failed');
        return;
      }
      const currentPaymentId = paymentIdRef.current;
      const payment = data.order?.payments?.find(
        p => p.id === currentPaymentId,
      );
      if (payment?.status?.key === 3) {
        setPaymentStatus('failed');
        return;
      }
      setPaymentStatus('completed');
      return handlePaymentCompletion(data, totalAmount);
    },
    [handlePaymentCompletion],
  );

  const handlePaymentFailed = useCallback(() => {
    setPaymentStatus('failed');
  }, []);

  // Reset & cancel
  const resetQRPayment = useCallback(() => {
    setQrPaymentUrl(null);
    setQrLoading(false);
    setQrError(false);
    setPaymentId(null);
    setPaymentStatus('waiting');
    setShowCancelDialog(false);
    setCancelLoading(false);
    setPaymentResponse(null);
    setCurrentTotalAmount(null);
    // Desbloquear productos
    dispatch(clearProductsInPayment());
    // Enviar estado vacío a otras tablets
    sendProductsPaymentStatus([]);
  }, [dispatch, sendProductsPaymentStatus]);

  const handleCancelPayment = useCallback(() => {
    if (['waiting', 'scanning', 'failed'].includes(paymentStatus)) {
      resetQRPayment();
    } else {
      resetQRPayment();
    }
  }, [paymentStatus, resetQRPayment]);

  // Flags
  const isFullLoyaltyPayment =
    user &&
    redeemPoints &&
    user.balance >= (totalPlanAmount || 0) &&
    (totalPlanAmount || 0) > 0 &&
    currentTotalAmount !== null &&
    currentTotalAmount === totalPlanAmount;

  const shouldListenPayments = Boolean(paymentId) && !isFullLoyaltyPayment;

  // Suscripción a eventos socket
  useOrderEvent(
    ORDER_EVENTS.PAYMENT_INIT,
    handlePaymentInit,
    shouldListenPayments,
  );
  useOrderEvent(
    ORDER_EVENTS.PAYMENT_PROCESSED,
    handlePaymentProcessed,
    shouldListenPayments,
  );
  useOrderEvent(
    ORDER_EVENTS.PAYMENT_FAILED,
    handlePaymentFailed,
    shouldListenPayments,
  );

  return {
    qrPaymentUrl,
    qrLoading,
    qrError,
    paymentId,
    paymentStatus,
    paymentResponse,
    showCancelDialog,
    cancelLoading,
    generateQRUrl,
    resetQRPayment,
    handleCancelPayment,
    setShowCancelDialog,
    setCancelLoading,
  };
};
