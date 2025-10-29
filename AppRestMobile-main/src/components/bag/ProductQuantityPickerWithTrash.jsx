import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import {useTheme} from '../../providers/ThemeProvider';
import OptimizedQuantityDisplay from './OptimizedQuantityDisplay';

const ProductQuantityPickerWithTrash = React.memo(({
  quantity,
  setQuantity,
  onRemove,
  inline = false,
  maxQuantity = 30, // Límite máximo de 30 items por defecto
  disabled = false, // Prop para deshabilitar el componente
}) => {
  const {colors, font_type, sizes} = useTheme();

  // console.log('🔍 [ProductQuantityPicker] Rendered with props:', {quantity, disabled});

  const handleDecrease = () => {
    if (quantity > 1 && !disabled) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity && !disabled) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      //   borderRadius: 25,
      //   borderWidth: 1,
      //   borderColor: colors.gray || '#e0e0e0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: inline ? 120 : 140,
      height: inline ? 40 : 50,
    },
    button: {
      width: inline ? 40 : 35,
      height: inline ? 40 : 35,
      borderRadius: inline ? sizes.borderRadius : 17.5,
      backgroundColor: colors.button,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      width: inline ? 40 : 35,
      height: inline ? 40 : 35,
      borderRadius: inline ? sizes.borderRadius : 17.5,
      backgroundColor: colors.disabled || '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
    },
    trashButton: {
      width: inline ? 40 : 35,
      height: inline ? 40 : 35,
      borderRadius: inline ? sizes.borderRadius : 17.5,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: inline ? 30 : 18,
      fontFamily: font_type.semibold,
      lineHeight: inline ? 42 : 18,
    },
    quantityText: {
      marginHorizontal: 15,
      fontSize: inline ? 20 : 18,
      fontFamily: font_type.semibold,
      color: colors.text,
      minWidth: 20,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* Botón izquierdo: Trash si quantity === 1, sino botón de menos */}
      <TouchableOpacity
        style={
          quantity === 1
            ? styles.trashButton
            : disabled || quantity <= 1
            ? styles.buttonDisabled
            : styles.button
        }
        onPress={quantity === 1 ? handleRemove : handleDecrease}
        disabled={disabled && quantity !== 1}>
        {quantity === 1 ? (
          <Icon name="trash" size={inline ? 15 : 14} color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>−</Text>
        )}
      </TouchableOpacity>

      {/* Cantidad actual optimizada */}
      <OptimizedQuantityDisplay 
        quantity={quantity} 
        style={styles.quantityText} 
      />

      {/* Botón derecho: siempre es más */}
      <TouchableOpacity
        style={
          disabled || quantity >= maxQuantity
            ? styles.buttonDisabled
            : styles.button
        }
        onPress={handleIncrease}
        disabled={disabled || quantity >= maxQuantity}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian propiedades críticas
  return (
    prevProps.quantity === nextProps.quantity &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.maxQuantity === nextProps.maxQuantity &&
    prevProps.inline === nextProps.inline
  );
});

export default ProductQuantityPickerWithTrash;
