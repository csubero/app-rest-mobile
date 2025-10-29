/* eslint-disable react-hooks/exhaustive-deps */
// hooks/useOrderCompletionHandler.js
import {useRef, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {clearOrderNotifications} from '../../redux/slice/bagSlice';
import {
  setPaidSplits,
  setTotalSplitAmount,
  setSplitCount,
  setIsSplit,
  setSplitType,
  blockSplits,
} from '../../redux/slice/paymentFlowSlice';
import {getOrderDetails} from '../../services/order/orderService';
import {ORDER_DONT_REFRESH_VIEWS} from '../../helpers/utils/OrderUtils';
let GLOBAL_isProcessingOrderCompletion = false;
let GLOBAL_lastProcessedOrderCompletion = 0;
export const useOrderCompletionHandler = (options = {}) => {
  const {
    enabled = true,
    context = 'OrderHook',
    throttleMs = 1000,
    requireNotification = false,
    excludeViews = [],
  } = options;
  // Logger con contexto
  const log = (...args) => console.log(`[${context}]`, ...args);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const currentView = useSelector(state => state.settings.currentView);
  const currentPaymentFlow = useSelector(state => state.paymentFlow);
  const orderConfirmedApiId = useSelector(
    state => state.bag.orderConfirmedApiId,
  );
  const hasOrderNotifications = useSelector(
    state => state.bag.hasOrderNotifications,
  );
  const {serverIp} = useSelector(state => state.store);
  const {apiToken} = useSelector(state => state.auth);

  // Control para evitar múltiples navegaciones a ThankYou
  const isNavigatingToThankYou = useRef(false);
  const SOCKET_THROTTLE_MS = throttleMs;

  // Helper: sincroniza los datos de payment split en Redux
  const syncPaymentSplit = useCallback(
    payment_split => {
      if (!payment_split) {
        return;
      }
      const {split_count, total_split_amount, paying_splits} = payment_split;

      log('Sincronizando payment_split', {
        split_count,
        total_split_amount,
        paying_len: paying_splits?.length || 0,
        wasBlocked: currentPaymentFlow.splits.isBlocked,
      });

      dispatch(setSplitCount(split_count || 2));
      dispatch(setTotalSplitAmount(total_split_amount || 0));
      dispatch(setPaidSplits(paying_splits || []));
      if (!currentPaymentFlow.splits.isBlocked) {
        dispatch(setIsSplit(true));
        dispatch(setSplitType('equal'));
        dispatch(blockSplits());
      }
    },
    [dispatch, currentPaymentFlow.splits.isBlocked, currentView],
  );

  const shouldNavigateToThankYou = useCallback(
    orderData => {
      if (!orderData) {
        return false;
      }

      const balance = orderData.balance || 0;
      const status = orderData.status;
      const hasItems = orderData.items && orderData.items.length > 0;
      const isCompleted = balance <= 0 && status?.key === 7 && hasItems;

      if (isCompleted) {
        console.log(` [${currentView}] Orden completamente pagada detectada`);
        return true;
      }

      if (balance <= 0 && status?.key === 7 && !hasItems) {
        console.log(`🔍 [${currentView}] Orden completada pero sin items`);
      }

      return false;
    },
    [currentView],
  );

  const navigateToThankYou = useCallback(
    async orderData => {
      if (isNavigatingToThankYou.current) {
        log('🚫 Navegación a ThankYou omitida (duplicado)');
        return;
      }

      // Pequeño delay para asegurar que el estado esté actualizado
      await new Promise(resolve => setTimeout(resolve, 50));

      // Si aún se reporta 'payment', reintentar una vez tras un pequeño delay para evitar carrera al cambiar de vista
      if (currentView === 'payment') {
        await new Promise(resolve => setTimeout(resolve, 120));
      }

      if (currentView === 'payment' || currentView === 'thankyou') {
        log(
          `⏭️ Navegación a ThankYou omitida por vista actual: ${currentView}`,
        );
        return;
      }

      log(`🎯 Navegando a ThankYou (vista actual: ${currentView})`);

      // Marcar que ya estamos navegando para evitar duplicados
      isNavigatingToThankYou.current = true;

      // Crear objeto de orden simulado para ThankYou
      const orderForThankYou = {
        invoice_serial: orderData.external_id || `ORDER-${orderData.id}`,
        invoice_number: null,
        invoice_key: null,
        invoice_consecutive: null,
        order_date: orderData.order_date || new Date().toISOString(),
        amount: orderData.total || 0,
        transactionReference: orderData.external_id || orderData.id,
      };

      // Limpiar notificaciones antes de navegar
      dispatch(clearOrderNotifications());

      // Navegar a ThankYou
      navigation.navigate('ThankYou', {
        order: orderForThankYou,
        paymentResponse: {},
        fully: true,
        setOnlyPaymentEnabled: () => {},
      });
      log('✅ Navegación a ThankYou ejecutada', {
        invoice_serial: orderForThankYou.invoice_serial,
      });
    },
    [currentView],
  );

  const handleOrderCompletion = useCallback(
    async (orderData = null) => {
      if (!orderConfirmedApiId) {
        log('Skip handleOrderCompletion: no orderConfirmedApiId');
        return;
      }

      if (!orderData) {
        log('Skip handleOrderCompletion: no orderData');
        return;
      }

      try {
        const statusKey = orderData?.status?.key;
        const balance = orderData?.balance ?? null;
        const itemsCount = orderData?.items?.length || 0;
        log('Procesando completion de orden', {
          statusKey,
          balance,
          itemsCount,
        });
        syncPaymentSplit(orderData.payment_split);
        if (shouldNavigateToThankYou(orderData)) {
          log('Orden completamente pagada, navegando a ThankYou');
          await navigateToThankYou(orderData);
        }
      } catch (error) {
        console.error(
          ` [${currentView}] Error al verificar estado de orden:`,
          error,
        );
      }
    },
    [orderConfirmedApiId, currentView],
  );

  // Obtiene la orden desde el servidor, aplica throttling/guards y delega a handleOrderCompletion
  const checkOrderCompletion = useCallback(async () => {
    if (!enabled) {
      return;
    }
    if (!orderConfirmedApiId) {
      return;
    }

    if (requireNotification && !hasOrderNotifications) {
      return;
    }

    const blockedViews = new Set([
      ...(ORDER_DONT_REFRESH_VIEWS || []),
      'payment',
      'thankyou',
      ...excludeViews,
    ]);
    if (blockedViews.has(currentView)) {
      log('Skip: vista bloqueada para refresh');
      return;
    }

    log('checkOrderCompletion triggered', {
      currentView,
      orderConfirmedApiId,
      requireNotification,
      hasOrderNotifications,
    });

    // Throttling
    const now = Date.now();
    const timeSinceLast = now - GLOBAL_lastProcessedOrderCompletion;
    if (
      GLOBAL_isProcessingOrderCompletion ||
      timeSinceLast < SOCKET_THROTTLE_MS
    ) {
      if (GLOBAL_isProcessingOrderCompletion) {
        log('Skip: ya hay una verificación en proceso (global)');
      } else {
        log(
          `Skip: throttle global (${timeSinceLast}ms < ${SOCKET_THROTTLE_MS}ms)`,
        );
      }
      return;
    }
    GLOBAL_lastProcessedOrderCompletion = now;
    GLOBAL_isProcessingOrderCompletion = true;

    try {
      log('🔄 Fetching order details...', {orderId: orderConfirmedApiId});
      const start = Date.now();
      const rawOrderData = await getOrderDetails({
        serverIp,
        apiToken,
        orderId: orderConfirmedApiId,
      });
      const elapsed = Date.now() - start;
      const statusKey = rawOrderData?.status?.key;
      const balance = rawOrderData?.balance ?? null;
      const itemsCount = rawOrderData?.items?.length || 0;
      const hasSplit = Boolean(rawOrderData?.payment_split);
      log('✅ Fetch OK', {
        ms: elapsed,
        statusKey,
        balance,
        itemsCount,
        hasSplit,
      });

      await handleOrderCompletion(rawOrderData);
    } catch (error) {
      console.error(` [${context}] Error en checkOrderCompletion:`, error);
    } finally {
      setTimeout(() => {
        GLOBAL_isProcessingOrderCompletion = false;
      }, 100);
    }
  }, [
    enabled,
    orderConfirmedApiId,
    currentView,
    serverIp,
    apiToken,
    handleOrderCompletion,
    hasOrderNotifications,
    requireNotification,
    context,
    excludeViews,
  ]);

  return {
    handleOrderCompletion,
    shouldNavigateToThankYou,
    navigateToThankYou,
    isNavigatingToThankYou: isNavigatingToThankYou.current,
    checkOrderCompletion,
  };
};
