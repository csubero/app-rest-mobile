import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Utils from '../../../helpers/utils/Utils';
import {useTheme} from '../../../providers/ThemeProvider';

const LoyaltyPoints = ({
  user,
  totalAmount,
  currency,
  calculateRemainingAmount,
  setPaymentMethod,
  setTotalAmount,
  resetPaymentMethod,
  loyaltyCardType,
  captureFullPayment,
  handlePoints,
  setRedeemPoints,
  onAccumulate, // Nueva prop para manejar la acumulación
  setAccumulateUser,
  setOnlyPaymentEnabled,
}) => {
  const {t} = useTranslation();
  const [error, setError] = useState(false);
  const remaining = calculateRemainingAmount();
  const {colors, font_type, sizes, dimensions, fonts} = useTheme();

  const handleAccumulatePoints = useCallback(() => {
    try {
      // Establecer el usuario como accumulateUser para que se incluya en el payload de acumulación
      if (setAccumulateUser && user) {
        setAccumulateUser(user);
      }

      // Llamar la función de acumulación pasada como prop
      if (onAccumulate) {
        onAccumulate();
      }
    } catch (err) {
      console.log('❌ LoyaltyPoints - accumulate error:', err);
      setError(true);
    }
  }, [onAccumulate, user, setAccumulateUser]);

  const continue_to_payment = useCallback(async () => {
    try {
      setRedeemPoints(true);

      if (remaining > 0) {
        setTotalAmount(remaining);
        setPaymentMethod('card');
      } else {
        setOnlyPaymentEnabled(true);
        await captureFullPayment(true);
      }
    } catch (err) {
      setError(true);
    }
  }, [
    remaining,
    setRedeemPoints,
    setTotalAmount,
    setPaymentMethod,
    captureFullPayment,
    setOnlyPaymentEnabled,
  ]);

  const styles = StyleSheet.create({
    keyboardContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.white,
      width: '100%',
      marginTop: -90,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: 400,
      height: 300,
      resizeMode: 'contain',
    },
    infoBox: {
      width: 380,
      borderRadius: 20,
      marginBottom: 20,
      marginTop: -40,
      backgroundColor: colors.white,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: colors.text,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    label: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.regular,
      color: colors.text,
    },
    value: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
      color: colors.text,
    },
    total: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.semibold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 20,
    },
    primaryButton: {
      backgroundColor: colors.button,
      paddingVertical: 12,
      width: 180,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
    },
    secondaryButton: {
      backgroundColor: colors.text,
      paddingVertical: 12,
      width: 180,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.regular,
      textTransform: 'uppercase',
    },
    secondaryButtonText: {
      color: colors.white,
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.regular,
      textTransform: 'uppercase',
    },
    error_message: {
      fontSize: fonts.lite,
      color: colors.error,
      marginTop: 10,
      textAlign: 'center',
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
  });

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.keyboardContainer}
      keyboardVerticalOffset={80}>
      <View style={styles.container}>
        <Image
          source={
            loyaltyCardType === 'Dunkin'
              ? require('../../../assets/images/rewards.png')
              : require('../../../assets/images/spiceup.png')
          }
          style={styles.icon}
        />

        <View style={styles.infoBox}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('subtotal_text')}</Text>
            <Text style={styles.value}>
              {Utils.formatCurrency(totalAmount, currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('account_balance')}</Text>
            <Text style={styles.value}>
              {Utils.formatCurrency(user.balance, currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('total_text')}</Text>
            <Text style={styles.value}>
              {Utils.formatCurrency(remaining, currency)}
            </Text>
          </View>
        </View>

        <Text style={styles.total}>
          {t('pending_value')}: {Utils.formatCurrency(remaining, currency)}
        </Text>

        {error && (
          <Text style={styles.error_message}>{t('payment_error')}</Text>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleAccumulatePoints}>
            <Text style={styles.secondaryButtonText}>{t('loyalty_earn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={continue_to_payment}>
            <Text style={styles.primaryButtonText}>{t('end_payment')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoyaltyPoints;
