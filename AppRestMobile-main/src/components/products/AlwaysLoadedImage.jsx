import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import PermanentImageCache from '../../helpers/config/PermanentImageCache';
import {useTheme} from '../../providers/ThemeProvider';

/**
 * Componente de imagen que NUNCA parpadea
 * Las imágenes están SIEMPRE disponibles, sin loading states
 */
const AlwaysLoadedImage = React.memo(
  ({
    source,
    style,
    priority = FastImage.priority.high,
    placeholder = 'https://dunkin-ar.s3.amazonaws.com/images/Fresh_beef_burger_isolated_-1_Background_Removed.png',
    roundedCorners = false,
    onLoad,
    onError,
    ...props
  }) => {
    // Obtener URL de la imagen
    const imageUrl = useMemo(() => {
      if (typeof source === 'string') return source;
      if (source?.uri) return source.uri;
      return placeholder;
    }, [source, placeholder]);

    // ✅ SIEMPRE DISPONIBLE: La imagen está SIEMPRE lista
    const isAlwaysReady = useMemo(() => {
      return PermanentImageCache.isImageCached(imageUrl);
    }, [imageUrl]);

    // Estados mínimos - sin loading states
    const [hasError, setHasError] = useState(false);
    const [actuallyLoaded, setActuallyLoaded] = useState(isAlwaysReady);
    
    const {sizes, colors} = useTheme();
    const retryCountRef = useRef(0);

    // Efecto para forzar que la imagen esté disponible inmediatamente
    useEffect(() => {
      if (imageUrl && imageUrl !== placeholder) {
        // Forzar que la imagen esté disponible INMEDIATAMENTE
        PermanentImageCache.forceImageAvailable(imageUrl);
        setActuallyLoaded(true);
      }
    }, [imageUrl, placeholder]);

    // Manejar carga exitosa (para marcar en caché permanente)
    const handleLoad = useCallback(() => {
      PermanentImageCache.markImageLoaded(imageUrl);
      setActuallyLoaded(true);
      setHasError(false);
      retryCountRef.current = 0;
      
      if (onLoad) {
        onLoad();
      }
      
      console.log(`🔥 [AlwaysLoadedImage] Imagen confirmada en caché permanente: ${imageUrl.substring(0, 50)}...`);
    }, [onLoad, imageUrl]);

    // Manejar errores - retry agresivo
    const handleError = useCallback(
      (error) => {
        retryCountRef.current += 1;
        
        if (retryCountRef.current < 5) { // Más reintentos
          console.warn(`🔄 [AlwaysLoadedImage] Reintentando carga (${retryCountRef.current}/5): ${imageUrl.substring(0, 50)}...`);
          
          // Retry más rápido
          setTimeout(() => {
            setHasError(false);
            setActuallyLoaded(false);
            // Volver a intentar
            setTimeout(() => setActuallyLoaded(true), 100);
          }, 500 * retryCountRef.current);
        } else {
          console.error(`❌ [AlwaysLoadedImage] Error definitivo cargando imagen:`, error);
          setHasError(true);
          
          if (onError) {
            onError(error);
          }
        }
      },
      [onError, imageUrl]
    );

    // Props para FastImage - siempre optimizadas
    const imageProps = useMemo(() => {
      const finalUrl = hasError ? placeholder : imageUrl;
      
      return {
        source: {
          uri: finalUrl,
          priority,
          cache: FastImage.cacheControl.immutable,
        },
        resizeMode: FastImage.resizeMode.contain,
        onLoad: handleLoad,
        onError: handleError,
        ...props,
      };
    }, [hasError, imageUrl, placeholder, priority, handleLoad, handleError, props]);

    // Estilos dinámicos
    const dynamicStyles = useMemo(
      () => ({
        container: {
          borderRadius: roundedCorners ? sizes.borderRadius2 : 0,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        image: {
          borderRadius: roundedCorners ? sizes.borderRadius2 : 0,
          width: '100%',
          height: '100%',
          opacity: 1, // ✅ SIEMPRE opacidad completa
        }
      }),
      [sizes.borderRadius2, roundedCorners]
    );

    // ✅ RENDERIZADO SIMPLE: Sin loading states, sin shimmers, sin parpadeos
    return (
      <View style={[style, dynamicStyles.container]}>
        <FastImage
          {...imageProps}
          style={[dynamicStyles.image]}
        />
      </View>
    );
  },
  // Comparación optimizada para evitar re-renders
  (prevProps, nextProps) => {
    const prevUrl = typeof prevProps.source === 'string' ? prevProps.source : prevProps.source?.uri;
    const nextUrl = typeof nextProps.source === 'string' ? nextProps.source : nextProps.source?.uri;
    
    return (
      prevUrl === nextUrl &&
      prevProps.priority === nextProps.priority &&
      prevProps.roundedCorners === nextProps.roundedCorners &&
      JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
    );
  }
);

AlwaysLoadedImage.displayName = 'AlwaysLoadedImage';

export default AlwaysLoadedImage;