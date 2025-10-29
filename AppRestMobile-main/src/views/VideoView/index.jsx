import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import InstantImageFullscreen from '../../components/products/InstantImageFullscreen';
import {useFocusEffect} from '@react-navigation/native';
import AdminCodeModal from '../../components/general/modals/AdminCodeModal';
import ConfirmDialog from '../../components/general/modals/ConfirmDialog';
import AlertDialog from '../../components/general/alerts/AlertDialog';
import Constants from '../../helpers/config/Constants';
import {
  clearTableData,
  clearWaiterData,
  setWaiterData,
} from '../../redux/slice/companySlice';
import {resetCopilot} from '../../redux/slice/settingsSlice';
import {
  clearBag,
  setWaiterCalled,
  clearOrderNotifications,
} from '../../redux/slice/bagSlice';
import {resetPaymentFlow} from '../../redux/slice/paymentFlowSlice';
import {getOrderDetails, cancelOrder} from '../../services/order/orderService';
import OrderManager from '../../services/order/OrderManager';
import {
  setPaidSplits,
  setTotalSplitAmount,
  setSplitCount,
  setIsSplit,
  setSplitType,
  blockSplits,
} from '../../redux/slice/paymentFlowSlice';

const VideoView = ({navigation}) => {
  const {companySelected, tableData} = useSelector(state => state.company);
  const {orderConfirmed, orderConfirmedApiId} = useSelector(state => state.bag);
  const currentPaymentFlow = useSelector(state => state.paymentFlow);
  // Selectores para la API
  const {serverIp} = useSelector(state => state.store);
  const {apiToken} = useSelector(state => state.auth);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCannotResetAlert, setShowCannotResetAlert] = useState(false);
  const [isValidatingOrder, setIsValidatingOrder] = useState(false);
  const dispatch = useDispatch();

  // Función para reconectar sockets automáticamente usando SocketReconnectionHelper
  const performAutomaticSocketReconnection = React.useCallback(() => {
    OrderManager.performSocketReconnection(false, 'SocketIndicator');
  }, []);

  // Efecto para reconectar sockets cuando se enfoca el VideoView
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔌 [VideoView] Habilitando reconexión de sockets');
      setTimeout(() => {
        performAutomaticSocketReconnection();
      }, 1000); // Esperar 1 segundo para asegurar que el estado se actualice
    }, [performAutomaticSocketReconnection]),
  );

  // Función para esquina superior izquierda - Ir a configuración del servidor
  const handleServerConfig = () => {
    setShowAdminModal(true);
  };

  // Función para esquina superior derecha - Configurar/resetear mesa
  const handleTableConfig = () => {
    setShowConfigModal(true);
  };

  const handleAdminModalClose = () => {
    setShowAdminModal(false);
  };

  const handleConfigModalClose = () => {
    setShowConfigModal(false);
  };

  // Success para ir a configuración del servidor
  const handleAdminSuccess = adminData => {
    setShowAdminModal(false);
    navigation.navigate('Config');
  };

  const handleConfigSuccess = async adminData => {
    // Primero almacenar los datos del mesero para usarlos en la creación de órdenes
    if (adminData?.adminData && !adminData.adminData.dev) {
      console.log('💾 [VideoView] Almacenando datos del mesero:', {
        id: adminData.adminData.id,
        name: adminData.adminData.name,
        // password: adminData.code,
      });

      dispatch(
        setWaiterData({
          id: adminData.adminData.id,
          name: adminData.adminData.name,
          // password: adminData.code,
        }),
      );
    } else {
      console.log('🔧 [VideoView] Modo DEV - usando datos mock del mesero');
      dispatch(
        setWaiterData({
          id: 1,
          name: 'MESERO DEV',
          // password: adminData.code,
        }),
      );
    }

    if (tableData) {
      // En desarrollo, permitir reset siempre
      if (Constants.DEV_API) {
        setShowConfigModal(false);
        setShowResetConfirm(true);
        return;
      }

      // Si hay una orden confirmada, validar si se puede resetear
      if (orderConfirmedApiId && orderConfirmed) {
        setIsValidatingOrder(true);

        try {
          console.log(
            '🔍 [VideoView] Validando si se puede resetear tablet...',
          );

          // Obtener los detalles de la orden
          const rawOrderData = await getOrderDetails({
            serverIp,
            apiToken,
            orderId: orderConfirmedApiId,
          });

          // Sincronizar payment_split con Redux state
          if (rawOrderData.payment_split) {
            const {split_count, total_split_amount, paying_splits} =
              rawOrderData.payment_split;

            console.log('[VideoView] Sincronizando payment_split:', {
              split_count,
              total_split_amount,
              paying_splits,
            });

            // Actualizar el estado de Redux con los datos del payment_split
            dispatch(setSplitCount(split_count || 2));
            dispatch(setTotalSplitAmount(total_split_amount || 0));
            dispatch(setPaidSplits(paying_splits || []));
            if (!currentPaymentFlow.splits.isBlocked) {
              dispatch(setIsSplit(true));
              dispatch(setSplitType('equal'));
              dispatch(blockSplits());
            }
          }

          const balance = rawOrderData.balance || 0;
          const status = rawOrderData.status;

          console.log(
            `[VideoView] Balance: ${balance}, Status: ${status?.display} (${status?.key})`,
          );

          // Si balance es 0 o la orden está completada, se puede resetear
          if (balance <= 0 || status?.key === 7) {
            console.log(
              '✅ [VideoView] Se puede resetear: orden sin balance pendiente',
            );
            setShowConfigModal(false);
            setShowResetConfirm(true);
          } else {
            console.log(
              '❌ [VideoView] No se puede resetear: orden con balance pendiente',
            );
            setShowConfigModal(false);
            setShowCannotResetAlert(true);
          }
        } catch (error) {
          console.error('❌ [VideoView] Error al validar orden:', error);
          // En caso de error, asumir que no se puede resetear por seguridad
          setShowConfigModal(false);
          setShowCannotResetAlert(true);
        } finally {
          setIsValidatingOrder(false);
        }
        return;
      }

      // Si no hay orden confirmada, se puede resetear libremente
      setShowConfigModal(false);
      setShowResetConfirm(true);
    } else {
      navigation.navigate('SetTable');
    }
  };

  const handleResetConfirm = async () => {
    try {
      // Si hay una orden confirmada, cancelarla en el backend antes de resetear
      if (orderConfirmedApiId && orderConfirmed) {
        console.log('🔄 [VideoView] Cancelando orden en el backend antes del reset...');
        
        await cancelOrder({
          serverIp,
          apiToken,
          orderId: orderConfirmedApiId,
        });
        
        console.log('✅ [VideoView] Orden cancelada exitosamente en el backend');
      }
    } catch (error) {
      console.error('❌ [VideoView] Error al cancelar la orden en el backend:', error);
      // Continuar con el reset local incluso si falla la cancelación en el backend
    }

    // Resetear todos los estados de Redux
    dispatch(clearTableData());
    dispatch(clearWaiterData());
    dispatch(clearBag());
    dispatch(setWaiterCalled(false));
    dispatch(clearOrderNotifications());
    dispatch(resetPaymentFlow());
    dispatch(resetCopilot());
    setShowResetConfirm(false);

    console.log('♻️ [VideoView] Estado de la tablet reseteado');
    console.log(`♻️ [VideoView] OrderConfirmedApiId reseteado: ${orderConfirmedApiId}`);

    // Navegar a la configuración de mesa tras resetear
    navigation.replace('VideoView');
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };
  return (
    <View style={styles.container}>
      <InstantImageFullscreen
        source={{uri: companySelected.settings.intro_video_url}}
        style={styles.image}
        resizeMode="cover"
      />

      {tableData ? (
        // Si hay tableData, toda la pantalla es "clickable" y además esquinas para config servidor y config mesa
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => navigation.navigate('LanguageSelectionView')}
          />
          <TouchableOpacity
            style={styles.serverConfigCorner}
            onPress={handleServerConfig}
          />
          <TouchableOpacity
            style={styles.tableConfigCorner}
            onPress={handleTableConfig}
          />
        </>
      ) : (
        // Si no hay tableData, solo esquinas para config servidor y config mesa
        <>
          <TouchableOpacity
            style={styles.serverConfigCorner}
            onPress={handleServerConfig}
          />
          <TouchableOpacity
            style={styles.tableConfigCorner}
            onPress={handleTableConfig}
          />
        </>
      )}

      {/* Modal de código para configuración del servidor */}
      <AdminCodeModal
        visible={showAdminModal}
        onClose={handleAdminModalClose}
        onSuccess={handleAdminSuccess}
        title="Configuración del servidor"
        message="Ingrese el código de acceso para cambiar la configuración del servidor"
      />

      {/* Modal de código para configuración/reset de mesa */}
      <AdminCodeModal
        visible={showConfigModal}
        onClose={handleConfigModalClose}
        onSuccess={handleConfigSuccess}
        title="Configuración de mesa"
        message="Ingrese el código de acceso para configurar o resetear la mesa"
        isLoading={isValidatingOrder}
      />

      {/* Modal de confirmación para reiniciar tablet */}
      <ConfirmDialog
        visible={showResetConfirm}
        title="Reiniciar Tablet"
        message="¿Está seguro que desea reiniciar el estado de la tablet? Esta acción eliminará todos los datos de la sesión actual."
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
        confirmText="Sí, reiniciar"
        cancelText="No, cancelar"
      />

      {/* Alerta cuando no se puede reiniciar */}
      <AlertDialog
        visible={showCannotResetAlert}
        alertTitle="No se puede reiniciar"
        alertMessage="La tablet tiene una orden con balance pendiente por pagar. Complete el pago antes de reiniciar."
        onCancel={() => setShowCannotResetAlert(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  serverConfigCorner: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    zIndex: 999,
    // backgroundColor: 'rgba(0, 255, 0, 0.2)', // solo para pruebas
  },
  tableConfigCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    zIndex: 999,
    // backgroundColor: 'rgba(255, 255, 0, 0.2)', // solo para pruebas
  },
});

export default VideoView;
