import React, {useMemo, useCallback, useRef, useState, useEffect} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  InteractionManager,
  FlatList,
  // Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {ScrollView} from 'react-native-gesture-handler';
import {useDispatch, useSelector} from 'react-redux';
import ProductService from '../../services/api/ProductService';

import {setMenuSelected} from '../../redux/slice/storeSlice';
import {useTheme} from '../../providers/ThemeProvider';
import InstantImage from './InstantImage';

const MenuListComponentSmall = React.memo(
  ({
    setProductsFilterList, 
    selectedItem, 
    setSelectedItem, 
    isBagBlocked,
    triggerScrollToSection, // 🆕 Función para hacer scroll a una sección
    isUpdatingFromSpyScroll, // 🆕 Ref para detectar cambios desde scroll spy
  }) => {
    //  DEBUG: Detectar mount/unmount
    const instanceId = useRef(Math.random().toString(36).substr(2, 9));
    useEffect(() => {
      console.log(`🟢 [MenuListComponentSmall-${instanceId.current}] MOUNTED`);
      return () => {
        console.log(`🔴 [MenuListComponentSmall-${instanceId.current}] UNMOUNTED`);
      };
    }, []);
    
    // Estados para el carrusel de menús
    const scrollViewRef = useRef(null);
    const [currentMenuIndex, setCurrentMenuIndex] = useState(0);

    // Solo necesitamos los menús, que ya vienen con sus productos organizados
    const [menus, setMenus] = useState([]);
    
    // 🎯 Ref para comparar menús y evitar updates innecesarios
    const prevMenusRef = useRef([]);
    
    useEffect(() => {
      console.log(`🟢 [MenuListComponentSmall] Montado`);
      
      // Suscribirse a cambios en productos
      const unsubscribe = ProductService.subscribe(() => {
        const newMenus = ProductService.getMenus();
        
        // Solo actualizar si los menús realmente cambiaron
        if (newMenus.length !== prevMenusRef.current.length || 
            newMenus.some((menu, i) => menu.id !== prevMenusRef.current[i]?.id)) {
          console.log('🔄 [MenuListComponentSmall] Menús cambiaron:', newMenus.length);
          setMenus(newMenus);
          prevMenusRef.current = newMenus;
        }
      });
      
      // Obtener datos iniciales si ya existen
      const initialMenus = ProductService.getMenus();
      if (initialMenus.length > 0) {
        console.log('📦 [MenuListComponentSmall] Usando menús existentes:', initialMenus.length);
        setMenus(initialMenus);
        prevMenusRef.current = initialMenus;
      }
      
      // Cleanup
      return () => {
        console.log(`🔌 [MenuListComponentSmall] Desmontado`);
        unsubscribe();
      };
    }, []);
    

    // Selector para menuSelected de Redux (se mantiene porque se setea con dispatch)
    const menuSelected = useSelector(
      state => state.store.menuSelected,
      (prev, next) => prev?.id === next?.id,
    );
    const language = useSelector(state => state.settings.language);
    const dispatch = useDispatch();

    const {colors, dimensions, font_type} = useTheme();

    // Memoizar estilos
    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            paddingHorizontal: 20,
          },
          carouselWrapper: {
            position: 'relative',
            marginTop: -20,
            marginBottom: 15,
            width: '100%',
            alignItems: 'center',
          },
          arrowButton: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            zIndex: 10,
            width: 60,
            justifyContent: 'center',
            alignItems: 'center',
          },
          arrowButtonLeft: {
            left: -10,
          },
          arrowButtonRight: {
            right: -10,
          },
          arrowText: {
            fontSize: 40,
            color: colors.primary,
            fontWeight: 'bold',
          },
          customScrollBar: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
          },
          customScrollBarContent: {
            paddingRight: 15,
            marginRight: -15,
            marginBottom: 0,
          },
          menuItem: {
            marginHorizontal: 2,
            width: dimensions.width * 0.15,
            minHeight: 100,
            paddingVertical: 0,
            // justifyContent: 'center',
            // alignItems: 'center',
          },
          menuItemSelected: {
            borderBottomWidth: 3,
            borderBottomColor: colors.primary,
          },
          menuItemUnselected: {
            borderBottomWidth: 3,
            borderBottomColor: '#E0E0E0', // Gris claro para las no seleccionadas
          },
          menuName: {
            fontSize: dimensions.width * 0.012,
            color: colors.primary,
            fontFamily: font_type.bold,
            textAlign: 'center',
            textTransform: 'uppercase',
            marginTop: 5,
            flexWrap: 'wrap',
            lineHeight: dimensions.width * 0.015,
          },
          menuNameUnselected: {
            fontSize: dimensions.width * 0.012,
            color: colors.text,
            fontFamily: font_type.bold,
            textAlign: 'center',
            textTransform: 'uppercase',
            marginTop: 5,
            flexWrap: 'wrap',
            lineHeight: dimensions.width * 0.015,
          },
          menuImage: {
            width: dimensions.width * 0.08,
            height: dimensions.width * 0.08,
            alignSelf: 'center',
            marginBottom: 5,
            backgroundColor: 'transparent',
          },
          disabledCard: {
            opacity: 0.5,
          },
        }),
      [colors, dimensions, font_type],
    );

    // Los menús ya vienen ordenados desde ProductService

    // 🚀 Ref para rastrear si el cambio de selectedItem vino del scroll spy
    // Ya no lo necesitamos localmente - viene como prop
    
    // 🎯 NUEVO ENFOQUE: Solo hacer scroll automático en el menú si viene de un CLICK
    // NO hacerlo cuando viene del scroll spy, para que el usuario pueda explorar libremente
    // Esto resuelve el problema de que el menú "salte" de vuelta cuando scrolleas
    
    // El useEffect anterior se elimina completamente para evitar interferencias

    // Funciones para navegación manual del carrusel
    const goToPreviousMenu = useCallback(() => {
      if (menus.length === 0) {
        return;
      }

      const newIndex =
        currentMenuIndex > 0 ? currentMenuIndex - 1 : menus.length - 1;
      setCurrentMenuIndex(newIndex);

      if (scrollViewRef.current) {
        const menuWidth = dimensions.width * 0.15 + 4; // ancho del item + margin
        const scrollPosition = newIndex * menuWidth;
        // 🚀 CORRECCIÓN: FlatList usa scrollToOffset en lugar de scrollTo
        scrollViewRef.current.scrollToOffset({
          offset: scrollPosition,
          animated: true,
        });
      }
    }, [menus.length, currentMenuIndex, dimensions.width]);

    const goToNextMenu = useCallback(() => {
      if (menus.length === 0) {
        return;
      }

      const newIndex =
        currentMenuIndex < menus.length - 1 ? currentMenuIndex + 1 : 0;
      setCurrentMenuIndex(newIndex);

      if (scrollViewRef.current) {
        const menuWidth = dimensions.width * 0.15 + 4; // ancho del item + margin
        const scrollPosition = newIndex * menuWidth;
        // 🚀 CORRECCIÓN: FlatList usa scrollToOffset en lugar de scrollTo
        scrollViewRef.current.scrollToOffset({
          offset: scrollPosition,
          animated: true,
        });
      }
    }, [menus.length, currentMenuIndex, dimensions.width]);

    // 🆕 Memoizar la función handleMenuPress para hacer scroll a la sección
    const handleMenuPress = useCallback(
      menu => {
        console.log('🎯 [MenuListComponentSmall] Click en menú:', menu.id);
        
        // 🚀 Actualizar UI inmediatamente para feedback visual rápido
        setSelectedItem(menu.id);
        
        // 🚀 Hacer scroll en el menú horizontal cuando el usuario hace CLICK
        const selectedIndex = menus.findIndex(m => m.id == menu.id);
        if (selectedIndex !== -1 && scrollViewRef.current) {
          const menuWidth = dimensions.width * 0.15 + 4;
          const scrollPosition = selectedIndex * menuWidth;
          scrollViewRef.current.scrollToOffset({
            offset: scrollPosition,
            animated: true,
          });
          setCurrentMenuIndex(selectedIndex);
        }
        
        // 🚀 Ejecutar acciones inmediatamente sin delay
        dispatch(setMenuSelected(menu));
        
        // 🆕 Hacer scroll a la sección en ProductListComponent
        if (triggerScrollToSection) {
          triggerScrollToSection(menu.id);
        }
      },
      [dispatch, setSelectedItem, triggerScrollToSection, menus, dimensions.width],
    );

    const defaultImageUrl =
      'https://dunkin-ar.s3.amazonaws.com/images/Fresh_beef_burger_isolated_-1_Background_Removed.png';

    // 🚀 OPTIMIZACIÓN: Renderizar cada item del menú con useCallback
    const renderMenuItem = useCallback(
      ({item: section}) => {
        const isSelected = selectedItem == section.id; // Comparación flexible para manejar string/number
        const imageUrl =
          section.image !== null ? section.image : defaultImageUrl;

        return (
          <TouchableOpacity
            onPress={() => handleMenuPress(section)}
            style={[
              styles.menuItem,
              isSelected ? styles.menuItemSelected : styles.menuItemUnselected,
              isBagBlocked && styles.disabledCard
            ]}
            activeOpacity={0.8}
            disabled={isBagBlocked}>
            <View>
              <InstantImage
                source={{
                  uri: imageUrl,
                }}
                style={styles.menuImage}
                resizeMode={FastImage.resizeMode.contain}
              />
              <Text
                style={
                  isSelected ? styles.menuName : styles.menuNameUnselected
                }
                numberOfLines={0}>
                {language === 'es' ? section.name_es : section.name_en}
              </Text>
            </View>
          </TouchableOpacity>
        );
      },
      [selectedItem, language, styles, handleMenuPress, isBagBlocked, defaultImageUrl],
    );

    return (
      <View style={styles.container}>
        <View style={styles.carouselWrapper}>
          {menus.length > 1 && (
            <TouchableOpacity
              style={[
                styles.arrowButton,
                styles.arrowButtonLeft,
                isBagBlocked && styles.disabledCard,
              ]}
              onPress={goToPreviousMenu}
              disabled={isBagBlocked}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
          )}

          <View style={styles.customScrollBar}>
            <FlatList
              ref={scrollViewRef}
              data={menus}
              renderItem={renderMenuItem}
              keyExtractor={(item) => `menu-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.customScrollBarContent}
              // 🚀 OPTIMIZACIONES DE RENDIMIENTO
              initialNumToRender={8}
              maxToRenderPerBatch={4}
              windowSize={11}
              removeClippedSubviews={false} // Desactivado para evitar huecos visuales
              getItemLayout={(data, index) => ({
                length: dimensions.width * 0.15 + 4,
                offset: (dimensions.width * 0.15 + 4) * index,
                index,
              })}
              onMomentumScrollEnd={event => {
                if (menus.length > 1) {
                  const menuWidth = dimensions.width * 0.15 + 4;
                  const newIndex = Math.round(
                    event.nativeEvent.contentOffset.x / menuWidth,
                  );
                  if (
                    newIndex !== currentMenuIndex &&
                    newIndex >= 0 &&
                    newIndex < menus.length
                  ) {
                    setCurrentMenuIndex(newIndex);
                  }
                }
              }}
            />
          </View>

          {menus.length > 1 && (
            <TouchableOpacity
              style={[
                styles.arrowButton,
                styles.arrowButtonRight,
                isBagBlocked && styles.disabledCard,
              ]}
              onPress={goToNextMenu}
              disabled={isBagBlocked}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  },
  // 🚀 OPTIMIZACIÓN: Comparador personalizado para evitar re-renders innecesarios
  (prevProps, nextProps) => {
    // Usar comparación flexible para selectedItem (permite string == number)
    const selectedItemUnchanged = prevProps.selectedItem == nextProps.selectedItem;
    const bagBlockedUnchanged = prevProps.isBagBlocked === nextProps.isBagBlocked;
    
    return selectedItemUnchanged && bagBlockedUnchanged;
  }
);

export default MenuListComponentSmall;
