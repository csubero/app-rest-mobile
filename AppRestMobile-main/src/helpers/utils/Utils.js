import {PAYMENT_STATUS} from './OrderUtils';

const Utils = {
  formatCurrency: (value, currency) => {
    // Validar y establecer moneda por defecto si no está definida
    const validCurrency =
      currency && typeof currency === 'string' ? currency : 'CRC';

    // Validar que value sea un número
    const validValue = typeof value === 'number' && !isNaN(value) ? value : 0;

    try {
      return validValue.toLocaleString('es-CR', {
        style: 'currency',
        currency: validCurrency,
        currencyDisplay: 'symbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch (error) {
      console.warn('Error formatting currency:', error);
      // Fallback: formato simple si falla la localización
      return `₡${validValue.toFixed(0)}`;
    }
  },
  calculatePriceWithTaxes: (price, taxRate) => {
    // return Math.round(price + (price * (taxRate / 100)), 3);
    return price + price * (taxRate / 100);
  },
  calculatePendingTotals: products => {
    const unpaid = products.filter(
      p => p.status_payment === PAYMENT_STATUS.PENDIENTE,
    );
    return Utils.calculateTotals(unpaid);
  },
  calculateProductTotal: (index, product, quantity) => {
    // Precio base del producto
    const basePrice = product.price || product.fullPrice || 0;

    // Calcular total de modificadores
    let modifiersTotal = 0;
    if (product.customizations && Array.isArray(product.customizations)) {
      product.customizations.forEach(modifier => {
        modifiersTotal += (modifier.precio || 0) * (modifier.cantidad || 0);
      });
    }

    // Calcular subtotal antes de impuestos
    const subtotalBeforeTax = (basePrice + modifiersTotal) * quantity;

    // Calcular impuestos
    const taxRate = product.taxRate || 0;
    const taxes = subtotalBeforeTax * (taxRate / 100);

    // Total final
    const total = subtotalBeforeTax + taxes;

    const newProduct = {
      ...product,
      quantity: quantity,
      totalLine: total,
      totalTaxes: taxes,
    };

    const dataProduct = {
      product: newProduct,
      index: index,
    };

    return dataProduct;
  },
  clearDiscounts(products) {
    const updatedProducts = products.map((product, index) => {
      const newProduct = {...product, discount: 0, appliedPromotions: []};
      const dataProduct = this.calculateProductTotal(
        index,
        newProduct,
        newProduct.quantity,
      );

      return dataProduct.product;
    });

    return updatedProducts;
  },
  calculateTotals(products) {
    let totalBag = 0;
    let totalTaxes = 0;
    let subTotal = 0;

    totalBag = products.reduce(
      (acc, productUpdate) => acc + productUpdate.totalLine,
      0,
    );
    totalTaxes = products.reduce(
      (acc, productUpdate) => acc + productUpdate.totalTaxes,
      0,
    );
    subTotal = products.reduce(
      (acc, productUpdate) =>
        acc + productUpdate.price * productUpdate.quantity,
      0,
    );

    subTotal = totalBag - totalTaxes;

    return {
      totalBag,
      totalDiscount: 0,
      totalTaxes,
      subTotal,
    };
  },
  concatWords(headers, maxLength) {
    const totalHeaderLength = headers.reduce(
      (sum, header) => sum + header.length,
      0,
    );
    const totalSpaces = maxLength - totalHeaderLength;
    const spacesBetweenHeaders = Math.floor(totalSpaces / (headers.length - 1));
    const extraSpaces = totalSpaces % (headers.length - 1);

    let result = headers[0];

    // Add headers with calculated spaces in between
    for (let i = 1; i < headers.length; i++) {
      let spaces = spacesBetweenHeaders + (i <= extraSpaces ? 1 : 0); // Distribute any extra spaces
      result += ' '.repeat(spaces) + headers[i];
    }

    return result;
  },
  maskEmail(email) {
    const emailParts = email.split('@');
    // muestra solo los 3 primeros caracteres del email y el resto se reemplaza por *
    const maskedEmail =
      emailParts[0].substring(0, 3) + '*******@' + emailParts[1];
    return maskedEmail;
  },
  getFirstNameAndLastName(str) {
    let parts = str.replace('.', '').trim().split(/\s+/);

    let firstName = '';
    let lastName = '';

    firstName = parts[0];

    switch (parts.length) {
      case 1:
        break;
      case 2:
        lastName = parts[1];
        break;
      case (3, 4):
        lastName = parts[2];
        break;

      default:
        lastName = parts[parts.length - 1];
        break;
    }

    return {firstName, lastName};
  },
  cleanString: str => {
    // Remove accents
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Remove special characters and emojis
    str = str.replace(/[^\w\s]/gi, '');
    return str;
  },

  roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 1000) / 1000;
  },

  generateTableInternalId(orderId, tableId) {
    // Ejemplo: tablet_order123_table5_1kg2h3_a9c7
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `tablet_order${orderId}_table${tableId}_${timestamp}_${randomStr}`;
  },

  parseTableInternalId(tableInternalId) {
    // Función para extraer información del tableInternalId si es necesario
    if (!tableInternalId || typeof tableInternalId !== 'string') {
      return null;
    }

    const match = tableInternalId.match(
      /^tablet_order(\d+)_table(\d+)_(.+)_(.+)$/,
    );
    if (match) {
      return {
        orderId: match[1],
        tableId: match[2],
        timestamp: match[3],
        randomStr: match[4],
        fullId: tableInternalId,
      };
    }

    return null;
  },

  formatTextCapitalized: (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  },
};

export default Utils;
