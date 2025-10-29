import React, {useState, useEffect} from 'react';
import {Image, View, ActivityIndicator} from 'react-native';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';

/**
 * 🚀 IMAGEN INSTANTÁNEA - Optimizada para imágenes locales y remotas
 * Usa Image nativo para file:// y FastImage para http://
 */
const InstantImage = React.memo(({
  source,
  style,
  resizeMode = FastImage.resizeMode.contain,
  ...restProps
}) => {
  const uri = typeof source === 'string' ? source : source?.uri;
  const [isValid, setIsValid] = useState(true);
  
  // Detectar si es una imagen local
  const isLocalImage = uri?.startsWith('file://');
  
  // Verificar que el archivo local existe (solo en desarrollo)
  useEffect(() => {
    if (isLocalImage && __DEV__) {
      const filePath = uri.replace('file://', '');
      RNFS.exists(filePath).then(exists => {
        if (!exists) {
          console.warn(`⚠️ [InstantImage] Archivo no existe: ${filePath}`);
          setIsValid(false);
        }
      });
    }
  }, [uri, isLocalImage]);
  
  if (!uri || !isValid) {
    return null;
  }
  
  // Para imágenes locales, usar Image nativo de React Native
  // Esto es más confiable en release builds
  if (isLocalImage) {
    const nativeResizeMode = 
      resizeMode === FastImage.resizeMode.contain ? 'contain' :
      resizeMode === FastImage.resizeMode.cover ? 'cover' :
      resizeMode === FastImage.resizeMode.stretch ? 'stretch' :
      resizeMode === FastImage.resizeMode.center ? 'center' : 'contain';
    
    return (
      <View style={style}>
        <Image
          source={{uri: uri}}
          style={style}
          resizeMode={nativeResizeMode}
          fadeDuration={0} // Sin animación de fade
          {...restProps}
        />
      </View>
    );
  }
  
  // Para imágenes remotas, usar FastImage
  return (
    <FastImage
      source={{
        uri: uri,
        priority: FastImage.priority.high,
        cache: FastImage.cacheControl.immutable,
      }}
      style={style}
      resizeMode={resizeMode}
      {...restProps}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if URI or style changes
  const prevUri = typeof prevProps.source === 'string' ? prevProps.source : prevProps.source?.uri;
  const nextUri = typeof nextProps.source === 'string' ? nextProps.source : nextProps.source?.uri;
  return prevUri === nextUri && prevProps.style === nextProps.style;
});

InstantImage.displayName = 'InstantImage';

export default InstantImage;