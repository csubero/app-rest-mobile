import React, {useEffect, useState} from 'react';
import {SunmiPrinterHelper} from '../../helpers/printer/SunmiPrinterHelper';
import Constants from '../../helpers/config/Constants';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import styles from './styles';
import {useDispatch, useSelector} from 'react-redux';
import {setKioskMode, setLastSyncDate} from '../../redux/slice/settingsSlice';
import {logout, setSyncronizingData} from '../../redux/slice/authSlice';
import {
  setCompanies,
  setCompanySelected,
  setPointOfSaleSelected,
  setStoreSelected,
} from '../../redux/slice/companySlice';
import {
  setSocketConnecting,
  setSocketConnected,
  setSocketDisconnected,
} from '../../redux/slice/bagSlice';
import StorageHelper from '../../helpers/config/StorageHelper';
import {useNavigation} from '@react-navigation/native';
import useNativeKiosk from '../../hooks/config/useNativeKiosk';

const ConfigView = () => {
  const [appVersion, setAppVersion] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [isTestingSockets, setIsTestingSockets] = useState(false);
  const [isResetUnlocked, setIsResetUnlocked] = useState(false);
  const [sunmiPrinterAvailable, setSunmiPrinterAvailable] = useState(false);

  const {serverIp} = useSelector(state => state.store);
  const {companySelected, storeSelected, pointOfSaleSelected} = useSelector(
    state => state.company,
  );
  const {kioskMode, lastSyncDate} = useSelector(state => state.settings);
  const {socketConnections} = useSelector(state => state.bag);

  // Hook para manejo nativo del modo kiosk
  const {
    isKioskActive,
    isLoading: isKioskLoading,
    error: kioskError,
    hasPermission: hasKioskPermission,
    enableKiosk,
    disableKiosk,
    checkKioskStatus,
    checkPermissions,
  } = useNativeKiosk();

  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Obtener versión de la app
        const version = DeviceInfo.getVersion();
        setAppVersion(version);

        // Cargar modo kiosko desde storage
        const savedKioskMode = await StorageHelper.getKioskMode();
        dispatch(setKioskMode(savedKioskMode));

        // Cargar fecha de última sincronización desde storage
        const savedLastSyncDate = await StorageHelper.getLastSyncDate();
        dispatch(setLastSyncDate(savedLastSyncDate));

        // Verificar disponibilidad de impresora Sunmi
        await checkSunmiPrinterAvailability();

        // Verificar permisos del modo kiosk nativo
        await checkPermissions();

        // Sincronizar estado del kiosk nativo con el estado guardado
        await checkKioskStatus();
      } catch (error) {
        console.error('Error inicializando datos de configuración:', error);
        ToastAndroid.show('Error al cargar configuración', ToastAndroid.SHORT);
      }
    };

    initializeData();
  }, [dispatch, checkPermissions, checkKioskStatus]);

  const checkSunmiPrinterAvailability = async () => {
    try {
      // Si DEV_PRINTER está habilitado, mostrar como no disponible
      if (Constants.DEV_PRINTER) {
        setSunmiPrinterAvailable(false);
        console.log('⚠️ Impresión deshabilitada en modo desarrollo');
        return;
      }

      // Usar el nuevo método de validación
      const isAvailable = SunmiPrinterHelper.isPrinterAvailable();
      setSunmiPrinterAvailable(isAvailable);

      if (isAvailable) {
        console.log('✅ Impresora Sunmi disponible y validada');
      } else {
        console.log('❌ Impresora Sunmi no disponible o con errores');
      }
    } catch (error) {
      setSunmiPrinterAvailable(false);
      console.log('❌ Error al verificar impresora Sunmi:', error);
    }
  };
  const handleTestPrint = async () => {
    Alert.alert('Probar Impresión', '¿Desea imprimir una página de prueba?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Imprimir',
        onPress: async () => {
          try {
            setIsTestingPrint(true);
            ToastAndroid.show('Imprimiendo prueba...', ToastAndroid.SHORT);

            console.log('🖨️ Iniciando impresión de prueba...');
            console.log('DEV_PRINTER:', Constants.DEV_PRINTER);

            if (Constants.DEV_PRINTER) {
              console.log('⚠️ Impresión deshabilitada en modo desarrollo');
              ToastAndroid.show(
                '⚠️ Impresión deshabilitada en modo desarrollo',
                ToastAndroid.SHORT,
              );
              return;
            }

            // Validar que la impresora esté disponible antes de imprimir
            if (!SunmiPrinterHelper.isPrinterAvailable()) {
              console.log('❌ Impresora no disponible para impresión');
              ToastAndroid.show(
                '❌ Impresora no disponible. Verifique la conexión.',
                ToastAndroid.SHORT,
              );
              return;
            }

            try {
              console.log('🖨️ Imprimiendo recibo de prueba...');
              SunmiPrinterHelper.printTestReceipt();
              console.log('✅ Comando de impresión enviado correctamente');
              ToastAndroid.show('✅ Impresión completada', ToastAndroid.LONG);
            } catch (printError) {
              console.error(
                '❌ Error específico en printTestReceipt:',
                printError,
              );
              console.error('Stack del error:', printError.stack);

              // Verificar si es un error de hardware o de software
              if (
                printError.message &&
                printError.message.includes('hardware')
              ) {
                ToastAndroid.show(
                  '❌ Hardware de impresora no disponible',
                  ToastAndroid.SHORT,
                );
              } else if (
                printError.message &&
                printError.message.includes('permission')
              ) {
                ToastAndroid.show(
                  '❌ Sin permisos para usar la impresora',
                  ToastAndroid.SHORT,
                );
              } else {
                ToastAndroid.show(
                  '❌ Error al enviar comando de impresión',
                  ToastAndroid.SHORT,
                );
              }
              throw printError;
            }
          } catch (error) {
            console.error('Error al imprimir:', error);
            ToastAndroid.show('❌ Error al imprimir', ToastAndroid.SHORT);
          } finally {
            setIsTestingPrint(false);
          }
        },
      },
    ]);
  };

  const handleTestSocketConnection = async () => {
    Alert.alert(
      'Probar Conexión de Sockets',
      'Se realizará una prueba temporal de conexión a los sockets WebSocket y se actualizará el estado en Redux.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Probar',
          onPress: async () => {
            try {
              setIsTestingSockets(true);
              ToastAndroid.show('Probando conexiones...', ToastAndroid.SHORT);

              if (!serverIp) {
                ToastAndroid.show(
                  '❌ No hay IP de servidor configurada',
                  ToastAndroid.SHORT,
                );
                return;
              }

              const baseUrl = `ws://${serverIp}`;
              const socketTests = [
                {type: 'table', url: `${baseUrl}/ws/tables/1`, name: 'Mesas'},
                {type: 'order', url: `${baseUrl}/ws/orders/1`, name: 'Órdenes'},
                {type: 'tablet', url: `${baseUrl}/ws/tablet`, name: 'Tablet'},
              ];

              // Función para crear prueba de socket simple sin reconexión
              const testSocket = async (url, socketType, timeout = 5000) => {
                // Marcar como conectando en Redux
                dispatch(setSocketConnecting({socketType}));

                return new Promise((resolve, reject) => {
                  let ws = null;
                  let timeoutId = null;
                  let resolved = false;

                  const cleanup = () => {
                    if (timeoutId) {
                      clearTimeout(timeoutId);
                    }
                    if (ws && ws.readyState !== WebSocket.CLOSED) {
                      ws.close();
                    }
                    ws = null;
                  };

                  const resolveOnce = (success, error) => {
                    if (!resolved) {
                      resolved = true;
                      cleanup();
                      if (success) {
                        dispatch(setSocketConnected({socketType}));
                        resolve(true);
                      } else {
                        dispatch(setSocketDisconnected({socketType}));
                        reject(error);
                      }
                    }
                  };

                  try {
                    ws = new WebSocket(url);

                    timeoutId = setTimeout(() => {
                      resolveOnce(false, new Error('Timeout'));
                    }, timeout);

                    ws.onopen = () => {
                      resolveOnce(true);
                    };

                    ws.onerror = error => {
                      resolveOnce(false, error);
                    };

                    ws.onclose = () => {
                      resolveOnce(false, new Error('Connection closed'));
                    };
                  } catch (error) {
                    resolveOnce(false, error);
                  }
                });
              };

              // Probar cada socket
              const results = [];
              for (const socketTest of socketTests) {
                try {
                  await testSocket(socketTest.url, socketTest.type);
                  results.push(`✅ ${socketTest.name}: Conectado`);
                  console.log(`✅ Socket ${socketTest.name}: conectado`);
                } catch (error) {
                  results.push(
                    `❌ ${socketTest.name}: Error - ${error.message}`,
                  );
                  console.log(
                    `❌ Socket ${socketTest.name}: error -`,
                    error.message,
                  );
                }
              }

              // Mostrar resultados
              Alert.alert(
                'Resultado de Prueba de Sockets',
                results.join('\n\n'),
                [{text: 'OK'}],
              );
            } catch (error) {
              console.error('Error probando sockets:', error);
              ToastAndroid.show(
                '❌ Error en prueba de sockets',
                ToastAndroid.SHORT,
              );
            } finally {
              setIsTestingSockets(false);
            }
          },
        },
      ],
    );
  };

  const handleUnlockReset = () => {
    Alert.alert(
      'Desbloquear Reset',
      'Ingrese la razón para desbloquear el reseteo de configuración:',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Continuar',
          onPress: () => {
            Alert.alert(
              'Confirmar Desbloqueo',
              '¿Está seguro que desea desbloquear el reseteo? Esta acción habilitará el botón de reseteo por 30 segundos.',
              [
                {
                  text: 'No',
                  style: 'cancel',
                },
                {
                  text: 'Sí, desbloquear',
                  style: 'destructive',
                  onPress: () => {
                    setIsResetUnlocked(true);
                    ToastAndroid.show(
                      '🔓 Reseteo desbloqueado por 30s',
                      ToastAndroid.LONG,
                    );

                    // Auto-bloquear después de 30 segundos
                    setTimeout(() => {
                      setIsResetUnlocked(false);
                      ToastAndroid.show(
                        '🔒 Reseteo bloqueado automáticamente',
                        ToastAndroid.SHORT,
                      );
                    }, 30000);
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleToggleKioskMode = async value => {
    if (!hasKioskPermission) {
      Alert.alert(
        'Permisos Requeridos',
        'La aplicación no tiene permisos para activar el modo kiosk. Asegúrese de que la app esté configurada como Device Owner o esté en la whitelist del sistema.',
        [{text: 'OK'}],
      );
      return;
    }

    try {
      if (value) {
        // Activar modo kiosk nativo
        ToastAndroid.show('Activando modo kiosk...', ToastAndroid.SHORT);
        await enableKiosk();
      } else {
        // Desactivar modo kiosk nativo
        ToastAndroid.show('Desactivando modo kiosk...', ToastAndroid.SHORT);
        await disableKiosk();
      }

      // Actualizar estado en Redux y Storage
      dispatch(setKioskMode(value));
      await StorageHelper.setKioskMode(value);

      ToastAndroid.show(
        `Modo Kiosk ${value ? 'activado' : 'desactivado'} correctamente`,
        ToastAndroid.LONG,
      );
    } catch (error) {
      console.error('Error al cambiar modo kiosk:', error);

      // Mostrar error específico al usuario
      let errorMessage = 'Error al cambiar modo kiosk';
      if (error.code === 'PERMISSION_DENIED') {
        errorMessage =
          'Sin permisos para modo kiosk. Configure la app como Device Owner.';
      } else if (error.code === 'NO_ACTIVITY') {
        errorMessage = 'Error interno: No hay actividad disponible.';
      }

      Alert.alert('Error', errorMessage, [{text: 'OK'}]);
    }
  };

  const handleSyncData = () => {
    Alert.alert(
      'Sincronizar Datos',
      '¿Está seguro que desea sincronizar los datos? Esta acción puede tomar varios minutos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sincronizar',
          onPress: async () => {
            try {
              setIsSyncing(true);
              dispatch(setSyncronizingData(true));
              ToastAndroid.show(
                'Iniciando sincronización...',
                ToastAndroid.LONG,
              );

              // Aquí iría la lógica real de sincronización
              // Por ahora simularemos un delay
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Guardar fecha de última sincronización
              const syncDate = new Date().toISOString();
              dispatch(setLastSyncDate(syncDate));
              await StorageHelper.setLastSyncDate(syncDate);

              ToastAndroid.show(
                '✅ Sincronización completada',
                ToastAndroid.LONG,
              );
            } catch (error) {
              console.error('Error al iniciar sincronización:', error);
              ToastAndroid.show('Error al sincronizar', ToastAndroid.SHORT);
            } finally {
              setIsSyncing(false);
              dispatch(setSyncronizingData(false));
            }
          },
        },
      ],
    );
  };

  const resetConfiguration = () => {
    if (!isResetUnlocked) {
      ToastAndroid.show(
        '🔒 Debe desbloquear el reseteo primero',
        ToastAndroid.SHORT,
      );
      return;
    }

    Alert.alert(
      'Resetear Configuración',
      'Esta acción eliminará toda la configuración y regresará a la configuración inicial. ¿Está seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Reseteando configuración...');

              // Desactivar modo kiosko nativo si está activo
              if (isKioskActive && hasKioskPermission) {
                try {
                  console.log('Desactivando modo kiosko...');
                  await disableKiosk();
                  ToastAndroid.show(
                    'Modo kiosko desactivado',
                    ToastAndroid.SHORT,
                  );
                } catch (disableKioskError) {
                  console.error(
                    'Error al desactivar modo kiosko:',
                    disableKioskError,
                  );
                  ToastAndroid.show(
                    'Advertencia: No se pudo desactivar el modo kiosko',
                    ToastAndroid.LONG,
                  );
                }
              }

              // Limpiar storage
              await StorageHelper.removeAuthInfo();
              await StorageHelper.removeCompanyInfo();
              await StorageHelper.removeStoreInfo();
              await StorageHelper.removePointOfSaleInfo();
              await StorageHelper.removeServerIp();
              await StorageHelper.removeKioskMode();
              await StorageHelper.removeLastSyncDate();

              // Limpiar estado de Redux
              dispatch(logout());
              dispatch(setCompanies([]));
              dispatch(setCompanySelected(null));
              dispatch(setStoreSelected(null));
              dispatch(setPointOfSaleSelected(null));
              dispatch(setKioskMode(false));
              dispatch(setLastSyncDate(null));

              // Re-bloquear el reseteo
              setIsResetUnlocked(false);

              ToastAndroid.show(
                'Configuración reseteada exitosamente',
                ToastAndroid.LONG,
              );

              // Navegar a InitialConfig después de un pequeño delay
              setTimeout(() => {
                navigation.reset({
                  index: 0,
                  routes: [{name: 'InitialConfig'}],
                });
              }, 1500);
            } catch (error) {
              console.error('Error al resetear configuración:', error);
              ToastAndroid.show(
                `Error al resetear configuración: ${error}`,
                ToastAndroid.SHORT,
              );
            }
          },
        },
      ],
    );
  };

  const renderSystemInfo = () => (
    <View style={styles.infoGrid}>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Impresora Sunmi</Text>
        <Text
          style={[
            styles.infoValue,
            sunmiPrinterAvailable
              ? styles.infoValueSuccess
              : styles.infoValueError,
          ]}>
          {sunmiPrinterAvailable ? '🖨️ Disponible' : '❌ No disponible'}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Modo Kiosk Nativo</Text>
        <Text
          style={[
            styles.infoValue,
            hasKioskPermission && isKioskActive
              ? styles.infoValueSuccess
              : hasKioskPermission === false
              ? styles.infoValueError
              : styles.infoValueWarning,
          ]}>
          {hasKioskPermission === null
            ? '⏳ Verificando...'
            : hasKioskPermission === false
            ? '❌ Sin permisos'
            : isKioskActive
            ? '🔒 Activo'
            : '🔓 Inactivo'}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Última Sincronización</Text>
        <Text
          style={[
            styles.infoValue,
            lastSyncDate ? styles.infoValueSuccess : styles.infoValueError,
          ]}>
          {lastSyncDate
            ? new Date(lastSyncDate).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Nunca sincronizado'}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Versión de la App</Text>
        <Text style={styles.infoValue}>{appVersion || 'N/A'}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>IP del Servidor</Text>
        <Text style={styles.infoValue}>{serverIp || 'No configurada'}</Text>
      </View>

      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Compañía</Text>
        <Text style={styles.infoValue}>
          {companySelected?.name || 'No seleccionada'}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Tienda</Text>
        <Text style={styles.infoValue}>
          {storeSelected?.name || 'No seleccionada'}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Punto de Venta</Text>
        <Text style={styles.infoValue}>
          {pointOfSaleSelected?.name || 'No seleccionado'}
        </Text>
      </View>

      {/* Estados de Sockets */}
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Socket Mesas</Text>
        <Text
          style={[
            styles.infoValue,
            socketConnections.table.connecting
              ? styles.infoValueWarning
              : socketConnections.table.connected
              ? styles.infoValueSuccess
              : styles.infoValueError,
          ]}>
          {socketConnections.table.connecting
            ? '🔄 Conectando...'
            : socketConnections.table.connected
            ? '🟢 Conectado'
            : '🔴 Desconectado'}
        </Text>
      </View>

      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Socket Órdenes</Text>
        <Text
          style={[
            styles.infoValue,
            socketConnections.order.connecting
              ? styles.infoValueWarning
              : socketConnections.order.connected
              ? styles.infoValueSuccess
              : styles.infoValueError,
          ]}>
          {socketConnections.order.connecting
            ? '🔄 Conectando...'
            : socketConnections.order.connected
            ? '🟢 Conectado'
            : '🔴 Desconectado'}
        </Text>
      </View>

      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Socket Tablet</Text>
        <Text
          style={[
            styles.infoValue,
            socketConnections.tablet.connecting
              ? styles.infoValueWarning
              : socketConnections.tablet.connected
              ? styles.infoValueSuccess
              : styles.infoValueError,
          ]}>
          {socketConnections.tablet.connecting
            ? '🔄 Conectando...'
            : socketConnections.tablet.connected
            ? '🟢 Conectado'
            : '🔴 Desconectado'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Configuración</Text>
          <Text style={styles.headerSubtitle}>
            Panel de configuración avanzada
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContainer}>
          {/* Acciones */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🔧 Acciones</Text>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={handleTestSocketConnection}
                disabled={isTestingSockets}>
                {isTestingSockets ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.actionButtonText}>Probar Sockets</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  sunmiPrinterAvailable
                    ? styles.actionButtonSecondary
                    : styles.actionButtonDisabled,
                ]}
                onPress={sunmiPrinterAvailable ? handleTestPrint : null}
                disabled={!sunmiPrinterAvailable || isTestingPrint}>
                {isTestingPrint ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    Probar Impresión{' '}
                    {!sunmiPrinterAvailable ? '(No disponible)' : ''}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSuccess]}
                onPress={handleSyncData}
                disabled={isSyncing}>
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.actionButtonText}>Sincronizar Datos</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isResetUnlocked
                    ? styles.actionButtonDanger
                    : styles.actionButtonLocked,
                ]}
                onPress={
                  isResetUnlocked ? resetConfiguration : handleUnlockReset
                }>
                <Text style={styles.actionButtonText}>
                  {isResetUnlocked
                    ? '🔓 Resetear Configuración'
                    : '🔒 Desbloquear Reset'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Configuraciones */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>⚙️ Configuraciones</Text>

            <View style={styles.toggleContainer}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>
                  Modo Kiosk {isKioskLoading ? '(Procesando...)' : ''}
                </Text>
                <Text style={styles.toggleDescription}>
                  {hasKioskPermission === false
                    ? 'Requiere permisos de Device Owner para funcionar'
                    : 'Habilita el modo de autoservicio con bloqueo nativo de Android'}
                </Text>
                {kioskError && (
                  <Text style={styles.toggleErrorText}>
                    Error: {kioskError.message}
                  </Text>
                )}
              </View>
              <Switch
                style={[
                  styles.toggle,
                  hasKioskPermission === false && styles.toggleDisabled,
                ]}
                value={kioskMode}
                onValueChange={handleToggleKioskMode}
                disabled={isKioskLoading || hasKioskPermission === false}
                trackColor={{false: '#e9ecef', true: '#007bff33'}}
                thumbColor={kioskMode ? '#007bff' : '#6c757d'}
              />
            </View>
          </View>

          {/* Información del Sistema */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📊 Información del Sistema</Text>
            {renderSystemInfo()}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ConfigView;
