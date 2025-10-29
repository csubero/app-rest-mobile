import React, {useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import Dialog, {DialogContent} from 'react-native-popup-dialog';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {useTheme} from '../../../providers/ThemeProvider';

const AlertDialogDouble = ({
  visible = false,
  onCancel = () => {},
  onConfirm = () => {},
  message = '',
  title = '',
  cancelText = '',
  confirmText = '',
  confirming = false, // deshabilita Confirmar mientras procesas
}) => {
  const {t} = useTranslation();
  const {companySelected} = useSelector(state => state.company);
  const {colors, dimensions, font_type, sizes} = useTheme();

  useEffect(() => {
    if (!visible) {
      return;
    }

    const onBack = () => {
      if (onCancel && typeof onCancel === 'function') {
        onCancel();
      }
      return true; // consumir back mientras el diálogo está visible
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => {
      if (sub && sub.remove) {
        sub.remove();
      }
    };
  }, [visible, onCancel]);

  const styles = StyleSheet.create({
    dialog: {
      width: Math.max(320, dimensions.width * 0.4),
      borderRadius: sizes.borderRadius * 1.2,
      backgroundColor: colors.white,
    },
    dialogContent: {
      padding: 0,
    },
    dialogContainer: {
      alignItems: 'center',
      paddingHorizontal: 16,
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
      textAlign: 'center',
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
      width: '80%',
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      borderColor: colors.gray || '#6c757d',
      borderWidth: 1,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
      padding: sizes.padding * 0.7,
      backgroundColor: colors.white,
    },
    confirmButton: {
      flex: 1,
      borderColor: colors.button,
      borderWidth: 1,
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
      padding: sizes.padding * 0.7,
      backgroundColor: colors.button,
      opacity: confirming ? 0.6 : 1,
    },
    cancelButtonText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.lite,
      textTransform: 'uppercase',
      color: colors.gray || '#6c757d',
    },
    confirmButtonText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.lite,
      textTransform: 'uppercase',
      color: colors.white,
    },
  });

  return (
    <Dialog
      visible={visible}
      dialogStyle={styles.dialog}
      overlayBackgroundColor="rgba(0,0,0,0.5)"
      onTouchOutside={() => {
        if (onCancel && typeof onCancel === 'function') {
          onCancel();
        }
      }}
      onDismiss={() => {
        if (onCancel && typeof onCancel === 'function') {
          onCancel();
        }
      }}
      onHardwareBackPress={() => {
        if (onCancel && typeof onCancel === 'function') {
          onCancel();
        }
        return true;
      }}
      dismissOnTouchOutside={true}
      dismissOnHardwareBackPress={true}>
      <DialogContent style={styles.dialogContent}>
        <View style={styles.dialogContainer}>
          {companySelected?.settings?.logo_url ? (
            <Image
              source={{
                uri: companySelected.settings.logo_url,
                cache: 'force-cache',
              }}
              style={styles.logo}
            />
          ) : null}

          <View style={styles.textContainer}>
            {!!title && <Text style={styles.title}>{title}</Text>}
            {!!message && <Text style={styles.message}>{message}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                if (onCancel && typeof onCancel === 'function') {
                  onCancel();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={cancelText || t('cancel') || 'Cancelar'}>
              <Text style={styles.cancelButtonText}>
                {cancelText || t('cancel') || 'Cancelar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                if (onConfirm && typeof onConfirm === 'function') {
                  onConfirm();
                }
              }}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityLabel={confirmText || t('confirm') || 'Confirmar'}>
              <Text style={styles.confirmButtonText}>
                {confirmText || t('confirm') || 'Confirmar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDialogDouble;
