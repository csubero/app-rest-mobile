import {NativeModules, Platform} from 'react-native';

class SoundHelper {
  constructor() {
    this.isEnabled = true;
    this.isAndroid = Platform.OS === 'android';

    // Constantes para ToneGenerator (Android)
    this.toneTypes = {
      NOTIFICATION: 9, // TONE_PROP_BEEP
      ALERT: 10, // TONE_PROP_ACK
      SUCCESS: 11, // TONE_PROP_NACK
      WARNING: 28, // TONE_CDMA_ALERT_CALL_GUARD
      ERROR: 17, // TONE_SUP_ERROR
    };
  }

  /**
   * Inicializar sonidos (no necesario para sonidos del sistema)
   */
  initializeSounds() {
    try {
      if (this.isAndroid) {
        console.log(
          '[SoundHelper] Inicializado para Android con sonidos del sistema',
        );
      } else {
        console.log(
          '[SoundHelper] Plataforma no soportada, solo funciona en Android',
        );
      }
    } catch (error) {
      console.warn('[SoundHelper] Error al inicializar sonidos:', error);
    }
  }

  /**
   * Reproducir sonido usando ToneGenerator de Android
   */
  playTone(toneType, duration = 200) {
    if (!this.isEnabled || !this.isAndroid) {
      return;
    }

    try {
      // Usar nuestro módulo nativo SystemSoundModule
      if (NativeModules.SystemSoundModule) {
        NativeModules.SystemSoundModule.playTone(toneType, duration);
        console.log(
          `🔊 [SoundHelper] Reproduciendo tono ${toneType} con duración ${duration}ms`,
        );
      } else {
        console.warn(
          '⚠️ [SoundHelper] SystemSoundModule no disponible, usando fallback',
        );
        this.playSystemNotification();
      }
    } catch (error) {
      console.warn('⚠️ [SoundHelper] Error al reproducir tono:', error);
      this.playSystemNotification();
    }
  }

  /**
   * Reproducir sonido de notificación a alto volumen
   */
  playHighVolumeNotification() {
    if (!this.isEnabled || !this.isAndroid) {
      return;
    }

    try {
      if (NativeModules.SystemSoundModule) {
        // Intentar usar el método de alto volumen si está disponible
        if (
          typeof NativeModules.SystemSoundModule.playHighVolumeNotification ===
          'function'
        ) {
          NativeModules.SystemSoundModule.playHighVolumeNotification();
          console.log(
            '🔊 [SoundHelper] Reproduciendo notificación a alto volumen',
          );
        } else {
          // Fallback: usar notificación normal + múltiples tonos para simular alto volumen
          console.log(
            '🔊 [SoundHelper] Método de alto volumen no disponible, usando fallback mejorado',
          );

          // Reproducir notificación del sistema
          NativeModules.SystemSoundModule.playDefaultNotification();

          // Agregar tonos adicionales para más volumen percibido
          setTimeout(() => {
            NativeModules.SystemSoundModule.playTone(this.toneTypes.ALERT, 300);
          }, 100);

          setTimeout(() => {
            NativeModules.SystemSoundModule.playTone(
              this.toneTypes.NOTIFICATION,
              200,
            );
          }, 500);
        }
      } else {
        console.warn(
          '⚠️ [SoundHelper] SystemSoundModule no disponible, usando fallback',
        );
        this.playSystemNotification();
      }
    } catch (error) {
      console.warn('⚠️ [SoundHelper] Error al reproducir notificación:', error);
      this.playSystemNotification();
    }
  }

  /**
   * Reproducir sonido de notificación estándar
   */
  playSystemNotification() {
    if (!this.isEnabled || !this.isAndroid) {
      return;
    }

    try {
      // Usar nuestro módulo nativo SystemSoundModule
      if (NativeModules.SystemSoundModule) {
        NativeModules.SystemSoundModule.playDefaultNotification();
        console.log('🔊 [SoundHelper] Reproduciendo notificación del sistema');
      } else {
        console.warn('⚠️ [SoundHelper] SystemSoundModule no disponible');
        // Fallback con ToneGenerator básico
        this.playTone(this.toneTypes.NOTIFICATION, 300);
      }
    } catch (error) {
      console.warn(
        '⚠️ [SoundHelper] Error al reproducir notificación del sistema:',
        error,
      );
      // Último fallback
      this.playTone(this.toneTypes.NOTIFICATION, 300);
    }
  }

  /**
   * Reproducir sonido específico por tipo
   */
  playSound(soundKey, volume = 1.0) {
    if (!this.isEnabled) {
      console.log(
        `🔇 [SoundHelper] Sonidos deshabilitados, no reproduciendo ${soundKey}`,
      );
      return;
    }

    try {
      switch (soundKey) {
        case 'waiter_notification':
          this.playWaiterNotification(volume);
          break;
        case 'order_reminder':
          this.playOrderReminder(volume);
          break;
        case 'general_notification':
        default:
          this.playGeneralNotification(volume);
          break;
      }
    } catch (error) {
      console.warn(
        `⚠️ [SoundHelper] Error al reproducir sonido ${soundKey}:`,
        error,
      );
    }
  }
}

// Crear instancia singleton
const soundHelper = new SoundHelper();

export default soundHelper;
