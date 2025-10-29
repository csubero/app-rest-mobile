import React, {useState, useCallback, useRef, useMemo, useEffect} from 'react';
import {View, TouchableOpacity, Text, ScrollView} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../providers/ThemeProvider';
import MenuListComponent from '../../components/products/MenuListComponent';
import Icon from 'react-native-vector-icons/FontAwesome6';
import InstantImage from '../../components/products/InstantImage';
import createStyles from './styles';

// Componente memoizado para las tarjetas promocionales
const MemoizedPromoCard = React.memo(
  ({imageUrl, isBagBlocked, onPress}) => {
    const {dimensions} = useTheme();

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isBagBlocked || !onPress}
        style={{
          width: dimensions.width * 0.387,
          height: dimensions.height * 0.22,
          marginRight: 15,
          borderRadius: 10,
          overflow: 'hidden',
        }}
        activeOpacity={0.8}>
        <InstantImage
          source={{uri: imageUrl}}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) =>
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.isBagBlocked === nextProps.isBagBlocked,
);

const ProductsMenuView = ({
  navigation,
  promoBanners = [],
  isBagBlocked = false,
  onBannerSectionSelect,
  onSectionSelect,
}) => {
  // 🔍 DEBUG: Rastrear renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log(`[ProductsMenuView] 🎨 Render #${renderCountRef.current}`);
  
  const {i18n} = useTranslation();
  const language = i18n.language;
  const {dimensions, commonStyles, colors, withOpacity} = useTheme();
  
  const styles = useMemo(
    () => createStyles({commonStyles, colors, dimensions, withOpacity}),
    [commonStyles, colors, dimensions, withOpacity]
  );

  const scrollViewRef = useRef(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const goToNextBanner = useCallback(() => {
    if (promoBanners.length <= 1) return;
    const nextIndex = (currentBannerIndex + 1) % promoBanners.length;
    const bannerWidth = dimensions.width * 0.387 + 15;
    scrollViewRef.current?.scrollTo({
      x: nextIndex * bannerWidth,
      animated: true,
    });
    setCurrentBannerIndex(nextIndex);
  }, [currentBannerIndex, promoBanners.length, dimensions.width]);

  const goToPreviousBanner = useCallback(() => {
    if (promoBanners.length <= 1) return;
    const prevIndex =
      currentBannerIndex === 0
        ? promoBanners.length - 1
        : currentBannerIndex - 1;
    const bannerWidth = dimensions.width * 0.387 + 15;
    scrollViewRef.current?.scrollTo({
      x: prevIndex * bannerWidth,
      animated: true,
    });
    setCurrentBannerIndex(prevIndex);
  }, [currentBannerIndex, promoBanners.length, dimensions.width]);

  // Función para navegar a la vista de productos
  const handleSectionPress = useCallback(
    sectionId => {
      if (onSectionSelect) {
        onSectionSelect(sectionId);
      } else if (navigation) {
        navigation.navigate('ProductsList', {
          sectionId: sectionId,
        });
      }
    },
    [onSectionSelect, navigation],
  );

  return (
    <View style={styles.container}>
      {/* Banners promocionales */}
      {promoBanners.length > 0 && (
        <View style={styles.horizontalCards}>
          <View style={styles.carouselWrapper}>
            {promoBanners.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.arrowButton,
                  styles.arrowButtonLeft,
                  isBagBlocked && {opacity: 0.5},
                ]}
                onPress={goToPreviousBanner}
                disabled={isBagBlocked}>
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
            )}

            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={promoBanners.length > 1}
              decelerationRate={promoBanners.length > 1 ? 'fast' : 'normal'}
              snapToInterval={
                promoBanners.length > 1
                  ? dimensions.width * 0.387 + 15
                  : undefined
              }
              snapToAlignment={promoBanners.length > 1 ? 'start' : undefined}
              onMomentumScrollEnd={event => {
                if (promoBanners.length > 1) {
                  const bannerWidth = dimensions.width * 0.387 + 15;
                  const newIndex = Math.round(
                    event.nativeEvent.contentOffset.x / bannerWidth,
                  );
                  if (
                    newIndex !== currentBannerIndex &&
                    newIndex >= 0 &&
                    newIndex < promoBanners.length
                  ) {
                    setCurrentBannerIndex(newIndex);
                  }
                }
              }}>
              {promoBanners.map(banner => {
                const imageUrl =
                  language === 'en'
                    ? banner.image_url_en || banner.image_url
                    : banner.image_url;

                return (
                  <MemoizedPromoCard
                    key={banner.id}
                    imageUrl={imageUrl}
                    isBagBlocked={isBagBlocked}
                    onPress={
                      banner.section && onBannerSectionSelect
                        ? () => onBannerSectionSelect(banner.section)
                        : null
                    }
                  />
                );
              })}
            </ScrollView>

            {promoBanners.length > 1 && (
              <TouchableOpacity
                style={[
                  styles.arrowButton,
                  styles.arrowButtonRight,
                  isBagBlocked && {opacity: 0.5},
                ]}
                onPress={goToNextBanner}
                disabled={isBagBlocked}>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Grid de secciones */}
      <MenuListComponent
        navigation={navigation}
        isBagBlocked={isBagBlocked}
        onSectionPress={handleSectionPress}
      />
    </View>
  );
};

// 🚀 OPTIMIZACIÓN: Usar React.memo para evitar re-renders innecesarios
export default React.memo(ProductsMenuView, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian props relevantes
  return prevProps.navigation === nextProps.navigation &&
         prevProps.isBagBlocked === nextProps.isBagBlocked &&
         prevProps.promoBanners === nextProps.promoBanners &&
         prevProps.onBannerSectionSelect === nextProps.onBannerSectionSelect &&
         prevProps.onSectionSelect === nextProps.onSectionSelect;
});
