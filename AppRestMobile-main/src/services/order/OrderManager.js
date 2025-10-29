// src/services/OrderManager.js
import {store} from '../../redux/store';
import {setSocketConnecting} from '../../redux/slice/bagSlice';
import webSocketManager from '../websocket/WebSocketManager';

class OrderManager {
  constructor() {
    this.lastFetchTime = null;
    this.currentOrderData = null;
    this.isCurrentlyFetching = false;
    this.pendingCallbacks = [];
  }

  performSocketReconnection(showToast = false, source = 'OrderManager') {
    const state = store.getState();
    const {orderConfirmedApiId} = state.bag;
    const {tableData} = state.company;
    const {serverIp} = state.store;

    console.log(`[${source}] Iniciando reconexión de sockets...`);

    if (!serverIp) {
      const message = 'No hay IP de servidor configurada';
      console.warn(`[${source}] ${message}`);

      if (showToast && typeof require !== 'undefined') {
        try {
          const {ToastAndroid} = require('react-native');
          ToastAndroid.show(`❌ ${message}`, ToastAndroid.SHORT);
        } catch (e) {
          // Ignorar si ToastAndroid no está disponible
        }
      }
      return false;
    }

    const baseUrl = `ws://${serverIp}`;
    let socketsToReconnect = [];

    // Primero desconectar todos para evitar conflictos
    console.log(`[${source}] Desconectando sockets antes de reconectar...`);
    webSocketManager.disconnectAll();

    // Esperar un poco antes de reconectar para evitar conflictos
    setTimeout(() => {
      // Reconectar socket de orden si hay orderId
      if (orderConfirmedApiId) {
        console.log(
          `[${source}] Reconectando order socket:`,
          orderConfirmedApiId,
        );
        store.dispatch(setSocketConnecting({socketType: 'order'}));
        webSocketManager.connectOne('orders', baseUrl, orderConfirmedApiId);
        socketsToReconnect.push('Órdenes');
      }

      // Reconectar socket de mesa si hay tableId
      if (tableData?.table?.id) {
        console.log(
          `[${source}] Reconectando table socket:`,
          tableData.table.id,
        );
        store.dispatch(setSocketConnecting({socketType: 'table'}));
        webSocketManager.connectOne('tables', baseUrl, tableData.table.id);
        socketsToReconnect.push('Mesa');
      }

      // Reconectar socket de tablet (siempre)
      console.log(`[${source}] Reconectando tablet socket`);
      store.dispatch(setSocketConnecting({socketType: 'tablet'}));
      webSocketManager.connectOneGeneral('tablet', baseUrl);
      socketsToReconnect.push('Tablet');

      console.log(`[${source}] Reconexión completada:`, socketsToReconnect);

      if (showToast && typeof require !== 'undefined') {
        try {
          const {ToastAndroid} = require('react-native');
          ToastAndroid.show(
            `🔄 Reconectando sockets: ${socketsToReconnect.join(', ')}`,
            ToastAndroid.SHORT,
          );
        } catch (e) {
          // Ignorar si ToastAndroid no está disponible
        }
      }
    }, 500); // Esperar 500ms

    return true;
  }
}

// Singleton instance
export default new OrderManager();
