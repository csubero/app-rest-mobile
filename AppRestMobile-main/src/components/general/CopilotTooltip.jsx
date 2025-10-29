// CopilotTooltip.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import {useTheme} from '../../providers/ThemeProvider';
import {useCopilot} from 'react-native-copilot';
import {useTranslation} from 'react-i18next';
import {useDispatch} from 'react-redux';
import {setCopilotShown, setCopilotActive} from '../../redux/slice/settingsSlice';

// lee Animated.Value o number
const n = (v, d = 0) => {
  const val = v?.__getValue?.() ?? v?._value ?? v;
  const num = Number(val);
  return Number.isFinite(num) ? num : d;
};

const GAP = 12; // separación del mask

export default function CopilotTooltip() {
  const {colors, dimensions, font_type, sizes} = useTheme();
  const {width: sw, height: sh} = useWindowDimensions();
  const {width: screenWidth} = Dimensions.get('window');
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const {
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrev,
    stop: copilotStop,
    currentStep,
    labels,
  } = useCopilot();
  
  // ✨ Wrapper para stop que también actualiza Redux
  const handleStop = React.useCallback(() => {
    console.log('🛑 [CopilotTooltip] Usuario presionó Omitir/Finalizar');
    dispatch(setCopilotShown(true));
    dispatch(setCopilotActive(false));
    copilotStop();
  }, [dispatch, copilotStop]);

  const [tip, setTip] = React.useState({w: 0, h: 0});

  // área resaltada (mask)
  const px = n(currentStep?.position?.x);
  const py = n(currentStep?.position?.y);
  const sx = n(currentStep?.size?.x);
  const sy = n(currentStep?.size?.y);

  // SIEMPRE a la derecha
  let left = px + sx + GAP;
  let top = py + sy / 2 - tip.h / 2;

  // clamp sin invertir el lado
  if (left + tip.w > sw) {
    left = sw - tip.w - 8;
  }
  if (top < 8) {
    top = 8;
  }
  if (top + tip.h > sh) {
    top = sh - tip.h - 8;
  }

  const toastWidth = Math.min(500, sw * 0.5);

  const S = StyleSheet.create({
    overlay: {...StyleSheet.absoluteFillObject, pointerEvents: 'box-none'},

    // card estilo toast arriba-derecha
    card: {
      position: 'absolute',
      right: 0,
      top: 40,
      width: toastWidth,
      maxWidth: 500,
      backgroundColor: colors.background,
      borderRadius: sizes.borderRadius2,
      paddingHorizontal: 20,
      paddingVertical: 16,
      elevation: 16,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 4},
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primary,
      minHeight: 80,
      justifyContent: 'center',
    },

    text: {
      fontSize: dimensions.width * 0.015,
      fontFamily: font_type.lite,
      color: colors.text,
      textAlign: 'left',
      marginBottom: 16,
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    btn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: sizes.borderRadius,
      minWidth: 80,
      alignItems: 'center',
    },
    primary: {backgroundColor: colors.button},
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.button,
    },
    primaryTxt: {
      color: colors.white,
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
    },
    outlineTxt: {
      color: colors.button,
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
    },
    skipTxt: {
      color: colors.text,
      fontSize: dimensions.width * 0.011,
      fontFamily: font_type.regular,
    },
  });

  return (
    <View style={S.overlay} pointerEvents="box-none">
      <View
        onLayout={e =>
          setTip({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
        style={[S.card]}>
        {!!currentStep?.text && (
          <Text style={S.text}>{String(currentStep.text)}</Text>
        )}

        <View style={S.row}>
          {!isFirstStep && (
            <TouchableOpacity onPress={goToPrev} style={[S.btn, S.outline]}>
              <Text style={S.outlineTxt}>
                {labels?.previous || t('previous')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleStop} style={S.btn}>
            <Text style={S.skipTxt}>{labels?.skip || t('skip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={isLastStep ? handleStop : goToNext}
            style={[S.btn, S.primary]}>
            <Text style={S.primaryTxt}>
              {isLastStep
                ? labels?.finish || t('finish')
                : labels?.next || t('next')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
