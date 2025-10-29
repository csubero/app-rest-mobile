import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import Utils from '../../../helpers/utils/Utils';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../../providers/ThemeProvider';

const LoyaltyTokenInput = ({
  loyaltyToken,
  setLoyaltyToken,
  resetPaymentMethod,
  loyaltyCardType,
  setUser,
  setAccumulateUser,
  setTokenValidated,
  tempUser,
}) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState(false);
  const [remainingTime, setRemainingTime] = useState(5);
  const {t} = useTranslation();
  const {colors, font_type, sizes, dimensions, fonts} = useTheme();

  useEffect(() => {
    if (loyaltyToken?.waitTime) {
      setRemainingTime(loyaltyToken.waitTime);
    }
  }, [loyaltyToken]);

  const handleValidateToken = () => {
    if (token !== '' && token === loyaltyToken.token) {
      // Para accumulate, establecer accumulateUser con tempUser
      if (loyaltyCardType === 'accumulate') {
        setAccumulateUser(tempUser);
        setAccumulateUser(tempUser);
      } else {
        // Para redeem/otros tipos, establecer user
        setUser(prev => prev || loyaltyToken.user || tempUser || {});
      }

      setTokenValidated(true);

      // Solo limpiar loyaltyToken si NO es para accumulate
      // Para accumulate necesitamos mantener el estado hasta llegar a LoyaltyCardAccumulate
      if (loyaltyCardType !== 'accumulate') {
        setLoyaltyToken(null);
      }
    } else {
      setError(t('invalid_token'));
    }
  };
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
      marginBottom: 10,
      fontFamily: font_type.semibold,
      textAlign: 'center',
    },
    buttonRow: {
      marginTop: 30,
      flexDirection: 'row',
      gap: 20,
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
    error_message: {
      fontSize: fonts.lite,
      textAlign: 'center',
      marginBottom: 20,
      color: colors.error,
      marginTop: 10,
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
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>
            {t('security_token_sent')} {Utils.maskEmail(loyaltyToken.email)}{' '}
            {t('valid_for')} {remainingTime} {t('minutes')}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_token')}
            value={token}
            onChangeText={setToken}
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
            onPress={handleValidateToken}>
            <Text style={styles.primaryButtonText}>{t('continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoyaltyTokenInput;
