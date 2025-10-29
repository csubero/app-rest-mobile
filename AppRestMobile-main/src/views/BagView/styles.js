import {StyleSheet} from 'react-native';

const createStyles = ({colors, sizes, font_type, dimensions, commonStyles}) =>
  StyleSheet.create({
    ...commonStyles,

    productsContainer: {
      width: '100%',
      paddingHorizontal: sizes.padding,
      marginTop: 20,
      marginBottom: 20,
      minHeight: 120, // Altura mínima para evitar saltos visuales
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      backgroundColor: colors.background || colors.white,
      borderRadius: sizes.borderRadius || 8,
      marginHorizontal: 10,
    },

    loadingText: {
      marginTop: 15,
      fontSize: dimensions.width * 0.014,
      color: colors.text,
      fontFamily: font_type.regular,
      textAlign: 'center',
    },

    productItem: {
      flexDirection: 'row',
      marginBottom: 15,
      marginHorizontal: sizes.padding,
      justifyContent: 'center',
      alignItems: 'center',
    },

    totalName: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.regular,
      color: colors.text,
    },

    productImageContainer: {
      width: '25%',
      padding: 5,
      height: dimensions.height * 0.25,
      overflow: 'hidden',
      borderRadius: sizes.borderRadius,
    },

    productImage: {
      width: '85%',
      height: '85%',
      marginLeft: 20,
      marginTop: 10,
      objectFit: 'contain',
    },

    imageButton: {
      width: '85%',
      height: '85%',
      justifyContent: 'center',
      alignItems: 'center',
    },

    productInfo: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },

    nameContainer: {
      flex: 1,
    },

    quantityContainer: {
      paddingTop: 35,
      alignItems: 'center',
      width: 200,
      paddingRight: 60,
    },

    actionsUnderPicker: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
      gap: 10,
    },

    iconButton: {
      padding: 8,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 36,
      minHeight: 36,
    },

    productPrice: {
      fontSize: dimensions.width * 0.017,
      color: colors.secondary,
      fontFamily: font_type.semibold,
      marginTop: 12,
    },

    productActions: {
      marginTop: 15,
      marginBottom: 10,
    },

    productName: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.semibold,
      color: colors.text,
      maxWidth: dimensions.width * 0.95,
      minWidth: dimensions.width * 0.5,
      marginBottom: 8,
    },

    takeAwayIcon: {
      fontSize: dimensions.width * 0.015,
      color: colors.primary,
    },

    productTotal: {
      fontSize: dimensions.width * 0.017,
      color: colors.secondary,
      fontFamily: font_type.semibold,
      marginRight: '18%',
    },

    actionContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      paddingVertical: 16,
      zIndex: 100,
      marginHorizontal: -10,
    },

    customization: {
      fontFamily: font_type.lite,
      fontSize: dimensions.width * 0.01,
      color: '#5e5e5eff',
    },

    nestedCustomization: {
      fontFamily: font_type.lite,
      fontSize: dimensions.width * 0.009,
      color: '#7e7e7eff',
      marginLeft: 15,
      fontStyle: 'italic',
    },

    discountInfo: {
      fontFamily: font_type.lite,
      fontSize: dimensions.width * 0.012,
      color: colors.secondary,
      fontStyle: 'italic',
      marginTop: 2,
    },

    originalPrice: {
      fontSize: dimensions.width * 0.017,
      color: colors.gray || '#6c757d',
      fontFamily: font_type.regular,
      textDecorationLine: 'line-through',
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginTop: 15,
      marginBottom: 5,
      paddingLeft: dimensions.width * 0.05,
      paddingRight: dimensions.width * 0.08,
    },

    sectionTitle: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.semibold,
      color: colors.text,
    },

    sectionSubtitle: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.lite,
      color: colors.text,
    },

    editText: {
      color: colors.secondary,
      fontSize: dimensions.width * 0.018,
    },

    statusTag: {
      width: '20%',
      backgroundColor: '#eee',
      borderRadius: sizes.borderRadius,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginBottom: 8,
    },

    statusTag2: {
      width: '20%',
      borderRadius: sizes.borderRadius,
      marginTop: 15,
    },

    statusText: {
      fontSize: 16,
      fontFamily: font_type.semibold,
      textAlign: 'center',
    },

    checkMark: {
      position: 'absolute',
      top: 3,
      left: 120,
      backgroundColor: 'green',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'white',
      zIndex: 10,
    },

    checkMark2: {
      position: 'absolute',
      left: 120,
      backgroundColor: 'green',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'white',
      zIndex: 10,
    },

    checkText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },

    // 🚀 Estilos para recomendaciones
    recommendationsContainer: {
      width: '100%',
      paddingHorizontal: sizes.padding,
      marginTop: 10,
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 15,
    },

    recommendationsSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginTop: 15,
      marginBottom: 10,
      paddingHorizontal: dimensions.width * 0.05,
    },

    recommendationsSectionTitle: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.semibold,
      color: colors.text,
      textAlign: 'center',
    },
  });

export default createStyles;
