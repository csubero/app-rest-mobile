import {useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import apiClient from '../../services/api/apiClient';
import StorageHelper from '../../helpers/config/StorageHelper';
import ProductService from '../../services/api/ProductService';

// Importar actions de Redux
import {setPromotions} from '../../redux/slice/bagSlice';
import {setSilentSyncing, setApiToken} from '../../redux/slice/authSlice';
import {setBannerImage, setLastSyncDate} from '../../redux/slice/settingsSlice';
import {setPromotionBannersList} from '../../redux/slice/promotionSlice';
import {
  setCompanySelected,
  setPointOfSaleSelected,
  setStoreSelected,
} from '../../redux/slice/companySlice';
import {setServerIp} from '../../redux/slice/storeSlice';

export const useSilentSync = () => {
  const dispatch = useDispatch();

  // Selectors
  const {isSilentSyncing, apiToken: reduxApiToken} = useSelector(
    state => state.auth,
  );
  const {serverIp: reduxServerIp} = useSelector(state => state.store);
  const {companySelected, storeSelected, pointOfSaleSelected} = useSelector(
    state => state.company,
  );

  const performSilentSync = useCallback(async () => {
    if (isSilentSyncing) {
      console.log('[useSilentSync] Sincronización ya en progreso, saltando...');
      return;
    }

    // Tomar de Redux o de Storage si no existen
    let serverIp = reduxServerIp;
    let apiToken = reduxApiToken;

    if (!serverIp || !apiToken) {
      console.log(
        '[useSilentSync] No hay serverIp o apiToken en Redux, intentando obtener de Storage...',
      );
      const auth_info = await StorageHelper.getAuthInfo();
      serverIp = auth_info?.serverIp || null;
      apiToken = auth_info?.apiToken || null;

      // Guardar en Redux si se obtuvieron de Storage
      if (serverIp) {
        dispatch(setServerIp(serverIp));
      }
      if (apiToken) {
        dispatch(setApiToken(apiToken));
      }
    }

    if (!serverIp || !apiToken) {
      console.log(
        '[useSilentSync] No hay serverIp o apiToken ni en Redux ni en Storage, abortando sync',
      );
      return;
    }

    dispatch(setSilentSyncing(true));
    console.log('[useSilentSync] Iniciando sincronización silenciosa...');

    try {
      const productsUrl = 'products/actives/';
      const promotionsUrl = `promotions/${companySelected?.id}/list/`;

      // Sincronizar información de empresa, tienda y punto de venta
      if (companySelected?.id) {
        const companyResponse = await apiClient(serverIp, apiToken).get(
          `companies/${companySelected.id}/detail/`,
        );
        await StorageHelper.setCompanyInfo(companyResponse);
        dispatch(setCompanySelected(companyResponse));
      }

      if (storeSelected?.id) {
        const storeResponse = await apiClient(serverIp, apiToken).get(
          `stores/${storeSelected.id}/detail/`,
        );
        await StorageHelper.setStoreInfo(storeResponse);
        dispatch(setStoreSelected(storeResponse));
      }

      if (pointOfSaleSelected?.id) {
        const pointOfSaleResponse = await apiClient(serverIp, apiToken).get(
          `point-of-sales/${pointOfSaleSelected.id}/detail/`,
        );
        await StorageHelper.setPointOfSaleInfo(pointOfSaleResponse);
        dispatch(setPointOfSaleSelected(pointOfSaleResponse));
      }

      // 🚀 OPTIMIZACIÓN: Usar ProductService para sincronizar productos
      console.log('[useSilentSync] Configurando ProductService...');
      ProductService.configure(serverIp, apiToken);
      
      console.log('[useSilentSync] Obteniendo productos desde API...');
      const productResponse = await ProductService.fetchProducts();

      await StorageHelper.removeOldImages();
      await StorageHelper.removeProductImages();
      await StorageHelper.checkBannerDirectory();
      await StorageHelper.removeBannerImage();
      await StorageHelper.createProductImagesDirectory();
      await StorageHelper.removeProducts();
      await StorageHelper.setProducts(productResponse);

      // Sincronizar banner
      const bannerUrl = 'cms/banner/';
      const bannerResponse = await apiClient(serverIp, apiToken).get(bannerUrl);
      dispatch(setBannerImage(bannerResponse.image));

      // 🚀 OPTIMIZACIÓN: Obtener menús ya organizados desde ProductService
      const menuList = ProductService.getMenus();
      console.log('[useSilentSync] Menús obtenidos:', {
        count: menuList.length,
        withProducts: menuList.map(m => ({ id: m.id, name: m.name_es, products: m.products?.length || 0 }))
      });

      // Solo guardar en storage - ProductService ya maneja el estado interno y notifica via listeners
      await StorageHelper.setMenus(menuList);
      
      console.log('[useSilentSync] Productos y menús sincronizados exitosamente via ProductService');

      // Sincronizar promociones
      if (companySelected?.id) {
        const promotionsResponse = await apiClient(serverIp, apiToken).get(
          promotionsUrl,
        );
        await StorageHelper.setPromotions(promotionsResponse);
        dispatch(setPromotions(promotionsResponse));
      }

      // Sincronizar banners promocionales
      const promoBannerUrl = 'cms/promo-banners/';
      const promoBannerResponse = await apiClient(serverIp, apiToken).get(
        promoBannerUrl,
      );
      if (StorageHelper.setPromoBanners) {
        await StorageHelper.setPromoBanners(promoBannerResponse);
      }
      dispatch(setPromotionBannersList(promoBannerResponse));

      // (Printer configuration removed)

      // Guardar fecha de sincronización
      const syncDate = new Date().toISOString();
      dispatch(setLastSyncDate(syncDate));
      await StorageHelper.setLastSyncDate(syncDate);

      console.log(
        '[useSilentSync] Sincronización silenciosa completada exitosamente',
      );
    } catch (error) {
      console.error(
        '[useSilentSync] Error en sincronización silenciosa:',
        error,
      );
    } finally {
      dispatch(setSilentSyncing(false));
    }
  }, [
    isSilentSyncing,
    companySelected?.id,
    reduxServerIp,
    reduxApiToken,
    storeSelected?.id,
    pointOfSaleSelected?.id,
    dispatch,
  ]);

  return {
    isSilentSyncing,
    performSilentSync,
  };
};
