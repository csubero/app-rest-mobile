import tableWebSocketService from './TableWebSocketService';
import orderWebSocketService from './OrderWebSocketService';
import tabletWebSocketService from './TabletWebSocketService';

class WebSocketManager {
  constructor() {
    this.services = new Map();
    this.singleServices = new Map();

    this.singleServices.set('orders', {
      service: orderWebSocketService,
      path: '/order',
    });
    this.singleServices.set('tables', {
      service: tableWebSocketService,
      path: '/tables',
    });
    this.singleServices.set('tablet', {
      service: tabletWebSocketService,
      path: '/tablet',
    });
  }

  connectOne(name, baseUrl, id) {
    // console.log(`🔗 [WebSocketManager-ConnectOne]`);
    const serviceConfig = this.singleServices.get(name);
    if (serviceConfig) {
      const fullUrl = `${baseUrl}/ws${serviceConfig.path}/${id}`;
      // console.log(`🔗 Conectando ${name} a: ${fullUrl}`);
      serviceConfig.service.connect(fullUrl);
    } else {
      console.warn(`⚠️ Servicio ${name} no encontrado`);
    }
  }

  connectOneGeneral(name, baseUrl) {
    // console.log(`🔗 [WebSocketManager-ConnectOneGeneral]`);
    const serviceConfig = this.singleServices.get(name);
    if (serviceConfig) {
      const fullUrl = `${baseUrl}/ws${serviceConfig.path}/`;
      // console.log(`🔗 Conectando ${name} a: ${fullUrl}`);
      serviceConfig.service.connect(fullUrl);
    } else {
      console.warn(`⚠️ Servicio ${name} no encontrado`);
    }
  }

  disconnectOne(name, baseUrl, id) {
    const serviceConfig = this.singleServices.get(name);
    if (serviceConfig) {
      // const fullUrl = `${baseUrl}/ws${serviceConfig.path}/${id}`;
      // console.log(`🔌 Desconectando ${name} de: ${fullUrl}`);
      serviceConfig.service.disconnect();
    } else {
      console.warn(`⚠️ Servicio ${name} no encontrado`);
    }
  }

  disconnectOneGeneral(name, baseUrl) {
    const serviceConfig = this.singleServices.get(name);
    if (serviceConfig) {
      // const fullUrl = `${baseUrl}/ws${serviceConfig.path}/`;
      // console.log(`Desconectando ${name} de: ${fullUrl}`);
      serviceConfig.service.disconnect();
    } else {
      console.warn(`⚠️ Servicio ${name} no encontrado`);
    }
  }

  disconnectAll() {
    console.log('[WebSocketManager] Desconectando todos los servicios');
    this.services.forEach(serviceConfig => serviceConfig.service.disconnect());
    this.singleServices.forEach(serviceConfig =>
      serviceConfig.service.disconnect(),
    );
  }

  // Método específico para cancelar completamente los sockets sin reconexión
  cancelAllSockets() {
    console.log(
      '[WebSocketManager] Cancelando todos los sockets (sin reconexión)',
    );
    this.services.forEach(serviceConfig => {
      if (serviceConfig.service.cancelReconnection) {
        serviceConfig.service.cancelReconnection();
      }
      serviceConfig.service.disconnect();
    });
    this.singleServices.forEach(serviceConfig => {
      if (serviceConfig.service.cancelReconnection) {
        serviceConfig.service.cancelReconnection();
      }
      serviceConfig.service.disconnect();
    });
  }

  getService(name) {
    return this.services.get(name)?.service;
  }
}

export default new WebSocketManager();
