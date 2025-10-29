import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {ToastAndroid, NativeModules} from 'react-native';
import StorageHelper from '../../helpers/config/StorageHelper';
import {setKioskMode} from '../../redux/slice/settingsSlice';

const {KioskModule} = NativeModules;

const useKioskAutoInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeKioskMode = async () => {
      try {
        console.log('Inicializando modo kiosko automáticamente...');

        // Cargar configuración guardada del modo kiosko
        const savedKioskMode = await StorageHelper.getKioskMode();
        dispatch(setKioskMode(savedKioskMode));

        if (savedKioskMode) {
          console.log('🔒 Modo kiosko está habilitado, intentando activar...');

          if (KioskModule) {
            try {
              // Verificar permisos del dispositivo
              const permissionsResult =
                await KioskModule.checkKioskPermissions();
              console.log('🔐 Resultado de permisos:', permissionsResult);

              if (permissionsResult.hasPermission) {
                // Verificar si ya está activo
                const statusResult = await KioskModule.isKioskActive();
                console.log('📱 Estado actual:', statusResult);

                if (!statusResult.isActive) {
                  // Activar modo kiosko automáticamente
                  const enableResult = await KioskModule.enableKiosk();
                  console.log('✅ Modo kiosko activado:', enableResult);
                }
              } else {
                // Desactivar en configuración si no hay permisos
                await StorageHelper.setKioskMode(false);
                dispatch(setKioskMode(false));
              }
            } catch (kioskError) {
              console.warn('Error al activar modo kiosko:', kioskError);
            }
          } else {
            console.warn('Módulo KioskModule no disponible');
          }
        } else {
          console.log('ℹModo kiosko no está habilitado en configuración');
        }
      } catch (error) {
        console.error('Error al inicializar modo kiosko:', error);
        ToastAndroid.show(
          '❌ Error al verificar configuración del modo kiosko',
          ToastAndroid.SHORT,
        );
      }
    };
    const timeoutId = setTimeout(initializeKioskMode, 2000);
    return () => clearTimeout(timeoutId);
  }, [dispatch]);
};

export default useKioskAutoInit;
