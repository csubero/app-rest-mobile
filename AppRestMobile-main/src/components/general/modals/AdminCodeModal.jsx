import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import apiClient from '../../../services/api/apiClient';
import {useTheme} from '../../../providers/ThemeProvider';
import Constants from '../../../helpers/config/Constants';

const AdminCodeModal = ({
  visible,
  onClose,
  onSuccess,
  title = 'Código de Administrador',
  message = 'Ingrese el código de administrador para continuar',
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const {colors, sizes} = useTheme();

  // Obtener datos del store de Redux
  const {apiToken} = useSelector(state => state.auth || {});
  const {serverIp} = useSelector(state => state.store);

  // Limpiar estado cuando se abre/cierra el modal
  useEffect(() => {
    if (visible) {
      setCode('');
      setLoading(false);
      setErrorMessage('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setErrorMessage('Por favor ingrese el código');
      return;
    }

    setLoading(true);
    setErrorMessage(''); // Limpiar errores previos

    try {
      if (Constants.DEV_API) {
        console.log('🔧 Modo DEV activado - omitiendo validación de API');
        onSuccess({
          code: code,
          adminData: {dev: true}, // Mock data para desarrollo
        });
        handleClose();
        return;
      }

      // Llamar a la API de validación solo en producción
      const requestData = {
        password: code.trim(),
      };

      const response = await apiClient(serverIp, apiToken).post(
        'utils/validate-user/',
        requestData,
      );

      // Si la validación es exitosa, llamar onSuccess con los datos del administrador
      onSuccess({
        code: code,
        adminData: response,
      });
      handleClose();
    } catch (error) {
      console.error('❌ Error al validar código de administrador:', error);
      setErrorMessage('Código de administrador incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setErrorMessage('');
    setLoading(false); // Asegurar que loading se resetee
    onClose();
  };

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
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 20,
      backgroundColor: '#f9fafb',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 2,
    },
    inputDisabled: {
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: sizes.borderRadius,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#f3f4f6',
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    confirmButton: {
      backgroundColor: colors.button,
    },
    confirmButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    disabledButton: {
      opacity: 0.6,
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
      fontWeight: '500',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TextInput
            style={[styles.input, loading && styles.inputDisabled]}
            placeholder="Código de acceso"
            value={code}
            onChangeText={setCode}
            secureTextEntry={true}
            autoFocus={true}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!loading}
          />

          {/* Mostrar mensaje de error debajo del input */}
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading}>
              <Text style={styles.confirmButtonText}>
                {loading ? 'Validando...' : 'Confirmar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AdminCodeModal;
