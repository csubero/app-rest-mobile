import {useEffect, useRef} from 'react';
import OrderWebSocketService from '../../services/websocket/OrderWebSocketService';

export const useOrderEvent = (eventType, callback, enabled = true) => {
  const callbackRef = useRef(callback);

  // Mantener siempre la referencia actualizada del callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !eventType || !callbackRef.current) {
      return;
    }

    const eventHandler = data => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    console.log(`[useOrderEvent] Suscribiendo a evento: ${eventType}`);
    OrderWebSocketService.addListener(eventType, eventHandler);

    return () => {
      console.log(`[useOrderEvent] Desuscribiendo de evento: ${eventType}`);
      OrderWebSocketService.removeListener(eventType, eventHandler);
    };
  }, [eventType, enabled]);
};
