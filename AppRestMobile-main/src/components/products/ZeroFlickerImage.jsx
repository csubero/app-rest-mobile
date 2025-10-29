import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';
import {useTheme} from '../../providers/ThemeProvider';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const {width: screenWidth} = Dimensions.get('window');

// ⚡ CACHÉ INMEDIATO: Sistema de caché inmediato para evitar parpadeos completamente
const ImageImmediateCache = new Map();

/**
 * Componente de imagen ultra-optimizado con ZERO parpadeo
 * Sistema de caché inmediato y renderizado inteligente
 */
const ZeroFlickerImage = React.memo(
  ({
    source,
    style,
    priority = FastImage.priority.normal,
    placeholder = 'https://dunkin-ar.s3.amazonaws.com/images/Fresh_beef_burger_isolated_-1_Background_Removed.png',
    showLoadingIndicator = false, // Por defecto false para evitar parpadeos
    roundedCorners = false,
    lazyLoad = false,
    preloadNext = [],
    onLoad,
    onError,
    onVisible,
    ...props
  }) => {
    // Obtener URL de la imagen
    const imageUrl = useMemo(() => {
      if (typeof source === 'string') return source;
      if (source?.uri) return source.uri;
      return placeholder;
    }, [source, placeholder]);

    // ⚡ DETECCIÓN INMEDIATA: Verificar caché inmediato
    const isImmediatelyCached = useMemo(() => {
      return ImageImmediateCache.has(imageUrl);
    }, [imageUrl]);

    // Estados optimizados para ZERO parpadeo
    const [imageStatus, setImageStatus] = useState(() => {
      if (isImmediatelyCached) {
        return 'loaded'; // Si está en caché inmediato, marcarlo como cargado
      }
      return showLoadingIndicator ? 'loading' : 'hidden';
    });
    
    const [hasError, setHasError] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(!lazyLoad);
    
    const {sizes, colors} = useTheme();
    const timeoutRef = useRef(null);
    const retryCountRef = useRef(0);
    const viewRef = useRef(null);

    // Setup lazy loading
    useEffect(() => {
      if (!lazyLoad || shouldLoad) return;

      const checkVisibility = () => {
        if (viewRef.current) {
          viewRef.current.measure((x, y, width, height, pageX, pageY) => {
            const isInViewport = pageY < screenWidth && (pageY + height) > 0;
            
            if (isInViewport) {
              setShouldLoad(true);
              if (onVisible) onVisible();
              AdvancedImageCacheManager.prioritizeVisibleImages([imageUrl]);
            }
          });
        }
      };

      const interval = setInterval(checkVisibility, 200);
      return () => clearInterval(interval);
    }, [lazyLoad, shouldLoad, imageUrl, onVisible]);

    // Precarga de siguientes imágenes
    useEffect(() => {
      if (shouldLoad && preloadNext.length > 0) {
        AdvancedImageCacheManager.intelligentPreload(preloadNext, FastImage.priority.low);
      }
    }, [shouldLoad, preloadNext]);

    // ⚡ TIMEOUT ANTI-PARPADEO: Solo mostrar loading si realmente es necesario
    useEffect(() => {
      if (imageStatus === 'loading' && showLoadingIndicator) {
        // Timeout muy corto para mostrar loading
        timeoutRef.current = setTimeout(() => {
          if (imageStatus === 'loading') {
            setImageStatus('showing-loader');
          }
        }, 50); // Solo 50ms de delay
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [imageStatus, showLoadingIndicator]);

    // ⚡ CARGA EXITOSA: Marcar en caché inmediato
    const handleLoad = useCallback(() => {
      // Marcar en caché inmediato para futuras renderizaciones
      ImageImmediateCache.set(imageUrl, {
        loaded: true,
        timestamp: Date.now()
      });
      
      setImageStatus('loaded');
      setHasError(false);
      retryCountRef.current = 0;
      
      if (onLoad) {
        onLoad();
      }
      
      console.log(`⚡ [ZeroFlickerImage] Imagen cargada y cacheada: ${imageUrl.substring(0, 50)}...`);
    }, [onLoad, imageUrl]);

    // Manejo de errores con retry
    const handleError = useCallback(
      (error) => {
        console.warn(`❌ [ZeroFlickerImage] Error cargando imagen (intento ${retryCountRef.current + 1}):`, error);
        
        retryCountRef.current += 1;
        
        if (retryCountRef.current < 3) {
          setTimeout(() => {
            setImageStatus('loading');
            setHasError(false);
          }, 1000 * retryCountRef.current);
        } else {
          setImageStatus('error');
          setHasError(true);
          
          if (onError) {
            onError(error);
          }
        }
      },
      [onError]
    );

    // Props optimizadas para FastImage
    const imageProps = useMemo(() => {
      if (!shouldLoad) return null;
      
      const finalUrl = hasError ? placeholder : imageUrl;
      const optimizedProps = AdvancedImageCacheManager.getOptimizedImageProps(
        finalUrl,
        priority,
        {
          fallbackUrl: placeholder,
          resizeMode: FastImage.resizeMode.contain,
          cacheControl: FastImage.cacheControl.immutable
        }
      );

      return {
        ...optimizedProps,
        onLoad: handleLoad,
        onError: handleError,
        ...props,
      };
    }, [shouldLoad, hasError, imageUrl, placeholder, priority, handleLoad, handleError, props]);

    // Estilos dinámicos
    const dynamicStyles = useMemo(
      () => ({
        container: {
          borderRadius: roundedCorners ? sizes.borderRadius2 : 0,
          overflow: 'hidden',
          backgroundColor: colors.background || 'transparent',
        },
        image: {
          borderRadius: roundedCorners ? sizes.borderRadius2 : 0,
          width: '100%',
          height: '100%',
        },
        shimmer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: roundedCorners ? sizes.borderRadius2 : 0,
        }
      }),
      [sizes.borderRadius2, roundedCorners, colors.background]
    );

    // ⚡ RENDERIZADO ANTI-PARPADEO: Lógica de renderizado optimizada
    const shouldShowShimmer = imageStatus === 'showing-loader';
    const shouldShowImage = shouldLoad && imageProps;
    const imageOpacity = imageStatus === 'loaded' || isImmediatelyCached ? 1 : 0;

    // Renderizado condicional para lazy loading
    if (!shouldLoad) {
      return (
        <View 
          ref={viewRef}
          style={[style, dynamicStyles.container, styles.placeholder]}
        >
          <ShimmerPlaceholder
            style={[style, dynamicStyles.shimmer]}
            visible={false}
            LinearGradient={LinearGradient}
          />
        </View>
      );
    }

    return (
      <View
        ref={viewRef}
        style={[style, dynamicStyles.container]}
      >
        {/* ⚡ SHIMMER INTELIGENTE: Solo mostrar si realmente está cargando */}
        {shouldShowShimmer && (
          <ShimmerPlaceholder
            style={[dynamicStyles.shimmer, styles.shimmerOpacity]}
            visible={false}
            LinearGradient={LinearGradient}
          />
        )}
        
        {/* ⚡ IMAGEN OPTIMIZADA: Opacidad inmediata si está en caché */}
        {shouldShowImage && (
          <FastImage
            {...imageProps}
            style={[
              dynamicStyles.image,
              { opacity: imageOpacity }, // Control directo de opacidad
            ]}
          />
        )}
      </View>
    );
  },
  // Comparación optimizada para evitar re-renders innecesarios
  (prevProps, nextProps) => {
    const prevUrl = typeof prevProps.source === 'string' ? prevProps.source : prevProps.source?.uri;
    const nextUrl = typeof nextProps.source === 'string' ? nextProps.source : nextProps.source?.uri;
    
    return (
      prevUrl === nextUrl &&
      prevProps.priority === nextProps.priority &&
      prevProps.roundedCorners === nextProps.roundedCorners &&
      prevProps.showLoadingIndicator === nextProps.showLoadingIndicator &&
      JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
    );
  }
);

ZeroFlickerImage.displayName = 'ZeroFlickerImage';

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'transparent',
  },
  shimmerOpacity: {
    opacity: 0.2,
  },
});

// ⚡ UTILIDAD: Limpiar caché inmediato periódicamente
export const clearImmediateCache = () => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hora
  
  for (const [url, data] of ImageImmediateCache.entries()) {
    if (now - data.timestamp > maxAge) {
      ImageImmediateCache.delete(url);
    }
  }
  
  console.log(`🧹 [ZeroFlickerImage] Caché inmediato limpiado, entradas restantes: ${ImageImmediateCache.size}`);
};

// ⚡ UTILIDAD: Precargar imagen en caché inmediato
export const precacheImage = (url) => {
  if (!ImageImmediateCache.has(url)) {
    ImageImmediateCache.set(url, {
      loaded: false,
      timestamp: Date.now()
    });
  }
};

export default ZeroFlickerImage;