/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import Utils from '../../helpers/utils/Utils';
import ProductService from '../../services/api/ProductService';
import {useOptimizedProducts, useOptimizedRecommendations} from '../../hooks/bag/useOptimizedProducts';
import {useInstantQuantityUpdateSimple} from '../../hooks/bag/useInstantQuantityUpdateSimple';
import {
  removeProductByIndex,
  updateProductByIndex,
  removeProductById,
  clearOrderNotifications,
  productsSelectors,
  selectTotalBag,
} from '../../redux/slice/bagSlice';
import {useTranslation} from 'react-i18next';
import Badge from '../../components/general/Badge';
import useToast from '../../hooks/general/useToast';
import {useOrderCompletionHandler} from '../../hooks/order/useOrderCompletionHandler';
import {useGlobalSocket} from '../../providers/GlobalSocketProvider';
import {useTheme} from '../../providers/ThemeProvider';
import {useIsFocused} from '@react-navigation/native';
import AlertDialogDouble from '../../components/general/alerts/AlertDialogDouble';
import ProductItem from '../../components/bag/ProductItem';
import ProductCard from '../../components/products/ProductCard';
import createStyles from './styles';
import {getOrderDetails} from '../../services/order/orderService';
import {setCurrentView} from '../../redux/slice/settingsSlice';

import {
  PAYMENT_STATUS,
  STATUS,
  ORDER_DONT_REFRESH_VIEWS,
  mapOrderDetailsForBag,
  mapRefactorOrder,
} from '../../helpers/utils/OrderUtils';

// 🎛️ FEATURE FLAG: Mostrar/ocultar productos recomendados en el bag
const SHOW_RECOMMENDATIONS = true; // Cambiar a false para ocultar recomendaciones

const BagView = ({navigation, showBag, payment, onContinueOrdering}) => {
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const {commonStyles, colors, sizes, font_type, dimensions} = useTheme();
  const {showWarningToast} = useToast();
  const isFocused = useIsFocused();

  // Estados locales para los datos de la orden
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados optimizados para carga inmediata
  const [isInitialized, setIsInitialized] = useState(false);

  // Control para throttling de notificaciones de socket (sin colas)
  const isProcessingSocketNotification = useRef(false);
  const lastProcessedTimeRef = useRef(0);
  const SOCKET_THROTTLE_MS = 2000; // Mínimo 2 segundos entre procesamiento

  // Control para evitar múltiples navegaciones a ThankYou
  const isNavigatingToThankYou = useRef(false);

  // Control para evitar múltiples fetches simultáneos
  const isFetchingOrderDetails = useRef(false);

  // Hook para manejar detección de orden completada y navegación a ThankYou
  const orderCompletionHandler = useOrderCompletionHandler({
    enabled: true,
    context: 'BagView',
  });

  // Hook para manejar bloqueo multitablet
  // Removed isMultitabletBlocked - no longer blocking tablets

  // 🚀 OPTIMIZACIÓN: Hook personalizado para productos optimizados
  const {products: reduxProducts, productStats} = useOptimizedProducts();
  
  const totalBagFromRedux = useSelector(selectTotalBag);
  
  // 🚀 OPTIMIZACIÓN: Total ultra-responsivo
  const totalBag = useMemo(() => {
    // Si hay un total temporal (recién calculado), usarlo inmediatamente
    if (tempTotal !== null && tempTotal !== undefined) {
      return tempTotal;
    }
    
    // Verificación defensiva para evitar errores
    if (!localQuantities || typeof localQuantities !== 'object') {
      return totalBagFromRedux || 0;
    }
    
    const hasLocalChanges = Object.keys(localQuantities).length > 0;
    
    if (hasLocalChanges && calculateTempTotal && reduxProducts) {
      const calculatedTotal = calculateTempTotal(reduxProducts);
      return calculatedTotal;
    }
    
    // Si no hay cambios locales, usar el total de Redux
    return totalBagFromRedux || 0;
  }, [tempTotal, localQuantities, calculateTempTotal, reduxProducts, totalBagFromRedux]);
  const orderConfirmed = useSelector(state => state.bag.orderConfirmed);
  const orderConfirmedApiId = useSelector(
    state => state.bag.orderConfirmedApiId,
  );
  const hasOrderNotifications = useSelector(
    state => state.bag.hasOrderNotifications,
  );
  
  const companySelected = useSelector(state => state.company.companySelected);
  const isBagBlocked = useSelector(
    state => state.paymentFlow?.splits?.isBlocked,
    shallowEqual,
  );
  const language = useSelector(state => state.settings.language);
  const serverIp = useSelector(state => state.store.serverIp);
  
  // Obtener productos desde el servicio singleton con suscripción reactiva
  const [storeProducts, setStoreProducts] = useState([]);
  
  useEffect(() => {
    // Suscribirse a cambios en productos
    const unsubscribe = ProductService.subscribe((newProducts) => {
      setStoreProducts(newProducts);
    });
    
    // Cleanup: desuscribirse al desmontar
    return () => {
      unsubscribe();
    };
  }, []);
  
  const apiToken = useSelector(state => state.auth.apiToken);
  const currentView = useSelector(state => state.settings.currentView);

  // 🚀 OPTIMIZACIÓN: Hook para recomendaciones optimizadas
  const top3Recommendations = useOptimizedRecommendations(reduxProducts, isInitialized);

  // Establecer y mantener currentView='bag' solo cuando la pantalla esté enfocada y el Bag visible
  useEffect(() => {
    if (isFocused && showBag) {
      dispatch(setCurrentView('bag'));
    }
  }, [isFocused, showBag, dispatch]);

  // Re-afirmación: si alguien cambia currentView mientras esta vista está enfocada y visible, volver a 'bag'
  useEffect(() => {
    if (isFocused && showBag && currentView !== 'bag') {
      dispatch(setCurrentView('bag'));
    }
  }, [isFocused, showBag, currentView, dispatch]);

  // Combinar todos los tipos de bloqueo
  const isBlocked = isBagBlocked; // Removed multitablet blocking

  // 🚀 OPTIMIZACIÓN: Estilos memoizados con dependencias específicas
  const styles = useMemo(() => {
    return createStyles({
      colors,
      sizes,
      font_type,
      dimensions,
      commonStyles,
    });
  }, [colors.primary, colors.white, colors.text, sizes.borderRadius, font_type.bold, dimensions.width]);

  // 🚀 OPTIMIZACIÓN: Separar productos por estado en una sola pasada
  const {confirmedProducts, canceledProducts} = useMemo(() => {
    if (!orderData?.items) {
      return {confirmedProducts: [], canceledProducts: []};
    }
    
    const confirmed = [];
    const canceled = [];
    
    // Una sola iteración para separar productos
    orderData.items.forEach(item => {
      if (item.status_preparation === STATUS.CANCELADO) {
        canceled.push(item);
      } else {
        confirmed.push(item);
      }
    });
    
    return {confirmedProducts: confirmed, canceledProducts: canceled};
  }, [orderData?.items]);

  // 🚀 OPTIMIZACIÓN: Counts optimizados usando productStats
  const countProducts = productStats.count;
  const countConfirmed = confirmedProducts.length;
  const countCanceled = canceledProducts.length;

  // Inicialización inmediata sin loader
  useEffect(() => {
    if (showBag && !isInitialized) {
      setIsInitialized(true);
    }
  }, [showBag, isInitialized]);

  // Reset del estado cuando se cierra el bag
  useEffect(() => {
    if (!showBag) {
      setIsInitialized(false);
    }
  }, [showBag]);

  // 🚀 PRECARGA AGRESIVA: Precargar imágenes de productos del bag
  // Se ejecuta cada vez que cambia la lista de productos
  useEffect(() => {
    if (!reduxProducts || reduxProducts.length === 0) return;
    
    console.log(`🖼️ [BagView] Precargando ${reduxProducts.length} imágenes de productos del bag`);
    
    // Recolectar TODAS las imágenes (productos + sus modificadores si tienen)
    const imagesToPreload = [];
    
    reduxProducts.forEach(product => {
      // Imagen principal del producto
      if (product.image_url) {
        imagesToPreload.push({
          uri: product.image_url,
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable,
        });
      }
    });
    
    if (imagesToPreload.length > 0) {
      console.log(`🚀 [BagView] Precargando ${imagesToPreload.length} imágenes en total`);
      // Precargar inmediatamente sin esperar
      FastImage.preload(imagesToPreload);
    }
  }, [reduxProducts]);

  // Memoized sorted confirmed products
  const sortedConfirmedProducts = useMemo(() => {
    return [...confirmedProducts].sort((a, b) => {
      // Prioridad: productos pagados al final
      if (a.status_payment !== b.status_payment) {
        return a.status_payment === PAYMENT_STATUS.PAGADO ? 1 : -1;
      }
      // Secundario: por línea/orden
      return (a.line || 0) - (b.line || 0);
    });
  }, [confirmedProducts]);

  // Canceled products with flag
  const canceledProductsWithFlag = useMemo(
    () =>
      canceledProducts.map(product => ({
        ...product,
        isCanceled: true,
      })),
    [canceledProducts],
  );

  // Total in order calculation - usar directamente el balance de la orden
  const totalInOrder = useMemo(
    () => orderData?.balance || 0,
    [orderData?.balance],
  );

  // Detectar si hay una orden confirmada para pagar (similar a IndexView)
  const hasOrderToPay = useMemo(
    () => Boolean(orderConfirmedApiId),
    [orderConfirmedApiId],
  );

  // Detectar si hay balance pendiente de pago en la orden confirmada
  const hasItemsToPay = useMemo(() => {
    if (!orderData) {
      return false;
    }
    const balanceToPay = orderData.balance || 0;
    return balanceToPay > 0;
  }, [orderData]);

  // 🚀 OPTIMIZACIÓN: Determinar si los botones deben estar habilitados
  const isPaymentEnabled = useMemo(() => {
    if (isBlocked) {
      return false;
    }
    
    // Si hay una orden confirmada y balance pendiente, permitir pago
    if (hasOrderToPay && hasItemsToPay) {
      return true;
    }
    
    // Si hay productos en el bag, permitir ordenar (incluso si el total es 0)
    // Esto permite manejar productos gratuitos, promociones, etc.
    if (productStats.hasProducts && reduxProducts.length > 0) {
      const hasValidProducts = reduxProducts.some(p => p.quantity > 0);
      if (hasValidProducts) {
        return true;
      }
    }
    
    return false;
  }, [hasOrderToPay, hasItemsToPay, productStats.hasProducts, totalBag, isBlocked, reduxProducts]);

  // Estado para el diálogo de confirmación de eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [indexToDelete, setIndexToDelete] = useState(null);

  // Función para limpiar el estado del diálogo
  const clearDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
    setProductToDelete(null);
    setIndexToDelete(null);
  }, []);
  const handleShowDeleteDialog = useCallback(
    (product, index) => {
      if (isBlocked) {
        return;
      }
      setProductToDelete(product);
      setIndexToDelete(index);
      setShowDeleteDialog(true);
    },
    [isBlocked],
  );

  // Función para confirmar la eliminación
  const handleConfirmDelete = useCallback(() => {
    const idx = indexToDelete;
    
    // Cerrar el diálogo INMEDIATAMENTE antes de hacer nada más
    clearDeleteDialog();
    
    if (idx !== null && idx >= 0 && idx < reduxProducts.length) {
      // Obtener el producto actual del array Redux usando el índice
      const productToRemove = reduxProducts[idx];
      
      if (productToRemove && productToRemove.internalId) {
        // Usar requestAnimationFrame para asegurar que el diálogo se cierre antes de eliminar
        requestAnimationFrame(() => {
          // Eliminar por internalId que es más confiable
          dispatch(removeProductById(productToRemove.internalId));
        });
      }
    }
  }, [indexToDelete, reduxProducts, dispatch, clearDeleteDialog]);

  // Función para cancelar la eliminación
  const handleCancelDelete = useCallback(
    () => clearDeleteDialog(),
    [clearDeleteDialog],
  );

  const handleRemoveProduct = useCallback(
    (product, index) => {
      if (isBlocked) {
        return;
      }
      dispatch(removeProductById(product.internalId));
    },
    [dispatch, isBlocked],
  );

  const handleEditProduct = useCallback(
    (product, index) => {
      if (isBlocked) {
        return;
      }
      
      // 🚀 OPTIMIZACIÓN: Buscar producto completo para renderizado inmediato
      const fullProduct = ProductService.getProductBySku(product.sku);
      
      navigation.replace('ProductDetail', {
        product: fullProduct,
        productSku: product.sku, // Mantener SKU como fallback
        productIndex: index,
        productData: product, // Mantener para cantidad inicial y customizaciones
      });
    },
    [isBlocked, navigation],
  );

  const handlePrimaryActionPress = useCallback(async () => {
    const isPaying = orderConfirmed && productStats.isEmpty;

    if (isPaying) {
      if (!hasOrderToPay) {
        showWarningToast(t('empty_order_title'));
        return;
      }

      try {
        if (orderData) {
          const balanceToPay = orderData.balance || 0;
          if (balanceToPay <= 0) {
            showWarningToast(t('empty_order_title'));
            return;
          }
        }
        payment();
      } catch (err) {
        console.error('[BagView] Error al validar orden para pago:', err);
        showWarningToast('Error al validar orden');
      }
      return;
    }

    if (productStats.hasProducts && isPaymentEnabled) {
      navigation.navigate('OrderView', {order_data: reduxProducts});
    } else {
      const message = !isPaymentEnabled
        ? t('no_items_to_order_alert') || 'No hay productos para ordenar'
        : t('empty_order_alert');
      showWarningToast(message, t('empty_order_title'));
    }
  }, [
    orderConfirmed,
    productStats.isEmpty,
    productStats.hasProducts,
    hasOrderToPay,
    serverIp,
    apiToken,
    orderData,
    payment,
    showWarningToast,
    t,
    isPaymentEnabled,
    navigation,
    reduxProducts,
  ]);

  // 🚀 OPTIMIZACIÓN: Hook simplificado para debugging
  // Estado para total temporal ultra-responsivo
  const [tempTotal, setTempTotal] = useState(null);
  
  // Callback para actualización inmediata de totales
  const updateTotalInstantly = useCallback((productId, newQuantity, product) => {
    // Calcular nuevo total inmediatamente
    if (reduxProducts && reduxProducts.length > 0) {
      let newTotal = 0;
      reduxProducts.forEach(p => {
        const quantity = p.internalId === productId ? newQuantity : p.quantity;
        const basePrice = p.price || 0;
        let modifiersTotal = 0;
        
        if (p.customizations && Array.isArray(p.customizations)) {
          p.customizations.forEach(modifier => {
            modifiersTotal += (modifier.precio || 0) * (modifier.cantidad || 0);
            
            // 🆕 Sumar nested customizations
            if (modifier.nested_customizations && Array.isArray(modifier.nested_customizations)) {
              modifier.nested_customizations.forEach(nested => {
                modifiersTotal += (nested.precio || 0) * (nested.cantidad || 0);
              });
            }
          });
        }
        
        const subtotalBeforeTax = (basePrice + modifiersTotal) * quantity;
        const taxRate = p.taxRate || 0;
        const taxes = subtotalBeforeTax * (taxRate / 100);
        newTotal += subtotalBeforeTax + taxes;
      });
      
      setTempTotal(newTotal);
      
      // ❌ REMOVIDO: setTimeout que causaba delay de 1 segundo
      // El tempTotal se limpiará automáticamente cuando Redux se actualice
    }
  }, [reduxProducts]);

  // 🔥 FIX: Limpiar tempTotal cuando Redux se actualice (sin delay)
  useEffect(() => {
    if (tempTotal !== null && totalBagFromRedux) {
      // Si Redux ya tiene el total actualizado, limpiar el temporal
      setTempTotal(null);
    }
  }, [totalBagFromRedux, tempTotal]);

  const hookResult = useInstantQuantityUpdateSimple(300, updateTotalInstantly);
  
  if (!hookResult) {
    throw new Error('useInstantQuantityUpdateSimple returned invalid result');
  }
  
  const { 
    updateQuantity, 
    getQuantity, 
    localQuantities 
  } = hookResult;
  
  // Funciones temporales hasta resolver el hook completo
  const calculateTempTotal = useCallback((products) => {
    if (!products || !localQuantities) {
      return 0;
    }
    
    const total = products.reduce((total, product) => {
      const currentQuantity = localQuantities[product.internalId] ?? product.quantity;
      const basePrice = product.price || 0;
      let modifiersTotal = 0;
      
      if (product.customizations && Array.isArray(product.customizations)) {
        product.customizations.forEach(modifier => {
          modifiersTotal += (modifier.precio || 0) * (modifier.cantidad || 0);
          
          // 🆕 Sumar nested customizations
          if (modifier.nested_customizations && Array.isArray(modifier.nested_customizations)) {
            modifier.nested_customizations.forEach(nested => {
              modifiersTotal += (nested.precio || 0) * (nested.cantidad || 0);
            });
          }
        });
      }
      
      const subtotalBeforeTax = (basePrice + modifiersTotal) * currentQuantity;
      const taxRate = product.taxRate || 0;
      const taxes = subtotalBeforeTax * (taxRate / 100);
      const productTotal = subtotalBeforeTax + taxes;
      
      return total + productTotal;
    }, 0);
    
    return total;
  }, [localQuantities]);
  
  const calculateProductTotalLine = useCallback((product, quantity = null) => {
    const currentQuantity = quantity ?? (localQuantities[product.internalId] ?? product.quantity);
    const basePrice = product.price || 0;
    let modifiersTotal = 0;
    
    if (product.customizations && Array.isArray(product.customizations)) {
      product.customizations.forEach(modifier => {
        modifiersTotal += (modifier.precio || 0) * (modifier.cantidad || 0);
        
        // 🆕 Sumar nested customizations
        if (modifier.nested_customizations && Array.isArray(modifier.nested_customizations)) {
          modifier.nested_customizations.forEach(nested => {
            modifiersTotal += (nested.precio || 0) * (nested.cantidad || 0);
          });
        }
      });
    }
    
    const subtotalBeforeTax = (basePrice + modifiersTotal) * currentQuantity;
    const taxRate = product.taxRate || 0;
    const taxes = subtotalBeforeTax * (taxRate / 100);
    return subtotalBeforeTax + taxes;
  }, [localQuantities]);

  // 🚀 OPTIMIZACIÓN: Función wrapper para compatibilidad con la interfaz existente
  const handleSetProductQuantityImmediate = useCallback(
    (index, product, quantity) => {
      console.log(`🎯 [BagView] handleSetProductQuantityImmediate called:`, {
        index,
        productId: product?.internalId,
        quantity,
        hasUpdateQuantity: !!updateQuantity,
        isBlocked
      });
      try {
        if (updateQuantity && typeof updateQuantity === 'function') {
          updateQuantity(index, product, quantity, isBlocked);
        } else {
          console.warn('⚠️ [BagView] updateQuantity not available, using fallback');
          // Fallback: actualizar Redux directamente
          const updatedProduct = {...product, quantity};
          const dataProduct = Utils.calculateProductTotal(index, updatedProduct, quantity);
          
          dispatch(updateProductByIndex({index, product: dataProduct.product}));
        }
      } catch (error) {
        console.error('❌ [BagView] Error updating quantity:', error);
      }
    },
    [updateQuantity, isBlocked, dispatch],
  );

  // 🚀 OPTIMIZACIÓN CRÍTICA: Memoizar props estables para ProductItem
  // Esto evita que se recreen objetos en cada render, reduciendo re-renders innecesarios
  const stableProductItemProps = useMemo(
    () => ({
      companySelected,
      language,
      t,
      colors,
      font_type,
      dimensions,
      sizes,
    }),
    [companySelected, language, t, colors, font_type, dimensions, sizes]
  );

  const handleNavigate = useCallback(
    (route, params) => {
      navigation.navigate(route, params);
    },
    [navigation],
  );

  const lastFetchTimeRef = useRef(0);
  const FETCH_THROTTLE_MS = 2000;

  const fetchOrderDetails = useCallback(async () => {
    if (!orderConfirmedApiId) {
      return;
    }
    const now = Date.now();
    const timeSinceLast = now - lastFetchTimeRef.current;

    if (isFetchingOrderDetails.current || timeSinceLast < FETCH_THROTTLE_MS) {
      return;
    }

    lastFetchTimeRef.current = now;

    isFetchingOrderDetails.current = true;
    setLoading(true);
    setError(null);

    try {
      const rawOrderData = await getOrderDetails({
        serverIp,
        apiToken,
        orderId: orderConfirmedApiId,
      });

      // Map util (sin filtrar)
      const mappedOrderData = mapOrderDetailsForBag(
        rawOrderData,
        storeProducts,
      );
      
      setOrderData(mappedOrderData);
      // Verificar orden cancelada (status key: 6)
      const status = rawOrderData.status || {};
      if (status?.key === 6 && !isNavigatingToThankYou.current) {
        const orderForThankYou = {
          ...mapRefactorOrder(rawOrderData, null, {
            totalAmount: rawOrderData.total || 0,
            fallbackPrefix: 'ORDER',
            paymentMethod: 'status',
          }),
          isCanceled: true,
        };

        dispatch(clearOrderNotifications());
        isNavigatingToThankYou.current = true;

        navigation.navigate('ThankYou', {
          order: orderForThankYou,
          paymentResponse: {},
          fully: true,
          isCanceled: true,
          setOnlyPaymentEnabled: () => {},
        });
        return;
      }

      // Manejo de completion (pago completado)
      await orderCompletionHandler.handleOrderCompletion(rawOrderData);

      // Limpiar notificaciones después de cargar exitosamente
      dispatch(clearOrderNotifications());
    } catch (err) {
      console.error('[BagView] Error al obtener orden:', err);
      setError(err.message || 'Error al obtener detalles de la orden');
    } finally {
      setLoading(false);
      isFetchingOrderDetails.current = false;
    }
  }, [
    orderConfirmedApiId,
    serverIp,
    apiToken,
    storeProducts,
    dispatch,
    navigation,
  ]);

  // Función para refrescar los datos de la orden (útil para socket updates)
  const refreshOrderDetails = useCallback(() => {
    if (
      orderConfirmed &&
      orderConfirmedApiId &&
      !isFetchingOrderDetails.current
    ) {
      fetchOrderDetails();
    }
  }, [orderConfirmed, orderConfirmedApiId, fetchOrderDetails]);

  // Exponer la función refresh para uso futuro (ejemplo: socket updates)
  // eslint-disable-next-line no-unused-vars
  const handleSocketUpdate = refreshOrderDetails;

  // Efecto para limpiar el diálogo cuando se oculta la vista del bag
  useEffect(() => {
    if (!showBag && showDeleteDialog) {
      clearDeleteDialog();
    }
  }, [showBag, showDeleteDialog, clearDeleteDialog]);

  // Efecto de limpieza cuando el componente se desmonta o cambia showBag
  useEffect(() => {
    return () => {
      clearDeleteDialog();
    };
  }, [clearDeleteDialog]);

  // Efecto para cargar los datos cuando hay una orden confirmada
  useEffect(() => {
    if (orderConfirmed && orderConfirmedApiId && showBag) {
      // 🚀 SOLUCIÓN: Esperar a que los productos estén disponibles
      if (storeProducts.length > 0) {
        fetchOrderDetails();
      }
    }
  }, [orderConfirmed, orderConfirmedApiId, showBag, storeProducts.length, fetchOrderDetails]);

  // Efecto para refrescar cuando hay notificaciones de socket
  useEffect(() => {
    if (!hasOrderNotifications) {
      return;
    }

    const handleSocketNotification = async () => {
      if (
        ORDER_DONT_REFRESH_VIEWS.includes(currentView) ||
        !showBag ||
        isProcessingSocketNotification.current
      ) {
        return;
      }

      const now = Date.now();
      const timeSinceLastExecution = now - lastProcessedTimeRef.current;

      if (timeSinceLastExecution < SOCKET_THROTTLE_MS) {
        return;
      }

      lastProcessedTimeRef.current = now;
      isProcessingSocketNotification.current = true;

      try {
        await fetchOrderDetails();
      } catch (err) {
        console.error('[BagView] Error al refrescar orden por socket:', err);
      } finally {
        setTimeout(() => {
          isProcessingSocketNotification.current = false;
        }, 100);
      }
    };

    handleSocketNotification();

    return undefined;
  }, [hasOrderNotifications, showBag]);

  return (
    <View style={[styles.container, {flex: 1, paddingHorizontal: 10}]}>
      <ScrollView
        style={{flex: 1, backgroundColor: colors.white}}
        contentContainerStyle={{paddingTop: 0, paddingBottom: 60}}>
        <Text
          style={[
            styles.title,
            {textTransform: 'uppercase', fontFamily: font_type.bold},
          ]}>
          {t('order')}
        </Text>

        {/* NUEVOS A AGREGAR */}
        {countProducts >= 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {productStats.isEmpty && !orderConfirmed
                  ? t('products_to_add')
                  : t('new_to_add')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {countProducts} Item{countProducts !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.productsContainer}>
              {productStats.hasProducts ? (
                <>
                  {reduxProducts.map((product, index) => (
                    <ProductItem
                      key={product.internalId}
                      product={product}
                      index={index}
                      isEditable={true}
                      styles={styles}
                      localQuantity={localQuantities?.[product.internalId]}
                      {...stableProductItemProps}
                      onSetQuantity={handleSetProductQuantityImmediate}
                      onEdit={handleEditProduct}
                      onRemove={handleShowDeleteDialog}
                    />
                  ))}
                </>
              ) : (
                <Text style={styles.subtitle}>
                  {productStats.isEmpty && !orderConfirmed
                    ? t('bag_no_items')
                    : t('bag_additiona_no_items')}
                </Text>
              )}
            </View>
          </>
        )}

        {/* ORDEN EN CURSO */}
        {(countConfirmed > 0 || (orderConfirmed && loading)) && (
          <>
            <View style={styles.sectionHeader}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  position: 'relative',
                }}>
                <Text style={styles.sectionTitle}>{t('current_order')}</Text>

                <Badge
                  visible={hasOrderNotifications}
                  style={{
                    position: 'relative',
                    top: 0,
                    right: 0,
                    marginLeft: 8,
                  }}
                />
              </View>
              <Text style={styles.sectionSubtitle}>
                {loading
                  ? t('loading') || 'Cargando...'
                  : `${countConfirmed} Item${countConfirmed !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <View style={styles.productsContainer}>
              {loading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 40,
                  }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: dimensions.width * 0.014,
                      color: colors.text,
                      fontFamily: font_type.regular,
                    }}>
                    {t('loading')}
                  </Text>
                </View>
              ) : error ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 40,
                  }}>
                  <Text
                    style={{
                      fontSize: dimensions.width * 0.014,
                      color: colors.error || '#ff0000',
                      fontFamily: font_type.regular,
                      textAlign: 'center',
                      paddingHorizontal: 20,
                    }}>
                    {error}
                  </Text>
                </View>
              ) : (
                sortedConfirmedProducts.map((product, index) => {
                  // Key único usando product.id y product.order_state para forzar re-render solo cuando cambia el estado
                  const uniqueKey = `confirmed-${product.id}-${product.bag_id || index}-${product.quantity}`;
                  return (
                    <ProductItem
                      key={uniqueKey}
                      product={product}
                      index={index}
                      isEditable={false}
                      styles={styles}
                      {...stableProductItemProps}
                      onSetQuantity={handleSetProductQuantityImmediate}
                      onEdit={handleEditProduct}
                      onRemove={handleRemoveProduct}
                    />
                  );
                })
              )}
            </View>
          </>
        )}

        {/* PRODUCTOS CANCELADOS */}
        {countCanceled > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('canceled_products')}</Text>
              <Text style={styles.sectionSubtitle}>
                {countCanceled} Item{countCanceled !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.productsContainer}>
              {canceledProductsWithFlag.map((product, index) => (
                <ProductItem
                  key={`canceled-${product.id}-${index}`}
                  product={product}
                  index={index}
                  isEditable={false}
                  styles={styles}
                  {...stableProductItemProps}
                  onSetQuantity={handleSetProductQuantityImmediate}
                  onEdit={handleEditProduct}
                  onRemove={handleRemoveProduct}
                />
              ))}
            </View>
          </>
        )}

        {/* RECOMENDACIONES */}
        {SHOW_RECOMMENDATIONS && top3Recommendations.length > 0 && (
          <>
            <View style={styles.recommendationsSectionHeader}>
              <Text style={styles.recommendationsSectionTitle}>
                {t('you_may_also_like') || 'También te puede interesar'}
              </Text>
            </View>
            <View style={styles.recommendationsContainer}>
              {top3Recommendations.map((recommendation, index) => (
                <ProductCard
                  key={`recommendation-${recommendation.sku}-${index}`}
                  product={recommendation}
                  language={language}
                  onPress={() => handleNavigate('ProductDetail', {
                    product: recommendation,
                    productSku: recommendation.sku,
                    isRecomendation: true,
                  })}
                  isBagBlocked={isBlocked}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.actionContainer}>
        <View style={{flex: 1, alignItems: 'center', marginLeft: -100}}>
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                (isBlocked || !isPaymentEnabled) && {opacity: 0.5},
              ]}
              disabled={isBlocked || !isPaymentEnabled}
              onPress={() => {
                if (onContinueOrdering) {
                  onContinueOrdering();
                } else {
                  showBag(false);
                }
              }}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  {textTransform: 'uppercase'},
                ]}>
                {t('add_more')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isPaymentEnabled || isBlocked) && {opacity: 0.5},
              ]}
              disabled={!isPaymentEnabled || isBlocked}
              onPress={handlePrimaryActionPress}>
              <Text
                style={[
                  styles.primaryButtonText,
                  {textTransform: 'uppercase'},
                ]}>
                {!orderConfirmed || productStats.hasProducts
                  ? t('order_now')
                  : t('pay_now')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            position: 'absolute',
            right: 120,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 1,
              height: dimensions.height * 0.05,
              backgroundColor: '#ccc',
              marginRight: 20,
            }}
          />
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}>
            {countConfirmed > 0 && (
              <Text
                style={{
                  fontFamily: font_type.semibold,
                  fontSize: dimensions.width * 0.013,
                  color: colors.text,
                }}>
                {t('total_in_order')}: {Utils.formatCurrency(totalInOrder, 'CRC')}
              </Text>
            )}
            <Text
              style={{
                fontFamily: font_type.semibold,
                fontSize:
                  productStats.hasProducts && orderConfirmed
                    ? dimensions.width * 0.013
                    : dimensions.width * 0.018,
                color: colors.text,
                marginBottom: 4,
              }}>
              {productStats.hasProducts && orderConfirmed
                ? t('total_to_add')
                : 'Total'}: {Utils.formatCurrency(totalBag, 'CRC')}
            </Text>
          </View>
        </View>
      </View>

      <AlertDialogDouble
        visible={showDeleteDialog}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        message={
          productToDelete
            ? `${t('confirm_remove_product_message')} "${
                language === 'es'
                  ? productToDelete.name_es
                  : productToDelete.name_en || productToDelete.name_es
              }" ${t('from_order')}`
            : ''
        }
      />
    </View>
  );
};

// 🚀 OPTIMIZACIÓN: Usar React.memo para evitar re-renders innecesarios
export default React.memo(BagView, (prevProps, nextProps) => {
  // Solo re-renderizar si navigation cambia (prácticamente nunca)
  return prevProps.navigation === nextProps.navigation &&
         prevProps.showBag === nextProps.showBag &&
         prevProps.payment === nextProps.payment &&
         prevProps.onContinueOrdering === nextProps.onContinueOrdering;
});
