// src/hooks/usePaymentData.js
import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {getOrderDetails} from '../../services/order/orderService';
import {ORDER_EVENTS} from '../../helpers/utils/OrderUtils';
import {clearOrderNotifications} from '../../redux/slice/bagSlice';
import {useOrderEvent} from '../../hooks/config/useSocketEvent';
import {mapOrderData, syncPaymentSplits} from '../../helpers/utils/OrderUtils';

export const usePaymentData = () => {
  const dispatch = useDispatch();
  const serverIp = useSelector(state => state.store.serverIp);
  const apiToken = useSelector(state => state.auth.apiToken);
  const {products: storeProducts} = useSelector(state => state.store);
  const currentPaymentFlow = useSelector(state => state.paymentFlow);
  const orderConfirmedApiId = useSelector(
    state => state.bag.orderConfirmedApiId,
  );

  // Estados locales
  const [orderData, setOrderData] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState(null);

  // Control interno
  const isFetchingRef = useRef(false);
  const revalidateScheduledRef = useRef(null);

  // Cargar datos desde API
  const fetchOrderData = useCallback(async () => {
    if (!orderConfirmedApiId || !serverIp || !apiToken) {
      setLoadingOrder(false);
      return;
    }
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      setLoadingOrder(true);
      setOrderError(null);

      const rawOrderData = await getOrderDetails({
        serverIp,
        apiToken,
        orderId: orderConfirmedApiId,
      });

      // Mapeo de datos y guardado en estado
      const mappedOrderData = mapOrderData(rawOrderData, storeProducts);
      setOrderData(mappedOrderData);

      // Limpiar notificaciones
      dispatch(clearOrderNotifications());

      // Sincronizar payment_split
      syncPaymentSplits(
        dispatch,
        rawOrderData.payment_split,
        currentPaymentFlow.splits.isBlocked,
      );
    } catch (error) {
      console.error('[usePaymentData] Error al obtener datos de orden:', error);
      setOrderError(error.message || 'Error al cargar datos de la orden');
    } finally {
      setLoadingOrder(false);
      isFetchingRef.current = false;
    }
  }, [
    orderConfirmedApiId,
    serverIp,
    apiToken,
    storeProducts,
    currentPaymentFlow.splits.isBlocked,
    dispatch,
  ]);

  // Revalidación con debounce
  const scheduleRevalidate = useCallback(() => {
    if (revalidateScheduledRef.current) return;
    revalidateScheduledRef.current = setTimeout(() => {
      revalidateScheduledRef.current = null;
      fetchOrderData();
    }, 250);
  }, [fetchOrderData]);

  // Handler de eventos de socket
  const handleOrderChanged = useCallback(
    evt => {
      const evtOrderId = evt?.order?.id || evt?.order_id || evt?.id;
      if (!orderConfirmedApiId || evtOrderId !== orderConfirmedApiId) return;
      scheduleRevalidate();
    },
    [orderConfirmedApiId, scheduleRevalidate],
  );

  // Cargar datos al montar
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Limpiar timeout al desmontar
  useEffect(
    () => () => {
      if (revalidateScheduledRef.current) {
        clearTimeout(revalidateScheduledRef.current);
        revalidateScheduledRef.current = null;
      }
    },
    [],
  );

  // Listener de WebSocket (ahora unificado con ORDER_REFRESH)
  useOrderEvent(
    ORDER_EVENTS.ORDER_REFRESH,
    handleOrderChanged,
    Boolean(orderConfirmedApiId),
  );

  // Objeto baseBag compatible
  const baseBag = useMemo(() => {
    if (!orderData) {
      return {
        products: [],
        totalBag: 0,
        balance: 0,
        clientName: '',
        orderType: 'dine_in',
        totalTaxes: 0,
      };
    }
    return {
      products: orderData.items || [],
      totalBag: orderData.total || 0,
      balance: orderData.balance || 0,
      clientName: orderData.client_name || '',
      orderType: orderData.order_type || 'dine_in',
      totalTaxes: orderData.total_taxes || 0,
    };
  }, [orderData]);

  const baseAmount = orderData ? orderData.balance || 0 : 0;
  const currency = orderData?.items?.[0]?.currency || 'CRC';

  return {
    orderData,
    baseBag,
    baseAmount,
    currency,
    loadingOrder,
    orderError,
    fetchOrderData,
  };
};
