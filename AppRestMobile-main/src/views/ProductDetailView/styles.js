import {StyleSheet} from 'react-native';

const createStyles = ({
  commonStyles,
  colors,
  dimensions,
  font_type,
  sizes,
  withOpacity,
}) =>
  StyleSheet.create({
    ...commonStyles,

    backButton: {
      zIndex: 20,
      position: 'absolute',
      top: 0,
      left: 5,
      padding: 10,
    },

    // Botón de regresar personalizado
    customBackButton: {
      position: 'absolute',
      top: 40,
      left: 25,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#CCCCCC',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    customBackButtonDisabled: {
      opacity: 0.5,
    },

    // Toggle para llevar (usando estilos de TableView)
    toggleButton: {
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: sizes.borderRadius,
      paddingVertical: 10,
      paddingHorizontal: 0,
      minWidth: dimensions.width * 0.3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toggleButtonDisabled: {
      borderColor: colors.disabled || '#CCCCCC',
      backgroundColor: colors.background || '#F5F5F5',
      opacity: 0.5,
    },
    toggleButtonText: {
      color: colors.text,
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.semibold,
      textAlign: 'center',
    },
    toggleButtonTextActive: {
      color: colors.white,
    },

    productInfoContainer: {
      width: '100%',
      padding: 5,
      paddingHorizontal: 10,
      alignItems: 'center',
    },

    iconDefault: {
      width: dimensions.width * 0.4,
      height: dimensions.width * 0.09,
      objectFit: 'contain',
      borderRadius: 5,
      borderWidth: 1,
      marginBottom: dimensions.width * 0.015,
    },

    productName: {
      fontSize: dimensions.width * 0.05,
      // fontWeight: 'bold',
      color: colors.text,
      fontFamily: font_type.regular,
    },

    productDescription: {
      width: '100%',
      fontSize: dimensions.width * 0.015,
      color: colors.text,
      fontFamily: font_type.regular,
      paddingHorizontal: 20,
      textAlign: 'center',
      marginBottom: 10,
    },

    productPrice: {
      fontSize: dimensions.width * 0.035,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },

    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '98%',
      gap: 10,
      paddingHorizontal: 10,
      paddingBottom: 20,
      backgroundColor: colors.white,
    },

    container2: {
      width: '100%',
      alignItems: 'center',
      // backgroundColor: colors.text,
    },

    scrollViewContainer: {
      flexGrow: 1,
      width: '100%',
      paddingHorizontal: 12,
      paddingVertical: 20,
      alignItems: 'center',
    },

    fullHeight: {
      height: dimensions.height / 2.1,
    },

    absoluteButton: {
      position: 'relative',
      top: dimensions.height / 2.6,
    },

    customizationSection: {
      marginBottom: 6,
      width: '100%',
      marginTop: 6,
    },

    productImage: {
      width: '100%',
      height: dimensions.height * 0.4,
      objectFit: 'contain',
      marginVertical: 15,
      marginTop: 40,
    },

    sizesContainer: {
      width: '100%',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
    },

    sizeItem: {
      width: '30%',
      padding: 15,
      marginBottom: 15,
      borderRadius: sizes.borderRadius2,
      borderWidth: 1,
      borderColor: colors.text,
      alignItems: 'center',
    },

    sizeText: {
      fontSize: dimensions.width * 0.04,
      color: '#000',
    },

    sizeItemSelected: {
      borderColor: colors.text,
      backgroundColor: colors.text,
      borderWidth: 3,
    },

    modifiersContainer: {
      width: '100%',
      gap: 6,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'start',
    },

    modifierItem: {
      width: '23%',
      padding: 5,
      borderRadius: dimensions.width * 0.01,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignItems: 'center',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },

    modifierItem2: {
      width: '23%',
      padding: 10,
      paddingBottom: 20,
      borderRadius: dimensions.width * 0.01,
      alignItems: 'center',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },

    modifierTitle: {
      fontSize: dimensions.width * 0.010,
      fontFamily: font_type.lite,
      color: colors.text,
      textAlign: 'center',
    },

    modifierTitleBtn: {
      fontSize: dimensions.width * 0.018,
      color: colors.text,
      paddingVertical: 5,
      fontFamily: font_type.lite,
      width: '100%',
      textAlign: 'center',
      borderRadius: sizes.borderRadius,
      marginTop: 10,
    },

    modifierPrice: {
      color: colors.text,
      fontFamily: font_type.lite,
      fontSize: dimensions.width * 0.010,
      textAlign: 'center',
    },

    modifierItemSelected: {
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.text,
      position: 'relative',
    },

    // Estilos para el círculo radio button
    radioButtonContainer: {
      position: 'absolute',
      top: 4,
      right: 4,
      zIndex: 10,
    },

    radioButtonOuter: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: '#E0E0E0',
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonOuterSelected: {
      borderColor: colors.text,
    },
    radioButtonInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.text,
    },

    actionContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '100%',
      padding: dimensions.width * 0.01,
      paddingVertical: 20,
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },

    counterText: {
      fontSize: dimensions.width * 0.015,
      color: colors.text,
      fontFamily: font_type.bold,
    },

    customizationTitle: {
      fontSize: dimensions.width * 0.013,
      fontFamily: font_type.bold,
      color: colors.text,
      marginBottom: dimensions.height * 0.006,
      marginTop: 6,
    },

    customizationSubtitle: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.lite,
      color: colors.text,
      marginBottom: 8,
      marginTop: -6,
    },

    priceTag: {
      fontFamily: font_type.lite,
      fontSize: dimensions.width * 0.016,
      color: colors.text,
      marginBottom: dimensions.height * 0.05,
    },

    requiredAsterisk: {
      color: '#FF0000',
      fontWeight: 'bold',
    },

    requiredBadge: {
      backgroundColor: colors.white,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: sizes.borderRadius,
      borderWidth: 1,
      borderColor: colors.primary,
      alignSelf: 'flex-start',
      marginLeft: 8,
    },

    requiredBadgeText: {
      color: colors.primary,
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
    },

    // 🎨 Estilos para badge inválido (colores invertidos)
    requiredBadgeInvalid: {
      backgroundColor: colors.primary, // Invertido: fondo con color primario
      borderColor: colors.white, // Invertido: borde blanco
    },

    requiredBadgeTextInvalid: {
      color: colors.white, // Invertido: texto blanco
    },



    // Checkbox para llevar
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      // marginTop: 30,
      marginBottom: 30,
    },
    checkboxBox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 3,
    },
    checkboxBoxActive: {
      backgroundColor: colors.primary,
    },
    checkboxText: {
      fontSize: dimensions.width * 0.014,
      color: colors.text,
      fontFamily: font_type.regular,
    },
    checkboxCheck: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },

    // Estilos para botones
    centerButtonContainer: {
      flex: 1,
      alignItems: 'center',
    },
    rightButtonContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: dimensions.width * 0.04,
    },
    leftButtonContainer: {
      flex: 1,
      alignItems: 'flex-start',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    buttonTextUppercase: {
      // textTransform removed to allow custom formatting
    },
    loadingButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    totalPriceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
    },
    verticalDivider: {
      width: 1,
      height: dimensions.height * 0.05,
      backgroundColor: '#ccc',
      marginRight: 20,
    },
    totalText: {
      fontFamily: font_type.semibold,
      fontSize: dimensions.width * 0.02,
      color: colors.text,
    },

    // Overlay de loading
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      zIndex: 1000,
    },

    // Estilos para Category Groups
    categoryGroupsContainer: {
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 2,
    },
    categoryGroupsTitle: {
      fontSize: dimensions.width * 0.02,
      fontFamily: font_type.bold,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: 0.5,
      opacity: 0.9,
    },
    categoryGroupItem: {
      backgroundColor: colors.white,
      borderRadius: sizes.borderRadius + 4,
      padding: 16,
      marginBottom: 6,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withOpacity(colors.gray || '#e0e0e0', 0.3),
      position: 'relative',
      overflow: 'hidden',
    },
    categoryGroupContent: {
      flex: 1,
      paddingRight: 12,
    },
    categoryGroupName: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.semibold,
      color: colors.text,
      marginBottom: 6,
      lineHeight: dimensions.width * 0.017,
    },
    categoryGroupCount: {
      fontSize: dimensions.width * 0.015,
      fontFamily: font_type.regular,
      color: colors.gray || '#666',
      opacity: 0.8,
    },
    categoryGroupArrow: {
      fontSize: dimensions.width * 0.020,
      color: colors.primary || colors.button,
      fontFamily: font_type.bold,
      opacity: 0.7,
    },
    categoryGroupHeader: {
      backgroundColor: colors.white,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray || '#f0f0f0',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    backToCategoryButton: {
      padding: 10,
      marginRight: 15,
    },
    backToCategoryButtonText: {
      fontSize: dimensions.width * 0.018,
      fontFamily: font_type.semibold,
      color: colors.primary || colors.button,
    },
    selectedCategoryTitle: {
      fontSize: dimensions.width * 0.022,
      fontFamily: font_type.bold,
      color: colors.text,
      flex: 1,
    },

    // Estilos para indicadores de selección - Solo badge
    categoryGroupItemSelected: {
      // Sin cambios visuales, solo para identificación
    },
    categoryGroupNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 5,
      width: '100%',
    },
    categoryGroupNameSelected: {
      // Sin cambios de color, mantener original
    },
    categoryGroupCountSelected: {
      // Sin cambios de color, mantener original
    },
    categoryGroupArrowSelected: {
      // Sin cambios de color, mantener original
    },
    selectionIndicator: {
      backgroundColor: colors.primary || colors.button,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      shadowColor: colors.primary || colors.button,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    selectionIndicatorText: {
      color: colors.white,
      fontSize: dimensions.width * 0.013,
      fontFamily: font_type.bold,
      textAlign: 'center',
    },

    // Elementos visuales simplificados
    categoryGroupTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    // Estilos para acordeón
    accordionContainer: {
      marginBottom: 8,
    },
    accordionContent: {
      backgroundColor: withOpacity(colors.gray || '#f5f5f5', 0.3),
      borderBottomLeftRadius: sizes.borderRadius + 4,
      borderBottomRightRadius: sizes.borderRadius + 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: -4,
      overflow: 'hidden',
    },
    accordionContentHidden: {
      height: 0,
      paddingVertical: 0,
      marginTop: 0,
    },
    categoryGroupArrowExpanded: {
      // Sin rotación para chevrons verticales
    },

    // Estilos para Category Groups expandidos por defecto
    expandedCategoryGroup: {
      width: '100%',
      marginBottom: 16,
      paddingHorizontal: 0,
    },
    expandedGroupTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      marginBottom: 4,
      marginTop: 8,
    },
    expandedGroupCounter: {
      backgroundColor: colors.text,
      borderRadius: 32,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    expandedGroupCounterText: {
      color: colors.white,
      fontSize: dimensions.width * 0.018,
      fontWeight: 'bold',
    },
    expandedGroupTitle: {
      fontSize: dimensions.width * 0.020,
      fontFamily: font_type.semibold,
      color: '#000000',
      marginBottom: 0,
      marginTop: 0,
      textAlign: 'left',
      paddingHorizontal: 0,
      flex: 1,
    },
    expandToggleIcon: {
      paddingLeft: 10,
      paddingRight: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expandToggleText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
      color: colors.white,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: sizes.borderRadius,
      borderWidth: 1,
      borderColor: colors.white,
      textAlign: 'center',
      overflow: 'hidden',
    },
    customHeaderBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: sizes.borderRadius,
      marginLeft: 10,
    },
    customHeaderBadgeText: {
      fontSize: dimensions.width * 0.012,
      fontFamily: font_type.semibold,
      color: colors.white,
      textAlign: 'center',
    },
    expandedGroupSubtitle: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
      color: colors.text,
      opacity: 0.6,
      marginBottom: 10,
      paddingHorizontal: 12,
    },
    expandedGroupScrollContainer: {
      maxHeight: dimensions.height * 0.5, // Limitar altura al 50% de la pantalla
    },
    expandedGroupScrollContainerLast: {
      // Para el último grupo: altura total menos header, título y footer
      // Header (~100px) + Título del grupo (~60px) + Footer (~100px) = ~260px
      maxHeight: dimensions.height - 260,
    },
    expandedCustomizationSection: {
      marginBottom: 16,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    expandedCustomizationTitle: {
      fontSize: dimensions.width * 0.017,
      fontFamily: font_type.semibold,
      color: '#000000',
      marginBottom: 4,
      paddingHorizontal: 12,
    },
    expandedCustomizationSubtitle: {
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.regular,
      color: colors.text,
      opacity: 0.5,
      marginBottom: 10,
      paddingHorizontal: 12,
    },
    expandedModifiersContainer: {
      marginTop: 0,
      paddingHorizontal: 0,
    },

    // Estilos para lista de modifiers con radio buttons
    listModifierItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      backgroundColor: 'transparent',
    },
    listModifierItemDisabled: {
      backgroundColor: 'transparent',
    },
    radioButtonContainer: {
      marginLeft: 12,
    },
    radioButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.gray || '#CCC',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    radioButtonSelected: {
      borderColor: colors.primary || '#007AFF',
      backgroundColor: 'transparent',
    },
    radioButtonInner: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primary || '#007AFF',
    },
    listModifierContent: {
      flex: 1,
      justifyContent: 'center',
    },
    listModifierName: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
      color: '#000000',
      marginBottom: 4,
    },
    listModifierNameSelected: {
      fontFamily: font_type.semibold,
      color: '#000000',
    },
    listModifierPrice: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
      color: '#CCC',
    },
    listModifierPriceSelected: {
      fontFamily: font_type.semibold,
      color: '#CCC',
    },
    
    // 🆕 Estilos para imágenes en vista lista
    listModifierImageContainer: {
      width: 60,
      height: 60,
      marginRight: 12,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    listModifierImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    listModifierContentWithImage: {
      flex: 1,
      justifyContent: 'center',
    },
    
    // 🆕 Estilos para Grid de modificadores
    modifierGridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      paddingHorizontal: 0,
    },
    
    listQuantityContainer: {
      marginRight: 8,
    },

    // Estilos para checkbox (selección múltiple con max 1)
    checkboxContainer: {
      marginLeft: 12,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.gray || '#CCC',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    checkboxSelected: {
      borderColor: colors.primary || '#007AFF',
      backgroundColor: colors.primary || '#007AFF',
    },
    checkboxCheck: {
      color: '#FFFFFF',
      fontSize: dimensions.width * 0.015,
      fontFamily: font_type.bold,
      lineHeight: 25,
      textAlign: 'center',
      marginTop: -2,
    },

    // Estilos para botón + individual (cuando no hay selección en picker)
    addButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background || '#F5F5F5',
      borderWidth: 2,
      borderColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: dimensions.width * 0.017,
      color: "#000000",
      lineHeight: 27,
      textAlign: 'center',
      marginTop: -1,
    },

    // 🆕 Estilos para indicador de opciones anidadas
    listModifierItemWithNested: {
      borderRightWidth: 4,
      borderRightColor: colors.primary || '#007AFF',
    },
    nestedIndicatorButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // 🆕 Estilos para la vista deslizante de customizaciones anidadas
    // Siguiendo el mismo patrón de diseño del componente principal
    nestedViewContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 90, // Deja espacio para el actionContainer (padding + altura)
      width: '50%',
      backgroundColor: '#FFFFFF',
      borderLeftWidth: 1,
      borderLeftColor: '#E0E0E0',
      zIndex: 1000,
    },
    nestedViewHeader: {
      paddingTop: 16,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      backgroundColor: '#F8F8F8',
    },
    nestedBackButton: {
      paddingRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nestedHeaderContent: {
      flex: 1,
    },
    nestedTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    nestedTitleContent: {
      flex: 1,
    },
    nestedViewContent: {
      flex: 1,
    },
    // Nota: Los estilos de los ítems de la lista nested (listModifierItem, listModifierContent, etc.)
    // se reutilizan del componente principal para mantener consistencia visual

    // 🆕 Estilos para customizaciones anidadas inline (deprecado - se mantiene por compatibilidad)
    nestedCustomizationsContainer: {
      marginLeft: 30,
      marginTop: 8,
      marginBottom: 12,
      paddingLeft: 16,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary || '#007AFF',
      backgroundColor: withOpacity(colors.primary || '#007AFF', 0.05),
      borderRadius: 8,
      paddingVertical: 12,
      paddingRight: 12,
    },
    nestedCustomizationGroup: {
      marginBottom: 12,
    },
    nestedCustomizationTitle: {
      fontSize: dimensions.width * 0.013,
      fontFamily: font_type.semibold,
      color: colors.primary || '#007AFF',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    nestedModifierItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 6,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    nestedModifierItemSelected: {
      borderColor: colors.primary || '#007AFF',
      backgroundColor: withOpacity(colors.primary || '#007AFF', 0.08),
    },
    nestedModifierName: {
      fontSize: dimensions.width * 0.0125,
      fontFamily: font_type.regular,
      color: '#333333',
    },
    nestedModifierNameSelected: {
      fontFamily: font_type.semibold,
      color: colors.primary || '#007AFF',
    },
    nestedModifierPrice: {
      fontSize: dimensions.width * 0.0125,
      fontFamily: font_type.regular,
      color: '#999999',
      marginTop: 2,
    },
    nestedModifierPriceSelected: {
      fontFamily: font_type.semibold,
      color: colors.primary || '#007AFF',
    },
    nestedRadioButton: {
      width: 22,
      height: 22,
    },
    nestedCheckbox: {
      width: 22,
      height: 22,
    },
    
    // Estilos para sección de recomendaciones
    recommendationsSection: {
      marginTop: 40,
      marginBottom: 40,
      paddingHorizontal: 0,
    },
    recommendationsTitle: {
      fontSize: dimensions.width * 0.017,
      fontFamily: font_type.semibold,
      color: '#000000',
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    recommendationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      width: '100%',
    },
    recommendationThumb: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: '#f5f5f5',
    },
    recommendationInfo: {
      flex: 1,
      marginLeft: 16,
      marginRight: 16,
    },
    recommendationName: {
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
      color: '#000000',
      marginBottom: 4,
    },
    recommendationPrice: {
      fontSize: dimensions.width * 0.013,
      fontFamily: font_type.regular,
      color: '#999999',
    },
    recommendationAddButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primary || '#007AFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendationAddButtonText: {
      fontSize: dimensions.width * 0.017,
      color: '#FFFFFF',
      lineHeight: 27,
      fontFamily: font_type.semibold,
    },
    
    // 🎠 CAROUSEL: Estilos para vista carousel de modificadores
    carouselContainer: {
      paddingVertical: dimensions.height * 0.008,
      paddingHorizontal: dimensions.width * 0.025,
    },
    
    // 🆕 Estilo específico para carousel (con margen horizontal)
    modifierCardCarousel: {
      width: dimensions.width * 0.15,
      marginRight: dimensions.width * 0.015,
      backgroundColor: '#FFFFFF',
      borderRadius: dimensions.width * 0.012,
      borderWidth: 2,
      borderColor: '#E0E0E0',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    // 🆕 Estilo específico para grid (sin margen, con padding horizontal y flexWrap)
    modifierCard: {
      width: '30%', // 🔧 Reducido a 30% para caber más items
      marginRight: dimensions.width * 0.006,
      marginLeft: dimensions.width * 0.006,
      marginBottom: dimensions.width * 0.012,
      backgroundColor: '#FFFFFF',
      borderRadius: dimensions.width * 0.012,
      borderWidth: 2,
      borderColor: '#E0E0E0',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modifierCardSelected: {
      borderColor: colors.primary,
      borderWidth: 3,
      backgroundColor: '#FFFFFF',
    },
    modifierCardImageContainer: {
      width: '100%',
      height: dimensions.height * 0.09, // 🔧 Aumentado a 0.09 (era 0.07)
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    modifierCardImage: {
      width: '100%',
      height: '100%',
    },
    modifierCardImagePlaceholder: {
      backgroundColor: colors.primary + '20',
    },
    modifierCardImagePlaceholderText: {
      fontSize: dimensions.width * 0.026, // 🔧 Reducido 25% (era 0.035)
      fontFamily: font_type.bold,
      color: colors.primary,
    },
    modifierCardContent: {
      padding: dimensions.width * 0.002,
      minHeight: dimensions.height * 0.05,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    // 🆕 Estilo para cards sin imagen (solo texto)
    modifierCardContentNoImage: {
      padding: dimensions.width * 0.003,
      minHeight: dimensions.height * 0.07,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    modifierCardName: {
      fontSize: dimensions.width * 0.008, // 🔧 Muy pequeño
      fontFamily: font_type.regular,
      color: '#000000',
      marginBottom: dimensions.height * 0.001,
      lineHeight: dimensions.width * 0.009,
      textAlign: 'center',
    },
    modifierCardPrice: {
      fontSize: dimensions.width * 0.0075, // 🔧 Muy pequeño
      fontFamily: font_type.regular,
      color: '#666666',
      marginTop: 0,
      textAlign: 'center',
    },
    modifierCardNestedInfo: {
      marginTop: dimensions.height * 0.004,
      paddingTop: dimensions.height * 0.003,
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
    },
    modifierCardNestedText: {
      fontSize: dimensions.width * 0.011,
      fontFamily: font_type.regular,
      color: '#999999',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    modifierCardCheckbox: {
      width: dimensions.width * 0.025,
      height: dimensions.width * 0.025,
      borderRadius: dimensions.width * 0.0125,
      borderWidth: 2,
      borderColor: '#CCCCCC',
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: dimensions.height * 0.005,
    },
    modifierCardCheckboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modifierCardCheckboxIcon: {
      fontSize: dimensions.width * 0.015,
      color: '#FFFFFF',
      fontFamily: font_type.bold,
    },
    
    // 🆕 Estilos para controles de selección en cards (grid)
    cardRadioButtonContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    cardRadioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#CCC',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    cardRadioButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: 'transparent',
    },
    cardRadioButtonInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    cardCheckboxContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    cardCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#CCC',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    cardCheckboxSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    cardCheckboxCheck: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: font_type.bold,
      textAlign: 'center',
    },
    cardQuantityContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    cardAddButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardAddButtonText: {
      fontSize: 16,
      color: '#000000',
      fontFamily: font_type.bold,
      textAlign: 'center',
    },
    cardNestedIndicatorButton: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 12,
      padding: 4,
    },
  });

export default createStyles;
