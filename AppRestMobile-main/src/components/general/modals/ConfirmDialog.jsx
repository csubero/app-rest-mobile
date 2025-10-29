import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import Dialog, {DialogContent} from 'react-native-popup-dialog';

import {useTheme} from '../../../providers/ThemeProvider';

import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';

const ConfirmDialog = ({
  visible = false,
  onCancel = () => {},
  onConfirm = () => {},
}) => {
  const {t} = useTranslation();
  const {colors, dimensions, sizes, fonts} = useTheme();

  const {companySelected} = useSelector(state => state.company);

  const styles = StyleSheet.create({
    dialog: {
      width: dimensions.width * 0.4,
      // height: theme.dimensions.height * 0.22,
    },
    dialogContainer: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: dimensions.height * 0.02,
    },
    textContainer: {paddingHorizontal: 20, alignItems: 'center'},
    logo: {
      width: 100,
      height: dimensions.height * 0.1,
      resizeMode: 'contain',
      marginBottom: 10,
    },
    title: {
      color: colors.text,
      fontSize: dimensions.width * 0.018,
      fontFamily: fonts.bold,
      marginBottom: 30,
      marginTop: 18,
    },
    message: {
      color: colors.text,
      fontSize: dimensions.width * 0.014,
      fontFamily: fonts.regular,
      textAlign: 'center',
      marginBottom: 40,
      marginTop: 10,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '60%',
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
      borderColor: colors.button,
      borderWidth: 1,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
      padding: sizes.padding * 0.7,
      backgroundColor: colors.button,
    },
    buttonText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: fonts.lite,
      textTransform: 'uppercase',
      color: colors.white,
    },
  });

  return (
    <Dialog visible={visible} onTouchOutside={onCancel}>
      <DialogContent style={styles.dialog}>
        <View style={styles.dialogContainer}>
          <Image
            source={{
              uri: companySelected.settings.logo_url,
              cache: 'force-cache',
            }}
            style={styles.logo}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('delete_title')}</Text>
            <Text style={styles.message}>{t('delete_sure')}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>{t('back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <Text style={styles.buttonText}>{t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
