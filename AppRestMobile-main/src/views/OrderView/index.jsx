/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  InteractionManager,
} from 'react-native';
import {useNavigation, useIsFocused, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {
  clearBagOnly,
  confirmProducts,
  setIsOrderEmpty,
  productsSelectors,
  selectTotals,
} from '../../redux/slice/bagSlice';
import {useTheme} from '../../providers/ThemeProvider';
import LottieView from 'lottie-react-native';
import AlertDialog from '../../components/general/alerts/AlertDialog';
import {sendUpdateOrderToServer} from '../../services/order/orderService';
import {createStyles} from './styles';
import soundHelper from '../../helpers/config/SoundHelperAndroid';
import {setCurrentView} from '../../redux/slice/settingsSlice';

const OrderView = () => {
  const COUNTER_DURATION_SECONDS = 5;
  
  const {t} = useTranslation();
  const [counter, setCounter] = useState(COUNTER_DURATION_SECONDS);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const route = useRoute();
  const {colors, dimensions, font_type, sizes} = useTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const {companySelected} = useSelector(state => state.company);
  const {language} = useSelector(state => state.settings);
  const baseBag = useSelector(state => state.bag.bag);
  const bagProducts = useSelector(productsSelectors.selectAll);
  const isOrderEmpty = useSelector(state => state.bag.isOrderEmpty);
  const totals = useSelector(selectTotals);
  const baseTable = useSelector(state => state.bag);
  const {serverIp} = useSelector(state => state.store);
  const {apiToken} = useSelector(state => state.auth);
  const {currentView} = useSelector(state => state.settings);

  // Establecer y mantener la vista actual como 'order' sólo cuando esta pantalla está enfocada
  useEffect(() => {
    if (isFocused) {
      dispatch(setCurrentView('order'));
    }
  }, [isFocused, dispatch]);

  // Autocorrección: si estando enfocada alguien cambia currentView, volver a 'order'
  useEffect(() => {
    if (isFocused && currentView !== 'order') {
      dispatch(setCurrentView('order'));
    }
  }, [isFocused, currentView, dispatch]);

  // Animaciones / refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const progressListenerIdRef = useRef(null); // para remover el listener a tiempo
  const sendOnceRef = useRef(false); // lock de envío

  const TIMER_DURATION = 2000;

  const order_id = baseTable.orderConfirmedApiId;
  const order_data = route.params?.order_data ?? bagProducts;

  // 🚀 OPTIMIZACIÓN: Memoizar orderSummary para evitar recalcular en cada render
  const orderSummary = useMemo(() => {
    return order_data.map(product => {
      const quantity = product.quantity || 1;
      const name =
        language === 'en'
          ? product.name_en || product.name_es || 'Unnamed product'
          : product.name_es || product.name_en || 'Producto sin nombre';

      const customizations = product.customizations || [];
      const customText = customizations
        .map(c => {
          // Preferir el texto según el idioma, con fallback al otro si falta
          if (language === 'en') {
            return c?.description ?? c?.descripcion ?? '';
          }
          return c?.descripcion ?? c?.description ?? '';
        })
        .filter(Boolean)
        .join(', ');

      return `${quantity}x ${name}${customText ? `, ${customText}` : ''}`;
    });
  }, [order_data, language]);

  // 🚀 OPTIMIZACIÓN: Inicializar animations solo una vez, no en cada render
  const animations = useRef(
    order_data.map(() => new Animated.Value(50)),
  ).current;

  const styles = createStyles(colors, dimensions, font_type, sizes);

  const removeProgressListener = () => {
    if (progressListenerIdRef.current != null) {
      try {
        progressAnim.removeListener(progressListenerIdRef.current);
      } catch (e) {
        // ignore
      }
      progressListenerIdRef.current = null;
    }
  };

  const stopProgressAnimation = () => {
    if (animationRef.current?.stop) {
      animationRef.current.stop();
    }
  };

  const handleSkipTimer = async () => {
    // 🔒 Evita dobles disparos por tap + listener
    if (sendOnceRef.current || sending || confirmed) {
      return;
    }
    sendOnceRef.current = true;

    // Validar que exista una orden activa
    if (!order_id) {
      console.error('❌ No hay orden activa para actualizar');
      setShowErrorDialog(true);
      sendOnceRef.current = false; // permitir reintento
      return;
    }

    // Limpiezas antes de forzar al final
    removeProgressListener();
    stopProgressAnimation();

    // Completar barra sin re-desencadenar listeners
    setCounter(0);
    progressAnim.setValue(1);

    setSending(true);
    try {
      const bagForApi = {
        ...baseBag,
        products: bagProducts,
        totalBag: totals.totalBag,
        totalTaxes: totals.totalTaxes,
        subTotal: totals.subTotal,
        totalDiscount: totals.totalDiscount || 0,
      };

      // Actualiza la orden existente
      await sendUpdateOrderToServer({
        serverIp,
        apiToken,
        orderId: order_id,
        baseBag: bagForApi,
      });

      if (isOrderEmpty) {
        dispatch(setIsOrderEmpty(false));
      }

      dispatch(confirmProducts());
      setConfirmed(true);
    } catch (error) {
      console.error('Error al actualizar la orden:', error);
      setShowErrorDialog(true);
      sendOnceRef.current = false; // permitir reintento si falló
    } finally {
      setSending(false);
    }
  };

  // Progreso + contador (una sola fuente de verdad: progressAnim)
  useEffect(() => {
    if (isFocused && !confirmed) {
      // 🚀 OPTIMIZACIÓN: Usar InteractionManager para no bloquear la navegación
      const task = InteractionManager.runAfterInteractions(() => {
        // reset
        sendOnceRef.current = false;
        removeProgressListener();
        stopProgressAnimation();

        setCounter(COUNTER_DURATION_SECONDS);
        progressAnim.setValue(0);

        animationRef.current = Animated.timing(progressAnim, {
          toValue: 1,
          duration: COUNTER_DURATION_SECONDS * 1000,
          useNativeDriver: false,
        });
        animationRef.current.start();

        const id = progressAnim.addListener(({value}) => {
          const newCounter = Math.ceil((1 - value) * COUNTER_DURATION_SECONDS);
          setCounter(newCounter);

          if (newCounter <= 0) {
            removeProgressListener(); // evita doble disparo
            handleSkipTimer();
          }
        });

        progressListenerIdRef.current = id;
      });

      return () => {
        task.cancel();
        removeProgressListener();
        stopProgressAnimation();
      };
    }

    return () => {
      removeProgressListener();
      stopProgressAnimation();
    };
  }, [isFocused, confirmed]);

  // Animación de líneas del resumen
  useEffect(() => {
    // 🚀 OPTIMIZACIÓN: Ejecutar animaciones después de que la navegación termine
    const task = InteractionManager.runAfterInteractions(() => {
      const animationsSequence = animations.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          delay: i * 100,
          useNativeDriver: true,
        }),
      );
      Animated.stagger(100, animationsSequence).start();
    });

    return () => task.cancel();
  }, []);

  // Navegar automáticamente después de 2s cuando se confirma
  useEffect(() => {
    if (confirmed) {
      const timer = setTimeout(() => {
        handleViewOrder();
      }, TIMER_DURATION);
      return () => clearTimeout(timer);
    }
  }, [confirmed]);

  // Reproducir sonido de notificación alto volumen cuando aparece el Lottie (orden confirmada)
  useEffect(() => {
    if (confirmed) {
      try {
        soundHelper.playHighVolumeNotification();
      } catch (e) {
        // ignorar si no está disponible o no es Android
      }
    }
  }, [confirmed]);

  const handleCancelOrder = () => {
    removeProgressListener();
    stopProgressAnimation();
    dispatch(clearBagOnly());
    navigation.goBack();
  };

  const handleModifyOrder = () => {
    removeProgressListener();
    stopProgressAnimation();
    navigation.replace('Index', {goToBag: true});
  };

  const handleViewOrder = () => {
    navigation.replace('Index', {goToBag: true});
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  return (
    <View style={styles.container}>
      {confirmed ? (
        <>
          <LottieView
            source={require('../../assets/animations/check2.json')}
            autoPlay
            loop={false}
            style={styles.checkAnimation}
          />
          <Text style={styles.confirmedText}>{t('order_confirmed')}</Text>
        </>
      ) : (
        <>
          <Image
            source={{
              uri: companySelected?.settings?.logo_url,
              cache: 'force-cache',
            }}
            style={styles.logo}
          />
          <Text style={styles.instruction}>{t('processing_order')}</Text>

          {/* ScrollView con detalle de orden ocultado */}
          {false && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}>
              {orderSummary.map((line, index) => (
                <Animated.View
                  key={index}
                  style={{
                    transform: [{translateY: animations[index]}],
                    opacity: animations[index].interpolate({
                      inputRange: [0, 50],
                      outputRange: [1, 0],
                    }),
                  }}>
                  <Text style={styles.orderSummaryText}>{line}</Text>
                </Animated.View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={handleSkipTimer}
            disabled={sending}
            style={[
              styles.progressButton,
              {backgroundColor: sending ? colors.gray : '#333'},
            ]}>
            {/* Progreso animado */}
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            {/* Texto encima */}
            <Text style={styles.progressButtonText}>
              {sending
                ? t('sending_order')
                : `${t('seems_ok')} (00:0${Math.max(0, counter)})`}
            </Text>
          </TouchableOpacity>

          {!sending && (
            <TouchableOpacity onPress={handleModifyOrder} style={styles.backLinkContainer}>
              <Text style={styles.backLinkText}>
                {language === 'es' ? 'Regresar' : 'Go Back'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <AlertDialog
        visible={showErrorDialog}
        onCancel={handleCloseErrorDialog}
        alertTitle={t('order_init_error_title')}
        alertMessage={t('order_init_error_message')}
      />
    </View>
  );
};

// 🚀 OPTIMIZACIÓN: React.memo para evitar re-renders innecesarios
export default React.memo(OrderView);
