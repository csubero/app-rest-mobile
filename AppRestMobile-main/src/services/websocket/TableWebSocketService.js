import BaseWebSocketService from './BaseWebSocketService';
import {store} from '../../redux/store';
import {
  setSocketConnected,
  setSocketDisconnected,
  setSocketConnecting,
} from '../../redux/slice/bagSlice';

class TableWebSocketService extends BaseWebSocketService {
  // Método llamado cuando se inicia la conexión
  onConnecting() {
    console.log('[TableWebSocket] 🟠 Conectando...');
    store.dispatch(setSocketConnecting({socketType: 'table'}));
  }

  // Método llamado cuando el socket se conecta exitosamente
  onConnected() {
    console.log('[TableWebSocket] ✅ Conectado exitosamente');
    store.dispatch(setSocketConnected({socketType: 'table'}));
  }

  // Método llamado cuando el socket se desconecta
  onDisconnected() {
    console.log('[TableWebSocket] ❌ Desconectado');
    store.dispatch(setSocketDisconnected({socketType: 'table'}));
  }

  // Método llamado cuando hay un error en el socket
  onError(error) {
    console.log('[TableWebSocket] ⚠️ Error:', error);
    store.dispatch(setSocketDisconnected({socketType: 'table'}));
  }
  _handleMessage(data) {
    switch (data.type) {
      case 'table_attended':
        this._handleTableAttended(data);
        break;
      default:
        super._handleMessage(data);
        break;
    }
  }

  _handleTableAttended(data) {
    const listeners = this.listeners.get('table_attended') || [];
    listeners.forEach(callback => callback(data));
  }

  async requestHelp(tableId, tableNumber) {
    console.log('[TableWebSocket] Solicitando ayuda:', {
      tableId,
      tableNumber,
    });

    try {
      const result = await this.sendSimple({
        type: 'table_call',
        tableId: tableId,
        tableNumber: tableNumber,
        message: {
          message: 'La mesa esta solicitando asistencia',
          title: 'Solicitud de asistencia',
          subtype: 'request',
        },
      });

      if (!result) {
        console.error('[TableWebSocket] Error al solicitar ayuda');
      }

      return result;
    } catch (error) {
      console.error('[TableWebSocket] Error al solicitar ayuda:', error);
      return false;
    }
  }

  async cancelHelp(tableId, tableNumber) {
    console.log('[TableWebSocket] Cancelando ayuda:', {
      tableId,
      tableNumber,
    });

    try {
      const result = await this.sendSimple({
        type: 'table_call',
        tableId: tableId,
        tableNumber: tableNumber,
        message: {
          message: 'La mesa ya no requiere asistencia',
          title: 'Asistencia cancelada',
          subtype: 'cancel',
        },
      });

      if (!result) {
        console.error('[TableWebSocket] Error al cancelar ayuda');
      }

      return result;
    } catch (error) {
      console.error('[TableWebSocket] Error al cancelar ayuda:', error);
      return false;
    }
  }

  async endOrderHelp(tableId, tableNumber) {
    console.log('[TableWebSocket] Finalizando ayuda de orden:', {
      tableId,
      tableNumber,
    });

    try {
      const result = await this.sendSimple({
        type: 'table_call',
        tableId: tableId,
        tableNumber: tableNumber,
        message: {
          message: 'Mesa finalizada',
          title: 'Mesa finalizada retirar tablet',
          subtype: 'end',
        },
      });

      if (!result) {
        console.error('[TableWebSocket] Error al finalizar ayuda de orden');
      }

      return result;
    } catch (error) {
      console.error(
        '[TableWebSocket] Error al finalizar ayuda de orden:',
        error,
      );
      return false;
    }
  }

  async startPaymentProcess(tableId, tableNumber, table_internal_id) {
    console.log('[TableWebSocket] Iniciando proceso de pago:', {
      tableId,
      tableNumber,
      table_internal_id,
    });

    try {
      const result = await this.sendSimple({
        type: 'table_attended',
        tableId: tableId,
        tableNumber: tableNumber,
        message: {
          tableStartedId: table_internal_id,
          subtype: 'payment_start',
        },
      });

      if (!result) {
        console.error(
          '[TableWebSocket] Error al iniciar proceso de pago - WebSocket no conectado',
        );
      }

      return result;
    } catch (error) {
      console.error(
        '[TableWebSocket] Error al iniciar proceso de pago:',
        error,
      );
      return false;
    }
  }

  async endPaymentProcess(tableId, tableNumber) {
    console.log('[TableWebSocket] Finalizando proceso de pago:', {
      tableId,
      tableNumber,
    });

    try {
      const result = await this.sendSimple({
        type: 'table_attended',
        tableId: tableId,
        tableNumber: tableNumber,
        message: {
          subtype: 'payment_end',
        },
      });

      if (!result) {
        console.error(
          '[TableWebSocket] Error al finalizar proceso de pago - WebSocket no conectado',
        );
      }

      return result;
    } catch (error) {
      console.error(
        '[TableWebSocket] Error al finalizar proceso de pago:',
        error,
      );
      return false;
    }
  }
}

export default new TableWebSocketService();
