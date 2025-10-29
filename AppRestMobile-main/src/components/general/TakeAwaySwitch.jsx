import React from 'react';
import {View, Text, TouchableOpacity, Animated} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../providers/ThemeProvider';

const TakeAwaySwitch = ({
  isTakeAway,
  onToggle,
  disabled = false,
  leftLabel, // opcional: sobreescribe "Delivery"
  rightLabel, // opcional: sobreescribe "Pickup"
  width, // opcional: ancho fijo (p.ej. 220)
  height = 36, // alto del control
}) => {
  const {colors, font_type} = useTheme();
  const {t} = useTranslation();

  const anim = React.useRef(new Animated.Value(isTakeAway ? 1 : 0)).current;
  const [containerW, setContainerW] = React.useState(0);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: isTakeAway ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isTakeAway, anim]);

  const PADDING = 3; // borde interno del contenedor gris
  const pillH = height - PADDING * 2;
  const innerW = Math.max(containerW - PADDING * 2, 0);
  const segmentW = innerW / 2;

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, PADDING + segmentW],
  });

  const styles = {
    root: {opacity: disabled ? 0.6 : 1},
    container: {
      backgroundColor: colors.surfaceAlt || '#EEF0F2',
      borderRadius: height / 2,
      height,
      padding: PADDING,
      alignItems: 'center',
      justifyContent: 'center',
      width: width || 220,
      marginBottom: 30,
    },
    shadow: {
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
    pill: {
      position: 'absolute',
      top: PADDING,
      left: 0,
      width: segmentW,
      height: pillH,
      borderRadius: pillH / 2,
      backgroundColor: colors.white || '#FFF',
    },
    row: {flexDirection: 'row', width: '100%', height: '100%'},
    segment: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    txt: {
      fontFamily: font_type?.regular,
      fontSize: 14,
      color: colors.text || '#111',
    },
    txtActive: {
      fontFamily: font_type?.bold,
    },
    txtInactive: {opacity: 0.7},
  };

  const handlePressLeft = () => {
    if (disabled) return;
    if (isTakeAway) onToggle(); // solo cambia si hace falta
  };
  const handlePressRight = () => {
    if (disabled) return;
    if (!isTakeAway) onToggle();
  };

  const L = leftLabel ?? t('dine_in'); // usando traducción por defecto
  const R = rightLabel ?? t('take_away'); // usando traducción por defecto

  return (
    <View style={styles.root}>
      <View
        style={[styles.container, styles.shadow]}
        onLayout={e => setContainerW(e.nativeEvent.layout.width)}>
        {/* Pestaña blanca deslizante */}
        <Animated.View
          style={[styles.pill, styles.shadow, {transform: [{translateX}]}]}
        />

        {/* Dos mitades tocables */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.segment}
            activeOpacity={0.8}
            onPress={handlePressLeft}
            disabled={disabled}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Text
              style={[
                styles.txt,
                !isTakeAway ? styles.txtActive : styles.txtInactive,
              ]}>
              {L}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.segment}
            activeOpacity={0.8}
            onPress={handlePressRight}
            disabled={disabled}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Text
              style={[
                styles.txt,
                isTakeAway ? styles.txtActive : styles.txtInactive,
              ]}>
              {R}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TakeAwaySwitch;
