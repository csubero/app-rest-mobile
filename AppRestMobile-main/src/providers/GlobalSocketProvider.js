/* eslint-disable react-hooks/exhaustive-deps */
// providers/GlobalSocketProvider.js
import React, {createContext, useContext, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {useSelector, useDispatch} from 'react-redux';
import {AppState} from 'react-native';
import webSocketManager from '../services/websocket/WebSocketManager';
import TableWebSocketService from '../services/websocket/TableWebSocketService';
import TabletWebSocketService from '../services/websocket/TabletWebSocketService';
import {useSilentSync} from '../hooks/config/useSilentSync';
import {store} from '../redux/store';

// Importar actions de Redux
import {
  showTableAttendedModal,
  disableSocketReconnection,
  setSocketConnecting,
  setSocketDisconnected,
} from '../redux/slice/bagSlice';
import {setProductsInPayment} from '../redux/slice/paymentFlowSlice';
// Removed setMultitabletIsBlocked - no longer blocking tablets

const GlobalSocketContext = createContext();

export const useGlobalSocket = () => {
  const context = useContext(GlobalSocketContext);
  if (!context) {
    throw new Error(
      'useGlobalSocket debe usarse dentro de GlobalSocketProvider',
    );
  }
  return context;
};

export const GlobalSocketProvider = ({children}) => {
  const dispatch = useDispatch();
  const {t} = useTranslation();

  // Hook para sincronización silenciosa
  const {performSilentSync} = useSilentSync();

  // Selectors
  const orderId = useSelector(state => state.bag.orderConfirmedApiId);
  const tableId = useSelector(state => state.company.tableData?.table?.id);
  const tableInternalId = useSelector(
    state => state.company.tableData?.tableInternalId,
  );
  const shouldReconnectSockets = useSelector(
    state => state.bag.shouldReconnectSockets,
  );
  const {serverIp} = useSelector(state => state.store);
  let formattedSocketIp = serverIp;

  // ======================
  // CONEXIÓN DE WEBSOCKETS
  // ======================

  // Manejar conexión/desconexión de order socket
  useEffect(() => {
    if (orderId && shouldReconnectSockets) {
      console.log('[GlobalSocket] Conectando order socket:', orderId);
      dispatch(setSocketConnecting({socketType: 'order'}));

      webSocketManager.connectOne(
        'orders',
        `ws://${formattedSocketIp}`,
        orderId,
      );

      return () => {
        console.log('[GlobalSocket] Desconectando order socket:', orderId);
        dispatch(setSocketDisconnected({socketType: 'order'}));
        webSocketManager.disconnectOne(
          'orders',
          `ws://${formattedSocketIp}`,
          orderId,
        );
      };
    } else {
      dispatch(setSocketDisconnected({socketType: 'order'}));
    }
  }, [orderId, formattedSocketIp, shouldReconnectSockets, dispatch]);

  // Manejar conexión/desconexión de table socket
  useEffect(() => {
    if (tableId && shouldReconnectSockets) {
      console.log('[GlobalSocket] Conectando table socket:', tableId);
      dispatch(setSocketConnecting({socketType: 'table'}));

      webSocketManager.connectOne(
        'tables',
        `ws://${formattedSocketIp}`,
        tableId,
      );

      return () => {
        console.log('[GlobalSocket] Desconectando table socket:', tableId);
        dispatch(setSocketDisconnected({socketType: 'table'}));
        webSocketManager.disconnectOne(
          'tables',
          `ws://${formattedSocketIp}`,
          tableId,
        );
      };
    } else {
      dispatch(setSocketDisconnected({socketType: 'table'}));
    }
  }, [tableId, formattedSocketIp, shouldReconnectSockets, dispatch]);

  // Manejar conexión/desconexión de tablet socket - SIEMPRE CONECTADO
  useEffect(() => {
    if (shouldReconnectSockets) {
      console.log('[GlobalSocket] Conectando tablet socket');
      dispatch(setSocketConnecting({socketType: 'tablet'}));

      webSocketManager.connectOneGeneral('tablet', `ws://${formattedSocketIp}`);

      return () => {
        console.log(
          '[GlobalSocket] Desconectando tablet socket:',
          tableInternalId,
        );
        dispatch(setSocketDisconnected({socketType: 'tablet'}));
        webSocketManager.disconnectOneGeneral(
          'tablet',
          `ws://${formattedSocketIp}`,
        );
      };
    } else {
      dispatch(setSocketDisconnected({socketType: 'tablet'}));
    }
  }, [formattedSocketIp, shouldReconnectSockets, dispatch, tableInternalId]);

  // ======================
  // LISTENERS GLOBALES DE WEBSOCKET
  // ======================

  // Listeners para Table Events - MANEJO GLOBAL
  useEffect(() => {
    if (!tableId) {
      return;
    }
    // Handler global para mesa atendida
    const handleTableAttended = data => {
      const subtype = data.message.subtype ? data.message.subtype : null;
      const type = data.type ? data.type : 'unknown';

      console.log(
        '[GlobalSocket] Table recibido - tipo:',
        type,
        ' - subtipo:',
        subtype,
      );

      // Verificar si el evento es para nuestra mesa
      if (data.table.id === tableId) {
        switch (subtype) {
          case 'payment_start':
            // Ya no bloqueamos tablets, solo productos individuales
            console.log('[GlobalSocket] Pago iniciado en otra tablet - no bloqueamos interfaz');
            break;

          case 'payment_end':
            console.log('[GlobalSocket] Pago finalizado en otra tablet');
            break;

          default:
            // Flujo normal - mostrar modal de mesero
            dispatch(
              showTableAttendedModal({
                message: t('table_attended_message'),
                title: t('table_attended_title'),
              }),
            );
            break;
        }
      }
    };

    // Registrar listener global
    TableWebSocketService.addListener('table_attended', handleTableAttended);

    return () => {
      // Limpiar listener
      TableWebSocketService.removeListener(
        'table_attended',
        handleTableAttended,
      );
    };
  }, [tableId, tableInternalId, dispatch, t]);

  // Listeners para Tablet Events - REFRESH PRODUCTS
  useEffect(() => {
    // Handler para refresh_products
    const handleRefreshProducts = data => {
      console.log('[GlobalSocket] Refresh products recibido:', data);
      performSilentSync();
    };

    // Registrar listener para refresh_products
    TabletWebSocketService.addListener(
      'refresh_products',
      handleRefreshProducts,
    );

    return () => {
      TabletWebSocketService.removeListener(
        'refresh_products',
        handleRefreshProducts,
      );
    };
  }, [dispatch]);

  // Listeners para Tablet Events - PRODUCTS PAYMENT STATUS
  useEffect(() => {
    if (!tableId) {
      return;
    }

    // Handler para products_payment_status
    const handleProductsPaymentStatus = data => {
      console.log('[GlobalSocket] Products payment status recibido:', data);
      
      // Solo procesar si es para nuestra mesa y no es de nuestra tablet
      if (data.tableId === tableId && data.tableInternalId !== tableInternalId) {
        console.log('[GlobalSocket] Actualizando productos en pago de otra tablet');
        dispatch(setProductsInPayment(data.message.productsInPayment));
      }
    };

    // Registrar listener
    TabletWebSocketService.addListener('products_payment_status', handleProductsPaymentStatus);

    return () => {
      // Limpiar listener
      TabletWebSocketService.removeListener('products_payment_status', handleProductsPaymentStatus);
    };
  }, [tableId, tableInternalId, dispatch]);

  // ======================
  // RECONEXIÓN AUTOMÁTICA Y MANEJO DE ESTADO DE APP
  // ======================

  // Reconexión automática cada 30 segundos para sockets desconectados
  useEffect(() => {
    if (
      !shouldReconnectSockets ||
      !formattedSocketIp ||
      formattedSocketIp.trim() === ''
    ) {
      return;
    }

    const reconnectInterval = setInterval(() => {
      const state = store.getState();
      const socketConnections = state.bag?.socketConnections;

      if (!socketConnections) {
        return;
      }

      // Solo reconectar si el socket NO está conectado y NO está conectando
      if (
        orderId &&
        !socketConnections.order.connected &&
        !socketConnections.order.connecting
      ) {
        console.log('[GlobalSocket] Reconexión automática - order socket');
        dispatch(setSocketConnecting({socketType: 'order'}));
        webSocketManager.connectOne(
          'orders',
          `ws://${formattedSocketIp}`,
          orderId,
        );
      }

      if (
        tableId &&
        !socketConnections.table.connected &&
        !socketConnections.table.connecting
      ) {
        console.log('[GlobalSocket] Reconexión automática - table socket');
        dispatch(setSocketConnecting({socketType: 'table'}));
        webSocketManager.connectOne(
          'tables',
          `ws://${formattedSocketIp}`,
          tableId,
        );
      }

      // Tablet socket siempre debe estar conectado
      if (
        !socketConnections.tablet.connected &&
        !socketConnections.tablet.connecting
      ) {
        console.log('[GlobalSocket] Reconexión automática - tablet socket');
        dispatch(setSocketConnecting({socketType: 'tablet'}));
        webSocketManager.connectOneGeneral(
          'tablet',
          `ws://${formattedSocketIp}`,
        );
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(reconnectInterval);
  }, [shouldReconnectSockets, orderId, tableId, formattedSocketIp, dispatch]);

  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'active' && shouldReconnectSockets) {
        console.log('[GlobalSocket] App activa, reconectando sockets...');

        // Reconectar order socket si hay orderId
        if (orderId) {
          console.log('[GlobalSocket] Reconectando order socket:', orderId);
          dispatch(setSocketConnecting({socketType: 'order'}));
          webSocketManager.connectOne(
            'orders',
            `ws://${formattedSocketIp}`,
            orderId,
          );
        }

        // Reconectar table socket si hay tableId
        if (tableId) {
          console.log('[GlobalSocket] Reconectando table socket:', tableId);
          dispatch(setSocketConnecting({socketType: 'table'}));
          webSocketManager.connectOne(
            'tables',
            `ws://${formattedSocketIp}`,
            tableId,
          );
        }

        // Reconectar tablet socket
        console.log('[GlobalSocket] Reconectando tablet socket');
        dispatch(setSocketConnecting({socketType: 'tablet'}));
        webSocketManager.connectOneGeneral(
          'tablet',
          `ws://${formattedSocketIp}`,
        );
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
      webSocketManager.disconnectAll();
    };
  }, [formattedSocketIp, orderId, tableId, shouldReconnectSockets]);

  // ======================
  // FUNCIONES UTILITARIAS
  // ======================

  // Función para solicitar ayuda (para IndexView)
  const requestHelp = useCallback((tableIdParam, tableNumberParam) => {
    console.log(
      '[GlobalSocket] Solicitando ayuda para mesa:',
      tableIdParam,
      tableNumberParam,
    );
    TableWebSocketService.requestHelp(tableIdParam, tableNumberParam);
  }, []);

  const cancelHelp = useCallback((tableIdParam, tableNumberParam) => {
    console.log(
      '[GlobalSocket] Cancelando ayuda para mesa:',
      tableIdParam,
      tableNumberParam,
    );
    TableWebSocketService.cancelHelp(tableIdParam, tableNumberParam);
  }, []);

  const endOrderHelp = useCallback((tableIdParam, tableNumberParam) => {
    console.log(
      '[GlobalSocket] Finalizando orden para mesa:',
      tableIdParam,
      tableNumberParam,
    );
    TableWebSocketService.endOrderHelp(tableIdParam, tableNumberParam);
  }, []);

  const startPaymentProcess = useCallback(
    (tableIdParam, tableNumberParam, tabletInternalId) => {
      console.log('[GlobalSocket] Iniciando proceso de pago');
      TableWebSocketService.startPaymentProcess(
        tableIdParam,
        tableNumberParam,
        tabletInternalId,
      );
    },
    [],
  );

  const endPaymentProcess = useCallback((tableIdParam, tableNumberParam) => {
    console.log('[GlobalSocket] Finalizando proceso de pago');
    TableWebSocketService.endPaymentProcess(tableIdParam, tableNumberParam);
  }, []);

  // Función para enviar estado de productos en pago a otras tablets
  const sendProductsPaymentStatus = useCallback(
    (productsInPayment) => {
      console.log('[GlobalSocket] Enviando estado de productos en pago:', productsInPayment);
      TabletWebSocketService.sendProductsPaymentStatus(
        productsInPayment,
        tableId,
        tableInternalId,
      );
    },
    [tableId, tableInternalId],
  );

  // Función para cancelar todos los sockets (para pago completo)
  const cancelAllSockets = useCallback(() => {
    console.log('[GlobalSocket] Cancelando todos los sockets - Pago completo');
    dispatch(disableSocketReconnection());
    webSocketManager.cancelAllSockets();
  }, [dispatch]);

  // Obtener el estado actual de bloqueo multitablet
  // Removed isMultitabletBlocked - no longer blocking tablets

  // Valor del contexto
  const contextValue = {
    endOrderHelp,
    requestHelp,
    cancelHelp,
    startPaymentProcess,
    endPaymentProcess,
    sendProductsPaymentStatus, // Nueva función para sincronizar productos en pago
    cancelAllSockets, // Nueva función para cancelar todos los sockets
    // Removed isMultitabletBlocked - no longer blocking tablets
    tableInternalId, // Exponer el ID de la tablet
  };

  return (
    <GlobalSocketContext.Provider value={contextValue}>
      {children}
    </GlobalSocketContext.Provider>
  );
};
