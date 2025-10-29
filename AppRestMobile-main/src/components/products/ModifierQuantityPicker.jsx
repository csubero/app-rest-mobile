import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome6';
import {useTheme} from '../../providers/ThemeProvider';

const ModifierQuantityPicker = ({
  quantity,
  setQuantity,
  modifier,
  customization_id,
  customization_selection_type,
  customization_custom_id,
}) => {
  const {colors, dimensions, sizes, font_type} = useTheme();

  const styles = StyleSheet.create({
    quantityPickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 5,
      marginBottom: 5,
    },
    quantityPickerButton: {
      fontSize: dimensions.width * 0.017,
      color: '#000000',
      textAlign: 'center',
      lineHeight: 27,
    },
    quantityPickerButtonDisabled: {
      fontSize: dimensions.width * 0.015,
      color: '#000000',
      textAlign: 'center',
      lineHeight: 17,
      opacity: 0.5,
    },
    quantityPickerText: {
      fontSize: dimensions.width * 0.013,
      fontFamily: font_type.regular,
      color: '#000000',
      paddingHorizontal: 10,
      paddingVertical: 0,
      minWidth: 21,
      textAlign: 'center',
    },
    quantityPickerButtonContainer: {
      width: 34,
      height: 34,
      borderRadius: sizes.borderRadius,
      borderWidth: 2,
      borderColor: '#000000',
      backgroundColor: colors.background || '#F5F5F5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityPickerButtonContainerDisabled: {
      backgroundColor: '#000000',
      borderColor: '#000000',
      opacity: 0.5,
    },
  });

  const handleQuantityMinus = () => {
    if (quantity > 0) {
      setQuantity(
        quantity - 1,
        modifier,
        customization_id,
        customization_selection_type,
        customization_custom_id,
      );
    }
  };

  const handleQuantityPlus = () => {
    setQuantity(
      quantity + 1,
      modifier,
      customization_id,
      customization_selection_type,
      customization_custom_id,
    );
  };

  return (
    <View style={styles.quantityPickerContainer}>
      <TouchableOpacity 
        onPress={handleQuantityMinus} 
        disabled={quantity <= 0}
        style={[
          styles.quantityPickerButtonContainer,
          quantity <= 0 && styles.quantityPickerButtonContainerDisabled
        ]}>
        {quantity === 1 ? (
          <Icon 
            name="trash" 
            size={dimensions.width * 0.011} 
            color="#000000"
          />
        ) : (
          <Text
            style={
              quantity <= 0
                ? styles.quantityPickerButtonDisabled
                : styles.quantityPickerButton
            }>
            −
          </Text>
        )}
      </TouchableOpacity>
      <Text style={styles.quantityPickerText}>{quantity}</Text>
      <TouchableOpacity 
        onPress={handleQuantityPlus}
        style={styles.quantityPickerButtonContainer}>
        <Text style={styles.quantityPickerButton}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ModifierQuantityPicker;
