import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';
import {useTheme} from '../../providers/ThemeProvider';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

/**
 * Componente de imagen optimizada con caché y loading states
 */
const OptimizedImage = React.memo(
  ({
    source,
    style,
    // force contain always, ignore any passed resizeMode
    priority = FastImage.priority.normal,
    placeholder = 'https://placehold.co/950x950.png',
    showLoadingIndicator = true,
    roundedCorners = false,
    useStyles = false,
    onLoad,
    onError,
    ...props
  }) => {
    const [isLoading, setIsLoading] = useState(showLoadingIndicator);
    const [hasError, setHasError] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const {sizes} = useTheme();
    const timeoutRef = useRef(null);

    // Delay para mostrar skeleton solo si la imagen tarda en cargar
    useEffect(() => {
      if (isLoading && showLoadingIndicator) {
        timeoutRef.current = setTimeout(() => {
          setShowSkeleton(true);
        }, 200); // Delay de 200ms antes de mostrar el skeleton
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
        setIsLoading(false);
        setHasError(true);
        if (onError) {
          onError(error);
        }
      },
      [onError],
    );

    // Build image props but ensure resizeMode is always 'contain'
    // ✅ Migrado a AdvancedImageCacheManager para mejor rendimiento y caché inteligente
    const imageProps = useMemo(() => {
      const base = AdvancedImageCacheManager.getOptimizedImageProps(
        finalSource, 
        priority,
        {
          fallbackUrl: placeholder,
          resizeMode: FastImage.resizeMode.contain,
          cacheControl: FastImage.cacheControl.immutable
        }
      );
      return {
        ...base,
        onLoad: handleLoad,
        onError: handleError,
        // don't allow external props to override resizeMode
        resizeMode: FastImage.resizeMode.contain,
        ...props,
      };
    }, [finalSource, priority, handleLoad, handleError, props, placeholder]);

    // Estilos dinámicos que usan sizes
    const dynamicStyles = useMemo(
      () => ({
        baseImage: {
          borderRadius: roundedCorners ? sizes.borderRadius2 : 0,
          width: '100%',
          height: '100%',
          // resizeMode: 'contain',
        },
        baseContainer: {
          borderRadius: roundedCorners ? sizes.borderRadius2 : 0,
          overflow: 'hidden',
        },
      }),
      [sizes.borderRadius2, roundedCorners],
    );

    return (
      <View
        style={[
          style,
          showSkeleton && styles.loadingContainer,
          dynamicStyles.baseContainer,
        ]}>
        {showSkeleton && (
          <ShimmerPlaceholder
            style={[
              style,
              styles.shimmerPlaceholder,
              dynamicStyles.baseImage,
              styles.shimmerOpacity,
            ]}
            visible={false}
            LinearGradient={LinearGradient}
          />
        )}
        <FastImage
          {...imageProps}
          // ensure the image itself also uses the baseImage rounding
          style={[
            useStyles && style,
            isLoading && styles.hiddenImage,
            !useStyles && dynamicStyles.baseImage,
          ]}
        />
      </View>
    );
  },
);

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerOpacity: {
    opacity: 0.3,
  },
  hiddenImage: {
    opacity: 0,
  },
});

export default OptimizedImage;
