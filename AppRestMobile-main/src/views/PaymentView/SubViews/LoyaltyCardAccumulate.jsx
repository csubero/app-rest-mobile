import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../../providers/ThemeProvider';
import {useTranslation} from 'react-i18next';
import Utils from '../../../helpers/utils/Utils';

const LoyaltyCardAccumulate = ({
  user,
  onAccumulate,
  onCancel,
  loading,
  currency,
}) => {
  const {colors, font_type, sizes, dimensions} = useTheme();
  const {t} = useTranslation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: -90,
    },
    title: {
      fontSize: 35,
      fontFamily: font_type.semibold,
      color: colors.primary,
      marginBottom: 0,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    subtitle: {
      fontSize: 22,
      fontFamily: font_type.regular,
      color: colors.text,
      marginBottom: 40,
      textAlign: 'center',
    },
    userInfo: {
      backgroundColor: colors.liteGray,
      padding: 30,
      borderRadius: sizes.borderRadius2,
      marginBottom: 40,
      alignItems: 'center',
      minWidth: 400,
    },
    userName: {
      fontSize: 28,
      fontFamily: font_type.semibold,
      color: colors.primary,
      marginBottom: 10,
    },
    userDetails: {
      fontSize: 18,
      fontFamily: font_type.semibold,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 25,
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

    infoBox: {
      width: 380,
      borderRadius: sizes.borderRadius,
      marginTop: -40,
      backgroundColor: colors.white,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: colors.text,
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
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    icon: {
      width: 400,
      height: 300,
      resizeMode: 'contain',
    },
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/spiceup.png')}
        style={styles.icon}
      />
      {/* <Text style={styles.title}>
        {t('hello')} {user?.name || user?.client_name || t('client')}
        {'\n'}
      </Text> */}
      {/* <Text style={styles.subtitle}>{t('loyalty_accumulate_subtitle')}</Text> */}

      <View style={styles.infoBox}>
        <View style={styles.row}>
          <>
            <Text style={styles.userDetails}>
              {t('card_payment')}:{' '}
              {user?.card_number || user?.cardNumber || t('n_a')}
            </Text>
          </>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account_balance')}</Text>
          <Text style={styles.value}>
            {Utils.formatCurrency(user?.balance || user?.points || 0, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onAccumulate}
          disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? t('processing') : t('loyalty_accumulate_button')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoyaltyCardAccumulate;
