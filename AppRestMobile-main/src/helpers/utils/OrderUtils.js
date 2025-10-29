import {
  setPaidSplits,
  setTotalSplitAmount,
  setSplitCount,
  setIsSplit,
  setSplitType,
  blockSplits,
} from '../../redux/slice/paymentFlowSlice';

export const ORDER_EVENTS = {
  STATUS: 'order_status',
  ITEMS_UPDATED: 'order_items_updated',
  PAYMENT_INIT: 'payment_init_process',
  PAYMENT_PROCESSED: 'payment_processed',
  PAYMENT_FAILED: 'payment_failed',
  CREATE_ORDER: 'create_order',
  ORDER_PAYMENT: 'order_payment',
  ORDER_REFRESH: 'order_refresh',

  // Eventos preventivos
  CHANGED: 'order_changed',
  UPDATED: 'order_updated',
  ITEM_UPDATED: 'order_item_updated',
};

export const ORDER_DONT_REFRESH_VIEWS = ['payment', 'thankyou', 'order'];

export const STATUS = {
  ENVIADO: 1,
  PREPARACION: 2,
  PREPARADO: 3,
  CANCELADO: 4,
};

export const STATUS_COLORS = {
  [STATUS.ENVIADO]: '#007bff',
  [STATUS.PREPARACION]: '#ffc107',
  [STATUS.PREPARADO]: '#28a745',
  [STATUS.CANCELADO]: '#dc3545',
};

export const STATUS_TRANSLATION_KEYS = {
  [STATUS.ENVIADO]: 'status.sent',
  [STATUS.PREPARACION]: 'status.preparing',
  [STATUS.PREPARADO]: 'status.ready',
  [STATUS.CANCELADO]: 'status.cancelled',
};

export const PAYMENT_STATUS = {
  PENDIENTE: 1,
  PAGADO: 2,
  ANULADO: 3,
  PROCESANDO: 4, // Nuevo estado para productos en proceso de pago
};

export const mapOrderData = (rawOrderData, storeProducts) => ({
  id: rawOrderData.id,
  external_id: rawOrderData.external_id,
  total: rawOrderData.total,
  balance: rawOrderData.balance,
  discount_amount: rawOrderData.discount_amount || 0,
  discount_percentage: rawOrderData.discount_percentage || 0,
  items: (rawOrderData.items || [])
    .filter(
      item =>
        item.payment_status?.key !== 'PAGADO' &&
        item.status?.key !== 'CANCELADO',
    )
    .map(item => {
      const fullProduct = storeProducts?.find(p => p.sku === item.sku);
      return {
        id: item.id,
        sku: item.sku,
        name_es: fullProduct?.name_es || item.name,
        name_en: fullProduct?.name_en || item.name,
        image_url: fullProduct?.image_url,
        price: item.price,
        totalLine: item.total_line,
        quantity: item.quantity,
        discount_amount: item.discount || 0,
        discount_percentage: item.discount_percentage || 0,
        currency: fullProduct?.currency || 'CRC',
        taxRate: fullProduct?.tax_rate || 0,
        internalId: `api_${item.id}`,
        db_id: item.id,
        status_payment: item.payment_status?.key,
        customizations: (item.modifiers || []).map(modifier => ({
          codigo_modificador: modifier.modifier_id,
          descripcion: modifier.name,
          precio: modifier.price,
          cantidad: modifier.quantity,
          currency: fullProduct?.currency || 'CRC',
        })),
        appliedPromotions: [],
      };
    }),
});

export const mapRefactorOrder = (order, payment, options = {}) => {
  const {
    totalAmount = 0,
    qrUrl = null,
    fallbackPrefix = 'Direct',
    paymentMethod = 'card',
  } = options;

  return {
    invoice_serial:
      payment?.client_reference_information ||
      order?.external_id ||
      `${fallbackPrefix}-${Date.now()}`,
    invoice_number: payment?.invoice?.number || order?.invoice?.number || null,
    invoice_key: payment?.invoice?.key || order?.invoice?.key || null,
    invoice_consecutive:
      payment?.invoice?.consecutive || order?.invoice?.consecutive || null,
    order_date: order?.order_date || new Date().toISOString(),
    amount: payment?.amount || totalAmount,
    transactionReference:
      payment?.transaction_number ||
      payment?.client_reference_information ||
      order?.client_reference_information ||
      `TXN-${Date.now()}`,
    payment_method: paymentMethod,
    qr_url: qrUrl,
    payment_id: payment?.id,
    authNumber: payment?.auth_number || order?.auth_number,
    invoiceNumber: payment?.invoice_number,
    orderId: order?.id,
    orderExternalId: order?.external_id,
    balanceOrder: payment?.balance_order || order?.balance_order,
    paymentExternalId: payment?.external_id || order?.external_id,
    paymentResponse: order, // opcional
  };
};

export const syncPaymentSplits = (dispatch, paymentSplit, isBlocked) => {
  if (!paymentSplit) {
    return;
  }
  const {split_count, total_split_amount, paying_splits} = paymentSplit;
  dispatch(setSplitCount(split_count || 2));
  dispatch(setTotalSplitAmount(total_split_amount || 0));
  dispatch(setPaidSplits(paying_splits || []));
  if (!isBlocked) {
    dispatch(setIsSplit(true));
    dispatch(setSplitType('equal'));
    dispatch(blockSplits());
  }
};

export const buildOrderPayload = ({
  baseBag,
  baseCompany,
  waiterData = null,
}) => {
  // console.log('baseBag: ', JSON.stringify(baseBag, null, 2));
  const detalle = baseBag.products.flatMap((product, index) => {
    // Si el producto tiene más de 1 unidad, crear múltiples filas
    const items = [];
    for (let i = 0; i < product.quantity; i++) {
      items.push({
        referencia: product.sku,
        unidades: 1, // Siempre 1 unidad por fila
        precio_bruto_unitario: product.price,
        tipo_orden: 'dine-in',
        modificadores: (product.customizations || []).map((mod, modIdx) => {
          const baseModifier = {
            numero_linea: modIdx + 1,
            codigo_modificador: mod.codigo_modificador,
            codigo_articulo: mod.codigo_modificador,
            descripcion: mod.descripcion,
            precio: mod.precio,
            unidades: mod.cantidad,
          };

          // 🆕 Incluir nested_customizations si existen
          if (mod.nested_customizations && mod.nested_customizations.length > 0) {
            baseModifier.nested_customizations = mod.nested_customizations.map((nested, nestedIdx) => ({
              numero_linea: nestedIdx + 1,
              codigo_modificador: nested.codigo_modificador,
              codigo_articulo: nested.codigo_articulo,
              descripcion: nested.descripcion,
              precio: nested.precio,
              unidades: nested.cantidad,
            }));
          }

          return baseModifier;
        }),
        descuento: null,
      });
    }
    return items;
  });

  const payload = {
    nombre_caja: baseCompany.pointOfSaleSelected.name,
    fecha: new Date().toISOString(),
    caja: baseCompany.pointOfSaleSelected.serial_code,
    serie_icg: baseCompany.pointOfSaleSelected.serial_number,
    total_neto: baseBag.totalBag,
    total_bruto: baseBag.totalBag - baseBag.totalBag * 0.13,
    mesa: baseCompany.tableData?.table?.id || null,
    numero_comensales: baseCompany.tableData?.numberOfDiners || 1,
    detalle,
  };

  // Agregar datos del mesero si están disponibles
  if (waiterData && waiterData.id && waiterData.name) {
    payload.waiter = {
      // password: waiterData.password,
      id: waiterData.id,
      name: waiterData.name,
    };
  }

  return payload;
};

export const buildUpdateOrderPayload = ({baseBag}) => {
  console.log(baseBag);
  return {
    detalle: baseBag.products.flatMap((product, index) => {
      const items = [];
      for (let i = 0; i < product.quantity; i++) {
        items.push({
          referencia: product.sku,
          unidades: 1, // Siempre 1 unidad por fila
          precio_bruto_unitario: product.price,
          to_go: product.isTakeAway || false, // Campo para llevar
          modificadores: (product.customizations || []).map((mod, modIdx) => {
            const baseModifier = {
              numero_linea: modIdx + 1,
              codigo_modificador: mod.modifier_id,
              codigo_articulo: mod.modifier_id,
              descripcion: mod.descripcion,
              precio: mod.precio,
              unidades: mod.cantidad,
            };

            // 🆕 Incluir nested_customizations si existen
            if (mod.nested_customizations && mod.nested_customizations.length > 0) {
              baseModifier.nested_customizations = mod.nested_customizations.map((nested, nestedIdx) => ({
                numero_linea: nestedIdx + 1,
                codigo_modificador: nested.codigo_modificador,
                codigo_articulo: nested.codigo_articulo,
                descripcion: nested.descripcion,
                precio: nested.precio,
                unidades: nested.cantidad,
              }));
            }

            return baseModifier;
          }),
          descuento: null,
        });
      }
      return items;
    }),
  };
};

export const buildPaymentPayloadList = payments => {
  return {
    pagos: payments.map(payment => ({
      numero_autorizacion: payment.authNumber,
      numero_factura: payment.invoiceNumber,
      numero_transaccion: payment.transactionNumber,
      monto: payment.amount,
      fecha_transaccion: payment.transactionDate,
    })),
  };
};

export const buildPaymentPayload = ({
  baseBag,
  baseCompany,
  paymentMethod,
  user,
  loyaltyCardType,
  totalPlanAmount,
  redeemPoints,
  selectedProductIds = null,
}) => {
  console.log(
    '[OrderUtils] buildPaymentPayload - paymentMethod:',
    paymentMethod,
  );
  const detalle = baseBag.products
    .filter(product => {
      console.log(
        '[OrderUtils] buildPaymentPayload - product:',
        product.customizations,
      );
      // Si hay productos seleccionados específicos, solo incluir esos
      if (selectedProductIds && selectedProductIds.length > 0) {
        return (
          selectedProductIds.includes(product.internalId) &&
          product.status_payment === PAYMENT_STATUS.PENDIENTE
        );
      }
      return product.status_payment === PAYMENT_STATUS.PENDIENTE;
    })
    .map((product, index) => ({
      referencia: product.sku,
      internalId: product.internalId,
      unidades: product.quantity,
      precio_bruto_unitario: product.price,
      order_item: product.db_id,
      to_go: product.isTakeAway || product.to_go || false, // Campo para llevar
      modificadores: (product.customizations || []).map((mod, modIdx) => {
        const baseModifier = {
          numero_linea: modIdx + 1,
          codigo_modificador: mod.codigo_modificador,
          codigo_articulo: mod.codigo_modificador,
          descripcion: mod.descripcion,
          precio: mod.precio,
          unidades: mod.cantidad,
        };

        // 🆕 Incluir nested_customizations si existen
        if (mod.nested_customizations && mod.nested_customizations.length > 0) {
          baseModifier.nested_customizations = mod.nested_customizations.map((nested, nestedIdx) => ({
            numero_linea: nestedIdx + 1,
            codigo_modificador: nested.codigo_modificador,
            codigo_articulo: nested.codigo_articulo,
            descripcion: nested.descripcion,
            precio: nested.precio,
            unidades: nested.cantidad,
          }));
        }

        return baseModifier;
      }),
      descuento: null,
    }));

  const payload = {
    nombre_cliente: baseBag.clientName,
    tipo_orden: baseBag.orderType,
    nombre_caja: baseCompany.pointOfSaleSelected.name,
    fecha: new Date().toISOString(),
    caja: baseCompany.pointOfSaleSelected.serial_code,
    serie_icg: baseCompany.pointOfSaleSelected.serial_number,
    numero_icg: 0,
    consecutivo_hacienda: '',
    clave_hacienda: '',
    total_neto: baseBag.totalBag,
    total_bruto: baseBag.totalBag - baseBag.totalTaxes,
    mesa: baseCompany.tableData.table.id,
    iva: 13,
    lealtad: {
      numero_tarjeta: paymentMethod !== 'loyalty' ? 0 : user?.card_number,
      saldo_tarjeta: paymentMethod !== 'loyalty' ? 0 : user?.balance,
      saldo_canjeado: paymentMethod !== 'loyalty' ? 0 : totalPlanAmount,
      tipo: paymentMethod !== 'loyalty' ? null : loyaltyCardType,
    },
    detalle,
  };

  if (user) {
    payload.lealtad = {
      numero_tarjeta: user.card_number,
      saldo_tarjeta: user.balance || 0,
      saldo_canjeado: totalPlanAmount || 0,
      tipo: loyaltyCardType,
    };
  }

  return payload;
};

export const buildEmptyOrderPayload = ({baseCompany, waiterData = null}) => {
  // Validaciones antes de crear la orden
  if (!baseCompany?.pointOfSaleSelected?.name) {
    throw new Error('Punto de venta no encontrado o sin nombre');
  }

  if (!baseCompany?.pointOfSaleSelected?.serial_code) {
    throw new Error('Código serial del punto de venta no encontrado');
  }

  if (!baseCompany?.tableData?.table?.id) {
    throw new Error('ID de mesa no encontrado');
  }

  // Payload mínimo para crear una orden vacía
  const payload = {
    nombre_caja: baseCompany.pointOfSaleSelected.name,
    fecha: new Date().toISOString(),
    caja: baseCompany.pointOfSaleSelected.serial_code,
    serie_icg: baseCompany.pointOfSaleSelected.serial_number || '',
    total_neto: 0,
    total_bruto: 0,
    mesa: baseCompany.tableData.table.id,
    numero_comensales: baseCompany.tableData.numberOfDiners || 1,
    detalle: [], // Sin productos inicialmente
  };

  // Agregar datos del mesero si están disponibles
  if (waiterData && waiterData.id && waiterData.name) {
    payload.waiter = {
      // password: waiterData.password,
      id: waiterData.id,
      name: waiterData.name,
    };
  }

  return payload;
};

/**
 * Calcula el total correcto según el modo de split.
 */
export const calculateCorrectTotal = ({paymentFlow, baseAmount, baseBag}) => {
  if (paymentFlow?.isSplit && paymentFlow?.splitType === 'products') {
    const ids = paymentFlow?.products?.selectedProductIds || [];
    return (baseBag?.products || []).reduce((acc, p) => {
      return ids.includes(p.internalId) ? acc + (p.totalLine || 0) : acc;
    }, 0);
  }

  if (paymentFlow?.isSplit && paymentFlow?.splitType === 'equal') {
    const splitCount = paymentFlow?.splits?.splitCount || 2;
    const selected = paymentFlow?.splits?.selectedSplits || [];
    return (splitCount > 0 ? baseAmount / splitCount : 0) * selected.length;
  }

  return baseAmount || 0;
};

/**
 * Devuelve { remaining, planAmount } para pagos con puntos.
 */
export const calculateRemainingAmount = ({user, totalAmount}) => {
  if (!user) return {remaining: 0, planAmount: 0};
  if (user.balance < (totalAmount || 0)) {
    return {
      remaining: (totalAmount || 0) - user.balance,
      planAmount: user.balance,
    };
  }
  return {remaining: 0, planAmount: totalAmount || 0};
};

/**
 * Construye el payload de splits si aplica.
 */
export const buildSplitsPayload = (paymentFlow, paymentType) => {
  if (paymentType !== 'split_equal') return null;
  const s = paymentFlow?.splits || {};
  return {
    payingSplits: s.selectedSplits,
    splitCount: s.splitCount,
    selectedSplitsCount: (s.selectedSplits || []).length,
    totalSplitAmount: s.totalSplitAmount,
  };
};

/**
 * Centraliza la construcción del contexto de lealtad.
 * Retorna { loyaltyInfo, userBalance, redeemedAmount }
 */
export const buildLoyaltyContext = ({
  usePoints,
  user,
  isAccumulatingPoints,
  accumulateUser,
  totalPlanAmount,
  totalAmount,
}) => {
  // Redeem points
  if (usePoints && user) {
    return {
      loyaltyInfo: {
        redeem: true,
        numero_tarjeta: user.card_number,
        cardNumber: user.card_number,
        userId: user.id,
        clientName: user.name || user.client_name,
        pointsToRedeem: totalPlanAmount,
        totalOrderAmount: totalAmount,
      },
      userBalance: user.balance,
      redeemedAmount: totalPlanAmount,
    };
  }

  // Accumulate points
  if (isAccumulatingPoints && accumulateUser) {
    return {
      loyaltyInfo: {
        accumulate: true,
        userId: accumulateUser.id,
        cardNumber: accumulateUser.card_number,
        numero_tarjeta: accumulateUser.card_number,
        clientName: accumulateUser.name || accumulateUser.client_name,
        totalOrderAmount: totalAmount,
      },
      userBalance: accumulateUser.balance,
      redeemedAmount: 0,
    };
  }

  return {loyaltyInfo: null, userBalance: null, redeemedAmount: 0};
};

// Mapea *toda* la orden (encabezado + items), sin filtrar paid/cancelled.
// Ideal para BagView.
// helpers/utils/OrderUtils.js (agrega esto)
export const mapOrderDetailsForBag = (rawOrderData, storeProducts) => {
  return {
  id: rawOrderData.id,
  order_date: rawOrderData.order_date,
  external_id: rawOrderData.external_id,
  status: rawOrderData.status,
  source: rawOrderData.source,
  store: rawOrderData.store,
  table: rawOrderData.table,
  point_of_sale: rawOrderData.point_of_sale,
  total: rawOrderData.total,
  balance: rawOrderData.balance,
  discount_type_id: rawOrderData.discount_type_id,
  discount_type_name: rawOrderData.discount_type_name,
  discount_percentage: rawOrderData.discount_percentage || 0,
  discount_amount: rawOrderData.discount_amount || 0,
  payments: rawOrderData.payments || [],
  invoices: rawOrderData.invoices || [],
  items: (rawOrderData.items || []).map(item => {
    // 🔍 BÚSQUEDA ROBUSTA DE PRODUCTOS
    let fullProduct = storeProducts?.find(p => p.sku === item.sku);
    
    // Si no se encuentra por SKU exacto, intentar búsqueda parcial
    if (!fullProduct && storeProducts?.length > 0) {
      const partialMatches = storeProducts.filter(p => 
        p.sku && item.sku && (
          p.sku.includes(item.sku) || 
          item.sku.includes(p.sku) ||
          p.sku.toLowerCase().includes(item.sku.toLowerCase()) ||
          item.sku.toLowerCase().includes(p.sku.toLowerCase())
        )
      );
      
      if (partialMatches.length > 0) {
        fullProduct = partialMatches[0];
      }
    }
    
    return {
      id: item.id,
      line: item.line,
      sku: item.sku,
      name_es: fullProduct?.name_es || item.name,
      name_en: fullProduct?.name_en || item.name,
      image_url: fullProduct?.image_url,
      price: item.price,
      total: item.total,
      total_line: item.total_line,
      totalLine: item.total_line,
      full_price: item.full_price,
      subtotal_taxed: item.subtotal_taxed,
      quantity: item.quantity,
      discount: item.discount || 0,
      discount_amount: item.discount || 0,
      discount_type_id: item.discount_type_id,
      discount_type_name: item.discount_type_name,
      discount_percentage: item.discount_percentage || 0,
      status_preparation: item.status?.key ?? STATUS.ENVIADO,
      status_payment: item.payment_status?.key ?? PAYMENT_STATUS.PENDIENTE,
      customizations: (item.modifiers || []).map(modifier => ({
        codigo_modificador: modifier.modifier_id,
        codigo_articulo: modifier.modifier_id,
        descripcion: modifier.name_es ?? modifier.name,
        description: modifier.name_en || modifier.name_es || modifier.name,
        precio: modifier.price,
        cantidad: modifier.quantity,
        total: modifier.total,
        currency: fullProduct?.currency || 'CRC',
      })),
      internalId: `api_${item.id}`,
      db_id: item.id,
      currency: fullProduct?.currency || 'CRC',
      taxRate: fullProduct?.tax_rate || 0,
      to_go: item.to_go || false,
    };
  }),
  };
};
