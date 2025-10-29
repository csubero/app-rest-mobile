/* eslint-disable react-hooks/exhaustive-deps, react-native/no-inline-styles */
import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {useSelector} from 'react-redux';
import {View, Image, TouchableOpacity} from 'react-native';
import ProductsMenuView from '../ProductsMenuView/index';
import ProductsListView from '../ProductsListView/index';
import BagView from '../BagView/index';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../providers/ThemeProvider';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import Sidebar from '../../components/index/Sidebar';
import ToastManager from '../../components/general/alerts/ToastManager';
import AlertDialogDouble from '../../components/general/alerts/AlertDialogDouble';
import {setMenuSelected} from '../../redux/slice/storeSlice';
import {resetPaymentFlow} from '../../redux/slice/paymentFlowSlice';
import ProductService from '../../services/api/ProductService';
import PromoBannerService from '../../services/api/PromoBannerService';
import AdvancedImageCacheManager from '../../helpers/config/AdvancedImageCacheManager';
import FastImage from 'react-native-fast-image';
import {
  setWaiterCalled,
  clearOrderNotifications,
  hideTableAttendedModal,
  selectTotalQuantity,
} from '../../redux/slice/bagSlice';
import {
  setCopilotShown,
  setCopilotActive,
  setCurrentView,
} from '../../redux/slice/settingsSlice';
import {useDispatch, shallowEqual} from 'react-redux';
import PaymentView from '../PaymentView/index';
import {useGlobalSocket} from '../../providers/GlobalSocketProvider';
import useToast from '../../hooks/general/useToast';
import {useOrderCompletionHandler} from '../../hooks/order/useOrderCompletionHandler';
import {CopilotStep, walkthroughable, useCopilot} from 'react-native-copilot';
import UserInactivityWrapper from '../../components/config/UserInactivityWrapper';
import createStyles from './styles';
import Constants from '../../helpers/config/Constants';

const WalkthroughableView = walkthroughable(View);

const IndexView = React.memo(({navigation}) => {
  //  DEBUG: Detectar mount/unmount para identificar memory leaks
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  useEffect(() => {
    console.log(`🟢 [IndexView-${instanceId.current}] MOUNTED`);
    
    // Limpiar caché de memoria cada vez que se monta para liberar RAM
    FastImage.clearMemoryCache();
    
    return () => {
      console.log(`🔴 [IndexView-${instanceId.current}] UNMOUNTED`);
      // Limpiar memoria al desmontar
      FastImage.clearMemoryCache();
    };
  }, []);
  
  // Redux selectors
  const totalBagQuantity = useSelector(selectTotalQuantity);
  const waiterCalled = useSelector(state => state.bag.waiterCalled);
  const hasOrderNotifications = useSelector(state => state.bag.hasOrderNotifications);
  const orderConfirmedApiId = useSelector(state => state.bag.orderConfirmedApiId);
  const companySelected = useSelector(
    state => state.company.companySelected,
    (prev, next) => prev?.id === next?.id,
  );
  const tableData = useSelector(
    state => state.company.tableData,
    (prev, next) => prev?.table?.id === next?.table?.id,
  );
  const tableAttendedModal = useSelector(state => state.bag.tableAttendedModal);
  const copilotState = useSelector(
    state => state.settings.copilot,
    (prev, next) => {
      if (prev === next) return true;
      if (!prev || !next) return false;
      return prev.visible === next.visible && 
             prev.stepNumber === next.stepNumber &&
             prev.start === next.start &&
             prev.hasShown === next.hasShown &&
             prev.isActive === next.isActive;
    }
  );
  const language = useSelector(state => state.settings.language);
  const currentView = useSelector(state => state.settings.currentView);
  
  // 🚀 PRECARGA: Inicializar cache de imágenes una sola vez
  useEffect(() => {
    // Inicializar el cache manager avanzado
    AdvancedImageCacheManager.initialize();
    // console.log('✅ [IndexView] AdvancedImageCacheManager inicializado');
  }, []);

  // Obtener productos desde el servicio singleton con suscripción reactiva
  const [products, setProducts] = useState([]);
  
  // 🔧 FIX CRÍTICO: Usar useFocusEffect en lugar de useEffect para garantizar cleanup
  // cuando React Navigation oculta/muestra la pantalla
  useFocusEffect(
    useCallback(() => {
      // Suscribirse a cambios en productos SOLO cuando la pantalla está enfocada
      const unsubscribe = ProductService.subscribe((newProducts) => {
        setProducts(newProducts);
      });
      
      // Cleanup: desuscribirse INMEDIATAMENTE al desenfocarse
      return () => {
        unsubscribe();
      };
    }, [])
  );
  
    // if (__DEV__ && products.length !== 114) {
    //   console.log('🎨 [IndexView] Productos cambiaron:', products.length);
    // }
  
  // 🚀 OPTIMIZACIÓN CRÍTICA: Los selectores ya están declarados arriba para logging
  
  // Obtener promo banners desde el servicio singleton con estado reactivo
  const [promoBanners, setPromoBanners] = useState([]);
  
  useEffect(() => {
    // Obtener promo banners iniciales
    const initialBanners = PromoBannerService.getPromoBanners();
    setPromoBanners(initialBanners);
    
    // Si no hay banners y el servicio está configurado, podría ser que aún no se hayan cargado
    if (initialBanners.length === 0 && PromoBannerService.serverIp && PromoBannerService.apiToken) {
      console.log('⏳ [IndexView] Promo banners no disponibles aún, esperando sincronización...');
    }
  }, []);

  const [productsFilterList, setProductsFilterList] = useState([]);
  const [onlyPaymentEnabled, setOnlyPaymentEnabled] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showProductsList, setShowProductsList] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // Actualizar productsFilterList cuando products cambie
  useEffect(() => {
    // console.log('🔄 [IndexView] Actualizando productsFilterList con', products.length, 'productos');
    setProductsFilterList(products);
  }, [products]);

  // Estado para el diálogo de confirmación de llamada al mesero
  const [showWaiterDialog, setShowWaiterDialog] = useState(false);

  // Hook para manejar detección de orden completada y navegación a ThankYou
  const {checkOrderCompletion} = useOrderCompletionHandler({
    enabled: true,
    context: 'IndexView',
    throttleMs: 1000,
    requireNotification: true,
    excludeViews: ['bag'],
  });

  const {commonStyles, dimensions, colors, font_type, withOpacity, sizes} =
    useTheme();
  const {t} = useTranslation();
  const route = useRoute();
  const dispatch = useDispatch();
  const {
    requestHelp,
    cancelHelp,
    startPaymentProcess,
    endPaymentProcess,
    // Removed isMultitabletBlocked - no longer blocking tablets
  } = useGlobalSocket();
  const {
    showSuccessToast,
    showWarningToast,
    showInfoToast,
    showErrorToast,
    showWaiterToast,
    showOrderReminderToast,
  } = useToast();

  const {start, stop: copilotStop} = useCopilot();
  // Removed multitablet blocking logic

  // 🚀 totalBagQuantity ya viene del selector memoizado - no necesita useMemo adicional

  // Detectar si hay una orden confirmada para pagar
  const hasOrderToPay = useMemo(() => {
    return Boolean(orderConfirmedApiId);
  }, [orderConfirmedApiId]);

  const shouldUseInactivityWrapper = useMemo(() => {
    return totalBagQuantity > 0;
  }, [totalBagQuantity]);

  const isPaymentEnabled = useMemo(() => {
    return hasOrderToPay; // Removed multitablet blocking check
  }, [hasOrderToPay]);

  // Estilos optimizados con useMemo
  const styles = useMemo(() => {
    return createStyles({
      commonStyles,
      dimensions,
      colors,
      font_type,
      withOpacity,
      sizes,
    });
  }, [commonStyles, dimensions, colors, font_type, withOpacity]);

  const handlePayment = useCallback(() => {
    if (!hasOrderToPay) {
      showWarningToast(t('empty_order_title'), t('empty_order_message'));
      return;
    }
    goToSection('payment');
  }, [hasOrderToPay, showWarningToast, t, goToSection]);

  const goToSection = useCallback(
    section => {
      if (showPayment && section !== 'payment') {
        console.log(
          '[IndexView] Saliendo de pago sin completar - enviando evento de finalización',
        );
        endPaymentProcess(tableData.table.id, tableData.table.name);
      }

      if (showPayment && section !== 'payment') {
        dispatch(resetPaymentFlow());
      }

      if (section === 'bag') {
        // Cambiar vista actual inmediatamente para evitar condiciones de carrera
        dispatch(setCurrentView('bag'));
        dispatch(clearOrderNotifications());
      }

      if (section === 'payment') {
        console.log(
          '[IndexView] Iniciando proceso de pago - enviando evento socket',
        );
        // Cambiar vista actual inmediatamente para evitar condiciones de carrera
        dispatch(setCurrentView('payment'));
        startPaymentProcess(
          tableData.table.id,
          tableData.table.name,
          tableData.tableInternalId,
        );
      }

      if (section === 'menu') {
        // Volver al menú de secciones (ProductsMenuView)
        console.log('[IndexView] Volviendo al menú de secciones');
        setShowProductsList(false);
        setSelectedSection(null);
      }

      setShowBag(section === 'bag');
      setShowPayment(section === 'payment');
      setSelectedFilter(false);
      setSelectedItem(null);
    },
    [showPayment, startPaymentProcess, endPaymentProcess, dispatch, tableData],
  );

  // 🆕 Función para volver a la lista de productos desde la bolsa
  const handleContinueOrdering = useCallback(() => {
    setShowBag(false);
    
    // Si hay una sección seleccionada, usar esa
    if (selectedSection) {
      setShowProductsList(true);
    } else {
      // Si no hay sección seleccionada, usar la primera disponible
      const menus = ProductService.getMenus();
      if (menus && menus.length > 0) {
        const firstSection = menus[0];
        setSelectedSection(firstSection.id);
        setShowProductsList(true);
        console.log('[IndexView] No hay sección seleccionada, usando primera:', firstSection.id);
      }
    }
  }, [selectedSection]);

  // 🚀 OPTIMIZACIÓN: Memoizar callback de onBack para ProductsListView
  const handleBackFromProductsList = useCallback(() => {
    setShowProductsList(false);
    setSelectedSection(null);
  }, []);

  const handleBannerPress = useCallback(
    section => {
      if (!section || !section.id) {
        return;
      }
      
      // 🚀 OPTIMIZACIÓN: Usar ProductService para obtener productos por sección directamente
      let filtered = ProductService.getProductsBySection(section.id);

      // Si no se encuentra por ID, buscar por nombre similar en los menús
      if (filtered.length === 0 && section.name_es) {
        const menus = ProductService.getMenus();
        const foundMenu = menus.find(menu => {
          const menuName = menu.name_es?.toLowerCase() || '';
          const bannerName = section.name_es?.toLowerCase() || '';
          return (
            menuName === bannerName ||
            menuName.includes(bannerName) ||
            bannerName.includes(menuName)
          );
        });

        if (foundMenu) {
          section = foundMenu;
          filtered = foundMenu.products || [];
        }
      }

      if (filtered.length === 0) {
        return;
      }

      // Navegar a la lista de productos con la sección seleccionada
      setSelectedSection(section.id);
      setShowProductsList(true);
      
      setProductsFilterList(filtered);
      setSelectedItem(section.id);
      setSelectedFilter(true);
      dispatch(setMenuSelected(section));
    },
    [dispatch],
  );

  const handleLogoPress = useCallback(() => {
    goToSection('menu');
  }, [goToSection]);

  // 🚀 OPTIMIZACIÓN: Memoizar callback de onSectionSelect para ProductsMenuView
  const handleSectionSelect = useCallback((sectionId) => {
    setSelectedSection(sectionId);
    setShowProductsList(true);
  }, []);

  // 🚀 OPTIMIZACIÓN: Memoizar callbacks de navegación para Sidebar
  const handleGoToMenu = useCallback(() => goToSection('menu'), [goToSection]);
  const handleGoToBag = useCallback(() => goToSection('bag'), [goToSection]);

  const handleLogoLongPress = useCallback(() => {
    console.log(
      '[IndexView] Long press en logo detectado - navegando a VideoView',
    );
    navigation.navigate('VideoView');
  }, [navigation]);

  const handleWaiterCall = useCallback(() => {
    if (!waiterCalled) {
      setShowWaiterDialog(true);
    } else {
      setShowWaiterDialog(true);
    }
  }, [waiterCalled]);

  // Función para confirmar la llamada al mesero
  const handleConfirmWaiterCall = useCallback(() => {
    if (!waiterCalled) {
      requestHelp(tableData.table.id, tableData.table.name);
      dispatch(setWaiterCalled(true));
      showWaiterToast(t('calling_description'), t('calling_title'));
    } else {
      cancelHelp(tableData.table.id, tableData.table.name);
      dispatch(setWaiterCalled(false));
      showSuccessToast(t('call_cancelled'), t('waiter_call'));
    }
    setShowWaiterDialog(false);
  }, [
    waiterCalled,
    tableData,
    dispatch,
    requestHelp,
    cancelHelp,
    t,
    showWaiterToast,
    showSuccessToast,
  ]);

  // Función para cancelar la llamada al mesero
  const handleCancelWaiterCall = useCallback(() => {
    setShowWaiterDialog(false);
  }, []);

  // Función para mostrar toast de mesa atendida
  const showTableAttendedToast = useCallback(
    (message, title) => {
      showSuccessToast(
        message || t('processing_order'),
        title || t('waiter_attended'),
      );
    },
    [t, showSuccessToast],
  );

  // Callback para manejar la inactividad cuando hay productos sin ordenar
  const handleInactivityWhenNoOrder = useCallback(() => {
    showOrderReminderToast(
      t('dont_forget_to_order_your_products'),
      t('order_reminder'),
    );
  }, [showOrderReminderToast, t]);

  // 🚀 OPTIMIZACIÓN: Usar ProductService para obtener productos filtrados
  const filteredProducts = useMemo(() => {
    if (selectedItem !== null) {
      return ProductService.getProductsBySection(selectedItem);
    }
    return products;
  }, [products, selectedItem]);

  useEffect(() => {
    const params = route?.params;

    if (!params) {
      return;
    }

    if (params.goToBag) {
      setShowBag(true);
      navigation.setParams({goToBag: undefined});
    }

    if (params.goToPayment) {
      goToSection('payment');
      navigation.setParams({goToPayment: undefined});
    }
  }, [route?.params, goToSection, navigation]);

  useEffect(() => {
    setProductsFilterList(filteredProducts);
  }, [filteredProducts]);

  useEffect(() => {
    if (tableAttendedModal.visible) {
      showTableAttendedToast(
        tableAttendedModal.message,
        tableAttendedModal.title,
      );
      dispatch(hideTableAttendedModal());
    }
  }, [tableAttendedModal, showTableAttendedToast, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (!copilotState.hasShown) {
        dispatch(setCopilotActive(true));
        const animationId = requestAnimationFrame(() => {
          const timeoutId = setTimeout(() => {
            start();
            dispatch(setCopilotShown(true));
          }, 350);

          return () => clearTimeout(timeoutId);
        });

        return () => {
          cancelAnimationFrame(animationId);
        };
      }
    }, [start, copilotState.hasShown]),
  );

  // Efecto para manejar notificaciones de socket y navegar a ThankYou cuando el pago esté completo
  useEffect(() => {
    // Evitar doble fetch: si BagView está visible, dejamos que BagView maneje el chequeo
    if (showPayment || showBag) {
      return;
    }
    checkOrderCompletion();
    return undefined;
  }, [
    hasOrderNotifications,
    currentView,
    showPayment,
    showBag,
    checkOrderCompletion,
  ]);

  // Removed multitablet blocking notifications

  return (
    <UserInactivityWrapper
      enabled={shouldUseInactivityWrapper}
      timeoutMs={Constants.TIMEOUT}
      onInactivity={handleInactivityWhenNoOrder}>
      <View style={styles.page}>
        <Sidebar
          styles={styles}
          t={t}
          companySelected={companySelected}
          onlyPaymentEnabled={onlyPaymentEnabled}
          showBag={showBag}
          showPayment={showPayment}
          isPaymentEnabled={isPaymentEnabled}
          // Removed isMultitabletBlocked prop
          totalBagQuantity={totalBagQuantity}
          onLogoPress={handleLogoPress}
          onLogoLongPress={handleLogoLongPress}
          onGoToMenu={handleGoToMenu}
          onGoToBag={handleGoToBag}
          onPayNow={handlePayment}
        />

        {/* Contenido principal - OPTIMIZADO: Solo montar la vista activa con key única */}
        <View style={styles.content}>
          {/* Carrusel ahora se muestra dentro de ProductsView cuando aplica */}
          
          {showPayment && (
            <PaymentView
              key="payment-view"
              navigation={navigation}
              setOnlyPaymentEnabled={setOnlyPaymentEnabled}
              onClose={() => setShowPayment(false)}
            />
          )}
          
          {!showPayment && showBag && (
            <BagView
              key="bag-view"
              navigation={navigation}
              showBag={setShowBag}
              payment={handlePayment}
              onContinueOrdering={handleContinueOrdering}
            />
          )}
          
          {!showPayment && !showBag && showProductsList && (
            <ProductsListView
              key={`products-list-${selectedSection}`}
              navigation={navigation}
              sectionId={selectedSection}
              onBack={handleBackFromProductsList}
            />
          )}
          
          {!showPayment && !showBag && !showProductsList && (
            <ProductsMenuView
              key="products-menu"
              navigation={navigation}
              promoBanners={promoBanners}
              isBagBlocked={false}
              onBannerSectionSelect={handleBannerPress}
              onSectionSelect={handleSectionSelect}
            />
          )}
        </View>

        <ToastManager />

        {/* Botón flotante para llamar al mesero */}
        <CopilotStep text={t('copilot_help_text')} order={3} name="help-btn">
          <WalkthroughableView
            style={{
              position: 'absolute',
              bottom: 35,
              right: 5,
              width: 90,
              height: 90,
              backgroundColor: 'transparent',
              borderRadius: 30,
            }}>
            {/** Bloquear llamada al mesero cuando se bloquea por pago en otra tablet o estamos en flujo de pago */}
            {(() => {
              // Removed multitablet blocking check
              const canCallWaiter = !showPayment
              return (
                <TouchableOpacity
                  style={[
                    styles.floatingWaiterButton,
                    waiterCalled
                      ? styles.floatingWaiterButtonCalling
                      : styles.floatingWaiterButtonNormal,
                    {
                      position: 'relative',
                      right: -10,
                      top: 10,
                      opacity: canCallWaiter ? 1 : 0.4,
                    },
                  ]}
                  onPress={() => {
                    if (!canCallWaiter) {
                      return;
                    }
                    handleWaiterCall();
                  }}
                  disabled={!canCallWaiter}>
                  <Image
                    source={{
                      uri: companySelected.settings.icon_call_help_url,
                      cache: 'force-cache',
                    }}
                    style={styles.floatingWaiterIcon}
                  />
                </TouchableOpacity>
              );
            })()}
          </WalkthroughableView>
        </CopilotStep>

        <AlertDialogDouble
          visible={showWaiterDialog}
          onCancel={handleCancelWaiterCall}
          onConfirm={handleConfirmWaiterCall}
          message={
            waiterCalled
              ? t('confirm_cancel_waiter_call') ||
                '¿Está seguro que desea cancelar la llamada al mesero?'
              : t('confirm_waiter_call') ||
                '¿Está seguro que desea llamar al mesero?'
          }
        />
      </View>
    </UserInactivityWrapper>
  );
}, 
// 🚀 OPTIMIZACIÓN: Comparación personalizada para evitar re-renders innecesarios
(prevProps, nextProps) => {
  return prevProps.navigation === nextProps.navigation;
});

export default IndexView;
