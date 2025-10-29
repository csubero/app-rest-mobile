import apiClient from './apiClient';

/**
 * Servicio Singleton para manejar banners promocionales
 * Mantiene los banners en memoria para acceso rápido
 */
class PromoBannerService {
  constructor() {
    this.promoBanners = [];
    this.serverIp = null;
    this.apiToken = null;
    this.lastFetchDate = null;
  }

  /**
   * Configura el servicio con los datos de conexión
   * @param {string} serverIp - IP del servidor
   * @param {string} apiToken - Token de autenticación
   */
  configure(serverIp, apiToken) {
    if (!serverIp || !apiToken) {
      throw new Error('ServerIp y apiToken son requeridos para configurar PromoBannerService');
    }
    
    this.serverIp = serverIp;
    this.apiToken = apiToken;
    
    console.log('🔧 [PromoBannerService] Configurado exitosamente');
  }

  /**
   * Obtiene los banners promocionales del servidor y los almacena en memoria
   * @returns {Promise<Array>} Lista de banners promocionales
   */
  async fetchPromoBanners() {
    if (!this.serverIp || !this.apiToken) {
      throw new Error('PromoBannerService no está configurado. Llama a configure() primero.');
    }

    try {
      console.log('📡 [PromoBannerService] Fetching promo banners from server...');
      
      const response = await apiClient(this.serverIp, this.apiToken).get('cms/promo-banners/');
      
      this.promoBanners = response || [];
      this.lastFetchDate = new Date().toISOString();
      
      console.log('✅ [PromoBannerService] Promo banners fetched successfully:', {
        count: this.promoBanners.length,
        lastFetch: this.lastFetchDate
      });
      
      return this.promoBanners;
    } catch (error) {
      console.error('❌ [PromoBannerService] Error fetching promo banners:', error);
      throw error;
    }
  }

  /**
   * Obtiene los banners promocionales desde memoria
   * @returns {Array} Lista de banners promocionales
   */
  getPromoBanners() {
    return this.promoBanners;
  }

  /**
   * Obtiene un banner promocional específico por ID
   * @param {string|number} bannerId - ID del banner
   * @returns {Object|null} Banner encontrado o null
   */
  getPromoBannerById(bannerId) {
    return this.promoBanners.find(banner => banner.id === bannerId) || null;
  }

  /**
   * Obtiene banners promocionales activos
   * @returns {Array} Lista de banners activos
   */
  getActivePromoBanners() {
    return this.promoBanners.filter(banner => banner.is_active === true);
  }

  /**
   * Verifica si hay banners promocionales cargados
   * @returns {boolean} True si hay banners cargados
   */
  hasPromoBanners() {
    return this.promoBanners.length > 0;
  }

  /**
   * Obtiene estadísticas de los banners promocionales
   * @returns {Object} Estadísticas
   */
  getPromoBannersStats() {
    const total = this.promoBanners.length;
    const active = this.getActivePromoBanners().length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
      lastFetch: this.lastFetchDate
    };
  }

  /**
   * Limpia todos los datos en memoria
   */
  clearData() {
    console.log('🗑️ [PromoBannerService] Clearing all data');
    this.promoBanners = [];
    this.lastFetchDate = null;
  }

  /**
   * Reinicia completamente el servicio
   */
  reset() {
    console.log('🔄 [PromoBannerService] Resetting service');
    this.clearData();
    this.serverIp = null;
    this.apiToken = null;
  }
}

// Exportar como singleton
const promoBannerService = new PromoBannerService();
export default promoBannerService;