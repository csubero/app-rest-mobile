// components/ProductQuantityPicker.js
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useTheme} from '../../providers/ThemeProvider';

const ProductQuantityPicker = ({
  quantity,
  setQuantity,
  small,
  home,
  inline = false,
  maxQuantity = 30, // Límite máximo de 30 items por defecto
  disabled = false, // Prop para deshabilitar el componente
}) => {
  const {colors, dimensions, sizes, font_type} = useTheme();

  const styles = StyleSheet.create({
    // Variante absoluta (por defecto)
    quantityPickerContainer: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      right: dimensions.width * 0.01,
    },
    // Versión “small” existente
    quantityPickerContainerSmall: {
      flexDirection: 'row',
      width: '20%',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 0,
      margin: 0,
    },
    // NUEVA variante inline (fluye en el flex de BagView)
    quantityPickerInlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityPickerButton: {
      fontSize: dimensions.width * 0.015,
      fontWeight: 'bold',
      color: colors.white,
      paddingHorizontal: dimensions.width * 0.01,
      paddingVertical: dimensions.width * 0.002,
      backgroundColor: colors.button,
      borderRadius: sizes.borderRadius,
      borderWidth: 1,
      borderColor: colors.button,
      textAlign: 'center',
    },
    quantityPickerButtonDisabled: {
      fontSize: dimensions.width * 0.015,
      fontWeight: 'bold',
      color: colors.white,
      paddingHorizontal: dimensions.width * 0.01,
      paddingVertical: dimensions.width * 0.002,
      backgroundColor: colors.disabled || '#ccc',
      borderRadius: sizes.borderRadius,
      borderWidth: 1,
      borderColor: colors.disabled || '#ccc',
      textAlign: 'center',
    },
    quantityPickerButtonPersonalization: {
      fontSize: dimensions.width * 0.02,
      fontWeight: 'bold',
      color: colors.white,
      paddingHorizontal: dimensions.width * 0.015,
      paddingVertical: dimensions.width * 0.004,
      backgroundColor: colors.button,
      borderRadius: sizes.borderRadius,
      textAlign: 'center',
    },
    quantityPickerButtonPersonalizationDisabled: {
      fontSize: dimensions.width * 0.02,
      fontWeight: 'bold',
      color: colors.white,
      paddingHorizontal: dimensions.width * 0.015,
      paddingVertical: dimensions.width * 0.004,
      backgroundColor: colors.disabled || '#ccc',
      borderRadius: sizes.borderRadius,
      textAlign: 'center',
    },
    quantityPickerText: {
      fontSize: dimensions.width * 0.02,
      fontFamily: font_type.bold,
      color: colors.text,
      paddingHorizontal: 10,
      paddingVertical: 0,
    },
    quantityPickerTextPersonalization: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.bold,
      color: colors.text,
      paddingHorizontal: 25,
      paddingVertical: 0,
    },
  });

  // Elige contenedor según prop
  const containerStyle = inline
    ? styles.quantityPickerInlineContainer
    : small
    ? styles.quantityPickerContainerSmall
    : styles.quantityPickerContainer;

  const handleQuantityMinus = () => {
    if (quantity > 1 && !disabled) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityPlus = () => {
    if (quantity < maxQuantity && !disabled) {
      setQuantity(quantity + 1);
    }
  };

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        onPress={handleQuantityMinus}
        disabled={disabled || quantity <= 1}
      >
        <Text
          style={
            disabled || quantity <= 1
              ? (home
                  ? styles.quantityPickerButtonPersonalizationDisabled
                  : styles.quantityPickerButtonDisabled)
              : (home
                  ? styles.quantityPickerButtonPersonalization
                  : styles.quantityPickerButton)
          }>
          –
        </Text>
      </TouchableOpacity>
      <Text
        style={
          home
            ? styles.quantityPickerTextPersonalization
            : styles.quantityPickerText
        }>
        {quantity}
      </Text>
      <TouchableOpacity
        onPress={handleQuantityPlus}
        disabled={disabled || quantity >= maxQuantity}
      >
        <Text
          style={
            disabled || quantity >= maxQuantity
              ? (home
                  ? styles.quantityPickerButtonPersonalizationDisabled
                  : styles.quantityPickerButtonDisabled)
              : (home
                  ? styles.quantityPickerButtonPersonalization
                  : styles.quantityPickerButton)
          }>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProductQuantityPicker;
