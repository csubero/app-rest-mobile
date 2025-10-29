import apiClient from './apiClient';
import PermanentImageCache from '../../helpers/config/PermanentImageCache';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';
import LocalImageCache from '../../helpers/config/LocalImageCache';
import PromoBannerService from './PromoBannerService';
import FastImage from 'react-native-fast-image';

/**
 * Servicio Singleton para gestionar productos
 * Mantiene los productos en memoria y proporciona métodos para acceder y actualizar los datos
 */
class ProductService {
  constructor() {
    if (ProductService.instance) {
      return ProductService.instance;
    }
    
    this.products = [];
    this.menus = [];
    this.lastSyncDate = null;
    this.isLoading = false;
    this.localImagesReady = false; // 🆕 Bandera para saber si las imágenes locales están listas
    this.serverIp = null;
    this.apiToken = null;
    this.listeners = []; // Para notificar cambios a los componentes
    
    ProductService.instance = this;
  }

  /**
   * Configura las credenciales para las peticiones al API
   * @param {string} serverIp - IP del servidor
   * @param {string} apiToken - Token de autenticación
   */
  configure(serverIp, apiToken) {
    console.log('🔧 [ProductService.configure] Configurando con:', {
      serverIp: serverIp ? '✅ Present' : '❌ Missing',
      apiToken: apiToken ? '✅ Present' : '❌ Missing',
    });
    
    if (!serverIp || !apiToken) {
      console.error('❌ [ProductService.configure] Credenciales inválidas');
      throw new Error('ServerIp y apiToken son requeridos');
    }
    
    this.serverIp = serverIp;
    this.apiToken = apiToken;
    
    console.log('✅ [ProductService.configure] Configuración completada:', {
      serverIp: this.serverIp ? 'OK' : 'FAIL',
      apiToken: this.apiToken ? 'OK' : 'FAIL',
    });
  }

  /**
   * Obtiene los productos activos desde el API y los almacena en memoria
   * @returns {Promise<Array>} Lista de productos activos
   */
  async fetchProducts() {
    console.log('📡 [ProductService.fetchProducts] Verificando configuración:', {
      serverIp: this.serverIp || 'NOT SET',
      hasToken: !!this.apiToken,
    });
    
    if (!this.serverIp || !this.apiToken) {
      console.error('❌ [ProductService.fetchProducts] Servicio no configurado');
      throw new Error('ProductService no está configurado. Llama a configure() primero.');
    }

    this.isLoading = true;

    try {
      const productsUrl = 'products/actives/';
      const productResponse = await apiClient(
        this.serverIp,
        this.apiToken,
      ).get(productsUrl);

      // Almacenar productos en memoria
      this.products = productResponse;

      // Generar lista de menús/categorías a partir de los productos
      const menuList = productResponse.reduce((acc, product) => {
        const existingCategory = acc.find(
          category => category.id === product.section.id,
        );

        if (existingCategory) {
          // Si la categoría ya existe, agregar el producto a su lista
          existingCategory.products.push(product);
        } else {
          // Si es una nueva categoría, crearla con el producto
          acc.push({
            ...product.section,
            products: [product]
          });
        }
        
        return acc;
      }, []);

      // Ordenar menús por orden
      menuList.sort((a, b) => a.order - b.order);
      this.menus = menuList;

      // Actualizar fecha de última sincronización
      this.lastSyncDate = new Date().toISOString();

      console.log('✅ Productos sincronizados exitosamente:', this.products.length);
      
      // 🚀 NUEVO: Descargar imágenes localmente para acceso instantáneo
      await this._downloadImagesLocally();
      
      // ✅ Marcar que las imágenes locales están listas
      this.localImagesReady = true;
      
      console.log('✅ [ProductService] Imágenes locales listas, notificando a listeners...');
      
      // Notificar a los listeners que hay nuevos productos con imágenes locales
      this.notifyListeners();
      
      return this.products;
    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Obtiene todos los productos almacenados en memoria
   * @returns {Array} Lista de productos
   */
  getProducts() {
    return this.products;
  }

  /**
   * Obtiene un producto por su ID
   * @param {number|string} productId - ID del producto
   * @returns {Object|null} Producto encontrado o null
   */
  getProductById(productId) {
    return this.products.find(product => product.id === productId) || null;
  }

  /**
   * Obtiene productos filtrados por categoría/sección
   * @param {number|string} sectionId - ID de la sección
   * @returns {Array} Lista de productos filtrados
   */
  getProductsBySection(sectionId) {
    // Optimización: buscar directamente en el menú que ya tiene los productos organizados
    const menu = this.menus.find(menu => menu.id === sectionId);
    return menu ? menu.products : [];
  }

  /**
   * Obtiene las categorías/menús
   * @returns {Array} Lista de menús
   */
  getMenus() {
    return this.menus;
  }

  /**
   * Busca productos por nombre (en español e inglés)
   * @param {string} searchTerm - Término de búsqueda
   * @param {string} language - Idioma ('es' o 'en'), por defecto busca en ambos
   * @returns {Array} Lista de productos que coinciden con la búsqueda
   */
  searchProducts(searchTerm, language = null) {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.products;
    }

    const term = searchTerm.toLowerCase();
    return this.products.filter(product => {
      const nameEs = product.name_es?.toLowerCase() || '';
      const nameEn = product.name_en?.toLowerCase() || '';
      const descEs = product.description_es?.toLowerCase() || '';
      const descEn = product.description_en?.toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';

      if (language === 'es') {
        return nameEs.includes(term) || descEs.includes(term) || sku.includes(term);
      } else if (language === 'en') {
        return nameEn.includes(term) || descEn.includes(term) || sku.includes(term);
      }

      // Buscar en todos los campos
      return (
        nameEs.includes(term) ||
        nameEn.includes(term) ||
        descEs.includes(term) ||
        descEn.includes(term) ||
        sku.includes(term)
      );
    });
  }

  /**
   * Verifica si hay productos cargados
   * @returns {boolean} True si hay productos, false en caso contrario
   */
  hasProducts() {
    return this.products.length > 0;
  }

  /**
   * Obtiene la fecha de última sincronización
   * @returns {string|null} Fecha en formato ISO o null
   */
  getLastSyncDate() {
    return this.lastSyncDate;
  }

  /**
   * Verifica si se está cargando información
   * @returns {boolean} True si está cargando, false en caso contrario
   */
  isProductsLoading() {
    return this.isLoading;
  }

  /**
   * Limpia todos los datos almacenados
   */
  clearData() {
    this.products = [];
    this.menus = [];
    this.lastSyncDate = null;
    console.log('🗑️ Datos de productos limpiados');
  }

  /**
   * Actualiza un producto específico en memoria
   * @param {number|string} productId - ID del producto
   * @param {Object} updatedData - Datos actualizados del producto
   */
  updateProduct(productId, updatedData) {
    const index = this.products.findIndex(product => product.id === productId);
    if (index !== -1) {
      this.products[index] = {...this.products[index], ...updatedData};
      console.log(`✅ Producto ${productId} actualizado`);
    }
  }

  /**
   * Obtiene productos disponibles (no agotados)
   * @returns {Array} Lista de productos disponibles
   */
  getAvailableProducts() {
    return this.products.filter(product => product.is_active !== false);
  }

  /**
   * Obtiene productos por familia
   * @param {number|string} familyId - ID de la familia
   * @returns {Array} Lista de productos filtrados
   */
  getProductsByFamily(familyId) {
    return this.products.filter(product => product.family?.id === familyId);
  }

  /**
   * Obtiene productos por menú
   * @param {number|string} menuId - ID del menú
   * @returns {Array} Lista de productos filtrados
   */
  getProductsByMenu(menuId) {
    return this.products.filter(product => product.menu?.id === menuId);
  }

  /**
   * Obtiene un producto por SKU
   * @param {string} sku - SKU del producto
   * @returns {Object|null} Producto encontrado o null
   */
  getProductBySku(sku) {
    return this.products.find(product => product.sku === sku) || null;
  }

  /**
   * Obtiene productos con grupos de categorías
   * @returns {Array} Lista de productos que tienen grupos de categorías
   */
  getProductsWithCategoryGroups() {
    return this.products.filter(product => product.has_category_groups === true);
  }

  /**
   * Obtiene productos con customizaciones
   * @returns {Array} Lista de productos que tienen customizaciones disponibles
   */
  getProductsWithCustomizations() {
    return this.products.filter(
      product => product.customizations && product.customizations.length > 0
    );
  }

  /**
   * Obtiene productos por rango de precio
   * @param {number} minPrice - Precio mínimo
   * @param {number} maxPrice - Precio máximo
   * @returns {Array} Lista de productos en el rango de precio
   */
  getProductsByPriceRange(minPrice, maxPrice) {
    return this.products.filter(
      product => product.price >= minPrice && product.price <= maxPrice
    );
  }

  /**
   * Obtiene productos ordenados por precio
   * @param {string} order - 'asc' o 'desc'
   * @returns {Array} Lista de productos ordenados
   */
  getProductsSortedByPrice(order = 'asc') {
    const sorted = [...this.products];
    return sorted.sort((a, b) => {
      return order === 'asc' ? a.price - b.price : b.price - a.price;
    });
  }

  /**
   * Obtiene productos con descuento
   * @returns {Array} Lista de productos con descuento
   */
  getDiscountedProducts() {
    return this.products.filter(
      product => product.price < product.full_price && product.full_price > 0
    );
  }

  /**
   * Obtiene el porcentaje de descuento de un producto
   * @param {number|string} productId - ID del producto
   * @returns {number} Porcentaje de descuento (0 si no tiene)
   */
  getProductDiscountPercentage(productId) {
    const product = this.getProductById(productId);
    if (!product || !product.full_price || product.full_price === 0) {
      return 0;
    }
    const discount = ((product.full_price - product.price) / product.full_price) * 100;
    return Math.round(discount * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Obtiene familias únicas de productos
   * @returns {Array} Lista de familias
   */
  getFamilies() {
    const familiesMap = new Map();
    this.products.forEach(product => {
      if (product.family && product.family.id) {
        familiesMap.set(product.family.id, product.family);
      }
    });
    const families = Array.from(familiesMap.values());
    return families.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Obtiene productos recomendados para un producto específico
   * @param {number|string} productId - ID del producto
   * @returns {Array} Lista de productos recomendados
   */
  getRecommendedProducts(productId) {
    const product = this.getProductById(productId);
    if (!product || !product.recommended_products) {
      return [];
    }
    
    // Manejar tanto IDs como objetos de recomendaciones
    return product.recommended_products
      .map(rec => {
        if (typeof rec === 'object' && rec.sku) {
          // Si es un objeto con SKU, obtener el producto completo por SKU
          return this.getProductBySku(rec.sku);
        } else if (typeof rec === 'number' || typeof rec === 'string') {
          // Si es un ID, obtener por ID
          return this.getProductById(rec);
        }
        return null;
      })
      .filter(p => p !== null);
  }

  /**
   * Obtiene estadísticas de los productos
   * @returns {Object} Objeto con estadísticas
   */
  getProductsStats() {
    const discounted = this.getDiscountedProducts();
    const withCustomizations = this.getProductsWithCustomizations();
    const families = this.getFamilies();
    
    return {
      total: this.products.length,
      active: this.getAvailableProducts().length,
      categories: this.menus.length,
      families: families.length,
      withDiscounts: discounted.length,
      withCustomizations: withCustomizations.length,
      lastSync: this.lastSyncDate,
    };
  }

  /**
   * Suscribe un listener para recibir notificaciones cuando cambien los productos
   * @param {Function} listener - Función callback que se ejecutará cuando cambien los productos
   * @returns {Function} Función para desuscribirse
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      console.error('❌ [ProductService.subscribe] El listener debe ser una función');
      return () => {};
    }
    
    this.listeners.push(listener);
    console.log('🔔 [ProductService.subscribe] Listener agregado:', {
      totalListeners: this.listeners.length,
      productsAvailable: this.products.length,
      willCallImmediately: this.products.length > 0,
    });
    
    // Llamar inmediatamente al listener si ya hay productos
    if (this.products.length > 0) {
      console.log('✅ [ProductService.subscribe] Llamando listener inmediatamente con', this.products.length, 'productos');
      try {
        // 🔑 CRÍTICO: Pasar una copia nueva del array, no la referencia
        listener([...this.products]);
      } catch (error) {
        console.error('❌ [ProductService.subscribe] Error en callback inmediato:', error);
      }
    } else {
      console.log('⏳ [ProductService.subscribe] Sin productos aún, listener esperará notificación');
    }
    
    // Retornar función para desuscribirse
    return () => {
      this.unsubscribe(listener);
    };
  }

  /**
   * Desuscribe un listener
   * @param {Function} listener - Función callback a eliminar
   */
  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log('🔕 [ProductService.unsubscribe] Listener removido. Total:', this.listeners.length);
    }
  }

  /**
   * Notifica a todos los listeners que los productos han cambiado
   */
  notifyListeners() {
    console.log('📢 [ProductService.notifyListeners] Notificando a listeners:', {
      totalListeners: this.listeners.length,
      productsCount: this.products.length,
    });

    // 🔑 CRÍTICO: Crear un NUEVO array para que React detecte el cambio
    const productsCopy = [...this.products];

    this.listeners.forEach((listener, index) => {
      try {
        console.log(`📤 [ProductService] Notificando listener #${index + 1}`);
        listener(productsCopy); // 👈 Pasar copia, no referencia
      } catch (error) {
        console.error(
          `❌ [ProductService] Error notificando listener #${index + 1}:`,
          error,
        );
      }
    });
  }

  /**
   * � Descargar TODAS las imágenes localmente para acceso instantáneo
   * Esto elimina la necesidad de descargarlas desde el servidor cada vez
   */
  async _downloadImagesLocally() {
    try {
      console.log('📥 [ProductService] Iniciando descarga de imágenes locales...');
      
      // Inicializar LocalImageCache
      await LocalImageCache.initialize();
      
      // Recopilar todas las URLs de imágenes ACTUALES
      const allImageUrls = [];
      
      // 1️⃣ Imágenes de menús/secciones
      const menuImages = this.menus
        .filter(menu => menu.image)
        .map(menu => menu.image);
      allImageUrls.push(...menuImages);
      console.log(`📸 [ProductService] Encontradas ${menuImages.length} imágenes de secciones`);
      
      // 2️⃣ Imágenes de productos
      const productImages = this.products
        .filter(product => product.image_url)
        .map(product => product.image_url);
      allImageUrls.push(...productImages);
      console.log(`📸 [ProductService] Encontradas ${productImages.length} imágenes de productos`);
      
      // 3️⃣ Imágenes de modificadores (dentro de customizations)
      let modifierImagesCount = 0;
      this.products.forEach(product => {
        if (product.customizations && Array.isArray(product.customizations)) {
          product.customizations.forEach(customization => {
            if (customization.modifiers && Array.isArray(customization.modifiers)) {
              customization.modifiers.forEach(modifier => {
                if (modifier.image) {
                  allImageUrls.push(modifier.image);
                  modifierImagesCount++;
                }
              });
            }
          });
        }
      });
      console.log(`📸 [ProductService] Encontradas ${modifierImagesCount} imágenes de modificadores`);
      
      // 4️⃣ Imágenes de PromoBanners
      const promoBanners = PromoBannerService.getPromoBanners();
      const bannerImages = [];
      promoBanners.forEach(banner => {
        if (banner.image_url) bannerImages.push(banner.image_url);
        if (banner.image_url_en) bannerImages.push(banner.image_url_en);
        if (banner.image) bannerImages.push(banner.image);
      });
      allImageUrls.push(...bannerImages);
      console.log(`📸 [ProductService] Encontradas ${bannerImages.length} imágenes de banners promocionales`);
      
      // Eliminar duplicados
      const uniqueImages = [...new Set(allImageUrls.filter(url => url))];
      
      console.log(`📥 [ProductService] Total de imágenes únicas a descargar: ${uniqueImages.length}`);
      
      // 🧹 LIMPIAR imágenes obsoletas (que ya no están en uso)
      await this._cleanupObsoleteImages(uniqueImages);
      
      // Descargar en lotes de 5 para no saturar
      await LocalImageCache.downloadBatch(uniqueImages, 5);
      
      // Actualizar las URLs de los productos y menús para usar rutas locales
      this._updateImageUrlsToLocal();
      
      const stats = await LocalImageCache.getStats();
      console.log(`✅ [ProductService] Descarga completa! Caché: ${stats.cacheSizeMB}MB, ${stats.totalImages} imágenes`);
      
    } catch (error) {
      console.error('❌ [ProductService] Error descargando imágenes localmente:', error);
      // No fallar la sincronización si las imágenes fallan
    }
  }

  /**
   * 🧹 Limpiar imágenes obsoletas que ya no están en uso
   */
  async _cleanupObsoleteImages(currentImageUrls) {
    try {
      const removedCount = await LocalImageCache.removeObsoleteImages(currentImageUrls);
      
      if (removedCount > 0) {
        console.log(`🧹 [ProductService] Eliminadas ${removedCount} imágenes obsoletas`);
      } else {
        console.log(`✅ [ProductService] No hay imágenes obsoletas para eliminar`);
      }
      
    } catch (error) {
      console.error('❌ [ProductService] Error limpiando imágenes obsoletas:', error);
    }
  }

  /**
   * Actualizar URLs de imágenes para usar rutas locales
   */
  _updateImageUrlsToLocal() {
    let menusUpdated = 0;
    let productsUpdated = 0;
    let modifiersUpdated = 0;
    let bannersUpdated = 0;
    
    // 1️⃣ Actualizar menús/secciones
    this.menus = this.menus.map(menu => {
      if (menu.image) {
        const localPath = LocalImageCache.getLocalPath(menu.image);
        if (localPath) {
          menusUpdated++;
          return {
            ...menu,
            image: `file://${localPath}`,
            image_url_remote: menu.image, // Guardar original por si acaso
          };
        } else {
          console.warn(`⚠️ [ProductService] No se encontró ruta local para menú: ${menu.image.substring(0, 50)}...`);
        }
      }
      return menu;
    });

    // 2️⃣ Actualizar productos Y modificadores
    this.products = this.products.map(product => {
      let updatedProduct = {...product};
      
      // Actualizar imagen del producto
      if (product.image_url) {
        const localPath = LocalImageCache.getLocalPath(product.image_url);
        if (localPath) {
          productsUpdated++;
          updatedProduct.image_url = `file://${localPath}`;
          updatedProduct.image_url_remote = product.image_url; // Guardar original
        } else {
          console.warn(`⚠️ [ProductService] No se encontró ruta local para producto: ${product.image_url.substring(0, 50)}...`);
        }
      }
      
      // Actualizar imágenes de modificadores
      if (product.customizations && Array.isArray(product.customizations)) {
        updatedProduct.customizations = product.customizations.map(customization => {
          if (customization.modifiers && Array.isArray(customization.modifiers)) {
            return {
              ...customization,
              modifiers: customization.modifiers.map(modifier => {
                if (modifier.image) {
                  const localPath = LocalImageCache.getLocalPath(modifier.image);
                  if (localPath) {
                    modifiersUpdated++;
                    return {
                      ...modifier,
                      image: `file://${localPath}`,
                      image_remote: modifier.image, // Guardar original
                    };
                  }
                }
                return modifier;
              })
            };
          }
          return customization;
        });
      }
      
      return updatedProduct;
    });

    // 3️⃣ Actualizar PromoBanners
    const promoBanners = PromoBannerService.getPromoBanners();
    if (promoBanners.length > 0) {
      const updatedBanners = promoBanners.map(banner => {
        const updates = {};
        let bannerUpdated = false;
        
        // Actualizar image_url
        if (banner.image_url) {
          const localPath = LocalImageCache.getLocalPath(banner.image_url);
          if (localPath) {
            updates.image_url = `file://${localPath}`;
            updates.image_url_remote = banner.image_url;
            bannerUpdated = true;
          }
        }
        
        // Actualizar image_url_en
        if (banner.image_url_en) {
          const localPath = LocalImageCache.getLocalPath(banner.image_url_en);
          if (localPath) {
            updates.image_url_en = `file://${localPath}`;
            updates.image_url_en_remote = banner.image_url_en;
            bannerUpdated = true;
          }
        }
        
        // Actualizar image (fallback)
        if (banner.image) {
          const localPath = LocalImageCache.getLocalPath(banner.image);
          if (localPath) {
            updates.image = `file://${localPath}`;
            updates.image_remote = banner.image;
            bannerUpdated = true;
          }
        }
        
        if (bannerUpdated) {
          bannersUpdated++;
          return {...banner, ...updates};
        }
        
        return banner;
      });
      
      // Actualizar en el servicio de banners
      PromoBannerService.promoBanners = updatedBanners;
    }

    console.log(`✅ [ProductService] URLs actualizadas: ${menusUpdated} secciones, ${productsUpdated} productos, ${modifiersUpdated} modificadores, ${bannersUpdated} banners → file://`);
  }

  /**
   * 🔥 FORZAR que todas las imágenes estén disponibles inmediatamente
   * Esto elimina completamente cualquier lazy loading o parpadeo
   */
  _forceAllImagesAvailable() {
    try {
      console.log('🚀 [ProductService] FORZANDO disponibilidad inmediata de TODAS las imágenes...');
      
      // Recopilar todas las URLs de imágenes
      const allImageUrls = [];
      
      // 1️⃣ Imágenes de menús/secciones
      this.menus.forEach(menu => {
        if (menu.image) {
          allImageUrls.push(menu.image);
        }
      });
      
      // 2️⃣ Imágenes de productos Y modificadores
      this.products.forEach(product => {
        if (product.image_url) {
          allImageUrls.push(product.image_url);
        }
        
        // Agregar imágenes de modificadores
        if (product.customizations && Array.isArray(product.customizations)) {
          product.customizations.forEach(customization => {
            if (customization.modifiers && Array.isArray(customization.modifiers)) {
              customization.modifiers.forEach(modifier => {
                if (modifier.image) {
                  allImageUrls.push(modifier.image);
                }
              });
            }
          });
        }
      });
      
      // 3️⃣ Imágenes de PromoBanners
      const promoBanners = PromoBannerService.getPromoBanners();
      promoBanners.forEach(banner => {
        if (banner.image_url) allImageUrls.push(banner.image_url);
        if (banner.image_url_en) allImageUrls.push(banner.image_url_en);
        if (banner.image) allImageUrls.push(banner.image);
      });
      
      // Eliminar duplicados
      const uniqueImages = [...new Set(allImageUrls.filter(url => url))];
      
      console.log(`🚀 [ProductService] Forzando ${uniqueImages.length} imágenes como disponibles INSTANTÁNEAMENTE`);
      
      // FORZAR todas las imágenes como disponibles AHORA MISMO
      uniqueImages.forEach(url => {
        PermanentImageCache.forceImageAvailable(url);
      });
      
      console.log('✅ [ProductService] TODAS las imágenes marcadas como disponibles - CERO lazy loading');
      
    } catch (error) {
      console.error('❌ [ProductService] Error forzando disponibilidad de imágenes:', error);
    }
  }

  /**
   * 🔥 Precarga AGRESIVA de TODAS las imágenes - Sin parpadeos NUNCA
   * Se ejecuta tan pronto como se obtienen los productos del servidor
   */
  async _preloadImagesImmediately() {
    try {
      console.log('🔥 [ProductService] Iniciando precarga AGRESIVA - NUNCA MÁS PARPADEOS...');
      
      // Inicializar el caché permanente
      await PermanentImageCache.initialize();
      
      // 🔥 RECOPILAR TODAS LAS IMÁGENES DE UNA VEZ
      const allImageUrls = [];
      
      // 1️⃣ Imágenes de menús/secciones
      const menuImages = this.menus
        .filter(menu => menu.image)
        .map(menu => menu.image);
      allImageUrls.push(...menuImages);
      
      // 2️⃣ Imágenes de TODOS los productos
      const productImages = this.products
        .filter(product => product.image_url)
        .map(product => product.image_url);
      allImageUrls.push(...productImages);
      
      // 3️⃣ Imágenes de modificadores
      let modifierImages = [];
      this.products.forEach(product => {
        if (product.customizations && Array.isArray(product.customizations)) {
          product.customizations.forEach(customization => {
            if (customization.modifiers && Array.isArray(customization.modifiers)) {
              customization.modifiers.forEach(modifier => {
                if (modifier.image) {
                  modifierImages.push(modifier.image);
                }
              });
            }
          });
        }
      });
      allImageUrls.push(...modifierImages);
      
      // 4️⃣ Imágenes de PromoBanners
      const promoBanners = PromoBannerService.getPromoBanners();
      const bannerImages = promoBanners
        .filter(banner => banner.image_url || banner.image)
        .map(banner => banner.image_url || banner.image);
      allImageUrls.push(...bannerImages);
      
      // Eliminar duplicados
      const uniqueImages = [...new Set(allImageUrls.filter(url => url))];
      
      console.log(`🔥 [ProductService] Precargando AGRESIVAMENTE ${uniqueImages.length} imágenes ÚNICAS`);
      console.log(`📊 [ProductService] Desglose: ${menuImages.length} secciones + ${productImages.length} productos + ${modifierImages.length} modificadores + ${bannerImages.length} banners`);
      
      // 🔥 PRECARGA AGRESIVA DE TODAS LAS IMÁGENES
      await PermanentImageCache.preloadAllImages(uniqueImages);
      
      // También usar el sistema tradicional como backup
      AdvancedImageCacheManager.initialize();
      AdvancedImageCacheManager.intelligentPreload(uniqueImages, FastImage.priority.high);
      
      console.log('🔥 [ProductService] ¡PRECARGA AGRESIVA COMPLETADA! Las imágenes NUNCA volverán a parpadear');
      
    } catch (error) {
      console.error('🔥 [ProductService] Error en precarga AGRESIVA:', error);
    }
  }
}

// Crear y exportar la instancia única
const productServiceInstance = new ProductService();
// NO usar Object.freeze() porque impide la configuración
// Object.freeze(productServiceInstance);

console.log('🏗️ [ProductService] Instancia singleton creada');

export default productServiceInstance;
