import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../../providers/ThemeProvider';

const CancelPaymentDialog = ({
  onConfirmCancel,
  onKeepPaying,
  isLoading = false,
}) => {
  const {t} = useTranslation();
  const {colors, font_type, sizes, dimensions} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 35,
      fontFamily: font_type.semibold,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    subtitle: {
      fontSize: 22,
      fontFamily: font_type.regular,
      color: colors.text,
      marginBottom: 50,
      textAlign: 'center',
      lineHeight: 30,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 20,
      justifyContent: 'center',
    },
    button: {
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: sizes.borderRadius2,
      minWidth: 150,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#F44336', // Rojo para cancelar
    },
    backButton: {
      backgroundColor: colors.text,
    },
    buttonText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
      color: colors.white,
      textTransform: 'uppercase',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    loadingText: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
      color: colors.text,
      marginTop: 15,
      textAlign: 'center',
    },

    buttonRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 30,
    },

    primaryButton: {
      backgroundColor: colors.button,
      paddingVertical: 12,
      //   paddingHorizontal: 30,
      width: 180,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
    },
    secondaryButton: {
      backgroundColor: colors.text,
      paddingVertical: 12,
      //   paddingHorizontal: 30,
      width: 180,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: dimensions.width * 0.012,
      paddingHorizontal: 10,
      fontFamily: font_type.regular,
      textTransform: 'uppercase',
    },
    secondaryButtonText: {
      color: colors.white,
      fontSize: dimensions.width * 0.012,
      paddingHorizontal: 10,
      fontFamily: font_type.regular,
      textTransform: 'uppercase',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.button || '#c63663'} />
          <Text style={styles.loadingText}>{t('canceling_payment')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('cancel_payment_title')}</Text>
      <Text style={styles.subtitle}>{t('cancel_payment_message')}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={onKeepPaying}>
          <Text style={styles.secondaryButtonText}>{t('keep_paying')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton]}
          onPress={onConfirmCancel}>
          <Text style={styles.primaryButtonText}>{t('yes_cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CancelPaymentDialog;
