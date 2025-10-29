function isValidWsUrl(url) {
  const regex =
    /^wss?:\/\/((\d{1,3}\.){3}\d{1,3}|[a-zA-Z0-9.-]+)(:\d+)?(\/.*)?$/;
  return regex.test(url);
}

class BaseWebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.currentServerUrl = null;
    this.lastGoodServerUrl = null; // Para diagnóstico / posibles futuros fallbacks
  }

  connect(serverUrl) {
    // console.log(`[BaseWebSocket] connect called with URL: ${serverUrl}`);

    // Validación correcta (antes estaba invertida)
    if (!serverUrl || typeof serverUrl !== 'string') {
      console.error('❌ URL del servidor vacía o no es string:', serverUrl);
      return;
    }

    if (!isValidWsUrl(serverUrl)) {
      console.error('❌ URL del servidor inválida (regex no pasó):', serverUrl);
      return;
    }

    // Protección manual (sin usar URL() porque en RN puede no estar totalmente implementado): detectar host vacío
    if (serverUrl.startsWith('ws:///') || /wss?:\/\/$/.test(serverUrl)) {
      console.error(
        '❌ Host vacío detectado en URL, abortando conexión:',
        serverUrl,
      );
      return;
    }
    const hostMatch = serverUrl.match(/^wss?:\/\/([^/]+)(\/|$)/);
    if (!hostMatch || !hostMatch[1] || hostMatch[1].trim() === '') {
      console.error('❌ No se pudo extraer hostname válido de:', serverUrl);
      return;
    }
    // Si ya está conectado a la misma URL, no hacer nada
    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN &&
      this.currentServerUrl === serverUrl
    ) {
      console.log(`Ya conectado a ${serverUrl}, ignorando`);
      return;
    }

    // Si está conectando a la misma URL, no hacer nada
    if (this.isConnecting && this.currentServerUrl === serverUrl) {
      console.log(`Ya conectando a ${serverUrl}, ignorando`);
      return;
    }

    // Guardar la URL para reconexiones automáticas
    this.currentServerUrl = serverUrl;
    this.isConnecting = true;

    // Notificar que se está conectando
    this.onConnecting();

    try {
      this.ws = new WebSocket(serverUrl);

      this.ws.onopen = () => {
        console.log('WebSocket Conectado');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        // Guardar última URL buena para diagnóstico
        this.lastGoodServerUrl = serverUrl;

        // Emitir evento interno de apertura
        this._emitInternalEvent('__internal_open__');
        this.onConnected();
      };

      this.ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data);
        } catch (error) {
          console.error('Error al procesar mensaje:', error);
        }
      };

      this.ws.onerror = error => {
        console.error('Error de WebSocket:', error);
        this.isConnecting = false;
        // Emitir evento interno de error
        this._emitInternalEvent('__internal_error__', error);
        this.onError(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket Desconectado');
        this.isConnecting = false;
        // Emitir evento interno de cierre
        this._emitInternalEvent('__internal_close__');
        this.onDisconnected();
        // Solo programar reconexión si la URL sigue siendo válida (evitar propagar una URL corrupta)
        if (isValidWsUrl(serverUrl)) {
          this._scheduleReconnect(serverUrl);
        } else {
          console.warn(
            '[BaseWebSocket] No se agenda reconexión: URL inválida actual',
            serverUrl,
          );
        }
      };
    } catch (error) {
      console.error('Error al crear WebSocket:', error);
      this.isConnecting = false;
      if (isValidWsUrl(serverUrl)) {
        this._scheduleReconnect(serverUrl);
      }
    }
  }

  _scheduleReconnect(serverUrl) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Máximo número de intentos de reconexión alcanzado');
      // Emitir evento de fallo crítico de conexión
      this._emitConnectionFailure();
      return;
    }

    // Verificar si debe reconectar (usando store de Redux si está disponible)
    if (typeof global !== 'undefined' && global.__REDUX_STORE__) {
      const state = global.__REDUX_STORE__.getState();
      if (!state.bag.shouldReconnectSockets) {
        console.log('[BaseWebSocket] Reconexión deshabilitada por Redux state');
        return;
      }
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Intento de reconexión ${this.reconnectAttempts}...`);
      this.connect(serverUrl);
    }, delay);
  }

  _emitConnectionFailure() {
    console.log(
      ' [BaseWebSocket] Emitiendo evento de fallo crítico de conexión',
    );
    const listeners = this.listeners.get('connection_failure') || [];
    listeners.forEach(callback =>
      callback({
        type: 'connection_failure',
        timestamp: new Date().toISOString(),
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.maxReconnectAttempts,
      }),
    );
  }

  _emitInternalEvent(eventType, data = null) {
    const listeners = this.listeners.get(eventType) || [];
    listeners.forEach(callback => callback(data));
  }

  _handleMessage(data) {
    if (data.type === 'ping') {
      console.log(' [BaseWebSocket] Ping recibido, enviando pong');
      this._handlePing();
      return;
    }
    const listeners = this.listeners.get(data.type) || [];
    listeners.forEach(callback => callback(data));
  }

  _handlePing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(' [BaseWebSocket] Enviando pong');
      this.ws.send(JSON.stringify({type: 'pong'}));
    }
  }

  async send(type, payload) {
    // Si ya está conectado, enviar inmediatamente
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({type, payload});
      this.ws.send(message);
      console.log(' [BaseWebSocket] Mensaje enviado:', {type, payload});
      return true;
    }

    // Si no está conectado, intentar reconectar primero
    console.log(
      ' [BaseWebSocket] Intentando reconectar antes de enviar mensaje...',
    );

    try {
      await this.ensureConnection();

      // Verificar conexión después del intento
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({type, payload});
        this.ws.send(message);
        console.log(' [BaseWebSocket] Mensaje enviado tras reconexión:', {
          type,
          payload,
        });
        return true;
      }
    } catch (error) {
      console.error(' [BaseWebSocket] Error en reconexión:', error);
    }

    console.error(
      ' [BaseWebSocket] No se pudo enviar mensaje - Reconexión falló:',
      {
        wsExists: !!this.ws,
        readyState: this.ws?.readyState,
        type,
        payload,
      },
    );
    return false;
  }

  async sendSimple(payload) {
    // Si ya está conectado, enviar inmediatamente
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(payload);
      this.ws.send(message);
      return true;
    }

    // Si no está conectado, intentar reconectar primero
    console.log(
      ' [BaseWebSocket] Intentando reconectar antes de enviar mensaje...',
    );

    try {
      await this.ensureConnection();

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify(payload);
        this.ws.send(message);
        return true;
      }
    } catch (error) {
      console.error(' [BaseWebSocket] Error en reconexión:', error);
    }

    console.error(
      ' [BaseWebSocket] No se pudo enviar mensaje - Reconexión falló:',
      {
        wsExists: !!this.ws,
        readyState: this.ws?.readyState,
        payload,
      },
    );
    return false;
  }

  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  addOnReady(callback) {
    if (this.isConnected()) {
      callback();
    } else {
      const onOpen = () => {
        this.removeListener('__internal_open__', onOpen);
        callback();
      };
      this.addListener('__internal_open__', onOpen);
    }
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Método para cancelar completamente la reconexión
  cancelReconnection() {
    console.log('[BaseWebSocket] Cancelando reconexión automática');
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Evitar más intentos
    this.currentServerUrl = null; // Limpiar URL para evitar reconexión
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Método para asegurar la conexión antes de enviar
  ensureConnection() {
    return new Promise((resolve, reject) => {
      // Si ya está conectado, resolver inmediatamente
      if (this.isConnected()) {
        resolve();
        return;
      }

      // Si no hay serverUrl guardada, rechazar
      if (!this.currentServerUrl) {
        reject(new Error('No hay URL del servidor configurada'));
        return;
      }

      // Configurar timeout para evitar espera infinita
      const timeout = setTimeout(() => {
        this.removeListener('__internal_open__', onConnect);
        this.removeListener('__internal_error__', onError);
        this.removeListener('__internal_close__', onError);
        reject(new Error('Timeout en reconexión'));
      }, 5000); // 5 segundos timeout

      const onConnect = () => {
        clearTimeout(timeout);
        this.removeListener('__internal_open__', onConnect);
        this.removeListener('__internal_error__', onError);
        this.removeListener('__internal_close__', onError);
        resolve();
      };

      const onError = error => {
        clearTimeout(timeout);
        this.removeListener('__internal_open__', onConnect);
        this.removeListener('__internal_error__', onError);
        this.removeListener('__internal_close__', onError);
        reject(error || new Error('Error en conexión'));
      };

      // Escuchar eventos de conexión
      this.addListener('__internal_open__', onConnect);
      this.addListener('__internal_error__', onError);
      this.addListener('__internal_close__', onError);

      // Intentar conectar si no está ya conectando
      if (!this.isConnecting) {
        this.connect(this.currentServerUrl);
      }
    });
  }

  // Métodos que las subclases pueden sobreescribir
  onConnecting() {}
  onConnected() {}
  onDisconnected() {}
  onError(error) {}
}

export default BaseWebSocketService;
