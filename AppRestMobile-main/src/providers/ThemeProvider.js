import React, {createContext, useContext, useEffect, useState, useMemo} from 'react';
import {Dimensions} from 'react-native';
import {store} from '../redux/store';

const defaultColors = {
  primary: '#d01240',
  secondary: '#0267AA',
  accent: '#EDAB30',
  text: '#707070',
  border: '#ccc',
  background: '#fff',
  error: '#E0081A',
  button: '#0267AA',
  buttonText: '#FFFF',
  white: '#FFFFFF',
};

const defaultFontFamilies = {
  regular: 'MerloRegular',
  lite: 'MerloLite',
  bold: 'MerloBold',
  semibold: 'MerloSemiBold',
};
const defaultFonts = {
  small: 16,
  medium: 24,
  large: 28,
  extralarge: 32,
};
const defaultSizes = {
  padding: 12,
  borderRadius: 30,
  borderRadius2: 8,
  cardRadius: 16,
  borderRadiusInputs: 12,
  // borderRadiusInputs: 12,
};
const defaultDimensions = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};

const ThemeContext = createContext();

// 🚀 OPTIMIZACIÓN: Función utilitaria fuera del componente (no se recrea)
const withOpacity = (hex, opacity) => {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
};

export const ThemeProvider = ({children}) => {
  const [colors, setColors] = useState(defaultColors);
  const [font_type, setFontType] = useState(defaultFontFamilies);
  const [fonts, setFonts] = useState(defaultFonts);
  const [sizes, setSizes] = useState(defaultSizes);
  const [dimensions, setDimensions] = useState(defaultDimensions);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const {companySelected} = store.getState().company;

      // console.log(companySelected.settings);
      if (companySelected) {
        setColors({
          primary:
            companySelected?.settings?.primary_color || defaultColors.primary,
          secondary:
            companySelected?.settings?.secondary_color ||
            defaultColors.secondary,
          accent:
            companySelected?.settings?.accent_color || defaultColors.accent,
          text: companySelected?.settings?.text_color || defaultColors.text,
          border:
            companySelected?.settings?.border_color || defaultColors.border,
          background:
            companySelected?.settings?.background_color ||
            defaultColors.background,
          error: companySelected?.settings?.error_color || defaultColors.error,
          // button: defaultColors.button,
          button:
            companySelected?.settings?.button_color || defaultColors.button,
          buttonText:
            companySelected?.settings?.button_text_color ||
            defaultColors.buttonText,
          white: defaultColors.white,
        });

        setFontType({
          regular:
            companySelected?.settings?.font_family_body ||
            defaultFontFamilies.regular,
          lite:
            companySelected?.settings?.font_family_button ||
            defaultFontFamilies.lite,
          bold:
            companySelected?.settings?.font_family_title ||
            defaultFontFamilies.bold,
          semibold:
            companySelected?.settings?.font_family_subtitle ||
            defaultFontFamilies.semibold,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 🚀 OPTIMIZACIÓN CRÍTICA: Memoizar el objeto theme completo
  // Evita re-renders en cascada de TODOS los componentes que usan useTheme()
  const theme = useMemo(() => ({
    colors,
    font_type,
    fonts,
    sizes,
    dimensions,
    withOpacity,
    commonStyles: {
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
      },
      centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: sizes.padding,
        width: '80%',
      },
      button: {
        padding: sizes.padding,
        borderRadius: sizes.borderRadius,
        alignItems: 'center',
      },
      buttonText: {
        fontWeight: 'bold',
        fontSize: dimensions.width * 0.025,
        textAlign: 'center',
      },
      input: {
        width: dimensions.width * 0.85,
        height: dimensions.height * 0.075,
        borderColor: colors.text,
        borderWidth: 1,
        marginBottom: 10,
        marginTop: 10,
        paddingHorizontal: 15,
        borderRadius: sizes.borderRadius2,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        color: colors.text,
        fontSize: fonts.medium,
        fontFamily: font_type.regular,
      },
      inputsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '80%',
      },
      title: {
        color: colors.text,
        fontSize: fonts.large,
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 20,
        fontFamily: font_type.regular,
      },
      title_h1: {
        color: colors.text,
        fontSize: fonts.extralarge,
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 10,
        fontFamily: font_type.regular,
      },
      title_h3: {
        color: colors.text,
        fontSize: fonts.medium,
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 10,
        fontFamily: font_type.regular,
      },
      subtitle: {
        color: colors.text,
        fontSize: fonts.medium,
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
      },
      subtitle_h4: {
        color: colors.text,
        fontSize: fonts.small,
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
      },
      error_message: {
        fontSize: fonts.small,
        textAlign: 'center',
        marginBottom: 20,
        color: colors.error,
        marginTop: 10,
      },
      alert_message: {
        fontSize: fonts.medium,
        textAlign: 'center',
        marginBottom: 20,
        color: colors.primary,
        marginTop: 10,
      },
      simpleButton: {
        minWidth: dimensions.width * 0.4,
        padding: 10,
        marginBottom: 5,
        borderRadius: sizes.borderRadius,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        marginLeft: '42%',
      },
      simpleButtonText: {
        color: colors.text,
        fontFamily: font_type.regular,
        fontSize: dimensions.width * 0.015,
        textAlign: 'center',
      },
      primaryButton: {
        minWidth: dimensions.width * 0.15,
        backgroundColor: colors.button,
        padding: sizes.padding,
        borderRadius: sizes.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
      },
      primaryButtonText: {
        color: colors.white,
        fontFamily: font_type.regular,
        fontSize: dimensions.width * 0.012,
        textAlign: 'center',
      },
      primaryButton2: {
        minWidth: dimensions.width * 0.15,
        backgroundColor: colors.secondary,
        padding: sizes.padding,
        borderRadius: sizes.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
      },
      primaryButton2Text: {
        color: colors.white,
        fontFamily: font_type.regular,
        fontSize: dimensions.width * 0.012,
        textAlign: 'center',
      },
      secondaryButton: {
        minWidth: dimensions.width * 0.15,
        backgroundColor: colors.text,
        padding: sizes.padding,
        borderRadius: sizes.borderRadius,
        borderWidth: 1,
        borderColor: colors.text,
        alignItems: 'center',
        justifyContent: 'center',
      },
      secondaryButtonText: {
        color: colors.white,
        fontFamily: font_type.lite,
        fontSize: dimensions.width * 0.012,
        textAlign: 'center',
      },
      secondaryButtonOutline: {
        minWidth: dimensions.width * 0.2,
        backgroundColor: colors.secondary,
        padding: sizes.padding,
        borderRadius: sizes.borderRadius2,
        borderWidth: 1,
        borderColor: colors.secondary,
        alignItems: 'center',
        // marginTop: 20,
        justifyContent: 'center',
      },
      secondaryButtonTextOutline: {
        color: colors.white,
        fontFamily: font_type.regular,
        fontSize: dimensions.width * 0.012,
        textAlign: 'center',
      },
      thirdButton: {
        minWidth: dimensions.width * 0.33,
        backgroundColor: colors.background,
        padding: sizes.padding,
        borderRadius: sizes.borderRadius2,
        alignItems: 'center',
        justifyContent: 'center',
      },
      thirdButtonText: {
        color: colors.text,
        fontSize: dimensions.width * 0.025,
        textAlign: 'center',
        fontFamily: font_type.regular,
      },
      fourthButton: {
        minWidth: dimensions.width * 0.33,
        backgroundColor: colors.primary,
        padding: 5,
        borderRadius: sizes.borderRadius2,
        alignItems: 'center',
        justifyContent: 'center',
      },
      fourthButtonText: {
        color: colors.white,
        fontSize: dimensions.width * 0.025,
        textAlign: 'center',
        fontFamily: font_type.regular,
        width: '100%',
      },

      thirdButtonOutline: {
        minWidth: dimensions.width * 0.33,
        backgroundColor: colors.background,
        borderColor: colors.text,
        borderWidth: 1,
        padding: sizes.padding,
        borderRadius: sizes.borderRadius2,
        alignItems: 'center',
      },
      thirdButtonOutlineText: {
        color: colors.text,
        fontSize: dimensions.width * 0.025,
        textAlign: 'center',
        fontFamily: font_type.regular,
      },
      thirdButtonOutlineText2: {
        color: colors.text,
        fontSize: dimensions.width * 0.025,
        textAlign: 'center',
        fontFamily: font_type.lite,
      },
      errorMessage: {
        color: colors.error,
        fontSize: dimensions.width * 0.025,
        textAlign: 'center',
        fontFamily: font_type.lite,
      },
      scrollViewContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
      },
      backButton: {
        zIndex: 20,
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 10,
      },
      buttonDisabled: {
        backgroundColor: '#ccc',
      },
    },
  }), [colors, font_type, fonts, sizes, dimensions]); // Solo se recrea cuando cambian estos valores

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
