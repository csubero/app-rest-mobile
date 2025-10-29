/* eslint-disable react-hooks/exhaustive-deps */
/**
 * 🚀 OPTIMIZACIONES APLICADAS:
 * 1. Usar product.full_price (ya incluye impuestos) en lugar de calcular
 * 2. Usar modifier.price_with_taxes cuando esté disponible
 * 3. Convertir calculateProductTotal de useCallback + useState a useMemo
 * 4. Componentes memoizados: ProductBasicInfo, ModifierItem, TotalPriceDisplay
 * 5. Función memoizada getModifierDisplayPrice para evitar recálculos
 * 6. Eliminar cálculos redundantes de impuestos
 */
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import {
  Image,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  InteractionManager,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Utils from '../../helpers/utils/Utils';
import ProductQuantityPicker from '../../components/products/ProductQuantityPicker';
import ModifierQuantityPicker from '../../components/products/ModifierQuantityPicker';
import TakeAwaySwitch from '../../components/general/TakeAwaySwitch';
import InstantImage from '../../components/products/InstantImage';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {addProduct, updateProductByIndex} from '../../redux/slice/bagSlice';
import Icon from 'react-native-vector-icons/FontAwesome6';
import ProductService from '../../services/api/ProductService';
import RecommendationItem from '../../components/bag/RecommendationItem';

import {useTheme} from '../../providers/ThemeProvider';

// 🚀 OPTIMIZACIÓN: Debug condicional para mejor rendimiento en producción
const DEBUG = __DEV__ && false; // Cambiar a true solo para debugging
const debugLog = (...args) => {
  if (DEBUG) console.log(...args);
};

// �️ FEATURE FLAG: Mostrar/ocultar productos recomendados
const SHOW_RECOMMENDATIONS = false; // Cambiar a true para activar recomendaciones

// �🎨 Helper para formatear texto con solo la primera letra en mayúscula
const formatTextCapitalized = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// 🎨 Constantes para display_mode de customizaciones
const DISPLAY_MODE_LIST = 1;
const DISPLAY_MODE_CAROUSEL = 2;
const DISPLAY_MODE_GRID = 3;

import createStyles from './styles';

// Componente memoizado para la información básica del producto
const ProductBasicInfo = React.memo(({ 
  imageUrl, 
  productName, 
  productDescription, 
  product, 
  fromText, 
  isTakeAway, 
  setIsTakeAway, 
  quantity, 
  setQuantity, 
  styles,
  colors,
  font_type,
  dimensions
}) => (
  <ScrollView
    contentContainerStyle={{
      paddingBottom: 40,
    }}
    showsVerticalScrollIndicator={false}>
    <InstantImage
      source={{uri: imageUrl}}
      style={[styles.productImage]}
      resizeMode="contain"
    />
    <View style={styles.productInfoContainer}>
      <Text
        style={[
          styles.title_h3,
          {
            fontSize: dimensions.width * 0.02,
            marginBottom: 10,
            marginTop: 10,
            fontFamily: font_type.bold,
          },
        ]}>
        {productName}
      </Text>
      {productDescription && (
        <Text style={styles.productDescription}>{productDescription}</Text>
      )}
      <Text style={styles.priceTag}>
        {fromText}
        {Utils.formatCurrency(product.full_price, product.currency)}
      </Text>

      <TakeAwaySwitch
        isTakeAway={isTakeAway}
        onToggle={() => setIsTakeAway(prev => !prev)}
        width={280}
      />

      <ProductQuantityPicker
        quantity={quantity}
        setQuantity={setQuantity}
        small={true}
        home={true}
      />
    </View>
  </ScrollView>
), (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.productName === nextProps.productName &&
    prevProps.productDescription === nextProps.productDescription &&
    prevProps.fromText === nextProps.fromText &&
    prevProps.quantity === nextProps.quantity &&
    prevProps.isTakeAway === nextProps.isTakeAway &&
    prevProps.product.full_price === nextProps.product.full_price
  );
});

// Componente memoizado para modificadores para evitar re-renders
const ModifierItem = React.memo(({ 
  modifier, 
  isSelected, 
  modifierName, 
  onModifierPress, 
  getModifierDisplayPrice,
  currency,
  styles,
  isSingleSelection,
  isMultipleButMaxOne,
  isMultipleWithPicker,
  selectedModifier,
  onQuantityChange
}) => (
  <TouchableWithoutFeedback onPress={onModifierPress}>
    <View style={[
      styles.listModifierContainer,
      isSelected && styles.listModifierContainerSelected
    ]}>
      <View style={styles.listModifierContent}>
        <Text style={[
          styles.listModifierName,
          isSelected && styles.listModifierNameSelected
        ]}>
          {formatTextCapitalized(modifierName)}
        </Text>
        <Text style={[
          styles.listModifierPrice,
          isSelected && styles.listModifierPriceSelected
        ]}>
          + {Utils.formatCurrency(
            getModifierDisplayPrice(modifier),
            currency,
          )}
        </Text>
      </View>
      
      {/* Control de selección según tipo */}
      {isSingleSelection && (
        <View style={styles.radioButtonContainer}>
          <View style={[
            styles.radioButton,
            isSelected && styles.radioButtonSelected
          ]}>
            {isSelected && <View style={styles.radioButtonInner} />}
          </View>
        </View>
      )}

      {isMultipleButMaxOne && (
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && (
              <Text style={styles.checkboxCheck}>✓</Text>
            )}
          </View>
        </View>
      )}

      {isMultipleWithPicker && selectedModifier && selectedModifier.cantidad > 0 && (
        <View style={styles.listQuantityContainer}>
          <ModifierQuantityPicker
            quantity={selectedModifier.cantidad}
            setQuantity={onQuantityChange}
            modifier={modifier}
            customization_id={selectedModifier.customization_id}
            customization_selection_type="multiple"
            customization_custom_id={selectedModifier.codigo_modificador}
          />
        </View>
      )}
    </View>
  </TouchableWithoutFeedback>
), (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.modifierName === nextProps.modifierName &&
    prevProps.modifier.id === nextProps.modifier.id &&
    prevProps.selectedModifier?.cantidad === nextProps.selectedModifier?.cantidad &&
    prevProps.getModifierDisplayPrice(prevProps.modifier) === nextProps.getModifierDisplayPrice(nextProps.modifier)
  );
});

// Componente memoizado para mostrar el precio total
const TotalPriceDisplay = React.memo(({ totalProductBag, currency, styles }) => (
  <View style={styles.totalPriceContainer}>
    {/* Barrita vertical */}
    <View style={styles.verticalDivider} />
    {/* Texto Total */}
    <Text style={styles.totalText}>
      Total {Utils.formatCurrency(totalProductBag, currency)}
    </Text>
  </View>
), (prevProps, nextProps) => {
  return (
    prevProps.totalProductBag === nextProps.totalProductBag &&
    prevProps.currency === nextProps.currency
  );
});

// Componente de botón de regresar con especificaciones exactas
const BackButton = React.memo(({ onPress, styles, colors, isDisabled = false }) => (
  <TouchableOpacity
    style={[
      styles.customBackButton,
      {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#CCC',
      },
      isDisabled && styles.customBackButtonDisabled
    ]}
    onPress={onPress}
    disabled={isDisabled}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel="Regresar"
    accessibilityHint="Toca para volver a la pantalla anterior"
  >
    <Icon 
      name="chevron-left" 
      size={32} 
      color={colors.primary} 
      solid 
    />
  </TouchableOpacity>
), (prevProps, nextProps) => {
  return (
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.colors.primary === nextProps.colors.primary
  );
});



const ProductDetailView = ({route, navigation}) => {
  // Performance tracking removed for speed
  
  // 🚀 OPTIMIZACIÓN: Usar datos directos o buscar por SKU como fallback
  let {product, productData, productIndex, isRecomendation, productSku} = route.params || {};
  const isUpdate = typeof productIndex === 'number';
  
  // Si no hay producto pero hay SKU, buscar por SKU como fallback
  if (!product && productSku) {
    product = ProductService.getProductBySku(productSku);
    if (__DEV__) {
      console.log('🔍 [ProductDetailView] Producto encontrado por SKU:', !!product);
    }
  }
  
  // Si es actualización y no hay producto, buscar por SKU del productData
  if (!product && isUpdate && productData?.sku) {
    product = ProductService.getProductBySku(productData.sku);
    if (__DEV__) {
      console.log('🔍 [ProductDetailView] Producto encontrado por productData.sku:', !!product);
    }
  }
  
  // Debug para entender qué datos llegan
  if (__DEV__) {
    console.log('🔍 [ProductDetailView] Route params:', {
      hasProduct: !!product,
      hasProductData: !!productData,
      productIndex,
      isRecomendation,
      productSku,
      productDataSku: productData?.sku,
      productId: product?.id,
      productName: product?.name_es || product?.name_en,
    });
  }
  
  // useEffect para manejar navegación cuando no hay producto (evita setState en render)
  useEffect(() => {
    if (!product) {
      if (__DEV__) {
        console.error('❌ [ProductDetailView] Producto no encontrado después de todos los fallbacks');
        console.error('Route params completos:', route.params);
        console.error('ProductService disponible:', !!ProductService);
        console.error('ProductService.getProductBySku:', typeof ProductService.getProductBySku);
      }
      navigation.goBack();
    }
  }, [product, navigation, route.params]);
  
  // Early return si no hay producto
  if (!product) {
    return null;
  }
  
  // Debug logging removed for speed
  const [quantity, setQuantity] = useState(
    isUpdate ? productData.quantity || 1 : 1,
  );


  // Loader removido - optimización de UX
  const [isPickerActive, setIsPickerActive] = useState(false);
  
  // Estados para category groups
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState(null);
  const [showCategoryGroups, setShowCategoryGroups] = useState(true);
  // 🚀 OPTIMIZACIÓN: Lazy initial state para mejor rendimiento inicial
  const [categoryGroupSelections, setCategoryGroupSelections] = useState(() => ({}));
  const [categoryGroupSizes, setCategoryGroupSizes] = useState(() => ({}));
  const [categoryGroupNestedSelections, setCategoryGroupNestedSelections] = useState(() => ({}));
  // 🚀 OPTIMIZACIÓN: Inicializar grupos usando is_opened, pero TODO se renderiza en memoria
  const [expandedGroups, setExpandedGroups] = useState(() => {
    if (product.has_category_groups && product.category_groups) {
      const initialExpanded = {};
      product.category_groups.forEach(group => {
        // Usar el campo is_opened del grupo, o false por defecto
        initialExpanded[group.id] = group.is_opened === true || group.is_opened === 1;
      });
      return initialExpanded;
    }
    return {};
  });

  // Estado para animaciones de productos recomendados
  const [recommendationAnimations, setRecommendationAnimations] = useState({});
  const recommendationAnimRefs = useRef({});

  const {commonStyles, colors, dimensions, font_type, sizes, withOpacity} =
    useTheme();

  // Estado para saber si es para llevar
  const [isTakeAway, setIsTakeAway] = useState(
    isUpdate ? productData?.isTakeAway || false : false,
  );
  


  // 🚀 OPTIMIZACIÓN: Memoizar wrapText para evitar recreación
  const wrapText = useCallback((text, maxWordsPerLine) => {
    const words = text.split(' ');
    const lines = [];
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
    }
    return lines.join('\n');
  }, []);

  // 🚀 OPTIMIZACIÓN: Lazy evaluation de customizations para carga rápida
  const customizations = useMemo(() => {
    // Fast path para productos sin customizations
    if (!product.has_category_groups) {
      const simpleCustomizations = product.section?.customizations || product.customizations || [];
      return simpleCustomizations;
    }
    
    // Para category_groups, lazy evaluation
    if (product.has_category_groups && product.category_groups) {
      return product.category_groups.flatMap(group => group.customizations || []);
    }
    
    return product.section?.customizations || product.customizations || [];
  }, [product.has_category_groups, product.category_groups, product.section?.customizations, product.customizations]);

  // 🚀 OPTIMIZACIÓN: Recomendaciones directas sin cálculo adicional
  const recomendations = product.recommended_products || [];

  // 🚀 OPTIMIZACIÓN: initialState directo sin cálculo
  const initialState = {
    ...product,
    quantity: quantity,
    customizations: isUpdate ? productData?.customizations || [] : [],
  };

  // 🚀 OPTIMIZACIÓN: Estilos directos para renderizado inmediato
  const styles = createStyles({
    commonStyles,
    colors,
    dimensions,
    font_type,
    sizes,
    withOpacity,
  });

  // 🚀 OPTIMIZACIÓN: Obtener idioma primero antes de usar en cálculos
  const {t, i18n} = useTranslation();
  const language = i18n.language; // Obtener idioma desde i18n en lugar de Redux

  // 🚀 OPTIMIZACIÓN: Valores directos sin cálculos adicionales
  const productName = (language === 'en' && product.name_en) ? product.name_en : product.name_es;
  const productDescriptionStr = (language === 'en' && product.description_en) ? product.description_en : product.description_es;
  const imageUrl = product.image_url || 'https://placehold.co/950x950.png';

  // 🚀 OPTIMIZACIÓN: fromText directo
  const hasCustomizations = product.has_category_groups 
    ? product.category_groups?.some(g => g.customizations?.length > 0)
    : product.customizations?.length > 0;
  const fromText = hasCustomizations ? (language === 'es' ? 'desde ' : 'from ') : '';
  
  const [productSelected, setProductSelected] = useState(initialState);
  // 🚀 OPTIMIZACIÓN: Estados de modificadores con lazy initial state
  const [modifiersSelected, setModifiersSelected] = useState(() => []);
  const [preselectedType2Modifiers, setPreselectedType2Modifiers] = useState(() => []);
  const [excludedModifiers, setExcludedModifiers] = useState(() => []);
  // 🆕 Estado para manejar customizaciones anidadas de modificadores
  const [nestedCustomizations, setNestedCustomizations] = useState(() => ({}));
  // 🆕 Estado para controlar la vista de customizaciones anidadas (slide navigation)
  const [showingNestedView, setShowingNestedView] = useState(false);
  const [currentNestedModifier, setCurrentNestedModifier] = useState(null);
  const [nestedViewAnimation] = useState(new Animated.Value(0));
  // 🆕 Estados para validación visual de customizaciones requeridas
  const [invalidCustomizationId, setInvalidCustomizationId] = useState(null);
  const [invalidCategoryGroupId, setInvalidCategoryGroupId] = useState(null);
  const [badgeAnimation] = useState(new Animated.Value(0));
  
  // 📍 Refs para scroll automático hacia customizaciones con error
  const customizationsScrollRef = useRef(null);
  const categoryGroupRefs = useRef({});
  const categoryGroupLayouts = useRef({});
  const customizationLayouts = useRef({}); // Para productos SIN category groups
  
  const [sizeSelected, setSizeSelected] = useState(() => {
    // Si tiene category_groups, inicialmente null hasta que se seleccione una categoría
    if (product.has_category_groups && product.category_groups) {
      return null;
    }
    // Lógica original
    return customizations.length > 0 ? null : true;
  });
  // totalProductBag ahora es calculado con useMemo (línea ~1079)
  const currency = product.currency;
  const dispatch = useDispatch();
  const companySelected = useSelector(state => state.settings.companySelected);

  // 🚀 OPTIMIZACIÓN: Ya no necesitamos useEffect para calcular total,
  // ahora se hace automáticamente con useMemo

  // 🚀 PRECARGA: Precargar imágenes de modificadores al abrir el detalle
  useEffect(() => {
    console.log('🖼️ [ProductDetail] Precargando imágenes de modificadores...');
    
    const modifierImages = [];
    
    // Recolectar todas las imágenes de modificadores
    customizations.forEach(customization => {
      customization.modifiers?.forEach(modifier => {
        if (modifier.image) {
          modifierImages.push({
            uri: modifier.image,
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          });
        }
      });
    });
    
    if (modifierImages.length > 0) {
      console.log(`🖼️ [ProductDetail] Precargando ${modifierImages.length} imágenes de modificadores`);
      FastImage.preload(modifierImages);
    }
  }, [customizations]);

  // 🚀 OPTIMIZACIÓN: Auto-seleccionar modificadores tipo 2 al inicio (para productos nuevos)
  useEffect(() => {
    // Solo ejecutar para productos NUEVOS (no actualizaciones) con category_groups
    if (isUpdate || !product.has_category_groups || !product.category_groups) {
      return;
    }

    console.log('🤖 [INIT] Auto-seleccionando modificadores tipo 2 al inicio...');
    
    const allAutoSelectModifiers = [];
    const groupSelections = {};
    
    // Recorrer TODOS los category groups
    product.category_groups.forEach((categoryGroup) => {
      const categoryCustomizations = categoryGroup.customizations || [];
      const groupAutoSelects = [];
      
      categoryCustomizations.forEach((customization) => {
        customization.modifiers?.forEach((modifier) => {
          // Seleccionar automáticamente modificadores con modifier_type: 2 (receta)
          if (modifier.modifier_type === 2) {
            const modifierData = {
              id: modifier.id,
              modifier_id: modifier.modifier_id,
              name_es: modifier.name_es,
              name_en: modifier.name_en,
              precio: parseFloat(modifier.price) || 0,
              price_with_taxes: parseFloat(modifier.price_with_taxes) || 0,
              customization_id: customization.id,
              codigo_modificador: customization.customization_id,
              codigo_articulo: modifier.modifier_id,
              descripcion: modifier.name_es,
              cantidad: 1,
            };
            
            groupAutoSelects.push(modifierData);
            allAutoSelectModifiers.push(modifierData);
          }
        });
      });
      
      // Guardar las selecciones de este grupo
      if (groupAutoSelects.length > 0) {
        groupSelections[categoryGroup.id] = groupAutoSelects;
        console.log(`🤖 [INIT] Grupo "${categoryGroup.name_es}": ${groupAutoSelects.length} modificadores tipo 2`);
      }
    });
    
    // Aplicar todas las selecciones
    if (allAutoSelectModifiers.length > 0) {
      console.log(`🤖 [INIT] Total modificadores tipo 2 auto-seleccionados: ${allAutoSelectModifiers.length}`);
      
      // Guardar en categoryGroupSelections para que estén disponibles sin expandir
      setCategoryGroupSelections(groupSelections);
      
      // Rastrear cuáles fueron preseleccionados
      const preselectedIds = allAutoSelectModifiers.map(mod => ({
        id: mod.id,
        modifier_id: mod.modifier_id,
        customization_id: mod.customization_id,
      }));
      setPreselectedType2Modifiers(preselectedIds);
    } else {
      console.log('ℹ️ [INIT] No hay modificadores tipo 2 para auto-seleccionar');
    }
  }, [isUpdate, product.has_category_groups, product.category_groups]);

  // Optimización: Actualizar productSelected solo cuando modifiersSelected cambia
  useEffect(() => {
    if (modifiersSelected.length === 0 && !isUpdate) return; // Skip inicial
    
    setProductSelected(prev => ({
      ...prev,
      customizations: modifiersSelected,
    }));
  }, [modifiersSelected, isUpdate]);

  // 🆕 useEffect para restaurar nested_customizations cuando se edita un producto
  useEffect(() => {
    if (!isUpdate || !productData?.customizations) {
      return;
    }

    console.log('🔄 [Nested Restore] Iniciando restauración de nested customizations...');
    
    // Construir el objeto nestedCustomizations desde productData
    const restoredNested = {};
    
    productData.customizations.forEach((customization) => {
      if (customization.nested_customizations && customization.nested_customizations.length > 0) {
        console.log('🔍 [Nested Restore] Procesando customization:', {
          modifier_id: customization.modifier_id,
          codigo_articulo: customization.codigo_articulo,
          nested_count: customization.nested_customizations.length
        });
        
        // Buscar el modificador padre en la estructura del producto para obtener su ID interno
        let parentModifier = null;
        let parentModifierId = null;
        
        // Buscar en category_groups si el producto los tiene
        if (product.has_category_groups && product.category_groups) {
          for (const categoryGroup of product.category_groups) {
            for (const cust of categoryGroup.customizations || []) {
              parentModifier = cust.modifiers?.find(
                m => m.modifier_id === customization.modifier_id || 
                     m.modifier_id === customization.codigo_articulo
              );
              if (parentModifier) {
                parentModifierId = parentModifier.id;
                break;
              }
            }
            if (parentModifier) break;
          }
        } else {
          // Buscar en customizations normales
          const allCustomizations = product.section?.customizations || product.customizations || customizations;
          for (const cust of allCustomizations) {
            parentModifier = cust.modifiers?.find(
              m => m.modifier_id === customization.modifier_id || 
                   m.modifier_id === customization.codigo_articulo
            );
            if (parentModifier) {
              parentModifierId = parentModifier.id;
              break;
            }
          }
        }
        
        if (!parentModifier || !parentModifierId) {
          console.warn('⚠️ [Nested Restore] No se encontró el modificador padre:', customization.modifier_id);
          return;
        }
        
        console.log('✅ [Nested Restore] Modificador padre encontrado:', {
          parentModifierId,
          parentModifierName: parentModifier.name_es
        });
        
        // Procesar cada nested customization
        customization.nested_customizations.forEach((nested) => {
          const nestedCustomizationId = nested.codigo_modificador;
          
          // Buscar la nested customization en el modificador padre
          const nestedCustomization = parentModifier.customizations?.find(
            nc => nc.customization_id === nestedCustomizationId || nc.id === nestedCustomizationId
          );
          
          if (!nestedCustomization) {
            console.warn('⚠️ [Nested Restore] No se encontró nested customization:', nestedCustomizationId);
            return;
          }
          
          // Buscar el nested modifier por modifier_id para obtener su ID interno
          const nestedModifier = nestedCustomization.modifiers?.find(
            nm => nm.modifier_id === nested.modifier_id || 
                  nm.modifier_id === nested.codigo_articulo
          );
          
          if (!nestedModifier) {
            console.warn('⚠️ [Nested Restore] No se encontró nested modifier:', nested.modifier_id);
            return;
          }
          
          const key = `${parentModifierId}_${nestedCustomization.id}`;
          
          if (!restoredNested[key]) {
            restoredNested[key] = [];
          }
          
          // Usar el ID interno del modifier (número), no el modifier_id (string)
          if (!restoredNested[key].includes(nestedModifier.id)) {
            restoredNested[key].push(nestedModifier.id);
            
            console.log('✅ [Nested Restore] Restored:', {
              key,
              parentModifierId,
              nestedCustomizationId: nestedCustomization.id,
              nestedModifierId: nestedModifier.id,
              nestedModifierIdString: nestedModifier.modifier_id,
              nestedName: nested.descripcion || nested.description
            });
          }
        });
      }
    });
    
    if (Object.keys(restoredNested).length > 0) {
      console.log('✅ [Nested Restore] Total restored nested:', restoredNested);
      setNestedCustomizations(restoredNested);
    } else {
      console.log('ℹ️ [Nested Restore] No nested customizations to restore');
    }
  }, [isUpdate, productData, product, customizations]);

  useEffect(() => {
    // 🚀 OPTIMIZACIÓN: Early return para productos simples sin customizations
    if (!product.has_category_groups && (!product.section?.customizations?.length && !product.customizations?.length)) {
      // Producto simple sin customizations - no ejecutar lógica compleja
      return;
    }
    
    // Solo log en desarrollo y SOLO para debugging crítico
    // Los logs normales están comentados para mejor performance
    
    // Para productos con category groups, esperamos hasta que se seleccione una categoría
    // No ejecutar si estamos en proceso de regresar a category groups
    if (product.has_category_groups && product.category_groups && !selectedCategoryGroup && isUpdate) {
      // console.log('🔧 Buscando category group para restauración...');
      // Si es una actualización y tenemos category groups, buscar la categoría correcta basada en los datos guardados
      if (productData?.customizations?.length > 0) {
        // Buscar en qué category group están las customizations guardadas
        const savedCustomization = productData.customizations[0];
        debugLog('🔧 Saved customization:', savedCustomization);
        
        debugLog('🔍 Buscando category group:', savedCustomization.codigo_modificador);
        
        let categoryGroup = null;
        
        for (const group of product.category_groups) {
          debugLog('🔍 Revisando group:', group.id);
          
          const hasMatchingCustomization = group.customizations?.some(customization => {
            debugLog('🔍 Comparando customization:', {
              customization_id: customization.customization_id,
              codigo_modificador: savedCustomization.codigo_modificador,
              match: customization.customization_id === savedCustomization.codigo_modificador
            });
            
            // Buscar por customization_id
            if (customization.customization_id === savedCustomization.codigo_modificador) {
              debugLog('✅ Match encontrado por customization_id');
              return true;
            }
            
            // También buscar si algún modifier del customization coincide
            const hasMatchingModifier = customization.modifiers?.some(modifier => {
              const match = modifier.modifier_id === savedCustomization.modifier_id ||
                           modifier.modifier_id === savedCustomization.codigo_articulo?.toString();
              if (match) {
                debugLog('✅ Match encontrado por modifier_id:', modifier.modifier_id);
              }
              return match;
            });
            
            return hasMatchingModifier;
          });
          
          if (hasMatchingCustomization) {
            debugLog('✅ Group seleccionado:', group.id);
            categoryGroup = group;
            break;
          }
        }
        
        debugLog('🔧 Category group encontrado:', categoryGroup?.id);
        
        if (categoryGroup) {
          debugLog('✅ Seleccionando category group:', categoryGroup.id);
          setSelectedCategoryGroup(categoryGroup);
          setShowCategoryGroups(false);
          
          // 🚀 OPTIMIZACIÓN: Restauración inmediata sin delay
          debugLog('🔄 Ejecutando restauración inmediata para category group:', categoryGroup.id);
            const categoryCustomizations = categoryGroup.customizations || [];
            
            categoryCustomizations.forEach((customization) => {
              const nameLower = customization.name_es?.toLowerCase() || '';
              const isSize = nameLower.includes('tamaño');

              if (isSize) {
                // Manejar tamaños
                const customizationSize = productData.customizations.find(
                  c => c.codigo_modificador === customization.customization_id,
                );

                if (customizationSize) {
                  let size = customization.modifiers.find(
                    m => m.modifier_id === customizationSize.codigo_articulo.toString(),
                  );

                  if (!size) {
                    size = customization.modifiers.find(
                      m => m.id === parseInt(customizationSize.codigo_articulo, 10),
                    );
                  }

                  if (size) {
                    handleSizePress(
                      size,
                      customization.id,
                      customization.customization_id,
                    );
                  }
                }
              } else {
                // Manejar modificadores normales
                const customizationModifiers = productData.customizations.filter(
                  c => c.codigo_modificador === customization.customization_id,
                );

                customizationModifiers.forEach(modifierData => {
                  let modifier = customization.modifiers.find(
                    m => m.modifier_id === modifierData.modifier_id,
                  );

                  if (!modifier) {
                    modifier = customization.modifiers.find(
                      m => m.modifier_id === modifierData.codigo_articulo?.toString(),
                    );
                  }

                  if (!modifier) {
                    modifier = customization.modifiers.find(
                      m => m.id === parseInt(modifierData.codigo_articulo, 10),
                    );
                  }

                  if (modifier) {
                    console.log('🔧 Restaurando modifier (inmediato):', {
                      modifier_id: modifier.modifier_id,
                      modifier_name: modifier.name_es,
                      cantidad: modifierData.cantidad,
                      categoryGroup: categoryGroup.name_es || categoryGroup.name_en
                    });
                    // Solo llamar handleSetQuantityModifier para evitar duplicación
                    handleSetQuantityModifier(
                      modifierData.cantidad,
                      modifier,
                      customization.id,
                      customization.selection_type,
                      customization.customization_id,
                    );
                  }
                });
              }
            });
        } else {
          console.log('❌ No se encontró category group válido');
        }
      }
      return;
    }
    
    if (customizations.length > 0) {
      // console.log('🔄 Ejecutando restauración en useEffect principal');
      let hasSize = false;

      customizations.forEach((customization, index) => {
        const nameLower = customization.name_es?.toLowerCase() || '';
        // Identificar si es un selector de tamaño
        const isSize = nameLower.includes('tamaño');

        if (isSize) {
          const customizationSize = productData?.customizations?.find(
            c => c.codigo_modificador === customization.customization_id,
          );

          if (customizationSize) {
            // Buscar el tamaño usando múltiples estrategias
            let size = customization.modifiers.find(
              m =>
                m.modifier_id === customizationSize.codigo_articulo.toString(),
            );

            // Si no se encuentra, intentar por descripción
            // Si no se encuentra por modifier_id, intentar por ID numérico
            if (!size) {
              size = customization.modifiers.find(
                m => m.id === parseInt(customizationSize.codigo_articulo, 10),
              );
            }

            if (size) {
              handleSizePress(
                size,
                customization.id,
                customization.customization_id,
              );
            }
          }

          hasSize = true;
        } else if (isUpdate && productData?.customizations?.length > 0 && !product.has_category_groups) {
          const customizationModifiers = productData.customizations.filter(
            c => c.codigo_modificador === customization.customization_id,
          );

          customizationModifiers.forEach(modifierData => {
            // Buscar por modifier_id primero
            let modifier = customization.modifiers.find(
              m => m.modifier_id === modifierData.modifier_id,
            );

            // Si no se encuentra, intentar por codigo_articulo como string
            if (!modifier) {
              modifier = customization.modifiers.find(
                m => m.modifier_id === modifierData.codigo_articulo?.toString(),
              );
            }

            // Si aún no se encuentra, intentar por ID numérico
            if (!modifier) {
              modifier = customization.modifiers.find(
                m => m.id === parseInt(modifierData.codigo_articulo, 10),
              );
            }

            if (modifier) {
              console.log('🔧 Restaurando modifier (useEffect principal):', {
                modifier_id: modifier.modifier_id,
                modifier_name: modifier.name_es,
                cantidad: modifierData.cantidad
              });
              // Solo llamar handleSetQuantityModifier para evitar duplicación
              handleSetQuantityModifier(
                modifierData.cantidad,
                modifier,
                customization.id,
                customization.selection_type,
                customization.customization_id,
              );
            } else {
              console.log('❌ No se encontró modifier para:', {
                modifierData: modifierData,
                availableModifiers: customization.modifiers.map(m => ({
                  id: m.id,
                  modifier_id: m.modifier_id,
                  name_es: m.name_es
                }))
              });
            }
          });
        }
      });

      if (!hasSize) {
        setSizeSelected(true);
      }
    }
  }, [
    customizations,
    productData,
    isUpdate,
    handleSizePress,
    handleModifierPress,
    handleSetQuantityModifier,
    product.has_category_groups,
    product.category_groups,
    selectedCategoryGroup,
  ]);

  // useEffect específico para restaurar modificadores en productos con category_groups
  useEffect(() => {
    // 🚀 OPTIMIZACIÓN: Skip para productos sin category groups
    if (!product.has_category_groups) {
      return; // Productos simples no necesitan esta lógica
    }
    
    console.log('🔍 useEffect category groups - Estado:', {
      has_category_groups: product.has_category_groups,
      selectedCategoryGroup: selectedCategoryGroup?.id,
      selectedCategoryGroupName: selectedCategoryGroup?.name_es || selectedCategoryGroup?.name_en,
      isUpdate,
      productDataCustomizations: productData?.customizations?.length
    });
    
    // Solo ejecutar para productos con category_groups cuando hay una categoría seleccionada y es una actualización
    if (product.has_category_groups && selectedCategoryGroup && isUpdate && productData?.customizations?.length > 0) {
      console.log('🔄 Ejecutando restauración en useEffect de category groups para grupo:', selectedCategoryGroup.id);
      
      // Restaurar modificadores para la categoría seleccionada
      const categoryCustomizations = selectedCategoryGroup.customizations || [];
      
      categoryCustomizations.forEach((customization, index) => {
        const nameLower = customization.name_es?.toLowerCase() || '';
        const isSize = nameLower.includes('tamaño');

        if (isSize) {
          // Manejar tamaños
          const customizationSize = productData.customizations.find(
            c => c.codigo_modificador === customization.customization_id,
          );

          if (customizationSize) {
            let size = customization.modifiers.find(
              m => m.modifier_id === customizationSize.codigo_articulo.toString(),
            );

            // Si no se encuentra por modifier_id, intentar por ID numérico
            if (!size) {
              size = customization.modifiers.find(
                m => m.id === parseInt(customizationSize.codigo_articulo, 10),
              );
            }

            if (size) {
              handleSizePress(
                size,
                customization.id,
                customization.customization_id,
              );
            }
          }
        } else {
          // Manejar modificadores normales
          const customizationModifiers = productData.customizations.filter(
            c => c.codigo_modificador === customization.customization_id,
          );

          customizationModifiers.forEach(modifierData => {
            // Buscar por modifier_id primero
            let modifier = customization.modifiers.find(
              m => m.modifier_id === modifierData.modifier_id,
            );

            // Si no se encuentra, intentar por codigo_articulo como string
            if (!modifier) {
              modifier = customization.modifiers.find(
                m => m.modifier_id === modifierData.codigo_articulo?.toString(),
              );
            }

            // Si aún no se encuentra, intentar por ID numérico
            if (!modifier) {
              modifier = customization.modifiers.find(
                m => m.id === parseInt(modifierData.codigo_articulo, 10),
              );
            }

            if (modifier) {
              console.log('🔧 Restaurando modifier (useEffect category groups):', {
                modifier_id: modifier.modifier_id,
                modifier_name: modifier.name_es,
                cantidad: modifierData.cantidad,
                categoryGroup: selectedCategoryGroup?.name_es
              });
              // Solo llamar handleSetQuantityModifier para evitar duplicación
              handleSetQuantityModifier(
                modifierData.cantidad,
                modifier,
                customization.id,
                customization.selection_type,
                customization.customization_id,
              );
            } else {
              console.log('❌ No se encontró modifier para category group:', {
                codigo_articulo: modifierData.codigo_articulo,
                descripcion: modifierData.descripcion,
                categoryGroup: selectedCategoryGroup?.name_es
              });
            }
          });
        }
      });
    }
  }, [selectedCategoryGroup, isUpdate, productData, handleSizePress, handleModifierPress, handleSetQuantityModifier, product.has_category_groups]);

  // useEffect para restaurar TODOS los grupos con selecciones en modo edición
  useEffect(() => {
    // 🚀 OPTIMIZACIÓN: Skip para productos sin category groups
    if (!product.has_category_groups) {
      return; // Productos simples no necesitan restauración
    }
    
    if (product.has_category_groups && isUpdate && productData?.customizations?.length > 0 && !selectedCategoryGroup) {
      console.log('🚀 Inicializando restauración completa para modo edición (sin auto-expandir)');
      
      // Encontrar qué category groups tienen selecciones guardadas
      const groupsWithSelections = {};
      // 🔧 FIX: NO auto-expandir grupos, mantenerlos contraídos
      // const groupsToExpand = {}; // ❌ Comentado para mantener contraídos
      
      // Analizar las customizations guardadas para determinar qué grupos tienen selecciones
      productData.customizations.forEach(customization => {
        // Buscar en qué category group está esta customization
        product.category_groups.forEach(categoryGroup => {
          const hasCustomization = categoryGroup.customizations?.some(
            c => c.customization_id === customization.codigo_modificador
          );
          
          if (hasCustomization) {
            groupsWithSelections[categoryGroup.id] = categoryGroup;
            // groupsToExpand[categoryGroup.id] = true; // ❌ Comentado para mantener contraídos
            console.log('📋 Grupo con selecciones encontrado:', {
              groupId: categoryGroup.id,
              groupName: categoryGroup.name_es || categoryGroup.name_en,
              customizationId: customization.codigo_modificador
            });
          }
        });
      });
      
      // 🔧 FIX: NO auto-expandir grupos, mantenerlos contraídos
      // Auto-expandir todos los grupos que tienen selecciones
      /* ❌ COMENTADO: Mantener grupos contraídos incluso en modo edición
      if (Object.keys(groupsToExpand).length > 0) {
        console.log('📂 Auto-expandiendo grupos:', Object.keys(groupsToExpand));
        setExpandedGroups(prev => ({
          ...prev,
          ...groupsToExpand
        }));
      }
      */
      
      // Inicializar los estados para badge counters
      const initialCategoryGroupSelections = {};
      const initialCategoryGroupSizes = {};
      
      // Restaurar modificadores de TODOS los grupos con selecciones
      Object.values(groupsWithSelections).forEach(categoryGroup => {
        console.log('🔄 Restaurando modificadores para grupo:', categoryGroup.name_es || categoryGroup.name_en);
        
        // Inicializar arrays para este grupo
        initialCategoryGroupSelections[categoryGroup.id] = [];
        
        const categoryCustomizations = categoryGroup.customizations || [];
        
        categoryCustomizations.forEach((customization, index) => {
          const nameLower = customization.name_es?.toLowerCase() || '';
          const isSize = nameLower.includes('tamaño');

          if (isSize) {
            // Manejar tamaños
            const customizationSize = productData.customizations.find(
              c => c.codigo_modificador === customization.customization_id,
            );

            if (customizationSize) {
              let size = customization.modifiers.find(
                m => m.modifier_id === customizationSize.codigo_articulo.toString(),
              );

              // Si no se encuentra por modifier_id, intentar por ID numérico
              if (!size) {
                size = customization.modifiers.find(
                  m => m.id === parseInt(customizationSize.codigo_articulo, 10),
                );
              }

              if (size) {
                console.log('📏 Restaurando tamaño para grupo:', {
                  size: size.name_es,
                  group: categoryGroup.name_es || categoryGroup.name_en
                });
                
                // Actualizar estado para badge counter
                initialCategoryGroupSizes[categoryGroup.id] = size;
                
                handleSizePress(
                  size,
                  customization.id,
                  customization.customization_id,
                );
              }
            }
          } else {
            // Manejar modificadores normales
            const customizationModifiers = productData.customizations.filter(
              c => c.codigo_modificador === customization.customization_id,
            );

            customizationModifiers.forEach(modifierData => {
              // Buscar por modifier_id primero
              let modifier = customization.modifiers.find(
                m => m.modifier_id === modifierData.modifier_id,
              );

              // Si no se encuentra, intentar por codigo_articulo como string
              if (!modifier) {
                modifier = customization.modifiers.find(
                  m => m.modifier_id === modifierData.codigo_articulo?.toString(),
                );
              }

              // Si aún no se encuentra, intentar por ID numérico
              if (!modifier) {
                modifier = customization.modifiers.find(
                  m => m.id === parseInt(modifierData.codigo_articulo, 10),
                );
              }

              if (modifier) {
                console.log('🔧 Restaurando modifier para grupo:', {
                  modifier_id: modifier.modifier_id,
                  modifier_name: modifier.name_es,
                  cantidad: modifierData.cantidad,
                  categoryGroup: categoryGroup.name_es || categoryGroup.name_en
                });
                
                // Actualizar arrays para badge counter - agregar tantas veces como cantidad
                for (let i = 0; i < modifierData.cantidad; i++) {
                  initialCategoryGroupSelections[categoryGroup.id].push({
                    id: modifier.id,
                    modifier_id: modifier.modifier_id,
                    name_es: modifier.name_es,
                    name_en: modifier.name_en,
                    precio: parseFloat(modifier.price) || 0,
                    price_with_taxes: parseFloat(modifier.price_with_taxes || modifier.price) || 0,
                    customization_id: customization.id,
                    codigo_modificador: customization.customization_id,
                    codigo_articulo: modifier.modifier_id,
                    descripcion: modifier.name_es,
                    cantidad: 1,
                  });
                }
                
                // Solo llamar handleSetQuantityModifier para evitar duplicación
                handleSetQuantityModifier(
                  modifierData.cantidad,
                  modifier,
                  customization.id,
                  customization.selection_type,
                  customization.customization_id,
                );
              } else {
                console.log('❌ No se encontró modifier para grupo:', {
                  codigo_articulo: modifierData.codigo_articulo,
                  descripcion: modifierData.descripcion,
                  categoryGroup: categoryGroup.name_es || categoryGroup.name_en
                });
              }
            });
          }
        });
      });
      
      // Actualizar los estados para badge counters
      console.log('🏷️ Inicializando badge counters:', {
        selections: initialCategoryGroupSelections,
        sizes: initialCategoryGroupSizes
      });
      
      setCategoryGroupSelections(initialCategoryGroupSelections);
      setCategoryGroupSizes(initialCategoryGroupSizes);
      
      // Auto-seleccionar el primer grupo que tiene selecciones
      const firstGroupWithSelections = Object.values(groupsWithSelections)[0];
      if (firstGroupWithSelections) {
        console.log('🎯 Auto-seleccionando primer grupo con selecciones:', firstGroupWithSelections.name_es || firstGroupWithSelections.name_en);
        setSelectedCategoryGroup(firstGroupWithSelections);
      }
    }
  }, [product.has_category_groups, isUpdate, productData?.customizations, selectedCategoryGroup, handleSizePress, handleModifierPress, handleSetQuantityModifier]);

  // useEffect para auto-seleccionar modificadores con modifier_type: 2
  useEffect(() => {
    // 🚀 OPTIMIZACIÓN: Skip para productos sin customizations
    if (customizations.length === 0) {
      return; // Sin customizations, no hay nada que auto-seleccionar
    }
    
    // Solo ejecutar cuando no es actualización (nuevo producto)
    if (!isUpdate && customizations.length > 0) {
      console.log('🤖 Ejecutando auto-selección (no debería ejecutarse en edición):', { isUpdate });
      const autoSelectModifiers = [];

      customizations.forEach((customization) => {
        customization.modifiers?.forEach((modifier) => {
          // Seleccionar automáticamente modificadores con modifier_type: 2
          if (modifier.modifier_type === 2) {
            autoSelectModifiers.push({
              id: modifier.id,
              modifier_id: modifier.modifier_id,
              name_es: modifier.name_es,
              name_en: modifier.name_en,
              precio: parseFloat(modifier.price) || 0, // Usar precio con impuestos si está disponible
              price_with_taxes: parseFloat(modifier.price_with_taxes) || 0,
              customization_id: customization.id,
              codigo_modificador: customization.customization_id,
              codigo_articulo: modifier.modifier_id,
              descripcion: modifier.name_es,
              cantidad: 1,
            });
          }
        });
      });

      // Si hay modificadores para auto-seleccionar, aplicarlos
      if (autoSelectModifiers.length > 0) {
        setModifiersSelected(autoSelectModifiers);
        // Rastrear cuáles fueron preseleccionados automáticamente
        const preselectedIds = autoSelectModifiers.map(mod => ({
          id: mod.id,
          modifier_id: mod.modifier_id,
          customization_id: mod.customization_id,
          selection_type: customizations.find(c => c.id === mod.customization_id)?.selection_type
        }));
        setPreselectedType2Modifiers(preselectedIds);
      }
    }
  }, [isUpdate, customizations]);

  // useEffect para auto-seleccionar modificadores con modifier_type: 2 en category groups
  useEffect(() => {
    // Solo ejecutar para productos con category groups, que son nuevos (no actualización)
    // y cuando se selecciona un category group por primera vez
    if (!product.has_category_groups || isUpdate || !selectedCategoryGroup) {
      return;
    }

    // Verificar si ya hay selecciones guardadas para este grupo (evitar sobreescribir selecciones manuales)
    const hasExistingSelections = categoryGroupSelections[selectedCategoryGroup.id]?.length > 0;
    const hasExistingNestedSelections = Object.keys(nestedCustomizations).length > 0;
    if (hasExistingSelections || hasExistingNestedSelections) {
      return;
    }

    // Verificar si ya hay modificadores seleccionados actualmente (evitar conflictos)
    if (modifiersSelected.length > 0) {
      return;
    }

    console.log('🤖 Ejecutando auto-selección para category group:', {
      categoryGroupId: selectedCategoryGroup.id,
      categoryGroupName: selectedCategoryGroup.name_es || selectedCategoryGroup.name_en,
      isUpdate
    });

    const autoSelectModifiers = [];
    const categoryCustomizations = selectedCategoryGroup.customizations || [];

    categoryCustomizations.forEach((customization) => {
      customization.modifiers?.forEach((modifier) => {
        // Seleccionar automáticamente modificadores con modifier_type: 2 (receta)
        if (modifier.modifier_type === 2) {
          console.log('🍴 Auto-seleccionando modificador de receta:', {
            modifier_id: modifier.modifier_id,
            name: modifier.name_es,
            modifier_type: modifier.modifier_type
          });
          
          autoSelectModifiers.push({
            id: modifier.id,
            modifier_id: modifier.modifier_id,
            name_es: modifier.name_es,
            name_en: modifier.name_en,
            precio: parseFloat(modifier.price) || 0,
            price_with_taxes: parseFloat(modifier.price_with_taxes) || 0,
            customization_id: customization.id,
            codigo_modificador: customization.customization_id,
            codigo_articulo: modifier.modifier_id,
            descripcion: modifier.name_es,
            cantidad: 1,
          });
        }
      });
    });

    // Si hay modificadores para auto-seleccionar, aplicarlos
    if (autoSelectModifiers.length > 0) {
      console.log('🤖 Aplicando auto-selección de modificadores tipo 2:', autoSelectModifiers.length);
      setModifiersSelected(autoSelectModifiers);
      
      // Rastrear cuáles fueron preseleccionados automáticamente
      const preselectedIds = autoSelectModifiers.map(mod => ({
        id: mod.id,
        modifier_id: mod.modifier_id,
        customization_id: mod.customization_id,
        selection_type: categoryCustomizations.find(c => c.id === mod.customization_id)?.selection_type
      }));
      setPreselectedType2Modifiers(preselectedIds);
    }
  }, [isUpdate, selectedCategoryGroup, product.has_category_groups, categoryGroupSelections, modifiersSelected.length, nestedCustomizations]);

  // Función para consolidar todas las selecciones de category groups
  const getAllCategoryGroupSelections = useCallback(() => {
    let allSelections = [];
    let allSizes = [];
    
    // Para la nueva estructura expandida, simplemente usamos modifiersSelected y sizeSelected
    // ya que ahora todas las selecciones se manejan directamente
    if (modifiersSelected.length > 0) {
      allSelections = [...modifiersSelected];
    }
    
    if (sizeSelected && sizeSelected !== true) {
      allSizes.push(sizeSelected);
    }
    
    // Si estamos en modo de actualización (isUpdate = true), solo usar las selecciones actuales
    // para evitar conflictos con selecciones guardadas que podrían haber sido desmarcadas
    if (!isUpdate) {
      // Solo incluir selecciones guardadas si NO estamos actualizando un producto
      Object.keys(categoryGroupSelections).forEach(categoryId => {
        const selections = categoryGroupSelections[categoryId] || [];
        // Evitar duplicados y conflictos con selecciones de tipo 'single'
        const newSelections = selections.filter(saved => {
          // No agregar si ya está en modifiersSelected (evitar duplicados)
          if (modifiersSelected.some(current => current.id === saved.id)) {
            return false;
          }
          
          // Para customizations de tipo 'single', no agregar si ya hay una selección actual para esa customization
          const customization = customizations.find(c => c.customization_id === saved.codigo_modificador);
          if (customization && customization.selection_type === 'single') {
            const hasCurrentSelection = modifiersSelected.some(current => 
              current.codigo_modificador === saved.codigo_modificador
            );
            if (hasCurrentSelection) {
              console.log('🔄 [getAllCategoryGroupSelections] Omitiendo selección guardada de tipo single porque hay una actual:', {
                saved: saved.descripcion,
                customization: customization.name_es
              });
              return false;
            }
          }
          
          return true;
        });
        allSelections = [...allSelections, ...newSelections];
      });
    } else {
      console.log('🔄 [getAllCategoryGroupSelections] Modo actualización: solo usando selecciones actuales');
    }
    
    // Solo incluir sizes guardados si NO estamos en modo actualización
    if (!isUpdate) {
      Object.keys(categoryGroupSizes).forEach(categoryId => {
        const size = categoryGroupSizes[categoryId];
        if (size && size !== true && (!sizeSelected || sizeSelected === true)) {
          allSizes.push(size);
        }
      });
    }
    
    console.log('📊 [getAllCategoryGroupSelections] Consolidando:', {
      modifiersSelected: modifiersSelected.length,
      sizeSelected: sizeSelected ? 1 : 0,
      categoryGroupSelections: Object.keys(categoryGroupSelections).length,
      totalSelections: allSelections.length,
      totalSizes: allSizes.length,
      isUpdate: isUpdate
    });
    
    return { allSelections, allSizes };
  }, [modifiersSelected, sizeSelected, categoryGroupSelections, categoryGroupSizes, isUpdate]);

  // 🚀 OPTIMIZACIÓN: Usar useMemo para cálculo de precio total y evitar re-renders
  const totalProductBag = useMemo(() => {
    // Usar full_price que ya incluye impuestos
    let total = product.full_price * quantity;
    
    // Para productos con category groups, incluir todas las selecciones
    if (product.has_category_groups) {
      const { allSelections } = getAllCategoryGroupSelections();
      // Incluir también las selecciones actuales
      const allModifiers = [...allSelections, ...modifiersSelected.filter(mod => 
        !allSelections.some(existing => existing.id === mod.id)
      )];
      
      allModifiers.forEach(modifier => {
        // Solo usar el precio almacenado (ya incluye impuestos)
        const modifierTotal = (parseFloat(modifier.price_with_taxes) || 0) * modifier.cantidad * quantity;
        total += modifierTotal;
      });
    } else {
      // Lógica original para productos sin category groups
      modifiersSelected.forEach(modifier => {
        // Solo usar el precio almacenado (ya incluye impuestos)
        const modifierTotal = (parseFloat(modifier.price_with_taxes) || 0) * modifier.cantidad * quantity;
        total += modifierTotal;
      });
    }

    // 🆕 Agregar precios de customizaciones anidadas
    if (nestedCustomizations && Object.keys(nestedCustomizations).length > 0) {
      Object.keys(nestedCustomizations).forEach(key => {
        const nestedModifierIds = nestedCustomizations[key];
        const [parentId, nestedCustomizationId] = key.split('_').map(Number);
        
        // Buscar el modificador padre para obtener información de la customización anidada
        let parentModifier = null;
        if (product.has_category_groups) {
          parentModifier = product.category_groups
            ?.flatMap(cg => cg.customizations)
            .flatMap(c => c.modifiers)
            .find(mod => mod.id === parentId);
        } else {
          const productCustomizations = product.section?.customizations || product.customizations || [];
          parentModifier = productCustomizations
            .flatMap(c => c.modifiers)
            .find(mod => mod.id === parentId);
        }
        
        if (parentModifier && parentModifier.customizations) {
          const nestedCustomization = parentModifier.customizations.find(
            nc => nc.id === nestedCustomizationId
          );
          
          if (nestedCustomization) {
            nestedModifierIds.forEach(nestedModId => {
              const nestedModifier = nestedCustomization.modifiers.find(
                nm => nm.id === nestedModId
              );
              
              if (nestedModifier) {
                const nestedModifierPrice = parseFloat(nestedModifier.price_with_taxes || nestedModifier.price) || 0;
                total += nestedModifierPrice * quantity;
              }
            });
          }
        }
      });
    }

    return Utils.roundMoney(total);
  }, [product.full_price, quantity, modifiersSelected, product.has_category_groups, getAllCategoryGroupSelections, nestedCustomizations, product.category_groups, product.section, product.customizations]);

  const handleSizePress = useCallback(
    (modifier, customizationId, customizationCustomId) => {

      setSizeSelected(modifier);
      setModifiersSelected(prevModifiers => {
        const updatedModifiers = prevModifiers.filter(
          item => item.customization_id !== customizationId,
        );

        return [
          ...updatedModifiers,
          {
            id: modifier.id,
            codigo_modificador: customizationCustomId,
            codigo_articulo: modifier.modifier_id,
            descripcion: modifier.name_es,
            description: modifier.name_en,
            precio: parseFloat(modifier.price) || 0,
            price_with_taxes: parseFloat(modifier.price_with_taxes || modifier.price) || 0, // Incluir precio con impuestos
            cantidad: 1,
            customization_id: customizationId,
          },
        ];
      });
    },
    [language],
  );

  const validateModifiers = (
    prevModifiers,
    customizationId,
    selection_type,
    newModifier,
  ) => {
    const customization = customizations.find(c => c.id === customizationId);
    
    // Si no encuentra el customization, permitir por defecto para evitar errores
    if (!customization) {
      console.log('⚠️ No se encontró customization para validar:', customizationId);
      return true;
    }

    if (selection_type === 'single') {
      return true;
    }

    if (selection_type === 'multiple') {
      // 1. VALIDACIÓN A NIVEL DE CUSTOMIZATION (total de modificadores)
      const values = prevModifiers.filter(
        m => m.customization_id === customizationId,
      );
      let totalSum = 0;
      values.forEach(value => {
        totalSum += value.cantidad;
      });

      // Verificar límite total de la customization
      if (totalSum > customization.max_selection) {
        console.log('❌ Límite de customization excedido:', {
          customization: customization.name_es,
          limit: customization.max_selection,
          current: totalSum
        });
        return false;
      }

      // 2. VALIDACIÓN A NIVEL DE MODIFICADOR INDIVIDUAL
      if (newModifier) {
        // Buscar el modifier específico en la customization
        const specificModifier = customization.modifiers?.find(
          m => m.id === newModifier.id || m.modifier_id === newModifier.codigo_articulo
        );

        if (specificModifier && specificModifier.max_selection > 0) {
          // Contar cuántas veces ya está seleccionado este modificador específico
          const existingModifierSelections = prevModifiers.filter(
            m => m.id === newModifier.id || m.codigo_articulo === newModifier.codigo_articulo
          );
          
          let modifierSum = 0;
          existingModifierSelections.forEach(selection => {
            modifierSum += selection.cantidad;
          });

          // Verificar límite individual del modificador
          if (modifierSum > specificModifier.max_selection) {
            console.log('❌ Límite de modificador individual excedido:', {
              modifier: specificModifier.name_es,
              limit: specificModifier.max_selection,
              current: modifierSum
            });
            return false;
          }
        }
      }

      return true;
    }

    // Si no encuentra el customization o no cumple las condiciones, retornar false por defecto
    return false;
  };

  const handleModifierPress = useCallback(
    (modifier, customizationId, customizationCustomId, selection_type) => {

      setModifiersSelected(prevModifiers => {
        const existingModifier = prevModifiers.find(
          item => item.id === modifier.id
        );

        if (existingModifier) {
          // 🆕 Si se está deseleccionando un modificador con customizaciones anidadas, cerrar la vista
          if (modifier.customizations && modifier.customizations.length > 0) {
            if (showingNestedView && currentNestedModifier?.modifier?.id === modifier.id) {
              closeNestedView();
            }
            
            // Limpiar selecciones anidadas de este modificador
            setNestedCustomizations(prev => {
              const newState = { ...prev };
              Object.keys(newState).forEach(key => {
                if (key.startsWith(`${modifier.id}_`)) {
                  delete newState[key];
                }
              });
              return newState;
            });
          }
          
          // Verificar si este modifier fue preseleccionado automáticamente (tipo 2)
          const wasPreselected = preselectedType2Modifiers.some(
            preselected => preselected.modifier_id === modifier.modifier_id &&
                          preselected.customization_id === customizationId
          );

          // Si era un modifier tipo 2 preseleccionado y se está quitando,
          // agregarlo a excludedModifiers para usar without_modifier_id
          if (wasPreselected) {
            setExcludedModifiers(prevExcluded => {
              const alreadyExcluded = prevExcluded.some(
                excluded => excluded.modifier_id === modifier.modifier_id &&
                           excluded.customization_id === customizationId
              );
              
              if (!alreadyExcluded) {
                return [...prevExcluded, {
                  modifier_id: modifier.modifier_id,
                  customization_id: customizationId,
                  without_modifier_id: modifier.without_modifier_id || modifier.modifier_id, // ⭐ Usar el without_modifier_id del modifier
                  originalModifier: modifier // Guardar el modifier completo
                }];
              }
              return prevExcluded;
            });
          }

          return prevModifiers.filter(item => item.id !== modifier.id);
        } else {
          // Si se está agregando un modifier que estaba en excludedModifiers,
          // quitarlo de la lista de excluidos
          setExcludedModifiers(prevExcluded => 
            prevExcluded.filter(excluded => 
              !(excluded.modifier_id === modifier.modifier_id &&
                excluded.customization_id === customizationId)
            )
          );
          let modifierDescription = modifier.name_es;

          if (language === 'en' && modifier.name_en) {
            modifierDescription = modifier.name_en;
          }

          // Para modificadores múltiples con max_selection=1, establecer cantidad fija en 1
          const isMaxOne = selection_type === 'multiple' && modifier.max_selection === 1;
          
          const newModifier = {
            id: modifier.id,
            codigo_modificador: customizationCustomId,
            codigo_articulo: modifier.modifier_id,
            descripcion: modifier.name_es,
            description: modifierDescription,
            precio: parseFloat(modifier.price) || 0, 
            price_with_taxes: parseFloat(modifier.price_with_taxes || modifier.price) || 0, // Incluir precio con impuestos
            cantidad: isMaxOne ? 1 : 1, // Siempre 1 por defecto, pero explícito para max_selection=1
            customization_id: customizationId,
          };

          const isValid = validateModifiers(
            [...prevModifiers, newModifier],
            customizationId,
            selection_type,
            newModifier,
          );

          if (!isValid) {
            return prevModifiers;
          }

          if (selection_type === 'single') {
            const filteredModifiers = prevModifiers.filter(
              m => m.customization_id !== customizationId,
            );
            
            // 🆕 Limpiar selecciones anidadas de los modifiers que se están removiendo
            const removedModifiers = prevModifiers.filter(
              m => m.customization_id === customizationId,
            );
            
            if (removedModifiers.length > 0) {
              console.log('🧹 Limpiando selecciones anidadas de modifiers removidos:', removedModifiers);
              setNestedCustomizations(prev => {
                const newState = { ...prev };
                removedModifiers.forEach(removedMod => {
                  // Limpiar todas las claves que empiecen con el ID del modifier removido
                  Object.keys(newState).forEach(key => {
                    if (key.startsWith(`${removedMod.id}_`)) {
                      console.log('  🗑️ Eliminando selecciones nested para:', removedMod.descripcion, 'key:', key);
                      delete newState[key];
                    }
                  });
                });
                return newState;
              });
            }
            
            return [...filteredModifiers, newModifier];
          }

          return [...prevModifiers, newModifier];
        }
      });
    },
    [customizations, language, validateModifiers, preselectedType2Modifiers, showingNestedView, currentNestedModifier, closeNestedView],
  );

  const handleSetQuantityModifier = useCallback(
    (qty, modifier, customizationId, selection_type, customizationCustomId) => {
      setModifiersSelected(prevModifiers => {
        const existingModifierIndex = prevModifiers.findIndex(
          item => item.id === modifier.id,
        );

        if (existingModifierIndex >= 0) {
          const updatedModifiers = [...prevModifiers];
          updatedModifiers[existingModifierIndex] = {
            ...updatedModifiers[existingModifierIndex],
            cantidad: qty,
          };

          if (qty === 0) {
            return updatedModifiers.filter(item => item.id !== modifier.id);
          } else {
            const isValid = validateModifiers(
              updatedModifiers,
              customizationId,
              selection_type,
              updatedModifiers[existingModifierIndex],
            );
            if (!isValid) {
              return prevModifiers; // return previous state if  valid
            }
            return updatedModifiers;
          }
        } else {
          // Si el modificador no existe, crearlo con estructura completa
          let modifierDescription = modifier.name_es;
          if (language === 'en' && modifier.name_en) {
            modifierDescription = modifier.name_en;
          }
          
          const newModifier = {
            id: modifier.id,
            codigo_modificador: customizationCustomId || customizationId,
            codigo_articulo: modifier.modifier_id,
            descripcion: modifier.name_es,
            description: modifierDescription,
            precio: parseFloat(modifier.price) || 0,
            price_with_taxes: parseFloat(modifier.price_with_taxes || modifier.price) || 0, // Incluir precio con impuestos
            cantidad: qty,
            customization_id: customizationId,
          };
          
          const isValid = validateModifiers(
            [...prevModifiers, newModifier],
            customizationId,
            selection_type,
            newModifier,
          );
          if (!isValid) {
            return prevModifiers; // return previous state if not valid
          }
          return [...prevModifiers, newModifier];
        }
      });
    },
    [validateModifiers, language],
  );

  // 🆕 Función para manejar la selección de modificadores anidados (nested customizations)
  const handleNestedModifierPress = useCallback(
    (parentModifierId, nestedModifier, nestedCustomizationId, selectionType) => {
      console.log('🔵 handleNestedModifierPress called', {
        parentModifierId,
        nestedModifierId: nestedModifier.id,
        nestedModifierName: nestedModifier.name_es,
        nestedCustomizationId,
        selectionType
      });
      
      setNestedCustomizations(prev => {
        const key = `${parentModifierId}_${nestedCustomizationId}`;
        const currentSelections = prev[key] || [];

        console.log('📦 Current state', {
          key,
          currentSelections,
          prevState: prev
        });

        if (selectionType === 'single') {
          // Para single selection, reemplazar la selección
          const newState = {
            ...prev,
            [key]: [nestedModifier.id]
          };
          console.log('✅ New state (single):', newState);
          return newState;
        } else {
          // Para multiple selection
          const isSelected = currentSelections.includes(nestedModifier.id);
          if (isSelected) {
            // Deseleccionar
            const newState = {
              ...prev,
              [key]: currentSelections.filter(id => id !== nestedModifier.id)
            };
            console.log('➖ New state (deselect):', newState);
            return newState;
          } else {
            // Seleccionar (agregar)
            const newState = {
              ...prev,
              [key]: [...currentSelections, nestedModifier.id]
            };
            console.log('➕ New state (select):', newState);
            return newState;
          }
        }
      });
    },
    []
  );

  // 🆕 Función para verificar si un modificador anidado está seleccionado
  const isNestedModifierSelected = useCallback((parentModifierId, nestedCustomizationId, nestedModifierId) => {
    const key = `${parentModifierId}_${nestedCustomizationId}`;
    const selections = nestedCustomizations[key] || [];
    const isSelected = selections.includes(nestedModifierId);
    
    // Debug log (comentar después de probar)
    // console.log('🔍 isNestedModifierSelected', {
    //   key,
    //   nestedModifierId,
    //   selections,
    //   isSelected
    // });
    
    return isSelected;
  }, [nestedCustomizations]);

  // 🆕 Funciones para manejar la navegación deslizante
  const openNestedView = useCallback((modifier, customization) => {
    console.log('🔵 openNestedView called', {
      modifier: modifier.name_es,
      hasCustomizations: !!modifier.customizations,
      customizationsCount: modifier.customizations?.length
    });
    
    setCurrentNestedModifier({ modifier, customization });
    setShowingNestedView(true);
    
    Animated.timing(nestedViewAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [nestedViewAnimation]);

  const closeNestedView = useCallback(() => {
    console.log('🔴 closeNestedView called');
    
    Animated.timing(nestedViewAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowingNestedView(false);
      setCurrentNestedModifier(null);
    });
  }, [nestedViewAnimation]);

  // 🔍 Debug effect para ver cambios de estado
  useEffect(() => {
    if (showingNestedView || currentNestedModifier) {
      console.log('🔍 Nested View States:', {
        showingNestedView,
        hasCurrentModifier: !!currentNestedModifier,
        modifierName: currentNestedModifier?.modifier?.name_es,
        customizationsCount: currentNestedModifier?.modifier?.customizations?.length
      });
    }
  }, [showingNestedView, currentNestedModifier]);

  // Función para verificar si el producto tiene algún requisito obligatorio
  const hasRequiredSelections = useCallback(() => {
    if (!product.has_category_groups || !product.category_groups) {
      return false;
    }
    
    for (let categoryGroup of product.category_groups) {
      const groupCustomizations = categoryGroup.customizations || [];
      for (let customization of groupCustomizations) {
        if (customization.min_selection > 0) {
          return true; // Encontró al menos un requisito
        }
      }
  }
  return false; // No hay requisitos obligatorios
}, [product.has_category_groups, product.category_groups]);

  // 🚀 OPTIMIZACIÓN: Obtener TODAS las customizations requeridas (min_selection > 0)
  const requiredCustomizations = useMemo(() => {
    const required = [];
    
    if (product.has_category_groups && product.category_groups) {
      // Para category groups, recorrer todos los grupos
      product.category_groups.forEach(group => {
        (group.customizations || []).forEach(customization => {
          if (customization.min_selection > 0) {
            required.push({
              id: customization.id,
              customization_id: customization.customization_id,
              name: customization.name_es || customization.name_en,
              min_selection: customization.min_selection,
              max_selection: customization.max_selection,
              selection_type: customization.selection_type,
              category_group_id: group.id,
              category_group_name: group.name_es || group.name,
            });
          }
        });
      });
    } else {
      // Para productos sin category groups
      const productCustomizations = product.section?.customizations || product.customizations || [];
      productCustomizations.forEach(customization => {
        if (customization.min_selection > 0) {
          required.push({
            id: customization.id,
            customization_id: customization.customization_id,
            name: customization.name_es || customization.name_en,
            min_selection: customization.min_selection,
            max_selection: customization.max_selection,
            selection_type: customization.selection_type,
          });
        }
      });
    }
    
    console.log('🔍 [Required Customizations]:', required.length, 'customizations requeridas:', 
      required.map(r => `${r.name} (min: ${r.min_selection})`).join(', ') || 'ninguna'
    );
    
    return required;
  }, [product.has_category_groups, product.category_groups, product.section?.customizations, product.customizations]);

  // 🚀 OPTIMIZACIÓN: Validación genérica basada en requiredCustomizations
  const areAllRequiredSelectionsComplete = useMemo(() => {
    // Si no hay customizations requeridas, el botón siempre está habilitado
    if (requiredCustomizations.length === 0) {
      console.log('🟢 [Validation] No hay customizations requeridas - botón habilitado');
      return true;
    }
    
    // Obtener todas las selecciones consolidadas
    const { allSelections } = getAllCategoryGroupSelections();
    
    console.log('🔍 [Validation] Verificando', requiredCustomizations.length, 'customizations requeridas');
    console.log('🔍 [Validation] Total selecciones disponibles:', allSelections.length);
    
    // Verificar cada customization requerida
    for (const requiredCustom of requiredCustomizations) {
      // Buscar selecciones que correspondan a esta customization
      const selectedForThis = allSelections.filter(
        selected => selected.codigo_modificador === requiredCustom.customization_id
      );
      
      // Contar la cantidad total seleccionada
      const totalQty = selectedForThis.reduce(
        (acc, selected) => acc + (selected.cantidad || 1),
        0
      );
      
      // Verificar si cumple con el mínimo requerido
      if (totalQty < requiredCustom.min_selection) {
        console.log(`🔴 [Validation] FALTA: "${requiredCustom.name}" requiere ${requiredCustom.min_selection}, tiene ${totalQty}`);
        return false;
      }
      
      // Verificar si no excede el máximo
      if (totalQty > requiredCustom.max_selection) {
        console.log(`🔴 [Validation] EXCEDE: "${requiredCustom.name}" máximo ${requiredCustom.max_selection}, tiene ${totalQty}`);
        return false;
      }
      
      console.log(`✅ [Validation] OK: "${requiredCustom.name}" (${totalQty}/${requiredCustom.min_selection})`);
    }
    
    console.log('🟢 [Validation] Todas las customizations requeridas completadas - botón habilitado');
    return true;
  }, [requiredCustomizations, categoryGroupSelections, modifiersSelected, sizeSelected]);

  // 🚀 OPTIMIZACIÓN: Función de validación genérica basada en requiredCustomizations
  const validateSelections = useCallback(() => {
    // Usar la misma lógica que areAllRequiredSelectionsComplete
    return areAllRequiredSelectionsComplete;
  }, [areAllRequiredSelectionsComplete]);

  const handleCategoryGroupToggle = useCallback((categoryGroup) => {
    const isCurrentlyExpanded = expandedGroups[categoryGroup.id];
    
    // 🚀 ACORDEÓN: Solo un grupo expandido a la vez (cerrar todos los demás)
    setExpandedGroups(prev => {
      // Si se está contrayendo el grupo actual, solo contraerlo
      if (isCurrentlyExpanded) {
        return {
          ...prev,
          [categoryGroup.id]: false
        };
      }
      
      // Si se está expandiendo, cerrar TODOS los demás y abrir solo este
      const newState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false; // Cerrar todos
      });
      newState[categoryGroup.id] = true; // Abrir solo el seleccionado
      
      return newState;
    });
    
    // 🔧 FIX: En modo EDICIÓN, NO modificar las selecciones al expandir/contraer
    // Las selecciones ya están cargadas correctamente desde el producto
    if (isUpdate) {
      console.log('📝 [Toggle] Modo edición: NO modificar selecciones al expandir/contraer');
      return;
    }
    
    // Lógica original solo para productos NUEVOS
    if (!isCurrentlyExpanded) {
      // Guardar selecciones de la categoría actual si existe
      if (selectedCategoryGroup && selectedCategoryGroup.id !== categoryGroup.id) {
        setCategoryGroupSelections(prev => ({
          ...prev,
          [selectedCategoryGroup.id]: [...modifiersSelected]
        }));
        setCategoryGroupSizes(prev => ({
          ...prev,
          [selectedCategoryGroup.id]: sizeSelected
        }));
        // 🆕 Guardar selecciones nested
        setCategoryGroupNestedSelections(prev => ({
          ...prev,
          [selectedCategoryGroup.id]: {...nestedCustomizations}
        }));
      }
      
      // Establecer como la categoría activa
      setSelectedCategoryGroup(categoryGroup);
      
      // Restaurar selecciones guardadas para esta categoría
      const savedSelections = categoryGroupSelections[categoryGroup.id] || [];
      const savedSize = categoryGroupSizes[categoryGroup.id] || null;
      const savedNestedSelections = categoryGroupNestedSelections[categoryGroup.id] || {};
      
      // Si no hay selecciones guardadas, aplicar auto-selección tipo 2
      if (savedSelections.length === 0) {
        const autoSelectModifiers = [];
        const categoryCustomizations = categoryGroup.customizations || [];

        categoryCustomizations.forEach((customization) => {
          customization.modifiers?.forEach((modifier) => {
            // Seleccionar automáticamente modificadores con modifier_type: 2 (receta)
            if (modifier.modifier_type === 2) {
              autoSelectModifiers.push({
                id: modifier.id,
                modifier_id: modifier.modifier_id,
                name_es: modifier.name_es,
                name_en: modifier.name_en,
                precio: parseFloat(modifier.price) || 0,
                price_with_taxes: parseFloat(modifier.price_with_taxes) || 0,
                customization_id: customization.id,
                codigo_modificador: customization.customization_id,
                codigo_articulo: modifier.modifier_id,
                descripcion: modifier.name_es,
                cantidad: 1,
              });
            }
          });
        });

        if (autoSelectModifiers.length > 0) {
          console.log('🤖 [Toggle] Auto-seleccionando modificadores tipo 2 para:', categoryGroup.name_es, autoSelectModifiers.length);
          setModifiersSelected(autoSelectModifiers);
          
          // Rastrear cuáles fueron preseleccionados automáticamente
          const preselectedIds = autoSelectModifiers.map(mod => ({
            id: mod.id,
            modifier_id: mod.modifier_id,
            customization_id: mod.customization_id,
            selection_type: categoryCustomizations.find(c => c.id === mod.customization_id)?.selection_type
          }));
          setPreselectedType2Modifiers(preselectedIds);
        } else {
          setModifiersSelected([]);
        }
        // Limpiar nested selections si no hay savedSelections
        setNestedCustomizations({});
      } else {
        setModifiersSelected(savedSelections);
        // 🆕 Restaurar nested selections guardadas
        setNestedCustomizations(savedNestedSelections);
      }
      
      // Establecer sizeSelected basado en selecciones guardadas o customizations disponibles
      const hasCustomizations = categoryGroup.customizations && categoryGroup.customizations.length > 0;
      if (savedSize !== null) {
        setSizeSelected(savedSize);
      } else {
        setSizeSelected(hasCustomizations ? null : true);
      }
    } else {
      // Si se está contrayendo, guardar selecciones actuales
      if (selectedCategoryGroup && selectedCategoryGroup.id === categoryGroup.id) {
        setCategoryGroupSelections(prev => ({
          ...prev,
          [categoryGroup.id]: [...modifiersSelected]
        }));
        setCategoryGroupSizes(prev => ({
          ...prev,
          [categoryGroup.id]: sizeSelected
        }));
        
        // Si no hay otros grupos expandidos, limpiar selecciones actuales
        const otherExpandedGroups = Object.keys(expandedGroups).filter(
          groupId => groupId !== categoryGroup.id && expandedGroups[groupId]
        );
        
        if (otherExpandedGroups.length === 0) {
          setModifiersSelected([]);
          setSizeSelected(null);
          setSelectedCategoryGroup(null);
        } else {
          // Si hay otros grupos expandidos, cambiar a uno de ellos
          const nextGroupId = otherExpandedGroups[0];
          const nextGroup = product.category_groups.find(g => g.id.toString() === nextGroupId);
          if (nextGroup) {
            setSelectedCategoryGroup(nextGroup);
            const savedSelections = categoryGroupSelections[nextGroup.id] || [];
            const savedSize = categoryGroupSizes[nextGroup.id] || null;
            setModifiersSelected(savedSelections);
            setSizeSelected(savedSize);
          }
        }
      }
    }
  }, [isUpdate, expandedGroups, categoryGroupSelections, categoryGroupSizes, selectedCategoryGroup, modifiersSelected, sizeSelected, product.category_groups]);

  // Función para guardar selecciones cuando se cambia de grupo
  const saveCurrentSelections = useCallback(() => {
    if (selectedCategoryGroup) {
      setCategoryGroupSelections(prev => ({
        ...prev,
        [selectedCategoryGroup.id]: [...modifiersSelected]
      }));
      setCategoryGroupSizes(prev => ({
        ...prev,
        [selectedCategoryGroup.id]: sizeSelected
      }));
    }
  }, [selectedCategoryGroup, modifiersSelected, sizeSelected]);

  // 🎨 Función para animar el badge de customización requerida
  const startBadgeAnimation = useCallback(() => {
    // Reset animation
    badgeAnimation.setValue(0);
    
    // Animación sutil: pulso suave 3 veces
    Animated.sequence([
      Animated.timing(badgeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [badgeAnimation]);

  // Function moved above to avoid 'not defined' error

  const handleAddToCart = useCallback(() => {
    console.log('🔵 [handleAddToCart] INICIADO');
    console.log('🔍 [handleAddToCart] requiredCustomizations:', requiredCustomizations.length);
    console.log('🔍 [handleAddToCart] requiredCustomizations details:', requiredCustomizations);
    
    // 🚀 NUEVA LÓGICA: Siempre ejecutar, hacer validaciones y navegar a errores
    
    // Validar si faltan selecciones requeridas
    const isValid = validateSelections();
    console.log('🔍 [handleAddToCart] validateSelections() retornó:', isValid);
    
    if (!isValid) {
      console.log('⚠️ handleAddToCart: Validación fallida - buscando primera customización incompleta');
      
      // Buscar la primera customización requerida que no está completa
      const { allSelections } = getAllCategoryGroupSelections();
      console.log('🔍 [handleAddToCart] allSelections:', allSelections);
      
      for (const requiredCustom of requiredCustomizations) {
        const selectedForThis = allSelections.filter(
          selected => selected.codigo_modificador === requiredCustom.customization_id
        );
        
        const totalQty = selectedForThis.reduce(
          (acc, selected) => acc + (selected.cantidad || 1),
          0
        );
        
        console.log(`🔍 [handleAddToCart] Checking "${requiredCustom.name}": totalQty=${totalQty}, min=${requiredCustom.min_selection}`);
        
        // Si esta customization no cumple el mínimo
        if (totalQty < requiredCustom.min_selection) {
          console.log(`🎯 Customización incompleta encontrada: "${requiredCustom.name}"`);
          console.log(`🎯 category_group_id: ${requiredCustom.category_group_id}`);
          console.log(`🎯 customization_id: ${requiredCustom.id}`);
          
          // Guardar los IDs para highlighting
          setInvalidCustomizationId(requiredCustom.id);
          setInvalidCategoryGroupId(requiredCustom.category_group_id || null);
          
          // Si tiene category_group_id, expandir ese grupo
          if (requiredCustom.category_group_id) {
            console.log(`📂 Expandiendo category group: ${requiredCustom.category_group_id}`);
            setExpandedGroups(prev => ({
              ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}), // Cerrar todos
              [requiredCustom.category_group_id]: true // Abrir el necesario
            }));
            
            // Esperar a que se expanda y el layout se actualice
            setTimeout(() => {
              // 📍 Scroll suave (smooth) hacia el category group con error
              const layout = categoryGroupLayouts.current[requiredCustom.category_group_id];
              
              console.log('📍 Layout disponible:', !!layout);
              if (layout && customizationsScrollRef.current) {
                console.log('📍 Haciendo scroll suave a category group:', layout.y);
                
                // Usar scrollTo con animated para scroll suave
                customizationsScrollRef.current.scrollTo({
                  y: Math.max(0, layout.y - 20), // Offset de 20px para mejor visibilidad
                  animated: true, // ✨ Animación suave nativa
                });
                
                // Animar badge después del scroll
                setTimeout(() => {
                  console.log('✨ Iniciando animación de badge');
                  startBadgeAnimation();
                }, 150); // Tiempo para que el scroll se complete
              } else {
                // Si no hay layout guardado, solo animar
                console.log('⚠️ Layout no encontrado para category group:', requiredCustom.category_group_id);
                startBadgeAnimation();
              }
              
              // Limpiar después de la animación
              setTimeout(() => {
                setInvalidCustomizationId(null);
                setInvalidCategoryGroupId(null);
              }, 2800); // Aumentado para dar tiempo al scroll + animación
            }, 500); // Aumentado para asegurar que el layout esté disponible
          } else {
            // No tiene category group - producto con customizaciones directas
            console.log('📍 Producto sin category groups, scrolling a customización individual');
            
            // Esperar un momento para que el layout esté disponible
            setTimeout(() => {
              const layout = customizationLayouts.current[requiredCustom.id];
              
              console.log('📍 Layout customización individual:', !!layout, layout);
              if (layout && customizationsScrollRef.current) {
                console.log('📍 Haciendo scroll suave a customización:', layout.y);
                
                customizationsScrollRef.current.scrollTo({
                  y: Math.max(0, layout.y - 20),
                  animated: true,
                });
                
                // Animar badge después del scroll
                setTimeout(() => {
                  console.log('✨ Iniciando animación de badge');
                  startBadgeAnimation();
                }, 150);
              } else {
                // Si no hay layout, solo animar
                console.log('⚠️ Layout no encontrado, solo animando badge');
                startBadgeAnimation();
              }
              
              // Limpiar
              setTimeout(() => {
                setInvalidCustomizationId(null);
              }, 2800);
            }, 300); // Dar tiempo para que el layout esté disponible
          }
          
          return; // Detener ejecución
        }
      }
      
      console.log('❌ handleAddToCart: No se encontró customización específica incompleta (raro!)');
      return;
    }

    console.log('✅ handleAddToCart: Validación pasada, agregando al carrito...');

    // Guardar selecciones actuales antes de procesar
    if (product.has_category_groups && selectedCategoryGroup) {
      setCategoryGroupSelections(prev => ({
        ...prev,
        [selectedCategoryGroup.id]: [...modifiersSelected]
      }));
      setCategoryGroupSizes(prev => ({
        ...prev,
        [selectedCategoryGroup.id]: sizeSelected
      }));
    }
    
    // Para productos con category groups, usar todas las selecciones consolidadas
    let finalModifiersSelected = modifiersSelected;
    if (product.has_category_groups) {
      const { allSelections } = getAllCategoryGroupSelections();
      // Incluir también las selecciones actuales si no están guardadas aún
      if (selectedCategoryGroup) {
        const currentSelections = modifiersSelected.filter(mod => 
          !allSelections.some(existing => existing.id === mod.id)
        );
        finalModifiersSelected = [...allSelections, ...currentSelections];
      } else {
        finalModifiersSelected = allSelections;
      }
      

    }

    // helpers (fuera del componente)
    const slimCustomizations = (mods = []) => {
      const regularModifiers = mods.map(m => {
        const baseModifier = {
          codigo_modificador: m.codigo_modificador, // Mantener el valor original
          codigo_articulo: m.codigo_articulo,
          descripcion: m.descripcion,
          description: m.description,
          precio: m.precio,
          price_with_taxes: m.price_with_taxes, // Incluir price_with_taxes que ya tiene impuestos
          cantidad: m.cantidad,
          modifier_id: m.codigo_articulo,
        };

        // 🆕 Incluir customizaciones anidadas si existen
        const nestedMods = [];
        if (nestedCustomizations) {
          Object.keys(nestedCustomizations).forEach(key => {
            if (key.startsWith(`${m.id}_`)) {
              const nestedModifierIds = nestedCustomizations[key];
              const [parentId, nestedCustomizationId] = key.split('_').map(Number);
              
              // Buscar la información del modificador padre y sus customizaciones
              const parentModifier = product.category_groups
                ?.flatMap(cg => cg.customizations)
                .flatMap(c => c.modifiers)
                .find(mod => mod.id === parentId);
              
              if (parentModifier && parentModifier.customizations) {
                const nestedCustomization = parentModifier.customizations.find(
                  nc => nc.id === nestedCustomizationId
                );
                
                if (nestedCustomization) {
                  nestedModifierIds.forEach(nestedModId => {
                    const nestedModifier = nestedCustomization.modifiers.find(
                      nm => nm.id === nestedModId
                    );
                    
                    if (nestedModifier) {
                      nestedMods.push({
                        codigo_modificador: nestedCustomization.customization_id || nestedCustomization.id,
                        codigo_articulo: nestedModifier.modifier_id,
                        descripcion: nestedModifier.name_es,
                        description: nestedModifier.name_en || nestedModifier.name_es,
                        precio: nestedModifier.price || 0,
                        price_with_taxes: nestedModifier.price_with_taxes || nestedModifier.price || 0,
                        cantidad: 1,
                        modifier_id: nestedModifier.modifier_id,
                      });
                    }
                  });
                }
              }
            }
          });
        }

        // Si hay modificadores anidados, agregarlos al modificador base
        if (nestedMods.length > 0) {
          return {
            ...baseModifier,
            nested_customizations: nestedMods
          };
        }

        return baseModifier;
      });

      // Agregar modifiers excluidos usando without_modifier_id
      const excludedModifierEntries = excludedModifiers.map(excluded => {
        const originalModifier = excluded.originalModifier;
        
        // Función para detectar y mantener el formato de mayúsculas/minúsculas
        const formatWithoutText = (originalText, withoutWord) => {
          if (!originalText) return withoutWord;
          
          // Detectar si está completamente en mayúsculas
          if (originalText === originalText.toUpperCase()) {
            return `${withoutWord.toUpperCase()} ${originalText}`;
          }
          
          // Detectar si es solo la primera letra en mayúscula
          if (originalText.charAt(0) === originalText.charAt(0).toUpperCase() && 
              originalText.slice(1) === originalText.slice(1).toLowerCase()) {
            return `${withoutWord.charAt(0).toUpperCase() + withoutWord.slice(1).toLowerCase()} ${originalText}`;
          }
          
          // Detectar si está completamente en minúsculas
          if (originalText === originalText.toLowerCase()) {
            return `${withoutWord.toLowerCase()} ${originalText}`;
          }
          
          // Caso por defecto: mantener formato original del "sin/without"
          return `${withoutWord} ${originalText}`;
        };
        
        // Crear descripción manteniendo el formato de mayúsculas/minúsculas
        const descripcionSin = formatWithoutText(originalModifier?.name_es, 'Sin');
        const descriptionSin = formatWithoutText(
          originalModifier?.name_en || originalModifier?.name_es, 
          'Without'
        );
        
        return {
          codigo_modificador: excluded.customization_id,
          codigo_articulo: excluded.without_modifier_id, // ⭐ Usar without_modifier_id en lugar del modifier_id
          descripcion: descripcionSin,
          description: descriptionSin,
          precio: 0,
          cantidad: 1, // Cantidad 1 para indicar "sin este ingrediente"
          modifier_id: excluded.without_modifier_id, // ⭐ Usar without_modifier_id
        };
      });

      return [...regularModifiers, ...excludedModifierEntries];
    };

    // podés limitar a 3–5 para no inflar el state si vienen muchas
    const slimRecommendations = (arr = []) =>
      arr.slice(0, 3).map(r => ({
        sku: r.sku,
        name_es: r.name_es,
        name_en: r.name_en,
        image_url: r.image_url ?? null,
        price: r.price,
        currency: r.currency,
      }));

    // arma la línea slim
    const buildSlimLine = (base, qty, total, mods, recs) => ({
      // UI (BagView)
      sku: base.sku,
      name_es: base.name_es,
      name_en: base.name_en,
      image_url: base.image_url ?? null,
      price: base.price,
      taxRate: base.tax_rate ?? base.taxRate ?? 0, // BagView usa taxRate
      currency: base.currency,
      quantity: qty,
      totalLine: total,

      // Order API + UI
      customizations: slimCustomizations(mods),

      // Recomendados por ítem (sólo lo que necesitas)
      recommended_products: slimRecommendations(recs),

      // Nuevo: para llevar
      isTakeAway: isTakeAway === true,
    });

    const productToAdd = buildSlimLine(
      product,
      quantity,
      totalProductBag,
      finalModifiersSelected,
      product.recommended_products || [],
    );

    // � DEBUG: Log específico de nested customizations
    console.log('🛒 PRODUCTO A AGREGAR AL CARRITO:');
    console.log('📦 Customizations:', JSON.stringify(productToAdd.customizations, null, 2));
    if (productToAdd.customizations?.some(c => c.nested_customizations)) {
      console.log('✅ NESTED CUSTOMIZATIONS DETECTADOS:');
      productToAdd.customizations.forEach((cust, idx) => {
        if (cust.nested_customizations) {
          console.log(`  ${idx + 1}. ${cust.descripcion}:`);
          cust.nested_customizations.forEach((nested, nIdx) => {
            console.log(`     ${nIdx + 1}. ${nested.descripcion} - $${nested.precio}`);
          });
        }
      });
    } else {
      console.log('⚠️ NO HAY NESTED CUSTOMIZATIONS en este producto');
    }

    // �🚀 OPTIMIZACIÓN: Ejecución inmediata sin delays
    try {
      if (isUpdate) {
        console.log('🔄 ACTUALIZANDO producto existente en Redux');
        console.log(
          'Producto que se actualizará:',
          JSON.stringify(productToAdd, null, 2),
        );

        dispatch(
          updateProductByIndex({index: productIndex, product: productToAdd}),
        );
      } else {
        console.log('➕ AGREGANDO nuevo producto a Redux');
        console.log(
          'Producto que se agregará:',
          JSON.stringify(productToAdd, null, 2),
        );

        dispatch(addProduct(productToAdd));
      }

      // Reset inmediato de estados
      setQuantity(1);
      setModifiersSelected([]);
      setProductSelected(initialState);
      setSizeSelected(null);
      setPreselectedType2Modifiers([]);
      setExcludedModifiers([]);

      // Navegación inmediata
      navigation.replace('Index', {goToBag: true});
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  }, [
    validateSelections,
    getAllCategoryGroupSelections,
    requiredCustomizations,
    startBadgeAnimation,
    productSelected,
    modifiersSelected,
    totalProductBag,
    quantity,
    isUpdate,
    dispatch,
    productIndex,
    initialState,
    navigation,
    isTakeAway,
    excludedModifiers,
    nestedCustomizations,
    product,
    selectedCategoryGroup,
    sizeSelected,
  ]);

  // Función para verificar si una categoría tiene selecciones
  const categoryHasSelections = useCallback((categoryGroupId) => {
    const selections = categoryGroupSelections[categoryGroupId] || [];
    const hasSize = categoryGroupSizes[categoryGroupId];
    return selections.length > 0 || (hasSize && hasSize !== true);
  }, [categoryGroupSelections, categoryGroupSizes]);

  // Callback para agregar producto recomendado directamente al carrito con animación
  const handleAddRecommendedProduct = useCallback((recommendedProduct, sku) => {
    // Inicializar animación si no existe
    if (!recommendationAnimRefs.current[sku]) {
      recommendationAnimRefs.current[sku] = {
        rotation: new Animated.Value(0),
        scale: new Animated.Value(1),
      };
    }

    const animValues = recommendationAnimRefs.current[sku];

    // Marcar como animando INMEDIATAMENTE
    setRecommendationAnimations(prev => ({
      ...prev,
      [sku]: 'animating'
    }));

    // Crear el objeto del producto básico sin modificadores ni personalizaciones
    const productToAdd = {
      sku: recommendedProduct.sku,
      name: recommendedProduct.name,
      name_es: recommendedProduct.name_es,
      name_en: recommendedProduct.name_en,
      price: recommendedProduct.full_price || recommendedProduct.price,
      quantity: 1,
      image_url: recommendedProduct.image_url,
      currency: recommendedProduct.currency || product.currency,
      customizations: [], // Sin personalizaciones
      modifiers: [], // Sin modificadores
      size: null,
      notes: '',
      takeAway: false,
    };

    // Agregar al carrito de forma asíncrona (no bloqueante)
    setTimeout(() => {
      dispatch(addProduct(productToAdd));
    }, 0);

    // Iniciar animación inmediatamente: Rotar 360 grados con escala
    Animated.sequence([
      Animated.parallel([
        Animated.timing(animValues.rotation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(animValues.scale, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animValues.scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      // Mostrar check
      setRecommendationAnimations(prev => ({
        ...prev,
        [sku]: 'success'
      }));

      // Reset después de 800ms
      setTimeout(() => {
        animValues.rotation.setValue(0);
        animValues.scale.setValue(1);
        setRecommendationAnimations(prev => ({
          ...prev,
          [sku]: null
        }));
      }, 800);
    });
  }, [dispatch, product.currency]);

  // Función para contar selecciones en una categoría
  const getCategorySelectionCount = useCallback((categoryGroupId) => {
    const selections = categoryGroupSelections[categoryGroupId] || [];
    const hasSize = categoryGroupSizes[categoryGroupId];
    let count = selections.length;
    if (hasSize && hasSize !== true) {
      count += 1; // Contar el tamaño como una selección adicional
    }
    return count;
  }, [categoryGroupSelections, categoryGroupSizes]);

  // 🚀 OPTIMIZACIÓN: Memoizar el precio con impuestos para evitar recálculos
  const getModifierDisplayPrice = useCallback((modifier) => {
    // Si ya viene price_with_taxes del servidor, usarlo directamente
    if (modifier.price_with_taxes) {
      return modifier.price_with_taxes;
    }
    // Si no, usar el precio base que ya debería incluir impuestos
    return modifier.price || 0;
  }, []);

  // 🎠 CAROUSEL: Renderizar modificadores como carousel horizontal con cards
  const renderModifiersAsCarousel = useCallback((customization, index) => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
      >
        {customization.modifiers.map((modifier, modIdx) => {
          // Determinar si está seleccionado (igual que en la lista normal)
          const selectedModifier = modifiersSelected.find(
            item => item.id === modifier.id,
          );
          const isSelectedForSize = sizeSelected && sizeSelected.id === modifier.id;
          const isSelected = selectedModifier || isSelectedForSize;
          
          const modifierPrice = getModifierDisplayPrice(modifier);
          
          // Obtener el nombre según el idioma
          let modifierName = modifier.name_es;
          if (language === 'en' && modifier.name_en) {
            modifierName = modifier.name_en;
          }
          
          // 🆕 Verificar si este modificador tiene customizaciones anidadas
          const hasNestedCustomizations = modifier.customizations && modifier.customizations.length > 0;
          
          // Handler del press
          const handlePress = () => {
            if (customization.name_es.toLowerCase().includes('tamaño')) {
              handleSizePress(
                modifier,
                customization.id,
                customization.customization_id,
              );
            } else {
              // 🆕 Si ya está seleccionado Y tiene customizaciones anidadas, solo reabrir la vista
              if (hasNestedCustomizations && isSelected) {
                console.log('🔄 Reabriendo vista nested para modifier ya seleccionado (carousel)');
                openNestedView(modifier, customization);
                return; // No llamar a handleModifierPress para evitar deselección
              }
              
              // Si no está seleccionado, o no tiene customizaciones, comportamiento normal
              handleModifierPress(
                modifier,
                customization.id,
                customization.customization_id,
                customization.selection_type,
              );
              
              // 🆕 Si el modificador tiene customizaciones anidadas y NO estaba seleccionado, abrir vista
              if (hasNestedCustomizations && !isSelected) {
                // Usar setTimeout para esperar a que se complete la selección del modificador
                setTimeout(() => {
                  openNestedView(modifier, customization);
                }, 100);
              }
            }
          };
          
          return (
            <TouchableOpacity
              key={`modifier-carousel-${modifier.id}-${modIdx}`}
              style={[
                styles.modifierCardCarousel,
                isSelected && styles.modifierCardSelected
              ]}
              onPress={handlePress}
              activeOpacity={0.7}
            >
              {/* Imagen del modificador - SOLO mostrar si tiene imagen */}
              {modifier.image && (
                <View style={styles.modifierCardImageContainer}>
                  <InstantImage
                    source={{ uri: modifier.image }}
                    style={styles.modifierCardImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Contenido del card */}
              <View style={modifier.image ? styles.modifierCardContent : styles.modifierCardContentNoImage}>
                <View>
                  <Text 
                    style={styles.modifierCardName}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {formatTextCapitalized(modifierName)}
                  </Text>
                  
                  {/* Mostrar selecciones nested si existen - ANTES del precio */}
                  {hasNestedCustomizations && isSelected && modifier.customizations && (
                    <View style={styles.modifierCardNestedInfo}>
                      {modifier.customizations.map((nestedCustomization) => {
                        const key = `${modifier.id}_${nestedCustomization.id}`;
                        const nestedSelections = nestedCustomizations[key] || [];
                        
                        if (nestedSelections.length === 0) return null;
                        
                        // Obtener nombres de los modificadores seleccionados con formato capitalizado
                        const selectedNames = nestedSelections
                          .map(nestedModId => {
                            const nestedMod = nestedCustomization.modifiers?.find(m => m.id === nestedModId);
                            if (!nestedMod) return null;
                            const name = language === 'en' && nestedMod.name_en ? nestedMod.name_en : nestedMod.name_es;
                            return formatTextCapitalized(name);
                          })
                          .filter(Boolean);
                        
                        if (selectedNames.length === 0) return null;
                        
                        return (
                          <Text 
                            key={key}
                            style={styles.modifierCardNestedText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {selectedNames.join(', ')}
                          </Text>
                        );
                      })}
                    </View>
                  )}
                  
                  <Text style={styles.modifierCardPrice}>
                    + {Utils.formatCurrency(modifierPrice, currency)}
                  </Text>
                </View>

                {/* Checkbox oculto en carousel - se indica selección solo con el borde */}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [modifiersSelected, sizeSelected, language, getModifierDisplayPrice, handleSizePress, handleModifierPress, openNestedView, nestedCustomizations, currency]);

  // 🚀 OPTIMIZACIÓN: Memoizar renderizado de modificadores
  const renderModifiers = useCallback((customization, index) => {
    // Detectar el modo de visualización
    const displayMode = customization.display_mode || DISPLAY_MODE_LIST;
    
    // Si es modo carousel, renderizar carousel
    if (displayMode === DISPLAY_MODE_CAROUSEL) {
      return renderModifiersAsCarousel(customization, index);
    }
    
    // Si es modo GRID, renderizar como grid usando el mismo componente del carousel
    if (displayMode === DISPLAY_MODE_GRID) {
      return (
        <View style={styles.modifierGridContainer}>
          {customization.modifiers.map((modifier, modIdx) => {
            const selectedModifier = modifiersSelected.find(
              item => item.id === modifier.id,
            );
            const isSelectedForSize = sizeSelected && sizeSelected.id === modifier.id;
            const isSelected = selectedModifier || isSelectedForSize;
            
            const modifierPrice = getModifierDisplayPrice(modifier);
            
            let modifierName = modifier.name_es;
            if (language === 'en' && modifier.name_en) {
              modifierName = modifier.name_en;
            }
            
            const hasNestedCustomizations = modifier.customizations && modifier.customizations.length > 0;
            
            const handlePress = () => {
              if (customization.name_es.toLowerCase().includes('tamaño')) {
                handleSizePress(
                  modifier,
                  customization.id,
                  customization.customization_id,
                );
              } else {
                if (hasNestedCustomizations && isSelected) {
                  console.log('🔄 Reabriendo vista nested para modifier ya seleccionado (grid)');
                  openNestedView(modifier, customization);
                  return;
                }
                
                handleModifierPress(
                  modifier,
                  customization.id,
                  customization.customization_id,
                  customization.selection_type,
                );
                
                if (hasNestedCustomizations && !isSelected) {
                  setTimeout(() => {
                    openNestedView(modifier, customization);
                  }, 100);
                }
              }
            };
            
            return (
              <TouchableOpacity
                key={`modifier-grid-${modifier.id}-${modIdx}`}
                style={[
                  styles.modifierCard,
                  isSelected && styles.modifierCardSelected
                ]}
                onPress={handlePress}
                activeOpacity={0.7}
              >
                {/* Imagen del modificador */}
                {modifier.image && (
                  <View style={styles.modifierCardImageContainer}>
                    <InstantImage
                      source={{ uri: modifier.image }}
                      style={styles.modifierCardImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Contenido del card */}
                <View style={modifier.image ? styles.modifierCardContent : styles.modifierCardContentNoImage}>
                  <View>
                    <Text 
                      style={styles.modifierCardName}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {formatTextCapitalized(modifierName)}
                    </Text>
                    
                    {hasNestedCustomizations && isSelected && modifier.customizations && (
                      <View style={styles.modifierCardNestedInfo}>
                        {modifier.customizations.map((nestedCustomization) => {
                          const key = `${modifier.id}_${nestedCustomization.id}`;
                          const nestedSelections = nestedCustomizations[key] || [];
                          
                          if (nestedSelections.length === 0) return null;
                          
                          const selectedNames = nestedSelections
                            .map(nestedModId => {
                              const nestedMod = nestedCustomization.modifiers?.find(m => m.id === nestedModId);
                              if (!nestedMod) return null;
                              const name = language === 'en' && nestedMod.name_en ? nestedMod.name_en : nestedMod.name_es;
                              return formatTextCapitalized(name);
                            })
                            .filter(Boolean);
                          
                          if (selectedNames.length === 0) return null;
                          
                          return (
                            <Text 
                              key={`nested-${nestedCustomization.id}`}
                              style={styles.modifierCardNestedText}
                              numberOfLines={2}
                              ellipsizeMode="tail"
                            >
                              {selectedNames.join(', ')}
                            </Text>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <Text style={styles.modifierCardPrice}>
                    + {Utils.formatCurrency(modifierPrice, currency)}
                  </Text>
                </View>

                {/* Control de selección */}
                {/* 🆕 En Grid: Solo mostrar controles para multiple, no para single (radio button removido) */}
                {customization.selection_type === 'multiple' && modifier.max_selection === 1 && (
                  <View style={styles.cardCheckboxContainer}>
                    <View style={[
                      styles.cardCheckbox,
                      isSelected && styles.cardCheckboxSelected
                    ]}>
                      {isSelected && (
                        <Text style={styles.cardCheckboxCheck}>✓</Text>
                      )}
                    </View>
                  </View>
                )}

                {customization.selection_type === 'multiple' && modifier.max_selection > 1 && (
                  <View style={styles.cardQuantityContainer}>
                    {selectedModifier && selectedModifier.cantidad > 0 ? (
                      <ModifierQuantityPicker
                        quantity={selectedModifier.cantidad}
                        setQuantity={handleSetQuantityModifier}
                        modifier={modifier}
                        customization_id={customization.id}
                        customization_selection_type={customization.selection_type}
                        customization_custom_id={customization.customization_id}
                      />
                    ) : (
                      <TouchableOpacity
                        style={styles.cardAddButton}
                        onPress={() => {
                          handleSetQuantityModifier(
                            1,
                            modifier,
                            customization.id,
                            customization.selection_type,
                            customization.customization_id
                          );
                        }}>
                        <Text style={styles.cardAddButtonText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {isSelected && hasNestedCustomizations && (
                  <View style={styles.cardNestedIndicatorButton}>
                    <Icon name="chevron-right" size={20} color={colors.primary} solid />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    
    // Modo LIST - renderizado con imágenes opcionales
    const listModifiers = customization.modifiers.map(modifier => {
      const selectedModifier = modifiersSelected.find(
        item => item.id === modifier.id,
      );
      const isSelectedForSize = sizeSelected && sizeSelected.id === modifier.id;
      const isSelected = selectedModifier || isSelectedForSize;

      let modifierName = modifier.name_es;
      if (language === 'en' && modifier.name_en) {
        modifierName = modifier.name_en;
      }

      const handlePress = () => {
        // No permitir click si es multiple con picker > 1 (se maneja con el picker directamente)
        if (customization.selection_type === 'multiple' && modifier.max_selection > 1) {
          return;
        }

        if (customization.name_es.toLowerCase().includes('tamaño')) {
          handleSizePress(
            modifier,
            customization.id,
            customization.customization_id,
          );
        } else {
          if (!isPickerActive) {
            // 🆕 Si ya está seleccionado Y tiene customizaciones anidadas, solo reabrir la vista
            if (hasNestedCustomizations && isSelected) {
              console.log('🔄 Reabriendo vista nested para modifier ya seleccionado');
              openNestedView(modifier, customization);
              return; // No llamar a handleModifierPress para evitar deselección
            }
            
            // Si no está seleccionado, o no tiene customizaciones, comportamiento normal
            handleModifierPress(
              modifier,
              customization.id,
              customization.customization_id,
              customization.selection_type,
            );
            
            // 🆕 Si el modificador tiene customizaciones anidadas y NO estaba seleccionado, abrir vista
            if (hasNestedCustomizations && !isSelected) {
              // Usar setTimeout para esperar a que se complete la selección del modificador
              setTimeout(() => {
                openNestedView(modifier, customization);
              }, 100);
            }
          }
        }
      };

      // Determinar tipo de control según la lógica de selección
      const isSingleSelection = customization.selection_type === 'single';
      const isMultipleButMaxOne = customization.selection_type === 'multiple' && modifier.max_selection === 1;
      const isMultipleWithPicker = customization.selection_type === 'multiple' && modifier.max_selection > 1;

      // 🆕 Verificar si este modificador tiene customizaciones anidadas
      const hasNestedCustomizations = modifier.customizations && modifier.customizations.length > 0;

      return (
        <View key={modifier.id}>
          <TouchableOpacity
            style={[
              styles.listModifierItem,
              (customization.selection_type === 'multiple' && modifier.max_selection > 1) && styles.listModifierItemDisabled,
              isSelected && hasNestedCustomizations && styles.listModifierItemWithNested
            ]}
            onPress={handlePress}
            activeOpacity={customization.selection_type === 'multiple' && modifier.max_selection > 1 ? 1 : 0.7}>
            
            {/* 🆕 Imagen del modificador en vista lista - si existe */}
            {modifier.image && (
              <View style={styles.listModifierImageContainer}>
                <InstantImage
                  source={{ uri: modifier.image }}
                  style={styles.listModifierImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            {/* Modifier Content */}
            <View style={[
              styles.listModifierContent,
              modifier.image && styles.listModifierContentWithImage
            ]}>
              <Text style={[
                styles.listModifierName,
                isSelected && styles.listModifierNameSelected
              ]}>
                {formatTextCapitalized(modifierName)}
              </Text>
              <Text style={[
                styles.listModifierPrice,
                isSelected && styles.listModifierPriceSelected
              ]}>
                + {Utils.formatCurrency(
                  getModifierDisplayPrice(modifier),
                  currency,
                )}
              </Text>
            </View>
            
            {/* Control de selección según tipo */}
            {isSingleSelection && (
              /* Radio Button para selección single */
              <View style={styles.radioButtonContainer}>
                <View style={[
                  styles.radioButton,
                  isSelected && styles.radioButtonSelected
                ]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
              </View>
            )}

            {isMultipleButMaxOne && (
              /* Checkbox para selección multiple con max 1 */
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected
                ]}>
                  {isSelected && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>
              </View>
            )}

            {isMultipleWithPicker && (
              /* Quantity Picker para selección multiple con max > 1 */
              <View style={styles.listQuantityContainer}>
                {selectedModifier && selectedModifier.cantidad > 0 ? (
                  /* Picker completo cuando hay selección */
                  <ModifierQuantityPicker
                    quantity={selectedModifier.cantidad}
                    setQuantity={handleSetQuantityModifier}
                    modifier={modifier}
                    customization_id={customization.id}
                    customization_selection_type={customization.selection_type}
                    customization_custom_id={customization.customization_id}
                  />
                ) : (
                  /* Solo botón + cuando no hay selección */
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      handleSetQuantityModifier(
                        1,
                        modifier,
                        customization.id,
                        customization.selection_type,
                        customization.customization_id
                      );
                    }}>
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 🆕 Indicador visual de que tiene opciones anidadas (solo visual, no clickeable) */}
            {isSelected && hasNestedCustomizations && (
              <View style={styles.nestedIndicatorButton}>
                <Icon name="chevron-right" size={24} color={colors.primary} solid />
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    });

    return (
      <>
        {listModifiers}
      </>
    );
  }, [modifiersSelected, sizeSelected, language, styles, colors.primary, currency, getModifierDisplayPrice, handleSizePress, handleModifierPress, openNestedView, handleSetQuantityModifier, isPickerActive, nestedCustomizations]);

  // 🚀 OPTIMIZACIÓN: Memoizar renderizado de category groups
  const renderCategoryGroups = useMemo(() => {
    if (!product.has_category_groups || !product.category_groups) {
      return null;
    }

    return (
      <View style={styles.categoryGroupsContainer}>
        {product.category_groups.map((categoryGroup, index) => {
          const groupName = language === 'en' && categoryGroup.name_en
            ? categoryGroup.name_en
            : categoryGroup.name;
          
          const isExpanded = expandedGroups[categoryGroup.id] || false;
          
          return (
            <View 
              key={categoryGroup.id} 
              style={styles.expandedCategoryGroup}
              ref={(ref) => {
                if (ref) {
                  categoryGroupRefs.current[categoryGroup.id] = ref;
                }
              }}
              onLayout={(event) => {
                const layout = event.nativeEvent.layout;
                categoryGroupLayouts.current[categoryGroup.id] = {
                  x: layout.x,
                  y: layout.y,
                  width: layout.width,
                  height: layout.height
                };
              }}
            >
              {/* Título del grupo con contador - Clickeable para toggle */}
              <TouchableOpacity 
                style={styles.expandedGroupTitleContainer}
                onPress={() => handleCategoryGroupToggle(categoryGroup)}
                activeOpacity={0.7}
              >
                <View style={styles.expandedGroupCounter}>
                  <Text style={styles.expandedGroupCounterText}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.expandedGroupTitle]}>{formatTextCapitalized(groupName)}</Text>
                
                {/* Badge personalizado con ícono integrado */}
                {(categoryGroup.custom_header_text || categoryGroup.custom_header_text_es) ? (
                  <View style={styles.customHeaderBadge}>
                    <Text style={styles.customHeaderBadgeText}>
                      {language === 'es' 
                        ? (categoryGroup.custom_header_text_es || categoryGroup.custom_header_text)
                        : (categoryGroup.custom_header_text_en || categoryGroup.custom_header_text)
                      }
                    </Text>
                    <Icon 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.white} 
                      solid 
                      style={{marginLeft: 8}}
                    />
                  </View>
                ) : (
                  <View style={styles.expandToggleIcon}>
                    <Icon 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={32} 
                      color={colors.primary} 
                      solid 
                    />
                  </View>
                )}
              </TouchableOpacity>
              
              {categoryGroup.subtitle && (
                <Text style={styles.expandedGroupSubtitle}>
                  {language === 'es' ? categoryGroup.subtitle_es || categoryGroup.subtitle : categoryGroup.subtitle_en || categoryGroup.subtitle}
                </Text>
              )}
              
              {/* 🚀 OPTIMIZACIÓN: Renderizar TODO en memoria, ocultar con display cuando colapsado */}
              {isExpanded && (
                <ScrollView 
                  style={[
                    styles.expandedGroupScrollContainer,
                    // 🆕 Si es el último grupo, permitir que crezca sin límite
                    index === product.category_groups.length - 1 && styles.expandedGroupScrollContainerLast
                  ]}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {(categoryGroup.customizations || []).map((customization, index) => (
                    <View key={customization.id} style={styles.expandedCustomizationSection}>
                      <View>
                        <View>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginRight: 30,
                            }}>
                            <Text style={[styles.expandedCustomizationTitle]}>
                              {formatTextCapitalized(language === 'es'
                                ? customization.name_es
                                : customization.name_es === null
                                ? customization.name_en
                                : customization.name_en)}
                            </Text>
                            {customization.min_selection > 0 && (
                              <Animated.View 
                                style={[
                                  styles.requiredBadge,
                                  // 🎨 Colores invertidos si esta customization está marcada como inválida
                                  invalidCustomizationId === customization.id && styles.requiredBadgeInvalid,
                                  // 🎨 Animación de escala sutil
                                  invalidCustomizationId === customization.id && {
                                    transform: [{
                                      scale: badgeAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.15]
                                      })
                                    }]
                                  }
                                ]}
                              >
                                <Text style={[
                                  styles.requiredBadgeText,
                                  invalidCustomizationId === customization.id && styles.requiredBadgeTextInvalid
                                ]}>
                                  {t('required')}
                                </Text>
                              </Animated.View>
                            )}
                          </View>
                          <Text style={[styles.expandedCustomizationSubtitle]}>
                            {customization.max_selection > 1 
                              ? `${t('select_max')} ${customization.max_selection}`
                              : `${t('select')} ${customization.max_selection}`
                            }
                          </Text>
                        </View>
                      </View>
                      <View style={styles.expandedModifiersContainer}>
                        {renderModifiers(customization, index)}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          );
        })}
      </View>
    );
  }, [product.has_category_groups, product.category_groups, expandedGroups, language, styles, colors.primary, t, renderModifiers]);

  const isScrollable = customizations.length > 0 || (product.has_category_groups && product.category_groups && product.category_groups.length > 0);

  // 🚀 OPTIMIZACIÓN: productDescription como string, no como JSX (para traducción correcta)
  // El JSX se renderiza dentro del componente ProductBasicInfo

  let customizationsTag = null;

  // Si tiene category_groups, mostrar el acordeón
  if (product.has_category_groups && product.category_groups) {
    customizationsTag = (
      <View style={{width: '50%', position: 'relative'}}>
        <ScrollView 
          ref={customizationsScrollRef}
          contentContainerStyle={[styles.scrollViewContainer]}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={[styles.scrollViewContainer]}>
            {renderCategoryGroups}
            
            {/* Recomendaciones al final */}
            {SHOW_RECOMMENDATIONS && product.recommended_products && product.recommended_products.length > 0 && (
              <View style={[styles.recommendationsSection, {width: '100%'}]}>
                <Text style={styles.recommendationsTitle}>
                  {t('you_may_also_like') || 'También te puede interesar'}
                </Text>
                
                {product.recommended_products.map((recommendedProduct, index) => {
                  const recProductName = language === 'es' 
                    ? recommendedProduct.name_es 
                    : recommendedProduct.name_en || recommendedProduct.name_es;
                  
                  const sku = recommendedProduct.sku;
                  const animState = recommendationAnimations[sku];
                  
                  // Obtener valores de animación
                  if (!recommendationAnimRefs.current[sku]) {
                    recommendationAnimRefs.current[sku] = {
                      rotation: new Animated.Value(0),
                      scale: new Animated.Value(1),
                    };
                  }
                  const animValues = recommendationAnimRefs.current[sku];
                  
                  const rotateInterpolate = animValues.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  });
                  
                  return (
                    <TouchableOpacity
                      key={`rec-${sku}-${index}`}
                      style={styles.recommendationItem}
                      onPress={() => {
                        handleAddRecommendedProduct(recommendedProduct, sku);
                      }}
                      disabled={animState === 'animating' || animState === 'success'}
                    >
                      {/* Thumbnail a la izquierda */}
                      <InstantImage
                        source={{
                          uri: recommendedProduct.image_url || 
                          companySelected?.settings?.icon_default_food_url
                        }}
                        style={styles.recommendationThumb}
                        resizeMode="cover"
                      />
                      
                      {/* Nombre y precio en el medio */}
                      <View style={styles.recommendationInfo}>
                        <Text style={styles.recommendationName} numberOfLines={2}>
                          {formatTextCapitalized(recProductName)}
                        </Text>
                        <Text style={styles.recommendationPrice}>
                          {Utils.formatCurrency(
                            recommendedProduct.full_price || recommendedProduct.price, 
                            recommendedProduct.currency || product.currency
                          )}
                        </Text>
                      </View>
                      
                      {/* Botón + discreto a la derecha con animación */}
                      <Animated.View 
                        style={[
                          styles.recommendationAddButton,
                          {
                            transform: [
                              { rotate: rotateInterpolate },
                              { scale: animValues.scale }
                            ],
                            backgroundColor: animState === 'success' ? '#4CAF50' : colors.primary,
                          }
                        ]}
                      >
                        <Text style={styles.recommendationAddButtonText}>
                          {animState === 'success' ? '✓' : '+'}
                        </Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  } else if (!product.has_category_groups && (customizations.length > 0 || (product.customizations && product.customizations.length > 0) || (product.section?.customizations && product.section.customizations.length > 0))) {
    // Lógica original para productos sin category_groups - mostrar directamente sin delay
    customizationsTag = (
      <View style={{width: '50%', position: 'relative'}}>
        <ScrollView 
          ref={customizationsScrollRef}
          contentContainerStyle={[styles.scrollViewContainer]}
        >
          <View style={[styles.scrollViewContainer, !isScrollable && styles.fullHeight]}>
            {customizations.map((customization, index) => (
              <View 
                key={customization.id} 
                style={styles.customizationSection}
                onLayout={(event) => {
                  const layout = event.nativeEvent.layout;
                  customizationLayouts.current[customization.id] = {
                    y: layout.y,
                    height: layout.height
                  };
                }}
              >
                <View>
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginRight: 30,
                      }}>
                      <Text style={[styles.customizationTitle]}>
                        {formatTextCapitalized(language === 'es'
                          ? customization.name_es
                          : customization.name_es === null
                          ? customization.name_en
                          : customization.name_en)}
                      </Text>
                      {customization.min_selection > 0 && (
                        <Animated.View 
                          style={[
                            styles.requiredBadge,
                            // 🎨 Colores invertidos si esta customization está marcada como inválida
                            invalidCustomizationId === customization.id && styles.requiredBadgeInvalid,
                            // 🎨 Animación de escala sutil
                            invalidCustomizationId === customization.id && {
                              transform: [{
                                scale: badgeAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.15]
                                })
                              }]
                            }
                          ]}
                        >
                          <Text style={[
                            styles.requiredBadgeText,
                            invalidCustomizationId === customization.id && styles.requiredBadgeTextInvalid
                          ]}>
                            {t('required')}
                          </Text>
                        </Animated.View>
                      )}
                    </View>
                    <Text style={[styles.customizationSubtitle]}>
                      {t('select_max')} {customization.max_selection}
                    </Text>
                  </View>
                </View>
                <View style={styles.expandedModifiersContainer}>
                  {renderModifiers(customization, index)}
                </View>
              </View>
            ))}
            
            {/* Recomendaciones al final */}
            {SHOW_RECOMMENDATIONS && product.recommended_products && product.recommended_products.length > 0 && (
              <View style={[styles.recommendationsSection, {width: '100%'}]}>
                <Text style={styles.recommendationsTitle}>
                  {t('you_may_also_like') || 'También te puede interesar'}
                </Text>
                
                {product.recommended_products.map((recommendedProduct, index) => {
                  const recProductName = language === 'es' 
                    ? recommendedProduct.name_es 
                    : recommendedProduct.name_en || recommendedProduct.name_es;
                  
                  const sku = recommendedProduct.sku;
                  const animState = recommendationAnimations[sku];
                  
                  // Obtener valores de animación
                  if (!recommendationAnimRefs.current[sku]) {
                    recommendationAnimRefs.current[sku] = {
                      rotation: new Animated.Value(0),
                      scale: new Animated.Value(1),
                    };
                  }
                  const animValues = recommendationAnimRefs.current[sku];
                  
                  const rotateInterpolate = animValues.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  });
                  
                  return (
                    <TouchableOpacity
                      key={`rec-${sku}-${index}`}
                      style={styles.recommendationItem}
                      onPress={() => {
                        handleAddRecommendedProduct(recommendedProduct, sku);
                      }}
                      disabled={animState === 'animating' || animState === 'success'}
                    >
                      {/* Thumbnail a la izquierda */}
                      <InstantImage
                        source={{
                          uri: recommendedProduct.image_url || 
                          companySelected?.settings?.icon_default_food_url
                        }}
                        style={styles.recommendationThumb}
                        resizeMode="cover"
                      />
                      
                      {/* Nombre y precio en el medio */}
                      <View style={styles.recommendationInfo}>
                        <Text style={styles.recommendationName} numberOfLines={2}>
                          {formatTextCapitalized(recProductName)}
                        </Text>
                        <Text style={styles.recommendationPrice}>
                          {Utils.formatCurrency(
                            recommendedProduct.full_price || recommendedProduct.price, 
                            recommendedProduct.currency || product.currency
                          )}
                        </Text>
                      </View>
                      
                      {/* Botón + discreto a la derecha con animación */}
                      <Animated.View 
                        style={[
                          styles.recommendationAddButton,
                          {
                            transform: [
                              { rotate: rotateInterpolate },
                              { scale: animValues.scale }
                            ],
                            backgroundColor: animState === 'success' ? '#4CAF50' : colors.primary,
                          }
                        ]}
                      >
                        <Text style={styles.recommendationAddButtonText}>
                          {animState === 'success' ? '✓' : '+'}
                        </Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{backgroundColor: '#FFF', flex: 1}}>
      {/* Botón de regresar */}
      <BackButton 
        onPress={() => {
          // Si es una actualización, volver al carrito
          if (isUpdate) {
            navigation.navigate('Index', {goToBag: true});
          } else {
            navigation.goBack();
          }
        }}
        styles={styles}
        colors={colors}
      />
      
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
        <View
          style={{
            width: '50%',
            position: 'relative',
          }}>
          <ProductBasicInfo
            imageUrl={imageUrl}
            productName={wrapText(productName, 4)}
            productDescription={productDescriptionStr}
            product={product}
            fromText={fromText}
            isTakeAway={isTakeAway}
            setIsTakeAway={setIsTakeAway}
            quantity={quantity}
            setQuantity={setQuantity}
            styles={styles}
            colors={colors}
            font_type={font_type}
            dimensions={dimensions}
          />
        </View>
        {customizationsTag}
      </View>

      {/* 🆕 Vista deslizante para customizaciones anidadas - Patrón de diseño consistente */}
      {showingNestedView && currentNestedModifier && (
        <Animated.View
          style={[
            styles.nestedViewContainer,
            {
              transform: [{
                translateX: nestedViewAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [dimensions.width * 0.5, 0],
                })
              }],
              opacity: nestedViewAnimation,
            }
          ]}
        >
          <View style={{flex: 1}}>
            {/* Header - botón de regresar y título en la misma línea (minimalista) */}
            <View style={styles.nestedViewHeader}>
              <View style={styles.nestedTitleRow}>
                {/* Botón de regresar a la izquierda */}
                <TouchableOpacity 
                  onPress={closeNestedView}
                  style={styles.nestedBackButton}
                >
                  <Icon name="chevron-left" size={24} color={colors.primary} solid />
                </TouchableOpacity>
                
                {/* Contenido del título */}
                <View style={styles.nestedTitleContent}>
                  <Text style={[styles.expandedCustomizationTitle, {fontSize: dimensions.width * 0.018, marginBottom: 2}]}>
                    {formatTextCapitalized(
                      language === 'es'
                        ? currentNestedModifier.modifier.name_es
                        : currentNestedModifier.modifier.name_en
                    )}
                  </Text>
                  <Text style={[styles.expandedCustomizationSubtitle, {fontSize: dimensions.width * 0.013}]}>
                    {t('customize_your_selection') || 'Personaliza tu selección'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Lista de opciones - mismo estilo que listModifierItem */}
            <ScrollView 
              style={styles.nestedViewContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Iterar sobre las customizaciones del modifier (no sobre los modifiers de la customization padre) */}
              {currentNestedModifier.modifier.customizations && 
                currentNestedModifier.modifier.customizations.map((nestedCustomization) => {
                  const nestedCustomizationName = language === 'es' 
                    ? nestedCustomization.name_es 
                    : nestedCustomization.name_en;
                  
                  return (
                    <View key={nestedCustomization.id}>
                      {/* Título de la customización anidada */}
                      <View style={styles.nestedTitleRow}>
                        <Text style={styles.expandedCustomizationTitle}>
                          {formatTextCapitalized(nestedCustomizationName)}
                        </Text>
                        {nestedCustomization.min_selection > 0 && (
                          <View style={styles.requiredBadge}>
                            <Text style={styles.requiredBadgeText}>
                              {t('required')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.expandedCustomizationSubtitle, {marginBottom: 16}]}>
                        {t('select_max')} {nestedCustomization.max_selection}
                      </Text>
                      
                      {/* Modifiers de esta customización anidada */}
                      {nestedCustomization.modifiers.map((nestedMod) => {
                        const isNestedSelected = isNestedModifierSelected(
                          currentNestedModifier.modifier.id,
                          nestedCustomization.id,
                          nestedMod.id
                        );
                        const nestedModName = language === 'es' ? nestedMod.name_es : nestedMod.name_en;
                        const isSingleSelection = nestedCustomization.selection_type === 'single';

                        return (
                          <TouchableOpacity
                            key={nestedMod.id}
                            style={styles.listModifierItem}
                            onPress={() => handleNestedModifierPress(
                              currentNestedModifier.modifier.id,
                              nestedMod,
                              nestedCustomization.id,
                              nestedCustomization.selection_type
                            )}
                            activeOpacity={0.7}
                          >
                            {/* Modifier Content - mismo diseño que el componente principal */}
                            <View style={styles.listModifierContent}>
                              <Text style={[
                                styles.listModifierName,
                                isNestedSelected && styles.listModifierNameSelected
                              ]}>
                                {formatTextCapitalized(nestedModName)}
                              </Text>
                              <Text style={[
                                styles.listModifierPrice,
                                isNestedSelected && styles.listModifierPriceSelected
                              ]}>
                                + {Utils.formatCurrency(
                                  getModifierDisplayPrice(nestedMod),
                                  currency,
                                )}
                              </Text>
                            </View>
                            
                            {/* Control de selección - mismo diseño que el componente principal */}
                            {isSingleSelection ? (
                              /* Radio Button para selección single */
                              <View style={styles.radioButtonContainer}>
                                <View style={[
                                  styles.radioButton,
                                  isNestedSelected && styles.radioButtonSelected
                                ]}>
                                  {isNestedSelected && <View style={styles.radioButtonInner} />}
                                </View>
                              </View>
                            ) : (
                              /* Checkbox para selección multiple */
                              <View style={styles.checkboxContainer}>
                                <View style={[
                                  styles.checkbox,
                                  isNestedSelected && styles.checkboxSelected
                                ]}>
                                  {isNestedSelected && (
                                    <Text style={styles.checkboxCheck}>✓</Text>
                                  )}
                                </View>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })
              }
            </ScrollView>
          </View>
        </Animated.View>
      )}

      <View style={styles.actionContainer}>
        {/* Centro: Botones */}
        
        <View style={styles.rightButtonContainer}>
          <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  marginRight: 20
                }
              ]}
              onPress={handleAddToCart}>
              <Text
                style={[
                  styles.primaryButtonText,
                  styles.buttonTextUppercase,
                ]}>
                {t('add_item')}
              </Text>
            </TouchableOpacity>
            {/* Derecha: Total */}
            <TotalPriceDisplay 
              totalProductBag={totalProductBag}
              currency={product.currency}
              styles={styles}
            />
        </View>
      </View>
    </View>
  );
};

export default React.memo(ProductDetailView);
