import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {useTheme} from '../../providers/ThemeProvider';

const Badge = ({visible = false, count = null, style = {}}) => {
  const {colors, dimensions, font_type} = useTheme();
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && (count === null || count === 0)) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      // Resetear la animación a opacidad 1 cuando no está visible o tiene contador
      blinkAnim.setValue(1);
    }
  }, [visible, count, blinkAnim]);

  if (!visible) return null;

  const styles = StyleSheet.create({
    badge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: colors.button,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.white,
      zIndex: 10,
    },
    badgeText: {
      color: colors.white,
      fontSize: dimensions.width * 0.008,
      fontFamily: font_type.bold,
      textAlign: 'center',
    },
  });

  return (
    <View style={[styles.badge, style]}>
      {count !== null && count > 0 ? (
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      ) : (
        <Animated.View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.white,
            opacity: blinkAnim,
          }}
        />
      )}
    </View>
  );
};

export default Badge;
