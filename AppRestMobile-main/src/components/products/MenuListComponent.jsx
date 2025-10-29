import React, {useMemo, useCallback, useState, useEffect, useRef} from 'react';
import {
  // Dimensions,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {ScrollView} from 'react-native-gesture-handler';
import {useDispatch, useSelector} from 'react-redux';
import {setMenuSelected} from '../../redux/slice/storeSlice';
import ProductService from '../../services/api/ProductService';

import {useTheme} from '../../providers/ThemeProvider';
import InstantImage from './InstantImage';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';

const MenuListComponent = ({
  setProductsFilterList,
  setSelectedFilter,
  setSelectedItem,
  isBagBlocked = false,
  triggerScrollToSection, // 🆕 Recibir función para hacer scroll
  navigation, // 🆕 Para navegación entre pantallas
  onSectionPress, // 🆕 Callback cuando se presiona una sección
}) => {
  // Debug logging disabled for performance
  
  // Solo necesitamos los menús, que ya vienen con sus productos organizados
  const [menus, setMenus] = useState([]);
  
  useEffect(() => {
    console.log('🔌 [MenuListComponent] Montado');
    
    // Suscribirse a cambios en productos
    const unsubscribe = ProductService.subscribe(() => {
      // Obtener menús actualizados del servicio
      const newMenus = ProductService.getMenus();
      console.log('📂 [MenuListComponent] Menús actualizados:', newMenus.length);
      setMenus(newMenus);
    });
    
    // Obtener datos iniciales si ya existen
    const initialMenus = ProductService.getMenus();
    if (initialMenus.length > 0) {
      console.log('📦 [MenuListComponent] Usando menús existentes:', initialMenus.length);
      setMenus(initialMenus);
    }
    
    // Cleanup
    return () => {
      console.log('🔌 [MenuListComponent] Desmontado');
      unsubscribe();
    };
  }, []);
  
  const language = useSelector(state => state.settings.language);
  const dispatch = useDispatch();
  const {colors, dimensions, font_type, sizes} = useTheme();

  // Los menús ya vienen ordenados desde ProductService

  // Memoizar estilos
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
          marginTop: dimensions.height * 0.02,
        },
        scrollViewContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center', // ← aquí el cambio
          paddingBottom: dimensions.height * 0.07,
        },
        menuItem: {
          width: dimensions.width * 0.25,
          height: dimensions.height * 0.18,
          backgroundColor: colors.white,
          borderRadius: sizes.cardRadius,
          flexDirection: 'row',
          overflow: 'hidden',
          marginVertical: 10,
          marginHorizontal: 16, // ← esto genera espacio entre las cards
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        textContainer: {
          width: '60%',
          justifyContent: 'center',
          paddingHorizontal: 30,
        },
        menuName: {
          fontSize: dimensions.width * 0.011, // un poco más pequeño
          color: colors.text,
          fontFamily: font_type.bold,
          textAlign: 'left',
          textTransform: 'uppercase',
        },
        imageContainer: {
          width: '50%',
          height: '100%',
        },
        menuImage: {
          width: 200,
          height: 200,
          resizeMode: 'contain',
          transform: [{translateX: -15}, {translateY: -10}],
        },
        disabledCard: {
          opacity: 0.5,
        },
      }),
    [colors, dimensions, font_type, sizes],
  );

  // Navegación optimizada - usar callback o navegación
  const handleMenuPress = useCallback(
    menu => {
      console.log('🎯 [MenuListComponent] Click en sección:', menu.name_es, menu.id);
      
      // 🚀 CRÍTICO: Ejecutar dispatch INMEDIATAMENTE antes de cualquier navegación
      dispatch(setMenuSelected(menu));
      
      // 🚀 NUEVO: Si hay onSectionPress (navegación), usarlo
      if (onSectionPress) {
        console.log('✅ [MenuListComponent] Navegación a ProductsListView');
        onSectionPress(menu.id);
        return;
      }
      
      // 🔄 MODO LEGACY: Para compatibilidad con ProductsView antigua
      if (triggerScrollToSection) {
        console.log('✅ [MenuListComponent] Navegación optimizada (legacy)');
        
        // 🚀 CRÍTICO: Ejecutar TODO inmediatamente, sin delays
        setSelectedFilter(true);
        setSelectedItem(menu.id);
        // Ya no usar InteractionManager - ejecutar todo inmediatamente
      } else {
        // Fallback al modo filtrado
        console.log('⚠️ [MenuListComponent] Fallback: modo filtrado');
        
        // 🚀 CRÍTICO: Ejecutar TODO inmediatamente
        setSelectedItem(menu.id);
        setSelectedFilter(true);
        const filterProducts = menu.products || [];
        setProductsFilterList(filterProducts);
        // Ya no usar InteractionManager
      }
    },
    [
      setProductsFilterList,
      setSelectedFilter,
      setSelectedItem,
      dispatch,
      triggerScrollToSection,
      onSectionPress,
    ],
  );

  // let imageUrl = 'https://placehold.co/950x950.png';
  const defaultImageUrl =
    'https://dunkin-ar.s3.amazonaws.com/images/Fresh_beef_burger_isolated_-1_Background_Removed.png';

  // Memoizar la lista de menús renderizada
  const menusList = useMemo(
    () =>
      menus.map(section => {
        const imageUrl =
          section.image !== null ? section.image : defaultImageUrl;

        return (
          <TouchableOpacity
            key={section.id}
            onPress={() => handleMenuPress(section)}
            disabled={isBagBlocked}
            style={[styles.menuItem, isBagBlocked && styles.disabledCard]}>
            <View style={styles.textContainer}>
              <Text style={styles.menuName}>
                {language === 'es'
                  ? section.name_es
                  : section.name_en || section.name_en}
              </Text>
            </View>
            <InstantImage
              source={{
                uri: imageUrl,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.menuImage}
              resizeMode={FastImage.resizeMode.contain}
            />
          </TouchableOpacity>
        );
      }),
    [menus, language, handleMenuPress, styles, isBagBlocked],
  );

  const truncatedList = menusList;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {truncatedList}
      </ScrollView>
    </View>
  );
};

export default React.memo(MenuListComponent);
