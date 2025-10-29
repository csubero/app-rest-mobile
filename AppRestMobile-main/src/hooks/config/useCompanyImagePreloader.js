import {useEffect} from 'react';
import {useSelector} from 'react-redux';
import CompanyImagePreloader from '../../helpers/config/CompanyImagePreloader';

/**
 * 🏢 Hook para precargar automáticamente las imágenes de empresa
 * Se ejecuta cuando companySelected está disponible en el store
 */
const useCompanyImagePreloader = () => {
  const companySelected = useSelector(state => state.company?.companySelected);

  useEffect(() => {
    if (companySelected?.settings) {
      console.log('🏢 [useCompanyImagePreloader] Empresa detectada, iniciando precarga de imágenes...');
      
      // Forzar disponibilidad inmediata
      CompanyImagePreloader.forceCompanyImagesAvailable(companySelected.settings);
      
      // Precargar realmente en segundo plano
      CompanyImagePreloader.preloadCompanyImages(companySelected.settings).catch(error => {
        console.error('❌ [useCompanyImagePreloader] Error en precarga:', error);
      });
    }
  }, [companySelected]);

  return {
    companySelected,
    hasCompanyImages: !!companySelected?.settings
  };
};

export default useCompanyImagePreloader;