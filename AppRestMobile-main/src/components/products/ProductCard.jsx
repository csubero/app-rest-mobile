import React, {useMemo, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../providers/ThemeProvider';
import Utils from '../../helpers/utils/Utils';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome6';
import InstantImage from './InstantImage';

const ProductCard = React.memo(
  ({product, language, onPress, isBagBlocked = false}) => {
    // 🔍 DEBUG: Log de renders deshabilitado para reducir ruido
    // console.log(`[ProductCard] 🎨 Render - Product ${product.sku}`);
    
    const {colors, dimensions, font_type, sizes} = useTheme();
    const {t} = useTranslation();

    const active_tag = product?.tags?.[0];

    const styles = useMemo(
      () =>
        StyleSheet.create({
          card: {
            width: (dimensions.width - 80) / 5,
            backgroundColor: colors.white,
            borderRadius: sizes.cardRadius,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            padding: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexDirection: 'column',
          },
          content: {
            flex: 1,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'flex-start',
          },
          image: {
            width: '100%',
            height: 120,
            marginBottom: 20,
            marginTop: 10,
            contain: true,
          },
          name: {
            fontFamily: font_type.bold,
            fontSize: dimensions.width * 0.016,
            color: colors.primary,
            textAlign: 'center',
            marginBottom: 4,
            paddingHorizontal: 18,
            marginTop: 15,
          },
          price: {
            fontSize: dimensions.width * 0.012,
            color: '#777',
            textAlign: 'center',
            marginBottom: 20,
          },
          button: {
            backgroundColor: colors.button,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: sizes.borderRadius,
            width: '80%',
          },
          buttonText: {
            color: colors.white,
            fontFamily: font_type.bold,
            fontSize: dimensions.width * 0.012,
            width: '100%',
            textAlign: 'center',
            textTransform: 'uppercase',
          },
          tag: {
            position: 'absolute',
            top: 8,
            left: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 15,
            zIndex: 10,
          },
          tagText: {
            textTransform: 'uppercase',
            fontSize: dimensions.width * 0.010,
            fontFamily: font_type.lite,
          },
          disabledCard: {
            opacity: 0.5,
          },
          disabledButton: {
            opacity: 0.5,
          },
        }),
      [colors, dimensions, font_type, sizes],
    );

    let imageUrl = 'https://placehold.co/950x950.png';

    const productName =
      language === 'es' ? product.name_es : product.name_en || product.name_es;

    const fromText =
      product.customizations?.length > 0
        ? language === 'es'
          ? 'desde '
          : 'from '
        : '';

    if (product.image_url) {
      imageUrl = product.image_url;
    }

    // Función memoizada optimizada para navegación instantánea
    const handlePress = useCallback(() => {
      if (!isBagBlocked) {
        onPress(product);
      }
    }, [onPress, product, isBagBlocked]);

    return (
      <TouchableOpacity
        style={[styles.card, isBagBlocked && styles.disabledCard]}
        activeOpacity={0.6}
        onPress={handlePress}>
        {active_tag && (
          <View style={[styles.tag, {backgroundColor: active_tag.color}]}>
            <Text style={[styles.tagText, {color: active_tag.text_color}]}>
              ★ {language === 'es'
                ? active_tag.tag_label
                : active_tag.tag_label_en || active_tag.tag_label}
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <InstantImage
            source={{
              uri: imageUrl,
            }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
          />
          <Text style={styles.name}>{productName}</Text>
          <Text style={styles.price}>
            {fromText}
            {Utils.formatCurrency(product.full_price, product.currency)}
          </Text>
        </View>

        <View style={[styles.button, isBagBlocked && styles.disabledButton]}>
          <Text style={styles.buttonText}>{t('add')}</Text>
        </View>
      </TouchableOpacity>
    );
  },
  // 🚀 OPTIMIZACIÓN: Comparación profunda personalizada para evitar re-renders
  (prevProps, nextProps) => {
    // Solo re-renderizar si cambia el producto, el idioma o el estado de bloqueo
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.full_price === nextProps.product.full_price &&
      prevProps.product.image_url === nextProps.product.image_url &&
      prevProps.language === nextProps.language &&
      prevProps.isBagBlocked === nextProps.isBagBlocked &&
      prevProps.product?.tags?.[0]?.id === nextProps.product?.tags?.[0]?.id
    );
  }
);

export default ProductCard;
