/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useTheme} from '../../../providers/ThemeProvider';

const {width: screenWidth} = Dimensions.get('window');

const ToastNotification = ({
  visible,
  message,
  title,
  duration = 4000,
  onHide,
  type = 'success', // 'success', 'info', 'warning', 'error'
}) => {
  const {colors, font_type} = useTheme();
  const slideAnim = useRef(new Animated.Value(screenWidth * 0.5)).current; // Inicia desde la derecha
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 40,
      right: 0,
      width: screenWidth * 0.5,
      zIndex: 9999,
      elevation: 999,
    },
    toast: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      marginRight: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 16,
      borderLeftWidth: 4,
      minHeight: 80,
      justifyContent: 'center',
    },
    toastSuccess: {
      borderLeftColor: colors.primary,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    toastInfo: {
      borderLeftColor: colors.secondary,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    toastWarning: {
      borderLeftColor: colors.accent,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    toastError: {
      borderLeftColor: colors.error,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.error,
    },
    titleText: {
      fontSize: 18,
      fontFamily: font_type.bold,
      color: colors.text,
      marginBottom: title ? 8 : 0,
    },
    messageText: {
      fontSize: 16,
      fontFamily: font_type.regular,
      color: colors.text,
      lineHeight: 22,
    },
  });

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return styles.toastSuccess;
      case 'info':
        return styles.toastInfo;
      case 'warning':
        return styles.toastWarning;
      case 'error':
        return styles.toastError;
      default:
        return styles.toastSuccess;
    }
  };

  const showToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth * 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      showToast();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset animations when not visible
      slideAnim.setValue(screenWidth * 0.5);
      opacityAnim.setValue(0);
    }
  }, [visible, duration]);

  const handleClose = () => {
    hideToast();
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={{
          transform: [{translateX: slideAnim}],
          opacity: opacityAnim,
        }}>
        <TouchableOpacity
          style={[styles.toast, getToastStyle()]}
          onPress={handleClose}
          activeOpacity={0.8}>
          {title && <Text style={styles.titleText}>{title}</Text>}
          <Text style={styles.messageText}>{message}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default ToastNotification;
