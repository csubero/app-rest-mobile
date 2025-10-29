import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

/**
 * Componente de imagen optimizada para fullscreen con skeleton mejorado
 * Diseñado específicamente para Android y pantallas grandes
 * Optimizado para imágenes que ocupan toda la pantalla o gran parte de ella
 */
const OptimizedImageFullscreen = React.memo(
  ({
    source,
    style,
    resizeMode = FastImage.resizeMode.cover, // Por defecto cover para fullscreen
    priority = FastImage.priority.high, // Prioridad alta por defecto
    placeholder = 'https://placehold.co/1920x1280.png',
    showLoadingIndicator = true,
    onLoad,
    onError,
    skeletonAnimationSpeed = 1000, // Velocidad más lenta para pantallas grandes
    ...props
  }) => {
    const [isLoading, setIsLoading] = useState(showLoadingIndicator);
    const [hasError, setHasError] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const timeoutRef = useRef(null);

    // Delay optimizado para imágenes grandes - más tiempo para evitar flickers
    useEffect(() => {
      if (isLoading && showLoadingIndicator) {
        timeoutRef.current = setTimeout(() => {
          setShowSkeleton(true);
        }, 100); // Delay más corto para mejor UX en fullscreen
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
    }, [isLoading, showLoadingIndicator]);

    const imageUrl = typeof source === 'string' ? source : source?.uri;
    const finalSource = hasError ? placeholder : imageUrl || placeholder;

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setHasError(false);
      if (onLoad) {
        onLoad();
      }
    }, [onLoad]);

    const handleError = useCallback(
      error => {
        console.log(
          '❌ [OptimizedImageFullscreen] Error loading image:',
          error,
        );
        setIsLoading(false);
        setHasError(true);
        if (onError) {
          onError(error);
        }
      },
      [onError],
    );

    // Props optimizadas para imágenes fullscreen
    // ✅ Migrado a AdvancedImageCacheManager para mejor rendimiento y caché inteligente
    const imageProps = useMemo(() => {
      const base = AdvancedImageCacheManager.getOptimizedImageProps(
        finalSource, 
        priority,
        {
          fallbackUrl: placeholder,
          resizeMode,
          cacheControl: FastImage.cacheControl.immutable
        }
      );
      return {
        ...base,
        onLoad: handleLoad,
        onError: handleError,
        resizeMode,
        ...props,
      };
    }, [finalSource, priority, handleLoad, handleError, resizeMode, props, placeholder]);

    // Estilos optimizados para fullscreen
    const dynamicStyles = useMemo(() => {
      const flattenedStyle = StyleSheet.flatten(style) || {};

      return {
        container: {
          ...flattenedStyle,
          // Asegurar que no haya border radius para fullscreen
          borderRadius: 0,
          overflow: 'hidden',
          // Optimizaciones específicas para Android
          renderToHardwareTextureAndroid: true,
          needsOffscreenAlphaCompositing: false, // Mejor performance en Android
          removeClippedSubviews: true, // Optimización de memoria en Android
        },
        image: {
          width: '100%',
          height: '100%',
          // Sin border radius para fullscreen
          borderRadius: 0,
        },
        shimmer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // Optimizaciones específicas para skeleton en pantallas grandes
          opacity: 0.4, // Más sutil en pantallas grandes
        },
      };
    }, [style]);

    // Configuración del gradiente optimizada para Android
    const shimmerColors = useMemo(() => ['#f0f0f0', '#e0e0e0', '#f0f0f0'], []);

    // Configuraciones específicas para Android
    const androidShimmerProps = useMemo(
      () => ({
        // Optimizaciones específicas para evitar corrupción en Android
        shimmerWidthPercent: 1.0,
        location: [0.3, 0.5, 0.7],
        // Usar software rendering si es necesario para evitar problemas de GPU
        useNativeDriver: false,
      }),
      [],
    );

    return (
      <View style={[styles.container, dynamicStyles.container]}>
        {/* Skeleton optimizado para Android */}
        {showSkeleton && (
          <ShimmerPlaceholder
            style={dynamicStyles.shimmer}
            visible={false}
            LinearGradient={LinearGradient}
            shimmerColors={shimmerColors}
            duration={skeletonAnimationSpeed}
            {...androidShimmerProps}
          />
        )}

        {/* Imagen principal */}
        <FastImage
          {...imageProps}
          style={[dynamicStyles.image, isLoading && styles.hiddenImage]}
        />
      </View>
    );
  },
);

OptimizedImageFullscreen.displayName = 'OptimizedImageFullscreen';

const styles = StyleSheet.create({
  container: {
    // Estilos base del contenedor optimizados para Android
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Color de fondo sutil mientras carga
    // Optimizaciones adicionales para Android
    elevation: 0, // Sin sombra para mejor performance
  },
  hiddenImage: {
    opacity: 0,
  },
});

export default OptimizedImageFullscreen;
