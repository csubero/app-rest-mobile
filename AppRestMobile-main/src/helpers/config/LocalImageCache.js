import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 🚀 Sistema de caché de imágenes LOCAL
 * Descarga y almacena imágenes en el dispositivo para acceso instantáneo
 * Esto elimina completamente la necesidad de descargar imágenes repetidamente
 */
class LocalImageCache {
  static CACHE_DIR = `${RNFS.DocumentDirectoryPath}/imageCache`;
  static METADATA_KEY = '@local_image_cache_metadata';
  static metadata = new Map(); // url -> localPath

  /**
   * Inicializar el caché local
   */
  static async initialize() {
    try {
      // Crear directorio de caché si no existe
      const exists = await RNFS.exists(this.CACHE_DIR);
      if (!exists) {
        await RNFS.mkdir(this.CACHE_DIR);
        console.log('📁 [LocalImageCache] Directorio creado:', this.CACHE_DIR);
      }

      // Cargar metadata del caché
      const metadataJson = await AsyncStorage.getItem(this.METADATA_KEY);
      if (metadataJson) {
        const metadataObj = JSON.parse(metadataJson);
        this.metadata = new Map(Object.entries(metadataObj));
        console.log(`✅ [LocalImageCache] Metadata cargada: ${this.metadata.size} imágenes`);
      }

      return true;
    } catch (error) {
      console.error('❌ [LocalImageCache] Error inicializando:', error);
      return false;
    }
  }

  /**
   * Generar nombre de archivo único basado en URL
   */
  static _getFileName(url) {
    // Usar hash simple de la URL para nombre único
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hashStr = Math.abs(hash).toString(36);
    const extension = url.split('.').pop().split('?')[0] || 'jpg';
    return `${hashStr}.${extension}`;
  }

  /**
   * Obtener ruta local de una imagen (si existe)
   */
  static getLocalPath(url) {
    if (!url) return null;
    return this.metadata.get(url) || null;
  }

  /**
   * Verificar si una imagen está cacheada localmente
   */
  static async isImageCached(url) {
    const localPath = this.getLocalPath(url);
    if (!localPath) return false;

    try {
      const exists = await RNFS.exists(localPath);
      return exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Descargar y cachear una imagen localmente
   */
  static async downloadAndCache(url) {
    if (!url) return null;

    try {
      // Verificar si ya está cacheada
      const existingPath = this.getLocalPath(url);
      if (existingPath) {
        const exists = await RNFS.exists(existingPath);
        if (exists) {
          return existingPath;
        }
      }

      // Descargar imagen
      const fileName = this._getFileName(url);
      const localPath = `${this.CACHE_DIR}/${fileName}`;

      console.log(`⬇️ [LocalImageCache] Descargando: ${url.substring(0, 50)}...`);

      await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
      }).promise;

      // Guardar metadata
      this.metadata.set(url, localPath);
      await this._saveMetadata();

      console.log(`✅ [LocalImageCache] Cacheada: ${fileName}`);
      return localPath;

    } catch (error) {
      console.error(`❌ [LocalImageCache] Error descargando ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Descargar múltiples imágenes en lotes
   */
  static async downloadBatch(urls, batchSize = 5) {
    if (!urls || urls.length === 0) return [];

    const results = [];
    const uniqueUrls = [...new Set(urls.filter(url => url))];

    console.log(`🔥 [LocalImageCache] Descargando ${uniqueUrls.length} imágenes en lotes de ${batchSize}...`);

    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(url => 
        this.downloadAndCache(url).catch(err => {
          console.warn(`⚠️ [LocalImageCache] Error en URL: ${url}`, err.message);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Log progreso
      const progress = Math.min(i + batchSize, uniqueUrls.length);
      console.log(`📊 [LocalImageCache] Progreso: ${progress}/${uniqueUrls.length}`);
    }

    console.log(`✅ [LocalImageCache] Descarga completada: ${results.filter(r => r).length}/${uniqueUrls.length} exitosas`);
    return results;
  }

  /**
   * Guardar metadata en AsyncStorage
   */
  static async _saveMetadata() {
    try {
      const metadataObj = Object.fromEntries(this.metadata);
      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadataObj));
    } catch (error) {
      console.error('❌ [LocalImageCache] Error guardando metadata:', error);
    }
  }

  /**
   * Limpiar caché (eliminar todas las imágenes)
   */
  static async clearCache() {
    try {
      const exists = await RNFS.exists(this.CACHE_DIR);
      if (exists) {
        await RNFS.unlink(this.CACHE_DIR);
        await RNFS.mkdir(this.CACHE_DIR);
      }

      this.metadata.clear();
      await AsyncStorage.removeItem(this.METADATA_KEY);

      console.log('🗑️ [LocalImageCache] Caché limpiado');
      return true;
    } catch (error) {
      console.error('❌ [LocalImageCache] Error limpiando caché:', error);
      return false;
    }
  }

  /**
   * Obtener tamaño del caché en MB
   */
  static async getCacheSize() {
    try {
      const exists = await RNFS.exists(this.CACHE_DIR);
      if (!exists) return 0;

      const files = await RNFS.readDir(this.CACHE_DIR);
      const totalSize = files.reduce((sum, file) => sum + parseInt(file.size || 0), 0);
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

      return parseFloat(sizeInMB);
    } catch (error) {
      console.error('❌ [LocalImageCache] Error obteniendo tamaño:', error);
      return 0;
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  static async getStats() {
    const size = await this.getCacheSize();
    return {
      totalImages: this.metadata.size,
      cacheSizeMB: size,
      cacheDir: this.CACHE_DIR,
    };
  }

  /**
   * 🧹 Eliminar imágenes obsoletas (que ya no están en la lista de URLs actuales)
   * @param {Array<string>} currentUrls - Lista de URLs que deben mantenerse
   * @returns {Promise<number>} Cantidad de imágenes eliminadas
   */
  static async removeObsoleteImages(currentUrls) {
    try {
      const currentUrlsSet = new Set(currentUrls);
      const cachedUrls = Array.from(this.metadata.keys());
      
      let removedCount = 0;
      
      for (const cachedUrl of cachedUrls) {
        // Si la URL cacheada NO está en las URLs actuales, eliminarla
        if (!currentUrlsSet.has(cachedUrl)) {
          const localPath = this.metadata.get(cachedUrl);
          if (localPath) {
            try {
              const exists = await RNFS.exists(localPath);
              if (exists) {
                await RNFS.unlink(localPath);
                removedCount++;
                console.log(`🗑️ [LocalImageCache] Eliminada: ${localPath}`);
              }
            } catch (error) {
              console.warn(`⚠️ [LocalImageCache] No se pudo eliminar: ${localPath}`, error.message);
            }
          }
          
          // Remover de metadata
          this.metadata.delete(cachedUrl);
        }
      }
      
      // Guardar metadata actualizada si hubo cambios
      if (removedCount > 0) {
        await this._saveMetadata();
      }
      
      return removedCount;
    } catch (error) {
      console.error('❌ [LocalImageCache] Error eliminando imágenes obsoletas:', error);
      return 0;
    }
  }
}

export default LocalImageCache;
