import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import InstantImageFullscreen from '../../components/products/InstantImageFullscreen';

import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {setLanguage} from '../../redux/slice/settingsSlice';
import Icon from 'react-native-vector-icons/FontAwesome6';
import {useTheme} from '../../providers/ThemeProvider';
import createStyles from './styles';

const LanguageSelectionView = ({navigation}) => {
  const {i18n} = useTranslation();
  const {companySelected} = useSelector(state => state.company);
  const orderConfirmedApiId = useSelector(
    state => state.bag.orderConfirmedApiId,
  );
  const tableId = useSelector(state => state.company.tableData?.table?.id);
  const socketConnections = useSelector(state => state.bag?.socketConnections);
  const {colors, font_type, sizes} = useTheme();

  const dispatch = useDispatch();

  // Determinar si los botones deben estar bloqueados
  const shouldBlockButtons = useMemo(() => {
    if (!socketConnections) {
      return true; // Bloquear si no hay info de sockets
    }

    let shouldBlock = false;

    // Verificar socket de orden si hay una orden
    if (orderConfirmedApiId) {
      const orderSocket = socketConnections.order;
      if (!orderSocket.connected) {
        shouldBlock = true;
      }
    }

    // Verificar socket de mesa si hay una mesa
    if (tableId) {
      const tableSocket = socketConnections.table;
      if (!tableSocket.connected) {
        shouldBlock = true;
      }
    }

    return shouldBlock;
  }, [socketConnections, orderConfirmedApiId, tableId]);

  const handleLanguageSelection = language => {
    if (shouldBlockButtons) {
      console.log(
        '[LanguageSelection] Botones bloqueados - sockets no conectados',
      );
      return;
    }

    console.log('[LanguageSelection] Selección de idioma:', language);

    i18n.changeLanguage(language);
    dispatch(setLanguage(language));
    navigation.navigate('Index');
  };

  // Estilos optimizados con useMemo
  const styles = useMemo(() => {
    return createStyles({
      colors,
      font_type,
      sizes,
    });
  }, [colors, font_type, sizes]);

  return (
    <View style={styles.container}>
      <InstantImageFullscreen
        source={{uri: companySelected.settings.banner_language_url}}
        style={styles.image}
        resizeMode="cover"
      />

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}>
        <Icon name="arrow-left" size={25} color={colors.white} />
      </TouchableOpacity>

      {orderConfirmedApiId && (
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdText}>ORDEN: {orderConfirmedApiId}</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <Text style={styles.title}>SELECCIONÁ TU IDIOMA</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, shouldBlockButtons && styles.buttonDisabled]}
            onPress={() => handleLanguageSelection('es')}
            disabled={shouldBlockButtons}>
            <Text
              style={[
                styles.buttonText,
                shouldBlockButtons && styles.buttonTextDisabled,
              ]}>
              ESPAÑOL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, shouldBlockButtons && styles.buttonDisabled]}
            onPress={() => handleLanguageSelection('en')}
            disabled={shouldBlockButtons}>
            <Text
              style={[
                styles.buttonText,
                shouldBlockButtons && styles.buttonTextDisabled,
              ]}>
              ENGLISH
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LanguageSelectionView;
