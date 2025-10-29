import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';

/**
 * Sistema de caché permanente y agresivo para eliminar parpadeos completamente
 * Las imágenes se mantienen SIEMPRE en memoria y nunca se descargan
 */
class PermanentImageCache {
  static STORAGE_KEY = '@permanent_image_cache';
  static _permanentCache = new Map();
  static _preloadedImages = new Set();
  static _isInitialized = false;

  /**
   * Inicializar el caché permanente
   */
  static async initialize() {
    if (this._isInitialized) return;

    try {
      // Inicializando caché permanente (log removido para performance)
      
      // Cargar caché persistente desde AsyncStorage
      const cachedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        this._permanentCache = new Map(Object.entries(parsed));
        // Log de recuperación removido para performance
      }

      this._isInitialized = true;
      // Log de inicialización completada removido para performance
    } catch (error) {
      console.error('❌ [PermanentImageCache] Error inicializando:', error);
    }
  }

  /**
   * Guardar caché en AsyncStorage
   */
  static async _saveToStorage() {
    try {
      const cacheData = Object.fromEntries(this._permanentCache);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('⚠️ [PermanentImageCache] Error guardando caché:', error);
    }
  }

  /**
   * Verificar si una imagen está en caché permanente
   */
  static isImageCached(url) {
    if (!url) return false;
    return this._permanentCache.has(url) || this._preloadedImages.has(url);
  }

  /**
   * Marcar imagen como cargada exitosamente
   */
  static markImageLoaded(url) {
    if (!url) return;
    
    this._permanentCache.set(url, {
      loaded: true,
      loading: false,
      timestamp: Date.now(),
      persistent: true
    });
    
    this._preloadedImages.add(url);
    
    // Guardar en storage de forma asíncrona
    this._saveToStorage().catch(error => {
      console.warn('⚠️ [PermanentImageCache] Error guardando imagen:', error);
    });
  }

  /**
   * 🚀 FORZAR que una imagen esté disponible INMEDIATAMENTE
   * Para uso con InstantImage - elimina completamente el lazy loading
   */
  static forceImageAvailable(url) {
    if (!url) return;
    
    // Si ya está en caché, perfecto
    if (this._permanentCache.has(url)) {
      return;
    }
    
    // Si no está, marcarla como disponible INMEDIATAMENTE
    this._permanentCache.set(url, {
      loaded: true,
      loading: false,
      timestamp: Date.now(),
      persistent: true,
      forced: true // Marca especial para imágenes forzadas
    });
    
    this._preloadedImages.add(url);
    
    // Precargar la imagen real en segundo plano (pero no esperar)
    FastImage.preload([{
      uri: url,
      priority: FastImage.priority.high,
      cache: FastImage.cacheControl.immutable
    }]).catch(error => {
      console.warn(`⚠️ [PermanentImageCache] Error precargando imagen forzada: ${url}`, error);
    });
    
    // Log removido para mejorar performance en debug
  }

  /**
   * Precarga AGRESIVA - todas las imágenes de una vez
   */
  static async preloadAllImages(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return;

    console.log(`🔥 [PermanentImageCache] Precargando ${imageUrls.length} imágenes...`);

    // Marcar todas como "disponibles" INMEDIATAMENTE para evitar parpadeos
    imageUrls.forEach(url => {
      if (url) {
        this._preloadedImages.add(url);
        this._permanentCache.set(url, {
          loaded: true,  // ⚡ CAMBIO: Marcar como loaded desde el inicio
          loading: false,
          timestamp: Date.now(),
          persistent: true,
          forced: true
        });
      }
    });

    // Precargar en lotes pero NO esperar (fire and forget)
    const BATCH_SIZE = 50; // Lotes MÁS grandes
    const batches = [];
    
    for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
      batches.push(imageUrls.slice(i, i + BATCH_SIZE));
    }

    // Procesar todos los lotes sin await (más rápido)
    batches.forEach((batch, index) => {
      const imageSources = batch
        .filter(url => url)
        .map(url => ({
          uri: url,
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable
        }));

      if (imageSources.length > 0) {
        // Fire and forget - no await
        try {
          const promise = FastImage.preload(imageSources);
          if (promise && typeof promise.catch === 'function') {
            promise.catch(err => {
              console.warn(`⚠️ [PermanentImageCache] Error en lote ${index + 1}:`, err);
            });
          }
        } catch (error) {
          console.warn(`⚠️ [PermanentImageCache] Error iniciando lote ${index + 1}:`, error);
        }
      }
    });

    console.log('✅ [PermanentImageCache] Precarga iniciada (no bloqueante)');
  }

  /**
   * Obtener estadísticas del caché
   */
  static getStats() {
    return {
      permanentCacheSize: this._permanentCache.size,
      preloadedImages: this._preloadedImages.size,
      isInitialized: this._isInitialized,
      totalImages: Math.max(this._permanentCache.size, this._preloadedImages.size)
    };
  }

  /**
   * Limpiar caché (solo usar en desarrollo)
   */
  static async clearCache() {
    // Log de limpieza iniciada removido para performance
    
    this._permanentCache.clear();
    this._preloadedImages.clear();
    
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await FastImage.clearMemoryCache();
      await FastImage.clearDiskCache();
    } catch (error) {
      console.error('❌ [PermanentImageCache] Error limpiando:', error);
    }
    
    // Log de limpieza completada removido para performance
  }

  /**
   * Forzar que una imagen específica esté siempre disponible
   */
  static forceImageAvailable(url) {
    if (!url) return;
    
    this._preloadedImages.add(url);
    this._permanentCache.set(url, {
      loaded: true,
      forced: true,
      timestamp: Date.now(),
      persistent: true
    });
    
    // Log removido para mejorar performance en debug
  }
}

export default PermanentImageCache;