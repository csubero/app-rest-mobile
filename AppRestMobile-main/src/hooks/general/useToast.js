import {useCallback, useRef} from 'react';
import soundHelper from '../../helpers/config/SoundHelperAndroid';

const useToast = () => {
  const lastSoundRef = useRef(null);
  const soundDebounceRef = useRef(null);

  const playToastSound = useCallback((soundType, highVolume = false) => {
    const soundKey = `${soundType}-${highVolume}`;

    // Evitar reproducir el mismo sonido múltiples veces muy rápido
    if (lastSoundRef.current === soundKey) {
      return;
    }

    lastSoundRef.current = soundKey;

    // Limpiar debounce anterior
    if (soundDebounceRef.current) {
      clearTimeout(soundDebounceRef.current);
    }

    // Resetear el debounce después de 1 segundo
    soundDebounceRef.current = setTimeout(() => {
      lastSoundRef.current = null;
    }, 1000);

    try {
      soundHelper.playHighVolumeNotification();
      return;
    } catch (error) {
      console.warn('⚠️ [useToast] Error al reproducir sonido:', error);
    }
  }, []);

  const showToast = useCallback(
    (message, options = {}) => {
      if (!global.toastManager) {
        console.warn('⚠️ [useToast] ToastManager no está disponible');
        return;
      }

      const toastData = {
        message,
        title: options.title || '',
        type: options.type || 'success', // 'success', 'info', 'warning', 'error'
        duration: options.duration || 3000,
        playSound: options.playSound !== false, // Por defecto true, se puede desactivar
        soundType: options.soundType || 'general', // 'general', 'waiter', 'reminder'
        highVolume: options.highVolume || false, // Nueva opción para alto volumen
      };

      // Reproducir sonido si está habilitado
      if (toastData.playSound) {
        playToastSound(toastData.soundType, toastData.highVolume);
      }

      global.toastManager.addToast(toastData);
    },
    [playToastSound],
  );

  const showSuccessToast = useCallback(
    (message, title, duration, playSound = true) => {
      showToast(message, {title, type: 'success', duration, playSound});
    },
    [showToast],
  );

  const showInfoToast = useCallback(
    (message, title, duration, playSound = true, soundType = 'general') => {
      showToast(message, {title, type: 'info', duration, playSound, soundType});
    },
    [showToast],
  );

  const showWarningToast = useCallback(
    (message, title, duration, playSound = true, soundType = 'general') => {
      showToast(message, {
        title,
        type: 'warning',
        duration,
        playSound,
        soundType,
      });
    },
    [showToast],
  );

  const showErrorToast = useCallback(
    (message, title, duration, playSound = true) => {
      showToast(message, {title, type: 'error', duration, playSound});
    },
    [showToast],
  );

  const clearAllToasts = useCallback(() => {
    if (global.toastManager) {
      global.toastManager.clearQueue();
    }
  }, []);

  // Función específica para notificaciones de mesero (con sonido especial)
  const showWaiterToast = useCallback(
    (message, title, duration = 4000) => {
      showToast(message, {
        title,
        type: 'info',
        duration,
        playSound: true,
        soundType: 'waiter',
      });
    },
    [showToast],
  );

  // Función específica para recordatorio de orden (con sonido especial)
  const showOrderReminderToast = useCallback(
    (message, title, duration = 5000) => {
      showToast(message, {
        title,
        type: 'warning',
        duration,
        playSound: true,
        soundType: 'reminder',
      });
    },
    [showToast],
  );

  // Función para notificaciones de alto volumen
  const showHighVolumeToast = useCallback(
    (message, options = {}) => {
      showToast(message, {
        ...options,
        highVolume: true,
        playSound: true,
      });
    },
    [showToast],
  );

  // Función específica para alertas críticas (alto volumen)
  const showCriticalAlert = useCallback(
    (message, title, duration = 6000) => {
      showToast(message, {
        title,
        type: 'error',
        duration,
        playSound: true,
        highVolume: true,
      });
    },
    [showToast],
  );

  // Función para debugging - obtener estado actual de toasts
  const getToastStatus = useCallback(() => {
    if (!global.toastManager) {
      return {available: false};
    }
    return {
      available: true,
      message: 'ToastManager está disponible y funcionando',
    };
  }, []);

  return {
    showToast,
    showSuccessToast,
    showInfoToast,
    showWarningToast,
    showErrorToast,
    showWaiterToast,
    showOrderReminderToast,
    showHighVolumeToast,
    showCriticalAlert,
    clearAllToasts,
    getToastStatus,
  };
};

export default useToast;
