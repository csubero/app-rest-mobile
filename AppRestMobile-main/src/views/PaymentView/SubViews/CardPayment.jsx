import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import Utils from '../../../helpers/utils/Utils';
import {useSelector} from 'react-redux';
import {useTheme} from '../../../providers/ThemeProvider';

const CardPayment = ({
  resetPaymentMethod,
  totalAmount,
  handleRemoveBag,
  setOnlyPaymentEnabled,
  processPaymentMock,
  navigation,
}) => {
  const {t} = useTranslation();
  const {companySelected} = useSelector(state => state.company);
  const {colors, font_type, sizes, dimensions} = useTheme();
  useEffect(() => {
    setOnlyPaymentEnabled(true);

    return () => {
      setOnlyPaymentEnabled(false);
    };
  }, [setOnlyPaymentEnabled]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      width: '100%',
      marginTop: -90,
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
    paymentIcons: {
      width: 300,
      height: 80,
      resizeMode: 'contain',
      marginTop: 20,
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
    <View style={styles.container}>
      <Image
        source={{
          uri: companySelected.settings.logo_url,
          cache: 'force-cache',
        }}
        style={styles.logo}
      />

      <Text style={styles.total}>
        {t('total_text')}: {Utils.formatCurrency(totalAmount, 'CRC')}
      </Text>

      <Text style={styles.instruction}>{t('insert_card')}</Text>
      <Text style={styles.instruction}>{t('follow_instructions')}</Text>

      <Text style={[styles.label, {marginTop: 30}]}>
        {t('accepted_payment_methods')}
      </Text>
      <Image
        source={require('../../../assets/images/payment.png')}
        style={styles.paymentIcons}
      />

      <TouchableOpacity onPress={handleRemoveBag}>
        <Text style={styles.cancelOrderText}>X {t('cancel_order')}</Text>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: 'row',
          gap: 20,
          marginTop: 40,
        }}>
        {/* Botón de regresar */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.text,
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: sizes.borderRadius2,
          }}
          onPress={resetPaymentMethod}>
          <Text
            style={{
              color: colors.white,
              fontFamily: font_type.regular,
              fontSize: dimensions.width * 0.012,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
            {t('back')}
          </Text>
        </TouchableOpacity>

        {/* Botón de test de pago */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.text,
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: sizes.borderRadius2,
          }}
          onPress={processPaymentMock}>
          <Text
            style={{
              color: colors.white,
              fontFamily: font_type.regular,
              fontSize: dimensions.width * 0.012,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
            Test de pago
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CardPayment;
