import React, {useRef, useState, useEffect, useCallback} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import ProductListComponent from '../../components/products/ProductListComponent';
import MenuListComponent from '../../components/products/MenuListComponent';
import PromoCard from '../../components/products/PromoCard';
import {useGlobalSocket} from '../../providers/GlobalSocketProvider';
import {useSelector} from 'react-redux';

const MemoizedPromoCard = React.memo(PromoCard);

// Componente unificado para listar productos o mostrar el menú
const ProductsView = React.memo(
  ({
    selectedFilter,
    products = [],
    selectedItem,
    setProductsFilterList,
    setSelectedFilter,
    setSelectedItem,
    navigation,
    // Nuevos props para carrusel
    promoBanners = [],
    language = 'es',
    dimensions,
    styles,
    onBannerSectionSelect,
  }) => {
    // console.log('🎨 [ProductsView] Renderizando con:', {
    //   productsCount: products.length,
    //   selectedFilter,
    //   promoBannersCount: promoBanners.length
    // });
    
    const scrollViewRef = useRef(null);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    
    // 🆕 Estado para manejar la sección activa (para spy scroll)
    const [activeSection, setActiveSection] = useState(null);
    
    // 🆕 Estado para prevenir scroll automático al regresar del detalle
    const isReturningFromDetail = useRef(false);
    
    // 🆕 Detectar cuando regresamos a esta pantalla
    useFocusEffect(
      useCallback(() => {
        // Marcar que estamos regresando (probablemente del detalle)
        isReturningFromDetail.current = true;
        
        // Después de un tiempo, resetear el flag
        const timer = setTimeout(() => {
          isReturningFromDetail.current = false;
        }, 1000);
        
        return () => clearTimeout(timer);
      }, [])
    );
    
    // 🆕 Ref para la función de scroll del ProductListComponent
    const scrollToSectionRef = useRef(null);
    
    // 🆕 Callback para recibir la función de scroll desde ProductListComponent
    const handleScrollToSection = (scrollFn) => {
      scrollToSectionRef.current = scrollFn;
    };
    
    // 🆕 Función simple - delegar el timing al componente
    const triggerScrollToSection = useCallback((sectionId) => {
      console.log('🎯 [ProductsView] triggerScrollToSection llamado:', sectionId);
      if (scrollToSectionRef.current) {
        scrollToSectionRef.current(sectionId);
      }
    }, []);

    // Removed isMultitabletBlocked - no longer blocking tablets
    const paymentFlow = useSelector(
      state => state.paymentFlow,
      (prev, next) =>
        prev?.splits?.isBlocked === next?.splits?.isBlocked,
    );
    const isBagBlocked = paymentFlow?.splits?.isBlocked;

    const goToPreviousBanner = () => {
      if (promoBanners.length === 0) {
        return;
      }
      const newIndex =
        currentBannerIndex > 0
          ? currentBannerIndex - 1
          : promoBanners.length - 1;
      setCurrentBannerIndex(newIndex);
      if (scrollViewRef.current) {
        const bannerWidth = dimensions.width * 0.387 + 15;
        const scrollPosition = newIndex * bannerWidth;
        scrollViewRef.current.scrollTo({x: scrollPosition, animated: true});
      }
    };

    const goToNextBanner = () => {
      if (promoBanners.length === 0) {
        return;
      }
      const newIndex =
        currentBannerIndex < promoBanners.length - 1
          ? currentBannerIndex + 1
          : 0;
      setCurrentBannerIndex(newIndex);
      if (scrollViewRef.current) {
        const bannerWidth = dimensions.width * 0.387 + 15;
        const scrollPosition = newIndex * bannerWidth;
        scrollViewRef.current.scrollTo({x: scrollPosition, animated: true});
      }
    };

    // � NUEVA ESTRATEGIA: Renderizar SIEMPRE la lista completa con el menú
    // 🚀 Renderizado condicional simple - más compatible con React Native
    return (
      <>
        {/* Vista de menú principal */}
        {!selectedFilter && products.length > 0 && (
          <>
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

            <MenuListComponent
              setProductsFilterList={setProductsFilterList}
              setSelectedFilter={setSelectedFilter}
              setSelectedItem={setSelectedItem}
              isBagBlocked={isBagBlocked}
              triggerScrollToSection={triggerScrollToSection}
            />
          </>
        )}
        
        {/* Lista de productos - Siempre montado, solo oculto */}
        <View style={{
          display: selectedFilter ? 'flex' : 'none',
          flex: 1,
          width: '100%',
          height: '100%'
        }}>
          <ProductListComponent
            setProductsFilterList={setProductsFilterList}
            selectedItem={selectedItem}
            products={products}
            navigation={navigation}
            setSelectedItem={setSelectedItem}
            isBagBlocked={isBagBlocked}
            onScrollToSection={handleScrollToSection}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            triggerScrollToSection={triggerScrollToSection}
            isReturningFromDetail={isReturningFromDetail}
          />
        </View>
      </>
    );
  },
  // 🚀 OPTIMIZACIÓN: Comparación simple para evitar overhead
  (prevProps, nextProps) => {
    return (
      prevProps.selectedFilter === nextProps.selectedFilter &&
      prevProps.products.length === nextProps.products.length &&
      prevProps.selectedItem?.id === nextProps.selectedItem?.id
    );
  }
);

export default ProductsView;
