import React from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {useTheme} from '../providers/ThemeProvider';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';

const ConnectionBlockedView = () => {
  const {colors, font_type, dimensions, withOpacity} = useTheme();
  const {t} = useTranslation();
  const [pulseAnim] = React.useState(new Animated.Value(1));

  // Obtener información de la orden actual
  const orderConfirmedApiId = useSelector(
    state => state.bag.orderConfirmedApiId,
  );
  const tableData = useSelector(state => state.company.tableData);

  React.useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnim]);

  // Mensajes según el idioma
  const getConnectionMessages = () => {
    return {
      title: t('connection_issues_title') || 'Sin Conexión a Internet',
      subtitle:
        t('connection_issues_subtitle') ||
        'Estamos experimentando problemas de conectividad',
      instruction:
        t('connection_issues_instruction') ||
        'Por favor, llamá a un mesero para obtener ayuda con tu pedido',
      waitMessage:
        t('connection_issues_wait') ||
        'Estamos trabajando para restablecer la conexión',
      icon: '📶',
    };
  };

  const messages = getConnectionMessages();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: withOpacity(colors.primary, 0.95),
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    iconContainer: {
      marginBottom: 30,
      backgroundColor: withOpacity(colors.white, 0.15),
      borderRadius: 80,
      padding: 20,
      borderWidth: 2,
      borderColor: withOpacity(colors.white, 0.3),
    },
    icon: {
      fontSize: 60,
      textAlign: 'center',
    },
    title: {
      fontSize: dimensions.width * 0.025,
      fontFamily: font_type.bold,
      color: colors.white,
      textAlign: 'center',
      marginBottom: 15,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.regular,
      color: withOpacity(colors.white, 0.9),
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: dimensions.width * 0.025,
    },
    instructionContainer: {
      backgroundColor: withOpacity(colors.white, 0.1),
      padding: 20,
      borderRadius: 15,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: withOpacity(colors.white, 0.2),
      minWidth: dimensions.width * 0.6,
    },
    instructionText: {
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.semibold,
      color: colors.white,
      textAlign: 'center',
      lineHeight: dimensions.width * 0.022,
    },
    orderInfoContainer: {
      backgroundColor: withOpacity(colors.secondary, 0.8),
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      minWidth: dimensions.width * 0.4,
    },
    orderInfoTitle: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.semibold,
      color: colors.white,
      textAlign: 'center',
      marginBottom: 8,
    },
    orderInfoText: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.bold,
      color: colors.white,
      textAlign: 'center',
    },
    callWaiterButton: {
      backgroundColor: colors.accent,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 25,
      marginBottom: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    callWaiterButtonDisabled: {
      backgroundColor: withOpacity(colors.accent, 0.6),
      elevation: 1,
    },
    callWaiterText: {
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.bold,
      color: colors.white,
      textAlign: 'center',
    },
    helpMessageContainer: {
      backgroundColor: withOpacity(colors.accent, 0.9),
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 25,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: withOpacity(colors.white, 0.3),
    },
    helpMessageText: {
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.bold,
      color: colors.white,
      textAlign: 'center',
    },
    waitMessage: {
      fontSize: dimensions.width * 0.013,
      fontFamily: font_type.regular,
      color: withOpacity(colors.white, 0.7),
      textAlign: 'center',
      fontStyle: 'italic',
      maxWidth: dimensions.width * 0.5,
      lineHeight: dimensions.width * 0.018,
    },
  });

  return (
    <View style={styles.container}>
      {/* Overlay de bloqueo */}
      <View style={styles.overlay} />

      {/* Contenido principal */}
      <View style={styles.content}>
        <Animated.View
          style={[styles.iconContainer, {transform: [{scale: pulseAnim}]}]}>
          <Text style={styles.icon}>{messages.icon}</Text>
        </Animated.View>

        <Text style={styles.title}>{messages.title}</Text>

        <Text style={styles.subtitle}>{messages.subtitle}</Text>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{messages.instruction}</Text>
        </View>

        {/* Mostrar información de la orden si existe */}
        {(orderConfirmedApiId || tableData?.table?.name) && (
          <View style={styles.orderInfoContainer}>
            <Text style={styles.orderInfoTitle}>
              {t('order_information') || 'Información de la Orden:'}
            </Text>
            {tableData?.table?.name && (
              <Text style={styles.orderInfoText}>
                {t('table_label') || 'Mesa'}: {tableData.table.name}
              </Text>
            )}
            {orderConfirmedApiId && (
              <Text style={styles.orderInfoText}>
                {t('order_id_label') || 'ID Orden'}: {orderConfirmedApiId}
              </Text>
            )}
          </View>
        )}

        <View style={styles.helpMessageContainer}>
          <Text style={styles.helpMessageText}>
            {t('language') === 'en'
              ? '📞 Please call a waiter for assistance'
              : '📞 Por favor llama a un mesero para obtener ayuda'}
          </Text>
        </View>

        <Text style={styles.waitMessage}>{messages.waitMessage}</Text>
      </View>
    </View>
  );
};

export default ConnectionBlockedView;
