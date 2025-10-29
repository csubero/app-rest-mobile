import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Utils from '../../../helpers/utils/Utils';
import {useTheme} from '../../../providers/ThemeProvider';
import QRCode from 'react-native-qrcode-svg';

const QRPayment = ({
  resetPaymentMethod, // Función para cancelar el pago en el servidor (para pagos pendientes)
  resetLocalState, // Función para resetear solo el estado local (para pagos fallidos)
  totalAmount,
  handleRemoveBag,
  paymentQrUrl, // Recibir la URL del QR desde el parent
  qrLoading, // Recibir el estado de loading del QR desde el parent
  paymentStatus = 'waiting',
  qrError = false,
  setShowCancelDialog = () => {}, // Default no-op para asegurar que siempre es callable
  setOnlyPaymentEnabled,
  companySelected,
}) => {
  const {t} = useTranslation();
  const {colors, font_type, sizes, dimensions} = useTheme();

  // Usar la URL del parent
  const qrUrl = paymentQrUrl || null;

  // Función para obtener el mensaje según el estado del pago
  const getPaymentStatusMessage = () => {
    switch (paymentStatus) {
      case 'waiting':
        return t('scan_qr_to_pay');
      case 'scanning':
        return t('qr_scanned_processing');
      case 'processing':
        return t('payment_processing');
      case 'completed':
        return t('payment_completed');
      case 'failed':
        return t('payment_failed');
      default:
        return t('scan_qr_to_pay');
    }
  };

  // Función para obtener el color según el estado del pago
  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'waiting':
        return colors.text;
      case 'scanning':
        return colors.button || '#c63663';
      case 'processing':
        return colors.button || '#c63663';
      case 'completed':
        return '#4CAF50'; // Verde para completado
      case 'failed':
        return '#F44336'; // Rojo para fallido
      default:
        return colors.text;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      width: '100%',
      marginTop: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      width: 400,
      height: 200,
      resizeMode: 'contain',
      marginBottom: 20,
    },
    label: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.semibold,
      color: colors.text,
      marginBottom: 15,
      textAlign: 'center',
    },
    total: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.semibold,
      color: colors.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    instruction: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    qrContainer: {
      backgroundColor: colors.white,
      padding: 20,
      borderRadius: sizes.borderRadius2,
      marginVertical: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    errorText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.regular,
      color: colors.error || '#ff0000',
      textAlign: 'center',
      marginBottom: 20,
    },
    loadingContainer: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelOrderText: {
      position: 'absolute',
      bottom: -dimensions.height * 0.02,
      left: dimensions.width * 0.52,
      textTransform: 'uppercase',
      fontFamily: font_type.regular,
      fontSize: dimensions.width * 0.012,
      color: colors.text,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 15,
    },
    button: {
      backgroundColor: colors.text,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: sizes.borderRadius,
    },
    buttonText: {
      color: colors.white,
      fontFamily: font_type.regular,
      fontSize: dimensions.width * 0.012,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    paymentStatusText: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.semibold,
      textAlign: 'center',
      marginBottom: 10,
    },
    successColor: {
      color: '#4CAF50',
    },
    qrScanning: {
      borderColor: colors.button || '#c63663',
      borderWidth: 2,
    },
    qrCompleted: {
      borderColor: '#4CAF50',
      borderWidth: 2,
    },
    // Espacio de error minimalista en lugar del contenedor con borde
    qrErrorSpace: {
      minHeight: 250, // mismo alto aproximado del QR
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 20,
      paddingHorizontal: 10,
      width: '100%',
    },
    failedTitle: {
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.semibold,
      color: '#F44336',
      textAlign: 'center',
    },
    failedHint: {
      fontSize: dimensions.width * 0.0115,
      fontFamily: font_type.regular,
      color: colors.text,
      textAlign: 'center',
      marginTop: 8,
      opacity: 0.7,
    },
    processingText: {
      marginTop: 10,
      fontSize: dimensions.width * 0.012,
    },
    icon: {
      marginTop: -40,
      width: 200,
      height: 100,
      resizeMode: 'contain',
    },
  });

  return (
    <View style={styles.container}>
      <Image
        source={{uri: companySelected.settings.logo_url}}
        style={styles.icon}
      />
      <Text style={styles.total}>
        {t('total_text')}: {Utils.formatCurrency(totalAmount, 'CRC')}
      </Text>

      {/* Solo mostrar mensaje según el estado del pago si no hay error de QR */}
      {paymentStatus !== 'failed' && !qrError && (
        <Text style={[styles.instruction, {color: getStatusColor()}]}>
          {getPaymentStatusMessage()}
        </Text>
      )}
      {qrLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.button || '#c63663'} />
          <Text style={styles.instruction}>{t('generating_qr')}</Text>
        </View>
      )}

      {qrUrl && !qrLoading && !qrError && paymentStatus !== 'failed' && (
        <View
          style={[
            styles.qrContainer,
            paymentStatus === 'scanning' && styles.qrScanning,
            paymentStatus === 'completed' && styles.qrCompleted,
          ]}>
          <QRCode
            value={qrUrl}
            size={250}
            backgroundColor="white"
            color="black"
          />
        </View>
      )}

      {/* Mostrar mensaje de error en lugar del QR cuando falla el pago o la generación del QR */}
      {(paymentStatus === 'failed' || qrError) && (
        <View style={styles.qrErrorSpace}>
          <Text style={styles.failedTitle}>
            {qrError ? t('qr_generation_failed') : t('payment_failed')}
          </Text>
          {/* <Text style={styles.failedHint}>{t('try_again')}</Text> */}
        </View>
      )}

      <TouchableOpacity onPress={handleRemoveBag}>
        <Text style={styles.cancelOrderText}>X {t('cancel_order')}</Text>
      </TouchableOpacity>
      {paymentStatus !== 'failed' && !qrError && (
        <View>
          <Text style={styles.instruction}>{t('want_to_cancel')}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {paymentStatus !== 'completed' && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (paymentStatus === 'failed' || qrError) {
                resetLocalState();
                return;
              }
              setShowCancelDialog(true);
            }}>
            <Text style={styles.buttonText}>
              {paymentStatus === 'failed' || qrError
                ? t('try_again')
                : t('yes_cancel')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default QRPayment;
