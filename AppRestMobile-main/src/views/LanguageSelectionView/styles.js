import {StyleSheet} from 'react-native';

const createStyles = ({colors, font_type, sizes}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    image: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      paddingTop: '44%',
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // Se agrega un fondo negro con opacidad
    },
    title: {
      fontSize: 30,
      fontFamily: font_type.semibold,
      color: colors.white,
      textAlign: 'center',
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    button: {
      backgroundColor: colors.button,
      paddingVertical: 12,
      paddingHorizontal: 80,
      borderRadius: sizes.borderRadius,
      marginHorizontal: 10,
    },
    buttonDisabled: {
      backgroundColor:  colors.white,
    },
    buttonText: {
      color: colors.white,
      fontSize: 20,
      fontFamily: font_type.lite,
    },
    buttonTextDisabled: {
      color: colors.text,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 8,
    },
    connectionText: {
      color: colors.white,
      fontSize: 14,
      fontFamily: font_type.lite,
      marginLeft: 10,
    },
    backButton: {
      position: 'absolute',
      top: 30,
      left: 20,
      zIndex: 2,
      // backgroundColor: '#00000088',
      padding: 10,
      borderRadius: 50,
    },
    orderIdContainer: {
      position: 'absolute',
      top: 30,
      right: 20,
      zIndex: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    orderIdText: {
      color: colors.white,
      fontSize: 16,
      fontFamily: font_type.semibold,
    },
    loaderContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.white,
      zIndex: 1,
    },
    loaderText: {
      marginTop: 10,
      fontSize: 16,
      color: colors.primary,
      fontFamily: font_type.lite,
    },
  });

export default createStyles;
