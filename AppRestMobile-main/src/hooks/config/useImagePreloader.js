import {useEffect, useRef} from 'react';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';

/**
 * Hook para precarga de imágenes con cache inteligente
 * ✅ Migrado a AdvancedImageCacheManager para mejor rendimiento
 */
const useImagePreloader = (products, options = {}) => {
  const {
    enabled = true,
    delay = 100, // Delay para evitar bloquear el hilo principal
  } = options;

  const preloadedRef = useRef(new Set());

  useEffect(() => {
    if (!enabled || !products || products.length === 0) {
      return;
    }

    // Crear un identificador único para esta lista de productos
    const productIds = products
      .map(p => p.id)
      .sort()
      .join(',');

    // Si ya precargamos estas imágenes, no lo hacemos de nuevo
    if (preloadedRef.current.has(productIds)) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        // ✅ Usar el nuevo manager con precarga inteligente
        AdvancedImageCacheManager.preloadProductImages(products);
        preloadedRef.current.add(productIds);
        console.log(`🚀 [useImagePreloader] Precargados ${products.length} productos`);
      } catch (error) {
        console.warn('Error preloading images:', error);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [products, enabled, delay]);

  // Función para limpiar el caché manualmente con limpieza avanzada
  const clearCache = async () => {
    preloadedRef.current.clear();
    await AdvancedImageCacheManager.performAdvancedCleanup();
    console.log('🧹 [useImagePreloader] Caché limpiado');
  };

  // Función para obtener estadísticas del caché
  const getCacheStats = () => {
    return AdvancedImageCacheManager.getCacheStats();
  };

  return {
    clearCache,
    getCacheStats,
  };
};

export default useImagePreloader;
