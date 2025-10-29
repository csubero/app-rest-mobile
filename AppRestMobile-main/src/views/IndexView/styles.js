import {StyleSheet} from 'react-native';

const createStyles = ({
  commonStyles,
  dimensions,
  colors,
  font_type,
  withOpacity,
  sizes,
}) =>
  StyleSheet.create({
    ...commonStyles,

    page: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: '#fff',
    },

    sidebar: {
      width: dimensions.width * 0.13,
      backgroundColor: colors.white,
      alignItems: 'center',
      paddingTop: 40,
      // borderRightWidth: 1,
      // borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: {width: 5, height: 0},
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 5,
      zIndex: 9999,
    },

    content: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 35,
    },

    logo: {
      width: dimensions.width * 0.1, // Reducido del 50% al 10% para que quepa en el sidebar
      height: dimensions.height * 0.16,
      resizeMode: 'contain',
    },

    sidebarButton: {
      alignItems: 'center',
      marginVertical: 12,
      paddingVertical: 18,
      alignSelf: 'stretch',
    },

    sidebarIcon: {
      fontSize: 40,
      width: 35,
      height: 35,
      marginBottom: 5,
      color: colors.text,
    },

    sidebarText: {
      fontSize: 16,
      color: colors.text,
      fontFamily: font_type.semibold,
    },

    sidebarMenu: {
      flex: 1,
      justifyContent: 'center',
      width: '100%',
    },

    horizontalCards: {
      paddingHorizontal: 30,
      marginBottom: 0,
    },

    carouselContainer: {
      alignItems: 'center',
      position: 'relative',
    },

    carouselWrapper: {
      position: 'relative',
      width: '100%',
      alignItems: 'center',
    },

    arrowButton: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      zIndex: 10,
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },

    arrowButtonLeft: {
      left: -20,
    },

    arrowButtonRight: {
      right: 0,
    },

    arrowText: {
      fontSize: 60,
      color: withOpacity(colors.primary, 1),
      fontWeight: 'bold',
    },

    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10,
      paddingHorizontal: 30,
    },

    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: withOpacity(colors.text, 0.3),
    },

    indicatorActive: {
      backgroundColor: colors.accent || colors.primary,
    },

    sidebarButtonActive: {
      backgroundColor: withOpacity(colors.text, 0.09),
      borderRadius: sizes.borderRadius2,
    },

    sidebarButtonDisabled: {
      backgroundColor: '#e0e0e0',
      opacity: 0.6,
    },

    sidebarTextActive: {
      color: colors.text,
    },

    sidebarTextDisabled: {
      color: '#9e9e9e',
    },

    sidebarIconActive: {
      color: colors.text,
    },

    sidebarIconDisabled: {
      color: '#9e9e9e',
    },

    reminderContainer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingHorizontal: 10,
    },

    reminderText: {
      fontSize: dimensions.width * 0.01,
      fontFamily: font_type.regular,
      color: colors.secondary,
      textAlign: 'center',
    },

    reminderTimeText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
      color: colors.secondary,
      textAlign: 'center',
      marginTop: 2,
    },

    // Estilos para el botón flotante del mesero
    floatingWaiterButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: {width: -2, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    },

    floatingWaiterButtonNormal: {
      backgroundColor: colors.secondary, // Verde
    },

    floatingWaiterButtonCalling: {
      backgroundColor: colors.error, // Rojo
    },

    floatingWaiterIcon: {
      width: 30,
      height: 30,
      tintColor: colors.white,
    },
  });

export default createStyles;
