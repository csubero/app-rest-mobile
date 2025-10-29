import PermanentImageCache from './PermanentImageCache';

/**
 * 🚀 Helper para precargar imágenes de configuración de la empresa
 * Estas son imágenes que no son productos pero necesitan estar disponibles instantáneamente
 */
class CompanyImagePreloader {
  
  /**
   * 🔥 Precargar TODAS las imágenes de configuración de la empresa
   * @param {Object} companySettings - Configuración de la empresa 
   */
  static async preloadCompanyImages(companySettings) {
    if (!companySettings) {
      console.warn('⚠️ [CompanyImagePreloader] No hay configuración de empresa para precargar');
      return;
    }

    try {
      console.log('🏢 [CompanyImagePreloader] Iniciando precarga de imágenes de empresa...');
      
      // Recopilar todas las URLs de imágenes de configuración
      const companyImageUrls = [];
      
      // Imagen de banner de idiomas
      if (companySettings.banner_language_url) {
        companyImageUrls.push(companySettings.banner_language_url);
      }
      
      // Imagen/video de intro
      if (companySettings.intro_video_url) {
        companyImageUrls.push(companySettings.intro_video_url);
      }
      
      // Logo de la empresa
      if (companySettings.logo_url) {
        companyImageUrls.push(companySettings.logo_url);
      }
      
      // Icono por defecto de comida
      if (companySettings.icon_default_food_url) {
        companyImageUrls.push(companySettings.icon_default_food_url);
      }
      
      // Banner principal si existe
      if (companySettings.banner_url) {
        companyImageUrls.push(companySettings.banner_url);
      }
      
      // Imagen de fondo si existe
      if (companySettings.background_image_url) {
        companyImageUrls.push(companySettings.background_image_url);
      }
      
      // Filtrar URLs válidas
      const validUrls = companyImageUrls.filter(url => url && typeof url === 'string');
      
      if (validUrls.length === 0) {
        console.log('📭 [CompanyImagePreloader] No se encontraron imágenes de empresa para precargar');
        return;
      }
      
      console.log(`🏢 [CompanyImagePreloader] Precargando ${validUrls.length} imágenes de empresa:`, validUrls.map(url => url.substring(0, 50) + '...'));
      
      // 🚀 FORZAR disponibilidad inmediata
      validUrls.forEach(url => {
        PermanentImageCache.forceImageAvailable(url);
      });
      
      // 🔥 Precargar realmente en segundo plano
      await PermanentImageCache.preloadAllImages(validUrls);
      
      console.log('✅ [CompanyImagePreloader] Imágenes de empresa precargadas exitosamente');
      
    } catch (error) {
      console.error('❌ [CompanyImagePreloader] Error precargando imágenes de empresa:', error);
    }
  }
  
  /**
   * 🚀 Forzar que las imágenes de empresa estén disponibles inmediatamente
   * @param {Object} companySettings - Configuración de la empresa 
   */
  static forceCompanyImagesAvailable(companySettings) {
    if (!companySettings) return;
    
    const urls = [
      companySettings.banner_language_url,
      companySettings.intro_video_url,
      companySettings.logo_url,
      companySettings.icon_default_food_url,
      companySettings.banner_url,
      companySettings.background_image_url,
    ].filter(url => url && typeof url === 'string');
    
    urls.forEach(url => {
      PermanentImageCache.forceImageAvailable(url);
    });
    
    console.log(`🏢 [CompanyImagePreloader] ${urls.length} imágenes de empresa marcadas como disponibles instantáneamente`);
  }
}

export default CompanyImagePreloader;