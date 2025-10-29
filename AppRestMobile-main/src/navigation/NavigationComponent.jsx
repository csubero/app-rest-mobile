/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import StorageHelper from '../helpers/config/StorageHelper';
import {
  login,
  setApiToken,
  setLoading,
  setSyncronizingData,
} from '../redux/slice/authSlice';
import SplashView from '../views/SplashView';
import InitialConfigView from '../views/InitialConfigView';
import {createStackNavigator, CardStyleInterpolators} from '@react-navigation/stack';
import {setServerIp, setSocketIp} from '../redux/slice/storeSlice';
import IndexView from '../views/IndexView/index';
import apiClient from '../services/api/apiClient';
import SyncDataView from '../views/SyncDataView';
import {
  setCompanySelected,
  setPointOfSaleSelected,
  setStoreSelected,
} from '../redux/slice/companySlice';
import ProductDetailView from '../views/ProductDetailView';
import PaymentView from '../views/PaymentView/index';
import Constants from '../helpers/config/Constants';
import {ToastAndroid} from 'react-native';
import BagView from '../views/BagView/index';
import ConfigView from '../views/ConfigView';
import {setPrinter} from '../redux/slice/settingsSlice';
import LanguageSelectionView from '../views/LanguageSelectionView';
import ThankYou from '../views/ThankYou/index';
import VideoView from '../views/VideoView';
import SetTableView from '../views/TableView';
import OrderView from '../views/OrderView';
import ProductsMenuView from '../views/ProductsMenuView';
import ProductsListView from '../views/ProductsListView';

const NavigationComponent = () => {
  const {isLoading, isLoggedIn, syncronizingData} = useSelector(
    state => state.auth,
  );
  const {serverIp} = useSelector(state => state.store);
  const {companySelected, storeSelected, pointOfSaleSelected} = useSelector(
    state => state.company,
  );
  const dispatch = useDispatch();
  const MainStack = createStackNavigator();
  
  // Estado local para controlar solo la carga inicial
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);

  useEffect(() => {
    const getAuthInfo = async () => {
      dispatch(setLoading(true));
      
      try {
        // Cargar toda la información del storage de manera paralela
        const [
          authInfo,
          serverIpStored,
          companyInfo,
          storeInfo,
          pointOfSaleInfo,
          printer
        ] = await Promise.all([
          StorageHelper.getAuthInfo(),
          StorageHelper.getServerIp(),
          StorageHelper.getCompanyInfo(),
          StorageHelper.getStoreInfo(),
          StorageHelper.getPointOfSaleInfo(),
          StorageHelper.getPrinter()
        ]);

        const apiUser = Constants.API_USER;
        const apiPassword = Constants.API_PASSWORD;

        // Determinar si el usuario está completamente configurado
        const isFullyConfigured = authInfo && serverIpStored && companyInfo && storeInfo && pointOfSaleInfo;

        console.log('🔍 [NavigationComponent] Verificando configuración:', {
          hasAuth: !!authInfo,
          hasServerIp: !!serverIpStored,
          hasCompany: !!companyInfo,
          hasStore: !!storeInfo,
          hasPointOfSale: !!pointOfSaleInfo,
          isFullyConfigured
        });

        // Cargar información parcial disponible
        if (serverIpStored) {
          dispatch(setServerIp(serverIpStored));
          dispatch(setSocketIp(serverIpStored));
        }
        if (companyInfo) dispatch(setCompanySelected(companyInfo));
        if (storeInfo) dispatch(setStoreSelected(storeInfo));
        if (pointOfSaleInfo) dispatch(setPointOfSaleSelected(pointOfSaleInfo));
        if (printer) dispatch(setPrinter(printer));

        if (isFullyConfigured) {
          // Usuario completamente configurado, proceder con login
          console.log('✅ [NavigationComponent] Usuario completamente configurado, iniciando login');
          
          dispatch(login(authInfo));

          // Obtener token de API de manera asíncrona
          apiClient(serverIpStored)
            .post('auth/token/', {username: apiUser, password: apiPassword})
            .then(response => {
              dispatch(setApiToken(response.access));
            })
            .catch(error => {
              console.error('Error al obtener token:', error);
              ToastAndroid.show(
                `Error al obtener token: ${error}`,
                ToastAndroid.SHORT,
              );
            });
        } else {
          console.log('⚠️ [NavigationComponent] Usuario NO completamente configurado');
        }
      } catch (error) {
        console.error('Error cargando información de configuración:', error);
        ToastAndroid.show(
          'Error cargando configuración',
          ToastAndroid.SHORT,
        );
      } finally {
        dispatch(setLoading(false));
        setInitialLoadComplete(true);
      }
    };

    getAuthInfo();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      dispatch(setSyncronizingData(true));
    }
  }, [isLoggedIn]);

  // Determinar el estado de configuración en tiempo real
  const isFullyConfigured = serverIp && companySelected && storeSelected && pointOfSaleSelected;

  console.log('📱 [NavigationComponent] Estado en tiempo real:', {
    isLoading, 
    isLoggedIn, 
    syncronizingData, 
    initialLoadComplete,
    isFullyConfigured,
    serverIp: !!serverIp,
    companySelected: !!companySelected,
    storeSelected: !!storeSelected,
    pointOfSaleSelected: !!pointOfSaleSelected
  });

  let navigationStack = null;

  // Lógica de navegación simplificada y reactiva
  if (!initialLoadComplete || isLoading) {
    // Splash mientras carga la configuración inicial
    navigationStack = <MainStack.Screen name="Splash" component={SplashView} />;
  } else if (!isFullyConfigured) {
    // Usuario no está completamente configurado
    navigationStack = (
      <MainStack.Screen name="InitialConfig" component={InitialConfigView} />
    );
  } else if (isLoggedIn && syncronizingData) {
    // Usuario configurado pero sincronizando datos
    navigationStack = <MainStack.Screen name="SyncData" component={SyncDataView} />;
  } else if (isLoggedIn && !syncronizingData) {
    // Usuario completamente configurado y datos sincronizados
    navigationStack = (
      <MainStack.Group>
        <MainStack.Screen name="VideoView" component={VideoView} />
        <MainStack.Screen
          name="LanguageSelectionView"
          component={LanguageSelectionView}
        />
        <MainStack.Screen 
          name="Index" 
          component={IndexView}
          options={{
            unmountOnBlur: true, // 🚀 CRÍTICO: Desmontar cuando no está visible
          }}
        />
        <MainStack.Screen 
          name="ProductDetail" 
          component={ProductDetailView}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 300,
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 300,
                },
              },
            },
            unmountOnBlur: true, // 🚀 CRÍTICO: Desmontar cuando no está visible
          }}
        />
        <MainStack.Screen name="Bag" component={BagView} />
        <MainStack.Screen
          name="Config"
          component={ConfigView}
          options={{
            title: 'Configuración',
            headerShown: true,
            headerBackTitleVisible: false,
            headerTintColor: '#000',
            headerStyle: {
              backgroundColor: '#fff',
            },
          }}
        />
        <MainStack.Screen name="PaymentView" component={PaymentView} />
        <MainStack.Screen name="ThankYou" component={ThankYou} />
        <MainStack.Screen name="OrderView" component={OrderView} />
        <MainStack.Screen name="SetTable" component={SetTableView} />
        <MainStack.Screen 
          name="ProductsMenu" 
          component={ProductsMenuView}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
          }}
        />
        <MainStack.Screen 
          name="ProductsList" 
          component={ProductsListView}
          options={{
            animation: 'none', // Sin animación para navegación instantánea
          }}
        />
      </MainStack.Group>
    );
  } else {
    // Fallback - configurado pero no logueado (no debería pasar)
    navigationStack = (
      <MainStack.Screen name="InitialConfig" component={InitialConfigView} />
    );
  }

  return (
    <MainStack.Navigator 
      screenOptions={{
        headerShown: false,
        // Sin animación por defecto para navegación rápida
      }}
    >
      {navigationStack}
    </MainStack.Navigator>
  );
};

export default NavigationComponent;
