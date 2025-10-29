import {useState, useCallback} from 'react';
import {NativeModules} from 'react-native';

const {KioskModule} = NativeModules;

/**
 * Hook personalizado para manejar el modo kiosk usando módulo nativo
 * Utiliza LockTask Mode nativo de Android para un mejor rendimiento
 * Incluye restricciones avanzadas del sistema para bloquear WiFi, Bluetooth, etc.
 * @returns {Object} Objeto con métodos y estado del kiosk
 */
const useNativeKiosk = () => {
  const [isKioskActive, setIsKioskActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [systemRestrictions, setSystemRestrictions] = useState(null);

  /**
   * Verificar permisos para el modo kiosk
   */
  const checkPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await KioskModule.checkKioskPermissions();
      setHasPermission(result.hasPermission);
      console.log(
        '🔐 Permisos kiosk:',
        result.hasPermission ? '✅ Disponible' : '❌ No disponible',
      );
      return result;
    } catch (err) {
      console.error('Error al verificar permisos:', err);
      setError(err);
      setHasPermission(false);
      return {hasPermission: false, error: err.message};
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Activar el modo kiosk
   */
  const enableKiosk = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await KioskModule.enableKiosk();
      setIsKioskActive(true);
      console.log('✅ Kiosk mode activado:', result.message);
      return result;
    } catch (err) {
      console.error('Error al activar kiosk:', err);
      setError(err);
      setIsKioskActive(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Desactivar el modo kiosk
   */
  const disableKiosk = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await KioskModule.disableKiosk();
      setIsKioskActive(false);
      console.log('🚪 Kiosk mode desactivado:', result.message);
      return result;
    } catch (err) {
      console.error('Error al desactivar kiosk:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verificar si el modo kiosk está activo
   */
  const checkKioskStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await KioskModule.isKioskActive();
      setIsKioskActive(result.isActive);
      console.log(
        '📱 Estado kiosk:',
        result.isActive ? 'Activo' : 'Inactivo',
        'LockTaskMode:',
        result.lockTaskModeState,
      );
      return result;
    } catch (err) {
      console.error('Error al verificar estado del kiosk:', err);
      setError(err);
      return {isActive: false, error: err.message};
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Alternar el estado del modo kiosk
   */
  const toggleKiosk = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await KioskModule.toggleKiosk();
      // El estado se actualizará automáticamente en enableKiosk o disableKiosk
      console.log('🔄 Kiosk toggled');
      return result;
    } catch (err) {
      console.error('Error al alternar kiosk:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtener estado de restricciones del sistema
   */
  const getSystemRestrictions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await KioskModule.getSystemRestrictions();
      setSystemRestrictions(result);
      console.log('🔐 Restricciones del sistema:', result);
      return result;
    } catch (err) {
      console.error('Error al obtener restricciones:', err);
      setError(err);
      return {isDeviceOwner: false, error: err.message};
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estado
    isKioskActive,
    isLoading,
    error,
    hasPermission,
    systemRestrictions,

    // Métodos
    enableKiosk,
    disableKiosk,
    checkKioskStatus,
    toggleKiosk,
    checkPermissions,
    getSystemRestrictions,
  };
};

export default useNativeKiosk;
