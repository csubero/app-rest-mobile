import React from 'react';
import {View, Text, Modal, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../../providers/ThemeProvider';

const GenericAlert = ({
  visible,
  title = 'Alerta',
  message = '',
  type = 'info', // 'info', 'success', 'warning', 'danger'
  confirmText = 'Aceptar',
  cancelText = '',
  onConfirm,
  onCancel,
}) => {
  const {colors} = useTheme();
  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          color: '#fff',
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          color: '#fff',
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#fff',
        };
      default:
        return {
          backgroundColor: colors.primary,
          color: '#fff',
        };
    }
  };

  const alertStyle = getAlertStyle();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 24,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    singleButton: {
      flex: 1,
    },
    cancelButton: {
      backgroundColor: colors.text,
      borderWidth: 1,
      borderColor: colors.text,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    confirmButton: {
      // backgroundColor will be set dynamically
    },
    confirmButtonText: {
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={[styles.title, {color: alertStyle.backgroundColor}]}>
            {title}
          </Text>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.buttonRow}>
            {cancelText ? (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {backgroundColor: alertStyle.backgroundColor},
                !cancelText && styles.singleButton,
              ]}
              onPress={onConfirm}>
              <Text
                style={[styles.confirmButtonText, {color: alertStyle.color}]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default GenericAlert;
