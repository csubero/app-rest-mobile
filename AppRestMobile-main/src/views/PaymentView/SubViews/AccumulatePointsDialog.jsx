import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../../providers/ThemeProvider';
import {useTranslation} from 'react-i18next';

const AccumulatePointsDialog = ({
  onAccumulatePoints,
  onSkipPoints,
  onCancel,
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
    cancelButton: {
      backgroundColor: colors.white,
      paddingVertical: 15,
      paddingHorizontal: 30,
      width: 200,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
      borderWidth: 2,
      borderColor: colors.gray,
      marginTop: 20,
    },
    cancelButtonText: {
      fontSize: 15,
      fontFamily: font_type.semibold,
      color: colors.gray,
      textTransform: 'uppercase',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('accumulate_points_title')}</Text>
      <Text style={styles.subtitle}>{t('accumulate_points_subtitle')}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkipPoints}>
          <Text style={styles.secondaryButtonText}>{t('accumulate_no')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onAccumulatePoints}>
          <Text style={styles.primaryButtonText}>{t('accumulate_yes')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.secondaryButton, {marginTop: 20}]}
        onPress={onCancel}>
        <Text style={styles.secondaryButtonText}>{t('back')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AccumulatePointsDialog;
