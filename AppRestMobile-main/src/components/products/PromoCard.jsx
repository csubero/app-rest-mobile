import React from 'react';
import {Image, StyleSheet, View, TouchableOpacity} from 'react-native';
import {useTheme} from '../../providers/ThemeProvider';

const PromoCard = ({imageUrl, onPress, isBagBlocked}) => {
  const {dimensions, sizes} = useTheme();

  const styles = StyleSheet.create({
    card: {
      width: dimensions.width * 0.387,
      height: 160,
      borderRadius: sizes.cardRadius,
      overflow: 'hidden',
      marginRight: 15,
      backgroundColor: '#eee',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    disabledCard: {
      opacity: 0.5,
    },
  });

  const CardContent = (
    <View style={styles.card}>
      <Image source={{uri: imageUrl}} style={styles.image} resizeMode="cover" />
    </View>
  );

  // Solo usar TouchableOpacity si hay onPress, sino usar View normal
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        disabled={isBagBlocked}
        style={isBagBlocked ? styles.disabledCard : null}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

export default PromoCard;
