import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';
import {useTheme} from '../../providers/ThemeProvider';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const {width: screenWidth} = Dimensions.get('window');

/**
 * Componente de imagen ultra-optimizado con caché avanzado y lazy loading
 */
const SuperOptimizedImage = React.memo(
  ({
    source,
    style,
    priority = FastImage.priority.normal,
    placeholder = 'https://dunkin-ar.s3.amazonaws.com/images/Fresh_beef_burger_isolated_-1_Background_Removed.png',
    showLoadingIndicator = true,
    roundedCorners = false,
    useBlurHash = false,
    lazyLoad = false,
    preloadNext = [],
    onLoad,
    onError,
    onVisible,
    ...props
  }) => {
  // 🚀 ANTI-PARPADEO: Si está en caché, no mostrar loading inicialmente
  const isCached = useMemo(() => {
    return AdvancedImageCacheManager.isImageCached(imageUrl);
  }, [imageUrl]);
  
  const [isLoading, setIsLoading] = useState(showLoadingIndicator && !isCached);
  const [hasError, setHasError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [shouldLoad, setShouldLoad] = useState(!lazyLoad);
  const [imageLoaded, setImageLoaded] = useState(isCached); // 🚀 Si está en caché, marcarlo como cargado
  
  const {sizes, colors} = useTheme();
  const timeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const viewRef = useRef(null);
  const intersectionRef = useRef(null);

  // Obtener URL de la imagen
  const imageUrl = useMemo(() => {
    if (typeof source === 'string') return source;
    if (source?.uri) return source.uri;
    return placeholder;
  }, [source, placeholder]);

  // Setup lazy loading con Intersection Observer simulado
  useEffect(() => {
      if (!lazyLoad || shouldLoad) return;

      const checkVisibility = () => {
        if (viewRef.current) {
          viewRef.current.measure((x, y, width, height, pageX, pageY) => {
            const isInViewport = pageY < screenWidth && (pageY + height) > 0;
            
            if (isInViewport && !isVisible) {
              setIsVisible(true);
              setShouldLoad(true);
              if (onVisible) onVisible();
              
              // Priorizar imágenes visibles
              AdvancedImageCacheManager.prioritizeVisibleImages([imageUrl]);
            }
          });
        }
      };

      const interval = setInterval(checkVisibility, 500);
      return () => clearInterval(interval);
    }, [lazyLoad, shouldLoad, isVisible, imageUrl, onVisible]);

    // Manejar precarga de imágenes siguientes
    useEffect(() => {
      if (isVisible && preloadNext.length > 0) {
        // Precargar las siguientes imágenes con prioridad baja
        AdvancedImageCacheManager.intelligentPreload(preloadNext, FastImage.priority.low);
      }
    }, [isVisible, preloadNext]);

    // Delay para mostrar skeleton - optimizado para eliminar parpadeos
    useEffect(() => {
      if (isLoading && showLoadingIndicator && shouldLoad && !imageLoaded) {
        // 🚀 ANTI-PARPADEO: Delays más cortos y inteligentes
        let delay;
        if (isCached) {
          delay = 10; // Casi instantáneo si está en caché
        } else {
          delay = 100; // Muy corto para imágenes nuevas
        }
        
        timeoutRef.current = setTimeout(() => {
          // Solo mostrar skeleton si la imagen realmente no ha cargado
          if (isLoading && !imageLoaded) {
            setShowSkeleton(true);
          }
        }, delay);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setShowSkeleton(false);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [isLoading, showLoadingIndicator, shouldLoad, isCached, imageLoaded]);

    // Manejar carga exitosa
    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setHasError(false);
      setImageLoaded(true); // 🚀 Marcar imagen como cargada para evitar parpadeos
      retryCountRef.current = 0;
      
      if (onLoad) {
        onLoad();
      }
      
      console.log(`✅ [SuperOptimizedImage] Imagen cargada: ${imageUrl.substring(0, 50)}...`);
    }, [onLoad, imageUrl]);

    // Manejar errores con retry automático
    const handleError = useCallback(
      (error) => {
        console.warn(`❌ [SuperOptimizedImage] Error cargando imagen (intento ${retryCountRef.current + 1}):`, error);
        
        retryCountRef.current += 1;
        
        if (retryCountRef.current < 3) {
          // Retry automático después de un delay
          setTimeout(() => {
            setIsLoading(true);
            setHasError(false);
          }, 1000 * retryCountRef.current);
        } else {
          setIsLoading(false);
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
          backgroundColor: colors.background || '#f5f5f5',
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
        {showSkeleton && !imageLoaded && (
          <ShimmerPlaceholder
            style={[dynamicStyles.shimmer, styles.shimmerOpacity]}
            visible={false}
            LinearGradient={LinearGradient}
          />
        )}
        
        {imageProps && (
          <FastImage
            {...imageProps}
            style={[
              dynamicStyles.image,
              // 🚀 ANTI-PARPADEO: Solo ocultar si realmente está cargando Y no se ha cargado
              (isLoading && !imageLoaded) && styles.hiddenImage,
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

SuperOptimizedImage.displayName = 'SuperOptimizedImage';

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
  },
  shimmerOpacity: {
    opacity: 0.3,
  },
  hiddenImage: {
    opacity: 0,
  },
});

export default SuperOptimizedImage;