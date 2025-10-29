/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useRef} from 'react';
import ToastNotification from './ToastNotification';

const ToastManager = () => {
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const [isShowing, setIsShowing] = useState(false);
  const timeoutRef = useRef(null);
  const toastIdCounter = useRef(0);
  const lastToastRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Función para verificar si un toast es duplicado
  const isDuplicateToast = useCallback(
    newToast => {
      const currentTime = Date.now();

      // Verificar si el toast actual es similar
      if (
        currentToast &&
        currentToast.message === newToast.message &&
        currentToast.title === newToast.title &&
        currentToast.type === newToast.type
      ) {
        return true;
      }

      // Verificar si ya existe un toast similar en la cola
      const existingToast = toastQueue.find(
        toast =>
          toast.message === newToast.message &&
          toast.title === newToast.title &&
          toast.type === newToast.type &&
          currentTime - toast.createdAt < 2000,
      );

      return !!existingToast;
    },
    [currentToast, toastQueue],
  );

  // Función para agregar un toast a la cola
  const addToast = useCallback(
    toastData => {
      const newToast = {
        id: toastIdCounter.current++,
        createdAt: Date.now(), // Agregar timestamp
        ...toastData,
        duration: toastData.duration || 3000,
      };

      // Crear una clave única para el toast
      const toastKey = `${newToast.message}-${newToast.title}-${newToast.type}`;

      // Verificar duplicados antes de agregar
      if (isDuplicateToast(newToast)) {
        console.log(
          '🚫 [ToastManager] Toast duplicado detectado, ignorando:',
          newToast.title || newToast.message,
        );
        return;
      }

      // Verificar si es el mismo toast que se agregó muy recientemente (debounce)
      if (lastToastRef.current === toastKey) {
        return;
      }

      // Actualizar el último toast y configurar debounce
      lastToastRef.current = toastKey;

      // Limpiar el debounce anterior si existe
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Configurar un nuevo debounce para permitir el mismo toast después de 2 segundos
      debounceTimeoutRef.current = setTimeout(() => {
        lastToastRef.current = null;
      }, 2000); // Aumentar a 2 segundos para mayor estabilidad
      setToastQueue(prevQueue => [...prevQueue, newToast]);
    },
    [isDuplicateToast],
  ); // Función para mostrar el siguiente toast en la cola
  const showNextToast = useCallback(() => {
    if (isShowing) {
      return;
    }

    setToastQueue(prevQueue => {
      if (prevQueue.length === 0) {
        return prevQueue;
      }

      const [nextToast, ...remainingQueue] = prevQueue;

      setCurrentToast(nextToast);
      setIsShowing(true);

      // Configurar timeout para auto-hide
      timeoutRef.current = setTimeout(() => {
        handleToastHide();
      }, nextToast.duration);

      return remainingQueue;
    });
  }, [isShowing]);

  // Función para ocultar el toast actual
  const handleToastHide = useCallback(() => {
    // console.log('🫥 [ToastManager] Ocultando toast actual');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsShowing(false);
    setCurrentToast(null);

    // Después de un pequeño delay, mostrar el siguiente toast
    setTimeout(() => {
      showNextToast();
    }, 300);
  }, [showNextToast]);

  // Efecto para mostrar toasts cuando se agreguen a la cola
  React.useEffect(() => {
    if (!isShowing && toastQueue.length > 0) {
      showNextToast();
    }
  }, [toastQueue, isShowing, showNextToast]);

  // Función para limpiar la cola (útil para casos de emergencia)
  const clearQueue = useCallback(() => {
    // console.log('🧹 [ToastManager] Limpiando cola de toasts');
    setToastQueue([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    lastToastRef.current = null;
    setIsShowing(false);
    setCurrentToast(null);
  }, []);

  // Exponer las funciones globalmente
  React.useEffect(() => {
    // Agregar funciones al objeto global para acceso desde cualquier componente
    global.toastManager = {
      addToast,
      clearQueue,
    };

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      delete global.toastManager;
    };
  }, [addToast, clearQueue]);

  return (
    <ToastNotification
      visible={isShowing && currentToast !== null}
      message={currentToast?.message || ''}
      title={currentToast?.title || ''}
      type={currentToast?.type || 'success'}
      duration={currentToast?.duration || 3000}
      onHide={handleToastHide}
    />
  );
};

export default ToastManager;
