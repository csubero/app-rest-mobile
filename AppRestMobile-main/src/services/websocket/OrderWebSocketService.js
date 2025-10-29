import BaseWebSocketService from './BaseWebSocketService';
import {store} from '../../redux/store';
import {
  setHasOrderNotifications,
  setSocketConnected,
  setSocketDisconnected,
  setSocketConnecting,
} from '../../redux/slice/bagSlice';
import {
  ORDER_EVENTS,
  ORDER_DONT_REFRESH_VIEWS,
} from '../../helpers/utils/OrderUtils';

class OrderWebSocketService extends BaseWebSocketService {
  constructor() {
    super();
    // Throttle leading-edge para evitar spam de notificaciones
    this._lastOrderNotifyTs = 0;
    this._notificationThrottleMs = 1000; // mismo intervalo que en IndexView
  }

  onConnecting() {
    console.log('[OrderWebSocket] 🟠 Conectando...');
    store.dispatch(setSocketConnecting({socketType: 'order'}));
  }

  onConnected() {
    console.log('[OrderWebSocket] ✅ Conectado exitosamente');
    store.dispatch(setSocketConnected({socketType: 'order'}));
  }

  onDisconnected() {
    console.log('[OrderWebSocket] ❌ Desconectado');
    store.dispatch(setSocketDisconnected({socketType: 'order'}));
  }

  onError(error) {
    console.log('[OrderWebSocket] ⚠️ Error:', error);
    store.dispatch(setSocketDisconnected({socketType: 'order'}));
  }

  _addNotificationToStore() {
    const currentView = store.getState().settings.currentView;
    console.log(
      '[OrderWebSocket] Agregando notificación en vista:',
      currentView,
    );
    if (!ORDER_DONT_REFRESH_VIEWS.includes(currentView)) {
      const now = Date.now();
      if (now - this._lastOrderNotifyTs < this._notificationThrottleMs) {
        console.log('[OrderWebSocket] Notificación descartada por throttle');
        return;
      }
      this._lastOrderNotifyTs = now;

      console.log('[OrderWebSocket] Refrescando orden');
      store.dispatch(setHasOrderNotifications(true));
    } else {
      console.log('No se agrega notificación');
    }
  }

  _handleMessage(data) {
    console.log('[OrderWebSocket] Mensaje recibido:', data.type);
    switch (data.type) {
      case ORDER_EVENTS.STATUS:
        this._addNotificationToStore();
        break;

      case ORDER_EVENTS.ITEMS_UPDATED:
      case ORDER_EVENTS.ORDER_PAYMENT:
      case ORDER_EVENTS.CHANGED:
      case ORDER_EVENTS.UPDATED:
      case ORDER_EVENTS.ITEM_UPDATED:
      case ORDER_EVENTS.REFRESH:
        this._handleOrderRefresh(data);
        break;

      case ORDER_EVENTS.PAYMENT_INIT:
        this._handlePaymentInitProcess(data);
        break;

      case ORDER_EVENTS.PAYMENT_PROCESSED:
        this._handlePaymentProcessed(data);
        break;

      case ORDER_EVENTS.PAYMENT_FAILED:
        this._handlePaymentFailed(data);
        break;

      default:
        this._handleOrderStatus(data);
    }
  }

  _handleOrderRefresh(data) {
    this._addNotificationToStore();
    const listeners = this.listeners.get(ORDER_EVENTS.ORDER_REFRESH) || [];
    listeners.forEach(callback => callback(data));
  }

  _handlePaymentInitProcess(data) {
    console.log('[OrderWebSocket] Pago iniciado');
    const listeners = this.listeners.get(ORDER_EVENTS.PAYMENT_INIT) || [];
    if (listeners.length > 0) {
      listeners.forEach(callback => callback(data));
    }
  }

  _handlePaymentProcessed(data) {
    const listeners = this.listeners.get(ORDER_EVENTS.PAYMENT_PROCESSED) || [];
    this._addNotificationToStore();
    console.log('[OrderWebSocket] Pago procesado');
    listeners.forEach(callback => callback(data));
  }

  _handlePaymentFailed(data) {
    console.log('[OrderWebSocket] Pago fallido');
    const listeners = this.listeners.get(ORDER_EVENTS.PAYMENT_FAILED) || [];
    if (listeners.length > 0) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export default new OrderWebSocketService();
