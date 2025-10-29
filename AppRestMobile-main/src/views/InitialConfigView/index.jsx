/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-trailing-spaces */
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import apiClient from '../../services/api/apiClient';
import styles from './styles';
import {useDispatch, useSelector} from 'react-redux';
import {setServerIp} from '../../redux/slice/storeSlice';
import StorageHelper from '../../helpers/config/StorageHelper';
import {
  setCompanies,
  setCompanySelected,
  setPointOfSaleSelected,
  setStoreSelected,
} from '../../redux/slice/companySlice';
import {
  login,
  setApiToken,
  setSyncronizingData,
} from '../../redux/slice/authSlice';
import Constants from '../../helpers/config/Constants';

const InitialConfigView = () => {
  const [storeIP, setStoreIP] = useState('');
  const [loading, setLoading] = useState(false);
  const [isIPValid, setIsIPValid] = useState(true);

  const {apiToken} = useSelector(state => state.auth);
  const {serverIp} = useSelector(state => state.store);
  const {companies, companySelected, storeSelected, pointOfSaleSelected} =
    useSelector(state => state.company);
  const dispatch = useDispatch();
  useEffect(() => {
    validateIP(storeIP);
  }, [storeIP]);

  useEffect(() => {
    setStoreIP(serverIp);
  }, []);

  const getCompanies = token => {
    console.log('Obteniendo marcas', storeIP);
    setLoading(true);

    apiClient(storeIP, token)
      .get('companies/list/')
      .then(response => {
        dispatch(setCompanies(response));
        console.log('Companias:', response);
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  function validateIP(ip) {
    if (ip !== '') {
      // Acepta IP con puerto opcional (ej: 192.168.1.1 o 192.168.1.1:83)
      const ipFormat =
        /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?$/;
      setIsIPValid(ipFormat.test(ip));
    } else {
      setIsIPValid(true);
    }
  }

  const setIP = async () => {
    console.log('Guardando IP:', storeIP);
    setLoading(true);
    dispatch(setServerIp(storeIP));
    await StorageHelper.setServerIp(storeIP);

    apiClient(storeIP)
      .post('auth/token/', {
        username: Constants.API_USER,
        password: Constants.API_PASSWORD,
      })
      .then(response => {
        console.log('Token obtenido:', response);
        dispatch(setApiToken(response.access));
        getCompanies(response.access);
      })
      .catch(error => {
        console.error(error);
        ToastAndroid.show(
          `Error al obtener token: ${error}`,
          ToastAndroid.SHORT,
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSelect = item => {
    console.log('Has seleccionado empresa: ', item.name, 'ID:', item.id);
    dispatch(setCompanySelected(item));
    dispatch(setStoreSelected(null));
    dispatch(setPointOfSaleSelected(null));
  };

  const handleStoreSelect = item => {
    console.log('Tienda seleccionada: ', item.name, 'ID:', item.id);
    dispatch(setStoreSelected(item));
    dispatch(setPointOfSaleSelected(null)); // Reset point of sale when store changes
  };

  const handlePointOfSaleSelect = item => {
    console.log('Caja seleccionada: ', item.name, 'ID:', item.id);
    dispatch(setPointOfSaleSelected(item));
  };

  const handleConfirmBtn = async () => {
    console.log('Guardar información de la tienda seleccionada');
    console.log('Variables antes de guardar:', {
      serverIp,
      apiToken,
      companySelected: companySelected?.id,
      storeSelected: storeSelected?.id,
      pointOfSaleSelected: pointOfSaleSelected?.id
    });

    // Validar que todas las variables necesarias estén presentes
    if (!serverIp || !apiToken || !companySelected || !storeSelected || !pointOfSaleSelected) {
      ToastAndroid.show(
        'Error: Faltan datos de configuración. Por favor revise su selección.',
        ToastAndroid.LONG,
      );
      return;
    }

    setLoading(true);

    try {
      // Guardar información en AsyncStorage
      await StorageHelper.setAuthInfo({serverIp, apiToken});
      await StorageHelper.setCompanyInfo(companySelected);
      await StorageHelper.setStoreInfo(storeSelected);
      await StorageHelper.setPointOfSaleInfo(pointOfSaleSelected);

      const data = {
        point_of_sale_id: pointOfSaleSelected.id,
        is_available: false,
      };

      // Realizar llamada a la API
      const response = await apiClient(serverIp, apiToken).post('point-of-sales/set-availability/', data);
      
      console.log('Respuesta del seteo de caja:', response);
      
      // Despachar las acciones al store
      dispatch(login({
        serverIp,
        apiToken,
        company: companySelected,
        store: storeSelected,
        pointOfSale: pointOfSaleSelected
      }));
      dispatch(setSyncronizingData(true));
      
      console.log('✅ Configuración guardada exitosamente');
      console.log('✅ Login despachado, syncronizingData establecido a true');
      
    } catch (error) {
      console.error('Error en handleConfirmBtn:', error);
      ToastAndroid.show(
        `Error al guardar configuración: ${error.message || error}`,
        ToastAndroid.LONG,
      );
    } finally {
      setLoading(false);
    }
  };

  let loadingContainer = null;

  if (loading) {
    loadingContainer = (
      <View>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  let buttonContainer = null;

  if (isIPValid && storeIP.length > 0 && !loading && companies.length === 0) {
    buttonContainer = (
      <View style={styles.buttonContainer}>
        <TouchableHighlight onPress={() => setIP()} style={{borderRadius: 5}}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Continuar</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  let formContainer = null;

  if (companies.length === 0) {
    formContainer = (
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Por favor introduzca la dirección IP servidor
        </Text>
        <TextInput
          style={[styles.input, isIPValid ? '' : styles.inputError]}
          value={storeIP}
          onChangeText={setStoreIP}
          keyboardType="url"
          placeholder=""
        />
        <Text style={styles.helpText}>
          Ejemplo: 192.168.1.1 o 192.168.1.1:83
        </Text>
      </View>
    );
  }

  let companiesContainer = null;

  if (companies.length > 0) {
    const Item = ({item}) => (
      <TouchableHighlight
        onPress={() => handleSelect(item)}
        style={{marginBottom: 5, borderRadius: 5}}>
        <View
          style={[
            styles.item,
            companySelected && companySelected.id == item.id
              ? styles.itemSelected
              : '',
          ]}>
          <Text style={styles.title}>{item.name}</Text>
        </View>
      </TouchableHighlight>
    );

    companiesContainer = (
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Seleccione una marca</Text>
        <FlatList
          data={companies}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => <Item item={item} />}
        />
      </View>
    );
  }

  let storesContainer = null;

  if (companySelected) {
    const Item = ({item}) => (
      <TouchableHighlight
        onPress={() => handleStoreSelect(item)}
        style={{marginBottom: 5, borderRadius: 5}}>
        <View
          style={[
            styles.item,
            storeSelected && storeSelected.id == item.id
              ? styles.itemSelected
              : '',
          ]}>
          <Text style={styles.title}>{item.name}</Text>
        </View>
      </TouchableHighlight>
    );

    storesContainer = (
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Seleccione una tienda</Text>
        <FlatList
          data={companySelected.stores}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => <Item item={item} />}
        />
      </View>
    );
  }

  let pointOfSaleContainer = null;

  if (storeSelected) {
    console.log(storeSelected);

    const pointOfSales = Constants.DEV
      ? [...storeSelected.point_of_sales, {id: 'test', name: 'TEST'}]
      : storeSelected.point_of_sales;

    pointOfSaleContainer = (
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Seleccione una caja</Text>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            onValueChange={value => {
              console.log('Valor seleccionado en picker:', value);
              if (value === null) {
                return; // No hacer nada si no hay valor
              }
              
              if (value === 'test') {
                handlePointOfSaleSelect({id: 1, name: 'TEST'});
              } else {
                const pointOfSale = storeSelected.point_of_sales.find(
                  pos => pos.id === value,
                );
                console.log('Point of sale encontrado:', pointOfSale);
                if (pointOfSale) {
                  handlePointOfSaleSelect(pointOfSale);
                } else {
                  console.error('No se encontró el point of sale con ID:', value);
                }
              }
            }}
            items={pointOfSales.map(pos => ({
              label: pos.name,
              value: pos.id,
            }))}
            value={pointOfSaleSelected?.id || null}
            placeholder={{
              label: 'Seleccione una caja...',
              value: null,
              color: '#9EA0A4',
            }}
            style={{
              inputIOS: styles.pickerStyle,
              inputAndroid: styles.pickerStyle,
              placeholder: {
                color: '#000',
              },
            }}
          />
        </View>
      </View>
    );
  }

  let buttonConfirmContainer = null;

  if (pointOfSaleSelected && !loading) {
    buttonConfirmContainer = (
      <View style={styles.buttonContainer}>
        <TouchableHighlight
          onPress={() => handleConfirmBtn()}
          style={{borderRadius: 5}}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Confirmar</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  // Debug: Log current state (solo cuando hay cambios significativos)
  if (loading || companies.length > 0) {
    console.log('📄 [InitialConfigView] Estado:', {
      serverIp: !!serverIp,
      hasApiToken: !!apiToken,
      companiesCount: companies.length,
      companySelected: companySelected?.name,
      storeSelected: storeSelected?.name,
      pointOfSaleSelected: pointOfSaleSelected?.name,
      loading
    });
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <View style={styles.container}>
        {formContainer}
        {companiesContainer}
        {storesContainer}
        {pointOfSaleContainer}
        {buttonConfirmContainer}
        {buttonContainer}
        {loadingContainer}
      </View>
    </KeyboardAvoidingView>
  );
};

export default InitialConfigView;
