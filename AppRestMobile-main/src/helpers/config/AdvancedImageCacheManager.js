import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Manager avanzado para caché de imágenes con persistencia y optimizaciones
 */
class AdvancedImageCacheManager {
  static CACHE_KEY_PREFIX = '@image_cache_';
  static CACHE_META_KEY = '@image_cache_meta';
  static CACHE_VERSION = '1.1'; // Incrementado por cambio de duración de caché
  static MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  static MAX_CACHE_AGE = 1 * 60 * 60 * 1000; // 1 hora - Optimizado para contenido fresco
  static PRELOAD_BATCH_SIZE = 10;
  
  static _cacheMetadata = new Map();
  static _preloadQueue = [];
  static _isPreloading = false;
  static _memoryCache = new Map();

  /**
   * Inicializa el cache manager
   */
  static async initialize() {
    try {
      await this._loadCacheMetadata();
      await this._cleanExpiredEntries();
      console.log('📦 [AdvancedImageCacheManager] Inicializado correctamente');
    } catch (error) {
      console.error('❌ [AdvancedImageCacheManager] Error en inicialización:', error);
    }
  }

  /**
   * Carga los metadatos del caché desde AsyncStorage
   */
  static async _loadCacheMetadata() {
    try {
      const metadataStr = await AsyncStorage.getItem(this.CACHE_META_KEY);
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        this._cacheMetadata = new Map(Object.entries(metadata));
      }
    } catch (error) {
      console.warn('⚠️ [AdvancedImageCacheManager] Error cargando metadatos:', error);
    }
  }

  /**
   * Guarda los metadatos del caché
   */
  static async _saveCacheMetadata() {
    try {
      const metadata = Object.fromEntries(this._cacheMetadata);
      await AsyncStorage.setItem(this.CACHE_META_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.warn('⚠️ [AdvancedImageCacheManager] Error guardando metadatos:', error);
    }
  }

  /**
   * Limpia entradas expiradas del caché
   */
  static async _cleanExpiredEntries() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [url, metadata] of this._cacheMetadata) {
      if (now - metadata.timestamp > this.MAX_CACHE_AGE) {
        expiredKeys.push(url);
      }
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 [AdvancedImageCacheManager] Limpiando ${expiredKeys.length} entradas expiradas (caché de 1 hora)`);
      for (const key of expiredKeys) {
        this._cacheMetadata.delete(key);
        this._memoryCache.delete(key);
      }
      await this._saveCacheMetadata();
    }
  }

  /**
   * Registra una imagen en el caché
   */
  static async _registerImageInCache(url, size = 0) {
    const metadata = {
      timestamp: Date.now(),
      size,
      hits: (this._cacheMetadata.get(url)?.hits || 0) + 1,
      version: this.CACHE_VERSION
    };
    
    this._cacheMetadata.set(url, metadata);
    await this._saveCacheMetadata();
  }

  /**
   * Obtiene props optimizadas para FastImage
   */
  static getOptimizedImageProps(imageUrl, priority = FastImage.priority.normal, options = {}) {
    const {
      fallbackUrl = 'https://dunkin-ar.s3.amazonaws.com/images/Fresh_beef_burger_isolated_-1_Background_Removed.png',
      resizeMode = FastImage.resizeMode.contain,
      cacheControl = FastImage.cacheControl.immutable
    } = options;

    // Registrar acceso para estadísticas
    this._registerImageInCache(imageUrl).catch(() => {});

    return {
      source: {
        uri: imageUrl || fallbackUrl,
        priority,
        cache: cacheControl,
      },
      resizeMode,
      fallback: true,
      onLoad: () => this._onImageLoad(imageUrl),
      onError: (error) => this._onImageError(imageUrl, error),
    };
  }

  /**
   * Callback cuando una imagen se carga exitosamente
   */
  static _onImageLoad(url) {
    this._memoryCache.set(url, { loaded: true, timestamp: Date.now() });
    console.log(`✅ [AdvancedImageCacheManager] Imagen cargada: ${url.substring(0, 50)}...`);
  }

  /**
   * Callback cuando hay error al cargar una imagen
   */
  static _onImageError(url, error) {
    console.warn(`❌ [AdvancedImageCacheManager] Error cargando imagen: ${url.substring(0, 50)}...`, error);
    this._memoryCache.set(url, { loaded: false, error: true });
  }

  /**
   * Precarga inteligente con prioridades
   */
  static intelligentPreload(images, priority = FastImage.priority.low) {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return;
    }

    // Filtrar imágenes ya en memoria
    const imagesToPreload = images
      .filter(img => img && typeof img === 'string')
      .filter(img => !this._memoryCache.has(img))
      .map(img => ({ uri: img, priority }));

    if (imagesToPreload.length === 0) {
      console.log('📦 [AdvancedImageCacheManager] Todas las imágenes ya están en caché');
      return;
    }

    // Añadir a la cola de precarga
    this._preloadQueue.push(...imagesToPreload);
    this._processPreloadQueue();

    console.log(`🚀 [AdvancedImageCacheManager] Agregadas ${imagesToPreload.length} imágenes a precarga`);
  }

  /**
   * Procesa la cola de precarga en lotes
   */
  static async _processPreloadQueue() {
    if (this._isPreloading || this._preloadQueue.length === 0) {
      return;
    }

    this._isPreloading = true;

    try {
      while (this._preloadQueue.length > 0) {
        const batch = this._preloadQueue.splice(0, this.PRELOAD_BATCH_SIZE);
        
        console.log(`⏳ [AdvancedImageCacheManager] Precargando lote de ${batch.length} imágenes`);
        
        await FastImage.preload(batch);
        
        // Marcar imágenes como precargadas
        batch.forEach(img => {
          this._memoryCache.set(img.uri, { preloaded: true, timestamp: Date.now() });
        });

        // Pequeña pausa entre lotes para no bloquear la UI
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('❌ [AdvancedImageCacheManager] Error en precarga:', error);
    } finally {
      this._isPreloading = false;
    }
  }

  /**
   * Precarga imágenes de menús con prioridad alta (modo agresivo para carga instantánea)
   */
  static preloadMenuImages(menus) {
    if (!menus || !Array.isArray(menus)) {
      return;
    }

    const menuImages = menus
      .filter(menu => menu?.image)
      .map(menu => ({
        uri: menu.image,
        priority: FastImage.priority.high,
        cache: FastImage.cacheControl.immutable,
      }));

    console.log(`🍽️ [AdvancedImageCacheManager] Precargando ${menuImages.length} imágenes de menús (modo agresivo)`);
    
    // Precarga inmediata sin cola - más agresivo
    if (menuImages.length > 0) {
      FastImage.preload(menuImages);
      
      // Marcar como precargadas inmediatamente
      menuImages.forEach(img => {
        this._memoryCache.set(img.uri, { 
          preloaded: true, 
          timestamp: Date.now() 
        });
      });
    }
  }

  /**
   * Método público para registrar una imagen que ya está disponible (para InstantImage)
   */
  static registerImageLoaded(url) {
    if (!url) return;
    
    this._memoryCache.set(url, { 
      loaded: true, 
      timestamp: Date.now() 
    });
    
    // También registrar en metadata para persistencia
    this._registerImageInCache(url).catch(() => {});
  }

  /**
   * Método público para verificar si una imagen está en cache
   */
  static isImageCached(url) {
    if (!url) return false;
    return this._memoryCache.has(url) && this._memoryCache.get(url)?.loaded;
  }

  /**
   * Precarga imágenes de productos con prioridad normal
   */
  static preloadProductImages(products) {
    if (!products || !Array.isArray(products)) {
      return;
    }

    const productImages = products
      .filter(product => product?.image_url)
      .map(product => product.image_url);

    console.log(`🛒 [AdvancedImageCacheManager] Precargando ${productImages.length} imágenes de productos`);
    this.intelligentPreload(productImages, FastImage.priority.normal);
  }

  /**
   * Limpieza avanzada del caché
   */
  static async performAdvancedCleanup() {
    try {
      console.log('🧹 [AdvancedImageCacheManager] Iniciando limpieza avanzada...');
      
      // Limpiar caché de FastImage
      await FastImage.clearMemoryCache();
      await FastImage.clearDiskCache();
      
      // Limpiar caché local
      this._memoryCache.clear();
      this._cacheMetadata.clear();
      
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem(this.CACHE_META_KEY);
      
      console.log('✅ [AdvancedImageCacheManager] Limpieza completada');
    } catch (error) {
      console.error('❌ [AdvancedImageCacheManager] Error en limpieza:', error);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  static getCacheStats() {
    return {
      memoryEntries: this._memoryCache.size,
      metadataEntries: this._cacheMetadata.size,
      queueLength: this._preloadQueue.length,
      isPreloading: this._isPreloading,
      version: this.CACHE_VERSION
    };
  }

  /**
   * Verifica si una imagen está en caché
   */
  static isImageCached(url) {
    return this._memoryCache.has(url) || this._cacheMetadata.has(url);
  }

  /**
   * Prioriza la precarga de imágenes visibles
   */
  static prioritizeVisibleImages(visibleUrls) {
    if (!visibleUrls || !Array.isArray(visibleUrls)) {
      return;
    }

    const highPriorityImages = visibleUrls
      .filter(url => !this.isImageCached(url))
      .map(url => ({ uri: url, priority: FastImage.priority.high }));

    if (highPriorityImages.length > 0) {
      // Insertar al inicio de la cola para procesamiento inmediato
      this._preloadQueue.unshift(...highPriorityImages);
      this._processPreloadQueue();
    }
  }
}

export default AdvancedImageCacheManager;