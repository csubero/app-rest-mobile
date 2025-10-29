import React, {useMemo} from 'react';
import FastImage from 'react-native-fast-image';
import PermanentImageCache from '../../helpers/config/PermanentImageCache';

/**
 * 🚀 IMAGEN INSTANTÁNEA A PANTALLA COMPLETA - CERO LAZY LOADING
 * 
 * Versión optimizada de InstantImage para imágenes fullscreen:
 * - No hay estados de carga
 * - No hay animaciones de opacidad  
 * - No hay shimmers o placeholders
 * - La imagen aparece INMEDIATAMENTE a pantalla completa
 * 
 * NOTA: Solo funciona si las imágenes ya están en PermanentImageCache
 */
const InstantImageFullscreen = React.memo(({
  source,
  style,
  resizeMode = 'cover', // Cover por defecto para fullscreen
  ...restProps
}) => {
  // Extraer URL de la imagen
  const imageUrl = useMemo(() => {
    if (typeof source === 'string') return source;
    if (source?.uri) return source.uri;
    return null;
  }, [source]);

  // 🔥 FORZAR que la imagen esté disponible inmediatamente
  if (imageUrl) {
    PermanentImageCache.forceImageAvailable(imageUrl);
  }

  // 🚀 RENDERIZADO INSTANTÁNEO FULLSCREEN - Sin lógica condicional
  return (
    <FastImage
      source={{
        uri: imageUrl,
        priority: FastImage.priority.high,
        cache: FastImage.cacheControl.immutable,
      }}
      style={[
        {
          width: '100%',
          height: '100%',
          opacity: 1, // ✅ SIEMPRE visible
        },
        style
      ]}
      resizeMode={resizeMode}
      
      // 🔥 CONFIGURACIÓN ANTI-LAZY FULLSCREEN:
      fadeDuration={0}        // Sin animación de fade
      loadingIndicatorSource={undefined}  // Sin indicador de carga
      
      // Callbacks mínimos
      onLoad={() => {
        if (imageUrl) {
          PermanentImageCache.markImageLoaded(imageUrl);
        }
      }}
      
      onError={(error) => {
        console.warn(`⚠️ [InstantImageFullscreen] Error con imagen fullscreen (pero sigue mostrando):`, imageUrl);
      }}
      
      {...restProps}
    />
  );
});

InstantImageFullscreen.displayName = 'InstantImageFullscreen';

export default InstantImageFullscreen;