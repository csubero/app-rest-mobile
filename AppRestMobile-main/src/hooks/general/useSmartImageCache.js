import {useEffect, useCallback, useRef} from 'react';
import {AppState} from 'react-native';
import AdvancedImageCacheManager from '../helpers/config/AdvancedImageCacheManager';

/**
 * Hook personalizado para manejo inteligente de imágenes
 */
export const useSmartImageCache = () => {
  const appStateRef = useRef(AppState.currentState);
  const initializationRef = useRef(false);

  // Inicialización del cache manager
  useEffect(() => {
    if (!initializationRef.current) {
      console.log('🚀 [useSmartImageCache] Inicializando cache inteligente...');
      AdvancedImageCacheManager.initialize();
      initializationRef.current = true;
    }
  }, []);

  // Manear cambios en el estado de la app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 [useSmartImageCache] App en primer plano - optimizando caché...');
        // La app volvió al primer plano, buen momento para limpiar caché viejo
        AdvancedImageCacheManager.initialize();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('📱 [useSmartImageCache] App en segundo plano - pausando precarga...');
        // La app va al segundo plano, se puede pausar la precarga
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Función para precargar menús
  const preloadMenus = useCallback((menus) => {
    if (!menus || !Array.isArray(menus) || menus.length === 0) {
      return;
    }
    
    console.log(`🍽️ [useSmartImageCache] Precargando ${menus.length} menús...`);
    AdvancedImageCacheManager.preloadMenuImages(menus);
  }, []);

  // Función para precargar productos
  const preloadProducts = useCallback((products) => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return;
    }
    
    console.log(`🛒 [useSmartImageCache] Precargando ${products.length} productos...`);
    AdvancedImageCacheManager.preloadProductImages(products);
  }, []);

  // Función para priorizar imágenes visibles
  const prioritizeVisible = useCallback((visibleUrls) => {
    if (!visibleUrls || !Array.isArray(visibleUrls) || visibleUrls.length === 0) {
      return;
    }
    
    console.log(`👀 [useSmartImageCache] Priorizando ${visibleUrls.length} imágenes visibles...`);
    AdvancedImageCacheManager.prioritizeVisibleImages(visibleUrls);
  }, []);

  // Función para obtener estadísticas del caché
  const getCacheStats = useCallback(() => {
    const stats = AdvancedImageCacheManager.getCacheStats();
    console.log('📊 [useSmartImageCache] Estadísticas del caché:', stats);
    return stats;
  }, []);

  // Función para limpiar caché
  const clearCache = useCallback(async () => {
    console.log('🧹 [useSmartImageCache] Limpiando caché...');
    await AdvancedImageCacheManager.performAdvancedCleanup();
  }, []);

  // Función para verificar si una imagen está en caché
  const isImageCached = useCallback((url) => {
    return AdvancedImageCacheManager.isImageCached(url);
  }, []);

  return {
    preloadMenus,
    preloadProducts,
    prioritizeVisible,
    getCacheStats,
    clearCache,
    isImageCached,
  };
};

/**
 * Hook para precarga automática basada en navegación
 */
export const useAutoPreload = (currentData, nextDataGetter) => {
  const preloadTimeoutRef = useRef(null);

  useEffect(() => {
    if (!currentData) return;

    // Limpiar timeout anterior
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    // Precargar siguiente contenido después de un delay
    preloadTimeoutRef.current = setTimeout(() => {
      const nextData = nextDataGetter ? nextDataGetter(currentData) : null;
      
      if (nextData) {
        console.log('🔮 [useAutoPreload] Precargando siguiente contenido...');
        
        if (Array.isArray(nextData)) {
          // Es una lista de imágenes
          AdvancedImageCacheManager.intelligentPreload(nextData);
        } else if (nextData.menus) {
          // Es un objeto con menús
          AdvancedImageCacheManager.preloadMenuImages(nextData.menus);
        } else if (nextData.products) {
          // Es un objeto con productos
          AdvancedImageCacheManager.preloadProductImages(nextData.products);
        }
      }
    }, 1000); // Delay de 1 segundo para no interferir con la navegación actual

    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [currentData, nextDataGetter]);
};

export default {
  useSmartImageCache,
  useAutoPreload,
};