import FastImage from 'react-native-fast-image';

/**
 * Helper para manejar el caché de imágenes
 */
class ImageCacheHelper {
  /**
   * Precarga una lista de imágenes en el caché
   * @param {Array} imageUrls - Array de URLs de imágenes
   */
  static preloadImages(imageUrls) {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return;
    }

    const imagesToPreload = imageUrls
      .filter(url => url && typeof url === 'string')
      .map(url => ({
        uri: url,
        priority: FastImage.priority.normal,
      }));

    if (imagesToPreload.length > 0) {
      FastImage.preload(imagesToPreload);
    }
  }

  /**
   * Precarga imágenes de productos
   * @param {Array} products - Array de productos con image_url
   */
  static preloadProductImages(products) {
    if (!products || !Array.isArray(products)) {
      return;
    }

    const imageUrls = products
      .filter(product => product?.image_url)
      .map(product => product.image_url);

    this.preloadImages(imageUrls);
  }

  /**
   * Limpia el caché de imágenes
   */
  static clearCache() {
    FastImage.clearMemoryCache();
    FastImage.clearDiskCache();
  }

  /**
   * Obtiene el tamaño del caché en disco
   * @returns {Promise<number>} Tamaño en bytes
   */
  static async getCacheSize() {
    try {
      return await FastImage.getCachePath();
    } catch (error) {
      console.warn('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Configuración optimizada para imágenes de producto
   * @deprecated Usar AdvancedImageCacheManager.getOptimizedImageProps() en su lugar
   */
  static getProductImageProps(imageUrl, priority = FastImage.priority.normal) {
    console.warn('⚠️ ImageCacheHelper.getProductImageProps está deprecated. Usa AdvancedImageCacheManager.getOptimizedImageProps()');
    return {
      source: {
        uri: imageUrl || 'https://placehold.co/950x950.png',
        priority: priority,
      },
      resizeMode: FastImage.resizeMode.contain,
      cache: FastImage.cacheControl.immutable,
      fallback: true,
    };
  }

  /**
   * Migración automática a AdvancedImageCacheManager
   */
  static migrateToAdvanced() {
    console.log('🔄 Migrando a AdvancedImageCacheManager...');
    // Importar dinámicamente para evitar dependencias circulares
    import('./AdvancedImageCacheManager').then(module => {
      const AdvancedImageCacheManager = module.default;
      AdvancedImageCacheManager.initialize();
    });
  }
}

export default ImageCacheHelper;
