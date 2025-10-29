import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../../providers/ThemeProvider';

const LoyaltyCardNumber = ({
  loyaltyCardType,
  idNumber,
  setIdNumber,
  error,
  resetPaymentMethod,
  handleLoyaltyPlan,
}) => {
  const {t} = useTranslation();
  const {colors, font_type, sizes, dimensions, fonts} = useTheme();

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
    section: {
      flex: 1,
      backgroundColor: colors.white,
      width: '100%',
      paddingTop: 50,
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
      fontSize: 18,
      fontFamily: font_type.regular,
      color: colors.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    button: {
      paddingVertical: 12,
      width: 200,
      alignItems: 'center',
      borderRadius: sizes.borderRadius2,
      borderWidth: 1,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: font_type.regular,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    icon: {
      width: 400,
      height: 300,
      resizeMode: 'contain',
    },
    productImageContainer: {
      width: '25%',
      padding: 5,
      height: 100,
      overflow: 'hidden',
    },
    productImage: {
      width: '85%',
      height: '85%',
      resizeMode: 'contain',
    },
    customization: {
      fontFamily: font_type.lite,
    },
    buttonRow: {
      marginTop: 30,
      flexDirection: 'row',
      gap: 20,
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
    inputContainer: {
      width: 380,
      borderRadius: 20,
      marginTop: -60,
    },
    input: {
      width: '100%',
      height: dimensions.height * 0.075,
      borderColor: colors.text,
      borderWidth: 1,
      paddingHorizontal: 15,
      borderRadius: sizes.borderRadius2,
      backgroundColor: colors.white,
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.lite,
    },
    inputText: {
      color: colors.text,
      fontSize: dimensions.width * 0.018,
      marginBottom: 5,
      fontFamily: font_type.semibold,
    },
    error_message: {
      fontSize: fonts.lite,
      textAlign: 'center',
      marginBottom: 20,
      color: colors.error,
      marginTop: 10,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.keyboardContainer}
      keyboardVerticalOffset={80}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={
              loyaltyCardType === 'Dunkin'
                ? require('../../../assets/images/rewards.png')
                : require('../../../assets/images/spiceup.png')
            }
            style={styles.icon}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('idNumber')}
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="numeric"
          />
          {error ? <Text style={styles.error_message}>{error}</Text> : null}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetPaymentMethod}>
            <Text style={styles.secondaryButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleLoyaltyPlan(null, loyaltyCardType)}>
            <Text style={styles.primaryButtonText}>{t('search_text')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoyaltyCardNumber;
