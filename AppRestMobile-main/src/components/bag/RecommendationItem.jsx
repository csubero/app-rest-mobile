/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import InstantImage from '../products/InstantImage';
import Utils from '../../helpers/utils/Utils';

const RecommendationItem = React.memo(
  ({
    product,
    index,
    styles,
    companySelected,
    language,
    colors,
    font_type,
    sizes,
    dimensions,
    t,
    onNavigate,
  }) => {
    const handleNavigateToDetail = () => {
      console.log('🔄 [RecommendationItem] Navegando a detalle:', product.sku);
      // 🚀 OPTIMIZACIÓN: Obtener producto completo desde ProductService
      const ProductService = require('../../services/api/ProductService').default;
      const fullProduct = ProductService.getProductBySku(product.sku);
      
      onNavigate('ProductDetail', {
        product: fullProduct || product, // Producto completo o fallback al limitado
        productSku: product.sku, // Mantener SKU como fallback
        isRecomendation: true,
      });
    };

    const productName =
      language === 'es' ? product.name_es : product.name_en || product.name_es;

    return (
      <View key={index} style={styles.productItem}>
        <View style={styles.productImageContainer}>
          <InstantImage
            source={{
              uri: product.image_url ||
              companySelected.settings.icon_default_food_url
            }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.productInfo}>
          <View style={styles.nameContainer}>
            <Text
              style={[
                styles.productName,
                {flexShrink: 1, flexWrap: 'wrap', minWidth: 0},
              ]}
              textBreakStrategy="balanced">
              {productName}
            </Text>

            <Text style={styles.productPrice}>
              {Utils.formatCurrency(product.full_price, product.currency || 'CRC')}
            </Text>
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={handleNavigateToDetail}
              style={{
                backgroundColor: colors.button,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: sizes.borderRadius,
              }}>
              <Text
                style={{
                  fontFamily: font_type.semibold,
                  fontSize: dimensions.width * 0.012,
                  color: colors.white,
                }}>
                {t('add_to_order')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

export default RecommendationItem;
