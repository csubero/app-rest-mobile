/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import apiClient from '../../services/api/apiClient';
import Constants from '../../helpers/config/Constants';
import Utils from '../../helpers/utils/Utils';
import {
  Image,
  Text,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../../providers/ThemeProvider';
import {createStyles} from './styles';
import RNPickerSelect from 'react-native-picker-select';
import AlertDialog from '../../components/general/alerts/AlertDialog';
import {setTableData} from '../../redux/slice/companySlice';
import {
  setOrderConfirmedApiId,
  setOrderConfirmed,
  setOrderConfirmedApiExternalId,
  setIsOrderEmpty,
  clearNumberOfDinersFromOrder,
  enableSocketReconnection,
} from '../../redux/slice/bagSlice';
import {useFocusEffect} from '@react-navigation/native';
import {getOrderDetails, createEmptyOrder} from '../../services/order/orderService';
import {
  setPaidSplits,
  setTotalSplitAmount,
  setSplitCount,
  setIsSplit,
  setSplitType,
  blockSplits,
  forceResetPaymentFlow,
} from '../../redux/slice/paymentFlowSlice';

const SetTableView = ({navigation}) => {
  const [roomsList, setRoomsList] = React.useState([]);
  const [selectedRoom, setSelectedRoom] = React.useState(null);
  const [numberOfDiners, setNumberOfDiners] = React.useState(null);
  const [tablesList, setTablesList] = React.useState([]);
  const [selectedTable, setSelectedTable] = React.useState(null);
  const [showAlert, setShowAlert] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState('');
  const [hasNavigated, setHasNavigated] = React.useState(false);
  const [orderId, setOrderId] = React.useState('');
  const [isRecoverMode, setIsRecoverMode] = React.useState(false);
  const [isConfiguringOrder, setIsConfiguringOrder] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const dispatch = useDispatch();

  const {companySelected, tableData, pointOfSaleSelected, waiterData} =
    useSelector(state => state.company);
  const {numberOfDinersFromOrder} = useSelector(state => state.bag);
  const currentPaymentFlow = useSelector(state => state.paymentFlow);
  const {serverIp} = useSelector(state => state.store);
  const {apiToken} = useSelector(state => state.auth);

  const {colors, dimensions, font_type, sizes} = useTheme();
  const styles = createStyles(colors, dimensions, font_type, sizes);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        setIsLoadingData(true);
        const tablesUrl = 'tables/list/';
        try {
          if (Constants.DEV_API) {
            const mockTablesResponse = [
              {
                id: 1,
                name: 'Sala Principal',
                tables: [
                  {
                    id: 5,
                    number: 5,
                    available: true,
                  },
                ],
              },
            ];

            // Filtrar salas que no tengan nombre vacío
            const filteredRooms = mockTablesResponse.filter(
              room => room.name && room.name.trim() !== '',
            );

            setRoomsList(filteredRooms);
            return;
          }

          const tablesResponse = await apiClient(serverIp, apiToken).get(
            tablesUrl,
          );

          // console.log('Tables response:', JSON.stringify(tablesResponse, null, 2));

          // Filtrar salas que no tengan nombre vacío
          const filteredRooms = tablesResponse.filter(
            room => room.name && room.name.trim() !== '',
          );

          setRoomsList(filteredRooms);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }

      fetchData();

      if (tableData && !hasNavigated) {
        setSelectedRoom(tableData.room);
        setSelectedTable(tableData.table);
        setNumberOfDiners(tableData.numberOfDiners);

        setHasNavigated(true);
        navigation.replace('LanguageSelectionView');
      }
    }, [serverIp, apiToken, tableData, hasNavigated]),
  );

  // Efecto para preseleccionar el número de comensales cuando se carga una orden activa
  React.useEffect(() => {
    if (numberOfDinersFromOrder && numberOfDinersFromOrder > 0) {
      console.log(
        '🍽️ Preseleccionando número de comensales desde orden activa:',
        numberOfDinersFromOrder,
      );
      setNumberOfDiners(numberOfDinersFromOrder);
    } else if (numberOfDinersFromOrder === null) {
      // Si se limpió el valor desde Redux, limpiar también el estado local si no hay datos de tabla preexistentes
      if (!tableData || !tableData.numberOfDiners) {
        setNumberOfDiners(null);
      }
    }
  }, [numberOfDinersFromOrder, tableData]);

  const handleConfigureOrder = async () => {
    if (!orderId.trim()) {
      setAlertMessage('Por favor ingrese un ID de orden válido');
      setShowAlert(true);
      return;
    }

    if (isConfiguringOrder) {
      return; // Evitar múltiples llamadas durante el loading
    }

    // Resetear el paymentFlow antes de configurar cualquier orden
    dispatch(forceResetPaymentFlow());
    setIsConfiguringOrder(true);

    try {
      console.log('🔍 Configurando orden con ID:', orderId);
      const orderDetails = await getOrderDetails({
        serverIp,
        apiToken,
        orderId: orderId.trim(),
      });

      console.log('✅ Orden configurada');

      // Sincronizar payment_split con Redux state
      if (orderDetails.payment_split) {
        const {split_count, total_split_amount, paying_splits} =
          orderDetails.payment_split;

        console.log('[TableView] Sincronizando payment_split:', {
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

      // Validar estado de la orden antes de procesar
      if (orderDetails?.status?.key === 7) {
        // Limpiar el estado de Redux si existe
        dispatch(setOrderConfirmedApiId(null));
        dispatch(setOrderConfirmed(false));
        setAlertMessage(
          'Esta orden ya está completada y no puede ser recuperada',
        );
        setShowAlert(true);
        return;
      }

      // Validar si la orden está cancelada
      if (orderDetails?.status?.key === 6) {
        // Limpiar el estado de Redux si existe
        dispatch(setOrderConfirmedApiId(null));
        dispatch(setOrderConfirmed(false));
        setAlertMessage('Esta orden está cancelada y no puede ser recuperada');
        setShowAlert(true);
        return;
      }

      // Procesar los detalles de la orden para poblar los campos
      if (orderDetails && orderDetails.room && orderDetails.table_details) {
        // Crear la estructura simplificada con los datos del JSON
        const roomData = {
          id: orderDetails.room.id,
          name: orderDetails.room.name,
          tables: [
            {
              id: orderDetails.table_details.id,
              number: orderDetails.table_details.number,
              available: true,
            },
          ],
        };

        const selectedTableData = {
          id: orderDetails.table_details.id,
          name: orderDetails.table_details.number.toString(),
        };

        // Configurar los datos de la mesa
        const tableDataSelected = {
          room: roomData,
          table: selectedTableData,
          numberOfDiners: orderDetails.number_of_dinners || 1,
          tableInternalId: Utils.generateTableInternalId(
            orderId.trim(),
            orderDetails.table_details.id,
          ),
        };

        console.log('📋 Configurando mesa desde orden:', tableDataSelected);
        console.log(
          '🆔 Table Internal ID generado:',
          tableDataSelected.tableInternalId,
        );

        // Habilitar reconexión de sockets para la nueva orden configurada
        dispatch(enableSocketReconnection());

        // Establecer el ID de la orden y los datos de la mesa
        dispatch(setOrderConfirmedApiId(orderId.trim()));
        dispatch(setOrderConfirmed(true));
        dispatch(setTableData(tableDataSelected));

        // Verificar si la orden tiene items para determinar si está vacía
        const hasItems = orderDetails.items && orderDetails.items.length > 0;
        dispatch(setIsOrderEmpty(!hasItems)); // Marcar como vacía si no tiene items

        // Navegar directamente a la selección de idioma
        navigation.replace('LanguageSelectionView');
        return;
      }

      // Si no se encuentran los datos necesarios
      dispatch(setOrderConfirmedApiId(null));
      dispatch(setOrderConfirmed(false));
      setAlertMessage('No se encontraron datos de mesa para esta orden');
      setShowAlert(true);
    } catch (error) {
      console.error('❌ Error al configurar la orden:', error);
      // Limpiar el estado de Redux en caso de error
      dispatch(setOrderConfirmedApiId(null));
      dispatch(setOrderConfirmed(false));
      setAlertMessage(
        'Error al configurar la orden. Verifique el ID e intente nuevamente.',
      );
      setShowAlert(true);
    } finally {
      setIsConfiguringOrder(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedRoom) {
      setAlertMessage('Por favor seleccione una sala');
      setShowAlert(true);
      return;
    }

    if (!selectedTable) {
      if (tablesList.length === 0 && selectedRoom) {
        setAlertMessage('No hay mesas disponibles en esta sala');
      } else {
        setAlertMessage('Por favor seleccione una mesa');
      }
      setShowAlert(true);
      return;
    }

    if (!numberOfDiners || parseInt(numberOfDiners, 10) <= 0) {
      setAlertMessage('Por favor ingrese el número de comensales');
      setShowAlert(true);
      return;
    }

    // Validar que se hayan configurado los datos del mesero
    if (!waiterData || !waiterData.id) {
      setAlertMessage(
        'Por favor configure primero el mesero desde la esquina superior derecha de la pantalla de video.',
      );
      setShowAlert(true);
      return;
    }

    // Resetear el paymentFlow antes de crear una orden nueva
    dispatch(forceResetPaymentFlow());
    setIsConfiguringOrder(true);

    try {
      // Preparar datos de la mesa
      const tableDataSelected = {
        room: selectedRoom,
        table: selectedTable,
        numberOfDiners: numberOfDiners,
      };

      console.log('📋 Configurando mesa:', tableDataSelected);
      console.log(
        '🔍 Datos de pointOfSaleSelected:',
        JSON.stringify(pointOfSaleSelected, null, 2),
      );

      // Verificar que tenemos los datos necesarios del punto de venta antes de crear la orden
      if (!pointOfSaleSelected?.name) {
        console.error(
          '❌ Faltan datos de punto de venta:',
          pointOfSaleSelected,
        );
        setAlertMessage(
          'Error: No se encontró información del punto de venta. Configure primero el punto de venta.',
        );
        setShowAlert(true);
        return;
      }

      // Crear una orden vacía primero (antes de establecer tableData para evitar conexión prematura de socket)
      console.log('🆕 Creando orden vacía para mesa configurada');

      const emptyOrderResponse = await createEmptyOrder({
        serverIp,
        apiToken,
        baseCompany: {
          pointOfSaleSelected: pointOfSaleSelected,
          tableData: tableDataSelected,
        },
        waiterData: waiterData,
      });

      console.log('✅ Orden vacía creada con ID:', emptyOrderResponse.id);

      // Ahora que tenemos el orderId, generar el tableInternalId
      const tableInternalId = Utils.generateTableInternalId(
        emptyOrderResponse.id,
        selectedTable.id,
      );

      // Agregar el tableInternalId a los datos de la mesa
      const finalTableDataSelected = {
        ...tableDataSelected,
        tableInternalId: tableInternalId,
      };

      console.log('🆔 Table Internal ID generado:', tableInternalId);

      // Habilitar reconexión de sockets para la nueva orden
      dispatch(enableSocketReconnection());

      dispatch(setTableData(finalTableDataSelected));
      dispatch(setOrderConfirmedApiId(emptyOrderResponse.id));
      dispatch(setOrderConfirmedApiExternalId(emptyOrderResponse.external_id));
      dispatch(setOrderConfirmed(true));
      dispatch(setIsOrderEmpty(true)); // Marcar la orden como vacía al crearla

      // Navegar a la selección de idioma
      navigation.replace('LanguageSelectionView');
    } catch (error) {
      console.error('❌ Error al configurar mesa y crear orden vacía:', error);
      setAlertMessage(
        'Error al configurar la mesa y crear la orden. Por favor intente nuevamente.',
      );
      setShowAlert(true);
    } finally {
      setIsConfiguringOrder(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Función para determinar si el botón debe estar habilitado
  const isButtonEnabled = () => {
    if (isRecoverMode) {
      // En modo recuperación, solo necesita el ID de orden
      return orderId.trim().length > 0 && !isConfiguringOrder;
    } else {
      // En modo normal, necesita sala, mesa, número de comensales y no debe estar configurando
      return (
        selectedRoom &&
        selectedTable &&
        numberOfDiners &&
        parseInt(numberOfDiners, 10) > 0 &&
        !isConfiguringOrder
      );
    }
  };

  const handleRoomSelect = room => {
    setSelectedRoom(room);
    setSelectedTable(null);
    setTablesList([]);

    // Limpiar la suscripción a la orden al cambiar de sala
    dispatch(setOrderConfirmedApiId(null));

    // Limpiar el número de comensales preseleccionado de orden activa
    dispatch(clearNumberOfDinersFromOrder());

    // Filtrar solo mesas disponibles y sin órdenes activas
    const tables = room.tables
      .filter(table => {
        // Solo mostrar mesas disponibles y sin órdenes activas
        return table.available && table.active_order_id === null;
      })
      .map(table => ({
        id: table.id,
        name: table.number.toString(),
      }));
    setTablesList(tables);
  };

  if (tableData && hasNavigated) {
    return null;
  }

  // Mostrar pantalla de carga mientras se obtienen los datos
  if (isLoadingData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Image
          source={{uri: companySelected.settings.logo_url}}
          style={styles.logo}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Cargando información de mesas...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={80}>
      <View style={[styles.container]}>
        <Image
          source={{uri: companySelected.settings.logo_url}}
          style={styles.logo}
        />
        <Text style={styles.titleText}>Configure su mesa</Text>
        <View style={styles.mainContentContainer}>
          {!isRecoverMode && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>Selecciona una Sala:</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    onValueChange={value => {
                      if (isConfiguringOrder) {
                        return; // Bloquear durante configuración
                      }
                      const room = roomsList.find(r => r.id === value);
                      if (room) {
                        handleRoomSelect(room);
                      }
                    }}
                    items={roomsList.map(room => ({
                      label: room.name,
                      value: room.id,
                    }))}
                    value={selectedRoom?.id || null}
                    placeholder={{
                      label: 'Seleccione una sala...',
                      value: null,
                      color: colors.placeholder || '#9EA0A4',
                    }}
                    style={{
                      inputAndroid: isConfiguringOrder
                        ? styles.pickerStyleDisabled
                        : styles.pickerStyle,
                      placeholder: {
                        color: '#000',
                      },
                    }}
                    disabled={isConfiguringOrder}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>Selecciona una Mesa:</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    onValueChange={async value => {
                      if (isConfiguringOrder) {
                        return; // Bloquear durante configuración
                      }
                      const table = tablesList.find(t => t.id === value);
                      setSelectedTable(table || null);

                      // Si la mesa seleccionada tiene una orden activa, obtener detalles y suscribirse al socket
                      if (table && table.active_order_id) {
                        console.log(
                          '🔄 Mesa con orden activa seleccionada, ID de orden:',
                          table.active_order_id,
                        );

                        // Establecer el ID de la orden para la suscripción al socket
                        dispatch(setOrderConfirmedApiId(table.active_order_id));
                      }
                    }}
                    items={
                      tablesList.length === 0
                        ? []
                        : tablesList.map(table => ({
                            label: `Mesa ${table.name}`,
                            value: table.id,
                          }))
                    }
                    value={selectedTable?.id || null}
                    placeholder={{
                      label:
                        tablesList.length === 0
                          ? 'No existen mesas disponibles'
                          : 'Seleccione una mesa...',
                      value: null,
                      color: colors.placeholder || '#9EA0A4',
                    }}
                    style={{
                      inputAndroid:
                        !selectedRoom ||
                        tablesList.length === 0 ||
                        isConfiguringOrder
                          ? styles.pickerStyleDisabled
                          : styles.pickerStyle,
                      placeholder: {
                        color: colors.placeholder || '#9EA0A4',
                      },
                    }}
                    disabled={
                      !selectedRoom ||
                      tablesList.length === 0 ||
                      isConfiguringOrder
                    }
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>
                  Ingrese el número de comensales:
                </Text>
                <TextInput
                  style={
                    isConfiguringOrder ? styles.inputDisabled : styles.input
                  }
                  placeholder="Número de comensales (1-20)"
                  keyboardType="numeric"
                  value={numberOfDiners ? numberOfDiners.toString() : ''}
                  onChangeText={text => {
                    if (isConfiguringOrder) {
                      return; // Bloquear durante configuración
                    }
                    const numeric = text.replace(/[^0-9]/g, '');
                    const numericValue = Number(numeric);

                    // Validar que no sea mayor a 20 ni 0
                    if (numericValue <= 20 && numericValue >= 0) {
                      setNumberOfDiners(
                        numericValue === 0 ? null : numericValue,
                      );
                    }
                  }}
                  editable={!isConfiguringOrder}
                />
              </View>

              {/* Indicador de estado del mesero */}
              <View style={styles.infoContainer}>
                <Text
                  style={[
                    styles.infoText,
                    waiterData && waiterData.name
                      ? {color: colors.success || '#28a745'}
                      : {color: colors.warning || '#ffc107'},
                  ]}>
                  {waiterData && waiterData.name
                    ? `✓ Mesero configurado: ${waiterData.name}`
                    : '⚠️ Configure el mesero desde la esquina superior derecha de la pantalla de video'}
                </Text>
              </View>
            </>
          )}

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isRecoverMode && styles.toggleButtonActive,
                isConfiguringOrder && styles.toggleButtonDisabled,
              ]}
              onPress={() => {
                if (isConfiguringOrder) {
                  return; // Bloquear durante configuración
                }
                const newRecoverMode = !isRecoverMode;
                setIsRecoverMode(newRecoverMode);

                if (newRecoverMode) {
                  setNumberOfDiners(null);
                }
              }}
              disabled={isConfiguringOrder}>
              <Text
                style={[
                  styles.toggleButtonText,
                  isRecoverMode && styles.toggleButtonTextActive,
                ]}>
                {isRecoverMode ? '✓ ' : ''}Configurar orden existente con ID
              </Text>
            </TouchableOpacity>
          </View>

          {isRecoverMode ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputText}>ID de Orden:</Text>
                <TextInput
                  style={
                    isConfiguringOrder ? styles.inputDisabled : styles.input
                  }
                  placeholder="Ingrese ID de orden"
                  keyboardType="numeric"
                  value={orderId}
                  onChangeText={setOrderId}
                  editable={!isConfiguringOrder}
                />
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  La información de sala, mesa y comensales se obtendrá
                  automáticamente de la orden.
                </Text>
              </View>
            </>
          ) : null}
          <View style={styles.buttonContainer}>
            <TouchableWithoutFeedback onPress={handleGoBack}>
              <View style={styles.backButtonStyle}>
                <Text style={styles.buttonText}>Atrás</Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback
              onPress={isRecoverMode ? handleConfigureOrder : handleContinue}
              disabled={!isButtonEnabled()}>
              <View
                style={[
                  styles.button,
                  (!isButtonEnabled() || isConfiguringOrder) &&
                    styles.buttonDisabled,
                ]}>
                {isConfiguringOrder ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={styles.buttonText}>
                      {isRecoverMode ? 'Configurando...' : 'Creando orden...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>
                    {isRecoverMode ? 'Configurar' : 'Continuar'}
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
        <AlertDialog
          visible={showAlert}
          onCancel={() => setShowAlert(false)}
          alertMessage={alertMessage}
          onConfirm={() => setShowAlert(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default SetTableView;
