/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import InstantImage from '../products/InstantImage';
import Utils from '../../helpers/utils/Utils';
import ProductQuantityPickerWithTrash from './ProductQuantityPickerWithTrash';
import {
  PAYMENT_STATUS,
  STATUS_TRANSLATION_KEYS,
  STATUS_COLORS,
} from '../../helpers/utils/OrderUtils';

const ProductItem = React.memo(
  ({
    product,
    index,
    isEditable,
    styles,
    companySelected,
    language,
    t,
    colors,
    localQuantity, // 🚀 NUEVO: cantidad local optimizada
    onSetQuantity,
    onEdit,
    onRemove,
  }) => {
    // 🚀 OPTIMIZACIÓN: Calcular valores solo si hay cantidad local
    const displayQuantity = localQuantity ?? product.quantity;
    
    // 🔥 FIX: Calcular displayTotalLine incluyendo modificadores e impuestos
    const displayTotalLine = React.useMemo(() => {
      if (!localQuantity) {
        return product.totalLine; // Si no hay cantidad local, usar el valor de Redux
      }
      
      // Calcular precio base
      const basePrice = product.price || 0;
      
      // Calcular total de modificadores (incluyendo nested)
      let modifiersTotal = 0;
      if (product.customizations && Array.isArray(product.customizations)) {
        product.customizations.forEach(modifier => {
          modifiersTotal += (modifier.precio || 0) * (modifier.cantidad || 0);
          
          // Sumar nested customizations
          if (modifier.nested_customizations && Array.isArray(modifier.nested_customizations)) {
            modifier.nested_customizations.forEach(nested => {
              modifiersTotal += (nested.precio || 0) * (nested.cantidad || 0);
            });
          }
        });
      }
      
      // Subtotal antes de impuestos
      const subtotalBeforeTax = (basePrice + modifiersTotal) * localQuantity;
      
      // Calcular impuestos
      const taxRate = product.taxRate || 0;
      const taxes = subtotalBeforeTax * (taxRate / 100);
      
      // Total con impuestos
      return subtotalBeforeTax + taxes;
    }, [localQuantity, product.price, product.totalLine, product.customizations, product.taxRate]);
    
    // SOLUCIÓN INTELIGENTE: Usar imagen del producto si está disponible, sino usar mapeo por SKU
    const getImageBySku = (sku) => {
      // Prioridad 1: Usar la imagen del producto si está disponible
      if (product.image_url) {
        return product.image_url;
      }
      
      // Prioridad 2: Mapeo de SKUs a imágenes específicas (usando URLs que existen)
      const skuImageMap = {
        'V296': 'https://arh-rest.s3.amazonaws.com/brands/icon_default_food/Hamburguesas.png', // THREE CHEESE BURGER
        'V071': 'https://arh-rest.s3.amazonaws.com/brands/icon_default_food/Hamburguesas.png', // SANDWICH DE POLLO CHIPOTLE
        'V139': 'https://arh-rest.s3.amazonaws.com/brands/icon_default_food/Hamburguesas.png', // COCA COLA ZERO
        'V008': 'https://arh-rest.s3.amazonaws.com/brands/icon_default_food/Hamburguesas.png', // Smoke House Doble
        'V052': 'https://arh-rest.s3.amazonaws.com/brands/icon_default_food/Hamburguesas.png', // GINGER ALE
      };
      
      const mappedImage = skuImageMap[sku];
      if (mappedImage) {
        return mappedImage;
      }
      
      // Prioridad 3: Imagen por defecto
      return companySelected.settings.icon_default_food_url;
    };

    const smartImageUrl = getImageBySku(product.sku);
    const handleSetQuantity = quantity => {
      console.log(`🔧 [ProductItem] handleSetQuantity called:`, {
        index,
        productId: product.internalId,
        sku: product.sku,
        oldQuantity: product.quantity,
        displayQuantity, // ← Cantidad REAL mostrada
        newQuantity: quantity,
        localQuantity
      });
      
      // 🔥 FIX: Crear producto con la cantidad ACTUAL mostrada (displayQuantity)
      // para que el hook compare correctamente
      const productWithCurrentQuantity = {
        ...product,
        quantity: displayQuantity // ← Usar la cantidad LOCAL, no Redux
      };
      
      onSetQuantity(index, productWithCurrentQuantity, quantity);
    };

    const handleRemoveFromPicker = () => {
      onRemove(product, index);
    };

    const handleEdit = () => {
      onEdit(product, index);
    };

    // Customizations con nested incluidos
    const customizations =
      product.customizations?.length === 0 || !product.customizations
        ? null
        : product.customizations.map((customization, idx) => (
            <Text key={`main-${idx}`} style={styles.customization}>
              {Utils.formatTextCapitalized(
                language === 'es'
                  ? customization.descripcion
                  : customization.description
              )}{' '}
              x{customization.cantidad}:{' '}
              {Utils.formatCurrency(
                customization.price_with_taxes * customization.cantidad,
                customization.currency || product.currency || 'CRC',
              )}
              {/* Nested customizations dentro del mismo Text */}
              {customization.nested_customizations?.map((nested, nestedIdx) => (
                <Text key={`nested-${idx}-${nestedIdx}`} style={styles.nestedCustomization}>
                  {'\n  '}• {Utils.formatTextCapitalized(
                    language === 'es' ? nested.descripcion : nested.description
                  )}{' '}
                  x{nested.cantidad}:{' '}
                  {Utils.formatCurrency(
                    nested.price_with_taxes * nested.cantidad,
                    nested.currency || product.currency || 'CRC',
                  )}
                </Text>
              ))}
            </Text>
          ));

    // Discount info - Mostrar información de descuento si existe
    const hasDiscount =
      product.discount_amount > 0 || product.discount_percentage > 0;
    const discountInfo = hasDiscount ? (
      <Text style={styles.discountInfo}>
        {product.discount_type_name && `${product.discount_type_name}: `}
        {product.discount_percentage > 0
          ? `${product.discount_percentage}% desc.`
          : `${Utils.formatCurrency(
              product.discount_amount || 0,
              product.currency || 'CRC',
            )} desc.`}
      </Text>
    ) : null;

    const priceWithoutDiscount =
      hasDiscount && !isEditable ? (
        <Text style={styles.originalPrice}>
          {Utils.formatCurrency(
            product.subtotal_taxed,
            product.currency || 'CRC',
          )}
        </Text>
      ) : null;

    const productName =
      language === 'es' ? product.name_es : product.name_en || product.name_es;

    return (
      <View
        style={[
          styles.productItem,
          (product.status_payment === PAYMENT_STATUS.PAGADO ||
            product.isCanceled) && {
            opacity: 0.4,
          },
        ]}>
        <View style={styles.productImageContainer}>
          {isEditable ? (
            <TouchableOpacity onPress={handleEdit} style={styles.imageButton}>
              <InstantImage
                source={{
                  uri: smartImageUrl
                }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <InstantImage
              source={{
                uri: smartImageUrl
              }}
              style={styles.productImage}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={styles.productInfo}>
          <View style={styles.nameContainer}>
            {!isEditable && (
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor:
                      STATUS_COLORS[product.status_preparation] || '#6c757d',
                  },
                ]}>
                <Text style={[styles.statusText, {color: 'white'}]}>
                  {t(
                    STATUS_TRANSLATION_KEYS[product.status_preparation] ||
                      'status.unknown',
                  )}
                </Text>
                {product.status_payment === PAYMENT_STATUS.PAGADO && (
                  <View style={styles.checkMark}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </View>
            )}

            <Text
              style={[
                styles.productName,
                {flexShrink: 1, flexWrap: 'wrap', minWidth: 0},
              ]}
              textBreakStrategy="balanced">
              {productName} x{displayQuantity}
            </Text>
            {customizations}
            {discountInfo}
            {isEditable ? (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.productPrice}>
                  {Utils.formatCurrency(
                    displayTotalLine,
                    product.currency || 'CRC',
                  )}
                </Text>
                {(product.isTakeAway || product.to_go) && (
                  <View style={[styles.statusTag2]}>
                    <Text
                      style={[styles.statusText, {color: colors.secondary}]}>
                      * {t('take_away')}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: -18,
                }}>
                {(product.isTakeAway || product.to_go) && (
                  <View style={[styles.statusTag2]}>
                    <Text
                      style={[styles.statusText, {color: colors.secondary}]}>
                      * {t('take_away')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {isEditable ? (
            <View style={styles.quantityContainer}>
              <ProductQuantityPickerWithTrash
                quantity={displayQuantity}
                setQuantity={handleSetQuantity}
                onRemove={handleRemoveFromPicker}
                inline
              />
              <View style={styles.actionsUnderPicker}>
                <TouchableOpacity
                  onPress={handleEdit}
                  style={styles.iconButton}>
                  <Text style={{color: colors.secondary}}>{t('edit_btn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.quantityContainer}>
              {priceWithoutDiscount}
              <Text style={styles.productPrice}>
                {Utils.formatCurrency(
                  displayTotalLine,
                  product.currency || 'CRC',
                )}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  },
  // 🚀 OPTIMIZACIÓN CRÍTICA: Comparación más específica para evitar re-renders innecesarios
  // Solo comparamos props que realmente afectan el render, ignorando funciones y objetos estables
  (prevProps, nextProps) => {
    const prev = prevProps.product;
    const next = nextProps.product;
    
    // Comparación rápida de propiedades críticas del producto
    if (prev.internalId !== next.internalId) return false;
    if (prev.id !== next.id) return false;
    if (prev.quantity !== next.quantity) return false;
    if (prev.totalLine !== next.totalLine) return false;
    if (prev.status_preparation !== next.status_preparation) return false;
    if (prev.status_payment !== next.status_payment) return false;
    
    // Props del componente
    if (prevProps.isEditable !== nextProps.isEditable) return false;
    if (prevProps.index !== nextProps.index) return false;
    if (prevProps.localQuantity !== nextProps.localQuantity) return false; // 🚀 NUEVO
    
    // Props de theme - usar shallow comparison ya que vienen de useMemo
    if (prevProps.colors !== nextProps.colors) return false;
    if (prevProps.dimensions !== nextProps.dimensions) return false;
    if (prevProps.font_type !== nextProps.font_type) return false;
    
    // Comparar customizations si están presentes
    if (prev.customizations?.length !== next.customizations?.length) return false;
    
    // NO comparamos callbacks (onSetQuantity, onEdit, onRemove) ya que están memoizados
    // NO comparamos styles, language, t, companySelected, sizes ya que son estables
    
    return true;
  }
);

export default ProductItem;
