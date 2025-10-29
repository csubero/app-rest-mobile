import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import Dialog, {DialogContent} from 'react-native-popup-dialog';

import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {useTheme} from '../../../providers/ThemeProvider';

const AlertDialog = ({
  visible = false,
  onCancel = () => {},
  alertMessage = '',
  alertTitle = '',
}) => {
  const {t} = useTranslation();

  const {companySelected} = useSelector(state => state.company);
  const {colors, dimensions, font_type, sizes} = useTheme();

  const styles = StyleSheet.create({
    dialog: {
      width: dimensions.width * 0.4,
      // height: dimensions.height * 0.22,
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
      fontFamily: font_type.bold,
      marginBottom: 30,
      marginTop: 18,
    },
    message: {
      color: colors.text,
      fontSize: dimensions.width * 0.015,
      fontFamily: font_type.regular,
      textAlign: 'center',
      marginBottom: 20,
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
      fontFamily: font_type.lite,
      textTransform: 'uppercase',
      color: colors.white,
    },
  });

  return (
    <Dialog visible={visible}>
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
            {alertTitle && <Text style={styles.title}>{alertTitle}</Text>}
            <Text style={styles.message}>{alertMessage}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>
                {t('alert_dialog_btn_text')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDialog;
