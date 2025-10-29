import BaseWebSocketService from './BaseWebSocketService';
import {store} from '../../redux/store';
import {setSocketConnected, setSocketDisconnected, setSocketConnecting} from '../../redux/slice/bagSlice';

class TabletWebSocketService extends BaseWebSocketService {
  // Método llamado cuando se inicia la conexión
  onConnecting() {
    console.log('[TabletWebSocket] 🟠 Conectando...');
    store.dispatch(setSocketConnecting({socketType: 'tablet'}));
  }

  // Método llamado cuando el socket se conecta exitosamente
  onConnected() {
    console.log('[TabletWebSocket] ✅ Conectado exitosamente');
    store.dispatch(setSocketConnected({socketType: 'tablet'}));
  }

  // Método llamado cuando el socket se desconecta
  onDisconnected() {
    console.log('[TabletWebSocket] ❌ Desconectado');
    store.dispatch(setSocketDisconnected({socketType: 'tablet'}));
  }

  // Método llamado cuando hay un error en el socket
  onError(error) {
    console.log('[TabletWebSocket] ⚠️ Error:', error);
    store.dispatch(setSocketDisconnected({socketType: 'tablet'}));
  }
  _handleMessage(data) {
    switch (data.type) {
      case 'refresh_products':
        this._handleRefreshProducts(data);
        break;
      case 'products_payment_status':
        this._handleProductsPaymentStatus(data);
        break;
      default:
        super._handleMessage(data);
        break;
    }
  }

  _handleRefreshProducts(data) {
    console.log('[TabletWebSocket] Refresh products recibido:', data);
    const listeners = this.listeners.get('refresh_products') || [];
    listeners.forEach(callback => callback(data));
  }

  _handleProductsPaymentStatus(data) {
    console.log('[TabletWebSocket] Products payment status recibido:', data);
    const listeners = this.listeners.get('products_payment_status') || [];
    listeners.forEach(callback => callback(data));
  }

  // Método para enviar estado de productos en pago a otras tablets
  async sendProductsPaymentStatus(productsInPayment, tableId, tableInternalId) {
    console.log('[TabletWebSocket] Enviando estado de productos en pago:', {
      productsInPayment,
      tableId,
      tableInternalId,
    });

    try {
      const result = await this.sendSimple({
        type: 'products_payment_status',
        tableId: tableId,
        tableInternalId: tableInternalId,
        message: {
          productsInPayment: productsInPayment,
          timestamp: new Date().toISOString(),
        },
      });

      if (!result) {
        console.error('[TabletWebSocket] Error al enviar estado de productos en pago');
      }

      return result;
    } catch (error) {
      console.error('[TabletWebSocket] Error al enviar estado de productos en pago:', error);
      return false;
    }
  }
}

export default new TabletWebSocketService();
