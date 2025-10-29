/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View, Image} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import FastImage from 'react-native-fast-image';
import styles from './styles';
import apiClient from '../../services/api/apiClient';
import ProductService from '../../services/api/ProductService';
import PromoBannerService from '../../services/api/PromoBannerService';
import {setSyncronizingData} from '../../redux/slice/authSlice';
import StorageHelper from '../../helpers/config/StorageHelper';
import {setPromotions} from '../../redux/slice/bagSlice';
import {setBannerImage, setLastSyncDate} from '../../redux/slice/settingsSlice';
import {store} from '../../redux/store';
import {
  setCompanySelected,
  setPointOfSaleSelected,
  setStoreSelected,
} from '../../redux/slice/companySlice';

const SyncDataView = () => {
  const {user} = useSelector(state => state.auth);
  const {companySelected, storeSelected, pointOfSaleSelected} = useSelector(
    state => state.company,
  );
  const [syncronizing, setSyncronizing] = useState(false);
  const [syncronizingMessage, setSyncronizingMessage] = useState('');
  const [isServiceConfigured, setIsServiceConfigured] = useState(false);
  const [preloadImages, setPreloadImages] = useState([]);
  const dispatch = useDispatch();

  // ============================================
  // CONFIGURAR SERVICIOS INMEDIATAMENTE
  // ============================================
  useEffect(() => {
    if (user?.serverIp && user?.apiToken) {
      console.log('🔧 [SyncDataView] Configurando servicios...');
      try {
        ProductService.configure(user.serverIp, user.apiToken);
        PromoBannerService.configure(user.serverIp, user.apiToken);
        setIsServiceConfigured(true);
        console.log('✅ [SyncDataView] Servicios configurados exitosamente');
      } catch (error) {
        console.error('❌ [SyncDataView] Error configurando servicios:', error);
        setIsServiceConfigured(false);
      }
    }
  }, [user?.serverIp, user?.apiToken]);

  const loaderActivity = syncronizing ? (
    <ActivityIndicator size="large" color="#0000ff" />
  ) : null;

  useEffect(() => {
    // Solo iniciar sincronización cuando el servicio esté configurado
    if (!isServiceConfigured) {
      console.log('⏳ [SyncDataView] Esperando configuración de ProductService...');
      return;
    }

    async function fetchData() {
      setSyncronizing(true);

      try {
        const productsUrl = 'products/actives/';
        const promotionsUrl = `promotions/${companySelected.id}/list/`;

        setSyncronizingMessage('Sincronizando información de la empresa...');
        const companyResponse = await apiClient(
          user.serverIp,
          user.apiToken,
        ).get(`companies/${companySelected.id}/detail/`);
        await StorageHelper.setCompanyInfo(companyResponse);
        dispatch(setCompanySelected(companyResponse));

        setSyncronizingMessage('Sincronizando información de la tienda...');
        const storeResponse = await apiClient(user.serverIp, user.apiToken).get(
          `stores/${storeSelected.id}/detail/`,
        );
        await StorageHelper.setStoreInfo(storeResponse);
        dispatch(setStoreSelected(storeResponse));

        setSyncronizingMessage(
          'Sincronizando información del punto de venta...',
        );
        const pointOfSaleResponse = await apiClient(
          user.serverIp,
          user.apiToken,
        ).get(`point-of-sales/${pointOfSaleSelected.id}/detail/`);
        await StorageHelper.setPointOfSaleInfo(pointOfSaleResponse);
        dispatch(setPointOfSaleSelected(pointOfSaleResponse));

        // ============================================
        // SINCRONIZACIÓN DE PRODUCTOS CON SINGLETON
        // ============================================
        setSyncronizingMessage('Sincronizando productos...');
        
        // Doble verificación de seguridad
        if (!ProductService.serverIp || !ProductService.apiToken) {
          console.error('❌ [SyncDataView] ProductService perdió configuración, reconfigurando...');
          ProductService.configure(user.serverIp, user.apiToken);
        }
        
        if (!PromoBannerService.serverIp || !PromoBannerService.apiToken) {
          console.error('❌ [SyncDataView] PromoBannerService perdió configuración, reconfigurando...');
          PromoBannerService.configure(user.serverIp, user.apiToken);
        }
        
        console.log('📡 [SyncDataView] Iniciando fetch de productos...');
        
        // Obtener productos usando el singleton (esto los almacena en memoria)
        const productResponse = await ProductService.fetchProducts();
        
        console.log('✅ [SyncDataView] Productos sincronizados vía ProductService:', {
          total: productResponse.length,
          categories: ProductService.getMenus().length,
          stats: ProductService.getProductsStats(),
        });

        // � RENDERIZADO INVISIBLE FORZADO - La única forma que funciona de verdad
        setSyncronizingMessage('Cargando imágenes en cache...');
        console.log('🖼️ [SyncDataView] Forzando renderizado invisible de imágenes...');
        
        const menus = ProductService.getMenus();
        if (menus.length > 0) {
          // Extraer URLs de imágenes DE MENÚS PRIMERO (prioridad alta)
          const menuUrls = menus
            .filter(menu => menu?.image)
            .map(menu => menu.image);
          
          console.log('🎯 [SyncDataView] PRECARGANDO MENÚS PRIMERO (prioridad alta):', menuUrls.length);
          
          // RENDERIZAR SOLO las imágenes de menús primero (PRIORIDAD)
          setPreloadImages(menuUrls);
          
          // Dar más tiempo para que se descarguen las imágenes de menús
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          console.log('✅ [SyncDataView] Menús precargados');
          
          // Ahora agregar las imágenes de productos
          const allProducts = menus.flatMap(menu => menu.products || []);
          const productUrls = allProducts
            .filter(product => product?.image_url)
            .map(product => product.image_url);
          
          const allImageUrls = [...menuUrls, ...productUrls];
          
          console.log('🖼️ [SyncDataView] Agregando productos:', {
            menus: menuUrls.length,
            products: productUrls.length,
            total: allImageUrls.length
          });
          
          // RENDERIZAR todas las imágenes (menús + productos)
          setPreloadImages(allImageUrls);
          
          // Dar tiempo adicional para productos
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('✅ [SyncDataView] Renderizado invisible completado - imágenes en cache');
        }

        // Limpiar y preparar directorios de imágenes
        await StorageHelper.checkBannerDirectory();
        await StorageHelper.removeBannerImage();

        // Obtener menús/categorías desde el singleton y guardarlos
        const menusFromService = ProductService.getMenus();
        await StorageHelper.setMenus(menusFromService);
        
        // Download banner image
        const bannerUrl = 'cms/banner/';
        const bannerResponse = await apiClient(
          user.serverIp,
          user.apiToken,
        ).get(bannerUrl);
        dispatch(setBannerImage(bannerResponse.image));

        setSyncronizingMessage('Sincronizando Promociones...');
        const promotionsResponse = await apiClient(
          user.serverIp,
          user.apiToken,
        ).get(promotionsUrl);

        await StorageHelper.setPromotions(promotionsResponse);

        dispatch(setPromotions(promotionsResponse));

        // ============================================
        // SINCRONIZACIÓN DE PROMO BANNERS CON SINGLETON
        // ============================================
        setSyncronizingMessage('Sincronizando banners promocionales...');
        
        console.log('📡 [SyncDataView] Iniciando fetch de promo banners...');
        
        // Obtener promo banners usando el singleton (esto los almacena en memoria)
        const promoBannerResponse = await PromoBannerService.fetchPromoBanners();
        
        console.log('✅ [SyncDataView] Promo banners sincronizados vía PromoBannerService:', {
          total: promoBannerResponse.length,
          active: PromoBannerService.getActivePromoBanners().length,
          stats: PromoBannerService.getPromoBannersStats(),
        });

        // (Printer configuration removed)

        // Reiniciar polling de órdenes después de sincronizar (si había una orden activa)
        const currentState = store.getState();
        const {orderConfirmedApiId, orderConfirmed} = currentState.bag;

        if (orderConfirmed && orderConfirmedApiId) {
          console.log(
            '🔄 [SyncDataView] Reiniciando polling de orden después de sincronización',
          );
          setSyncronizingMessage('Reiniciando monitoreo de orden...');
        }
      } catch (error) {
        console.error('❌ [SyncDataView] Error en sincronización:', error);
        setSyncronizingMessage('Error al sincronizar datos');
        
        // Limpiar servicios en caso de error
        if (error.message?.includes('ProductService')) {
          console.log('🗑️ [SyncDataView] Limpiando ProductService por error');
          ProductService.clearData();
        }
        if (error.message?.includes('PromoBannerService')) {
          console.log('🗑️ [SyncDataView] Limpiando PromoBannerService por error');
          PromoBannerService.clearData();
        }
      } finally {
        setSyncronizing(false);
        setSyncronizingMessage('Datos sincronizados...');
        dispatch(setSyncronizingData(false));

        // Guardar fecha de última sincronización exitosa
        try {
          const syncDate = new Date().toISOString();
          dispatch(setLastSyncDate(syncDate));
          await StorageHelper.setLastSyncDate(syncDate);
          console.log('Fecha de última sincronización guardada:', syncDate);
        } catch (syncError) {
          console.error('Error guardando fecha de sincronización:', syncError);
        }
      }
    }

    fetchData();
  }, [isServiceConfigured]); // Depende de isServiceConfigured

  return (
    <View style={styles.container}>
      <Text style={styles.syncTitle}>{syncronizingMessage}</Text>
      {loaderActivity}
      
      {/* 🔥 RENDERIZADO INVISIBLE - Forzar descarga de imágenes */}
      {preloadImages.length > 0 && (
        <View style={{position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden'}}>
          {preloadImages.map((url, index) => (
            <FastImage
              key={index}
              source={{
                uri: url,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={{width: 1, height: 1}}
              resizeMode={FastImage.resizeMode.contain}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default SyncDataView;
