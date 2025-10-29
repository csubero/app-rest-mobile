// src/redux/slice/bagSlice.js
import 'react-native-get-random-values';
import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from '@reduxjs/toolkit';
import {v4 as uuidv4} from 'uuid';
import Utils from '../../helpers/utils/Utils';
import {STATUS, PAYMENT_STATUS} from '../../helpers/utils/OrderUtils';

/** Adapter para products (clave = internalId) */
const productsAdapter = createEntityAdapter({
  selectId: p => p.internalId,
});

const emptyProductsState = productsAdapter.getInitialState();

const initialBag = {
  products: emptyProductsState, // entities + ids
  subTotal: 0,
  totalBag: 0,
  totalDiscount: 0,
  totalTaxes: 0,
  promotions: [],
};

const initialState = {
  clientName: '',
  orderType: '',
  loyaltyInfo: null,
  paymentType: null,
  totalReedemPoints: 0,
  orderConfirmed: false,
  orderConfirmedApiId: null,
  orderConfirmedApiExternalId: null,
  isOrderEmpty: true,
  lastLineItem: 1,
  tableNumber: null,
  waiterCalled: false,
  hasOrderNotifications: false,
  tableAttendedModal: {
    visible: false,
    message: '',
    title: '',
    timestamp: null,
  },
  numberOfDinersFromOrder: null,
  shouldReconnectSockets: true, // Controla si los sockets deben reconectarse
  // Estados de conexión de sockets
  socketConnections: {
    order: {
      connected: false,
      connecting: false,
      lastAttempt: null,
    },
    table: {
      connected: false,
      connecting: false,
      lastAttempt: null,
    },
    tablet: {
      connected: false,
      connecting: false,
      lastAttempt: null,
    },
  },
  bag: {...initialBag},
};

export const bagSlice = createSlice({
  name: 'bag',
  initialState,
  reducers: {
    // Agregar producto con defaults e internalId
    addProduct: {
      prepare(product) {
        const slim = {
          sku: product.sku,
          name_es: product.name_es,
          name_en: product.name_en,
          image_url: product.image_url ?? null,
          price: product.price,
          taxRate: product.taxRate ?? product.tax_rate ?? 0,
          currency: product.currency,
          quantity: product.quantity ?? 1,
          totalLine:
            product.totalLine ?? product.price * (product.quantity ?? 1),
          isTakeAway: product.isTakeAway ?? false, // Campo para llevar

          customizations: (product.customizations ?? []).map(m => ({
            codigo_modificador: m.codigo_modificador,
            codigo_articulo: m.codigo_modificador,
            descripcion: m.descripcion ?? m.description,
            description: m.description,
            precio: m.precio,
            price_with_taxes: m.price_with_taxes,
            cantidad: m.cantidad,
            modifier_id: m.modifier_id,
            // 🆕 Incluir nested customizations si existen
            ...(m.nested_customizations && {
              nested_customizations: m.nested_customizations.map(nested => ({
                codigo_modificador: nested.codigo_modificador,
                codigo_articulo: nested.codigo_articulo,
                descripcion: nested.descripcion ?? nested.description,
                description: nested.description,
                precio: nested.precio,
                price_with_taxes: nested.price_with_taxes,
                cantidad: nested.cantidad,
                modifier_id: nested.modifier_id,
              })),
            }),
          })),

          // sólo lo mínimo para recomendados por ítem
          recommended_products: (product.recommended_products ?? [])
            .slice(0, 3)
            .map(r => ({
              sku: r.sku,
              name_es: r.name_es,
              name_en: r.name_en,
              image_url: r.image_url ?? null,
              price: r.price,
              currency: r.currency,
            })),
        };

        return {
          payload: {
            ...slim,
            internalId: product?.internalId ?? uuidv4(),
            status_payment: PAYMENT_STATUS.PENDIENTE,
            status_preparation: STATUS.ENVIADO,
          },
        };
      },
      reducer(state, action) {
        productsAdapter.addOne(state.bag.products, action.payload);
      },
    },

    updateProductByIndex(state, action) {
      const {index, product} = action.payload;
      const id = state.bag.products.ids[index];
      if (!id) {
        return;
      }

      const changes = {
        sku: product.sku,
        name_es: product.name_es,
        name_en: product.name_en,
        image_url: product.image_url ?? null,
        price: product.price,
        taxRate: product.taxRate ?? product.tax_rate ?? 0,
        currency: product.currency,
        quantity: product.quantity,
        totalLine: product.totalLine,
        isTakeAway: product.isTakeAway ?? false, // Campo para llevar

        customizations: (product.customizations ?? []).map(m => ({
          codigo_modificador: m.codigo_modificador,
          codigo_articulo: m.codigo_modificador,
          descripcion: m.descripcion ?? m.description,
          description: m.description,
          precio: m.precio,
          price_with_taxes: m.price_with_taxes,
          cantidad: m.cantidad,
          modifier_id: m.modifier_id,
          // 🆕 Incluir nested customizations si existen
          ...(m.nested_customizations && {
            nested_customizations: m.nested_customizations.map(nested => ({
              codigo_modificador: nested.codigo_modificador,
              codigo_articulo: nested.codigo_articulo,
              descripcion: nested.descripcion ?? nested.description,
              description: nested.description,
              precio: nested.precio,
              price_with_taxes: nested.price_with_taxes,
              cantidad: nested.cantidad,
              modifier_id: nested.modifier_id,
            })),
          }),
        })),

        recommended_products: (product.recommended_products ?? [])
          .slice(0, 5)
          .map(r => ({
            sku: r.sku,
            name_es: r.name_es,
            name_en: r.name_en,
            image_url: r.image_url ?? null,
            price: r.price,
            currency: r.currency,
          })),
      };

      productsAdapter.updateOne(state.bag.products, {id, changes});
    },

    // Eliminar por internalId
    removeProductById(state, action) {
      productsAdapter.removeOne(state.bag.products, action.payload);
    },

    // Compat: eliminar por índice
    removeProductByIndex(state, action) {
      const idx = action.payload;
      const id = state.bag.products.ids[idx];
      if (id) {
        productsAdapter.removeOne(state.bag.products, id);
      }
    },

    // Confirmar: limpiar bolsa y marcar orden confirmada
    confirmProducts(state) {
      state.bag = {...initialBag, products: productsAdapter.getInitialState()};
      state.orderConfirmed = true;
      state.hasOrderNotifications = false;
    },

    // Limpiar TODO
    clearBag(state) {
      state.bag = {...initialBag, products: productsAdapter.getInitialState()};
      state.clientName = '';
      state.orderType = '';
      state.loyaltyInfo = null;
      state.paymentType = null;
      state.totalReedemPoints = 0;
      state.orderConfirmed = false;
      state.orderConfirmedApiId = null;
      state.hasOrderNotifications = false;
      state.orderConfirmedApiExternalId = null;
      state.isOrderEmpty = true; // Restablecer cuando se limpia la bolsa
      state.waiterCalled = false;
      state.tableNumber = null;
      state.numberOfDinersFromOrder = null;
      state.shouldReconnectSockets = true; // Restablecer reconexión cuando inicia nueva orden
    },

    // Limpiar solo bolsa
    clearBagOnly(state) {
      state.bag = {...initialBag, products: productsAdapter.getInitialState()};
    },

    // Promociones (si afectan totales, el selector las usa)
    setPromotions(state, action) {
      state.bag.promotions = action.payload;
    },

    // Mantengo por compatibilidad (idealmente no usar si derives totales)
    setTotalBag(state, action) {
      state.bag.totalBag += action.payload;
    },

    setLoyaltyInfo(state, action) {
      state.loyaltyInfo = action.payload;
    },

    setOrderConfirmed(state, action) {
      state.orderConfirmed = action.payload;
      if (action.payload === true) {
        state.hasOrderNotifications = false;
      }
    },
    setOrderConfirmedApiId(state, action) {
      state.orderConfirmedApiId = action.payload;
    },
    setOrderConfirmedApiExternalId(state, action) {
      state.orderConfirmedApiExternalId = action.payload;
    },

    setIsOrderEmpty(state, action) {
      state.isOrderEmpty = action.payload;
    },

    setWaiterCalled(state, action) {
      state.waiterCalled = action.payload;
    },

    showTableAttendedModal(state, action) {
      state.tableAttendedModal = {
        visible: true,
        message: action.payload?.message || '',
        title: action.payload?.title || '',
        timestamp: Date.now(),
      };
      state.waiterCalled = false;
    },
    hideTableAttendedModal(state) {
      state.tableAttendedModal = {
        visible: false,
        message: '',
        title: '',
        timestamp: null,
      };
    },

    setHasOrderNotifications(state, action) {
      state.hasOrderNotifications = action.payload;
    },
    clearOrderNotifications(state) {
      state.hasOrderNotifications = false;
    },

    clearNumberOfDinersFromOrder(state) {
      state.numberOfDinersFromOrder = null;
    },

    // Controlar reconexión de sockets
    disableSocketReconnection(state) {
      state.shouldReconnectSockets = false;
    },

    enableSocketReconnection(state) {
      state.shouldReconnectSockets = true;
    },

    // Estados de conexión de sockets
    setSocketConnecting(state, action) {
      const {socketType} = action.payload;
      if (state.socketConnections[socketType]) {
        state.socketConnections[socketType].connecting = true;
        state.socketConnections[socketType].connected = false;
        state.socketConnections[socketType].lastAttempt =
          new Date().toISOString();
      }
    },

    setSocketConnected(state, action) {
      const {socketType} = action.payload;
      if (state.socketConnections[socketType]) {
        state.socketConnections[socketType].connected = true;
        state.socketConnections[socketType].connecting = false;
      }
    },

    setSocketDisconnected(state, action) {
      const {socketType} = action.payload;
      if (state.socketConnections[socketType]) {
        state.socketConnections[socketType].connected = false;
        state.socketConnections[socketType].connecting = false;
      }
    },

    // Resetear todos los estados de sockets
    resetAllSocketConnections(state) {
      Object.keys(state.socketConnections).forEach(socketType => {
        state.socketConnections[socketType] = {
          connected: false,
          connecting: false,
          lastAttempt: null,
        };
      });
    },
  },
});

export default bagSlice.reducer;

/* ---------- Actions ---------- */
export const {
  addProduct,
  updateProductByIndex,
  removeProductById,
  removeProductByIndex,
  confirmProducts,
  clearBag,
  clearBagOnly,
  setPromotions,
  setTotalBag,
  setLoyaltyInfo,
  setOrderConfirmed,
  setOrderConfirmedApiId,
  setOrderConfirmedApiExternalId,
  setIsOrderEmpty,
  setWaiterCalled,
  showTableAttendedModal,
  hideTableAttendedModal,
  setHasOrderNotifications,
  clearOrderNotifications,
  clearNumberOfDinersFromOrder,
  disableSocketReconnection,
  enableSocketReconnection,
  setSocketConnecting,
  setSocketConnected,
  setSocketDisconnected,
  resetAllSocketConnections,
} = bagSlice.actions;

/* ---------- Selectores ---------- */
// Base
const selectEntityState = state => state.bag.bag.products;

// Entity selectors
export const productsSelectors =
  productsAdapter.getSelectors(selectEntityState);

// 🚀 OPTIMIZACIÓN: Selectores más eficientes para productos
export const selectProductsOptimized = createSelector(
  [selectEntityState],
  (entityState) => {
    // Retornar directamente los IDs y entities para evitar recrear arrays
    return {
      ids: entityState.ids,
      entities: entityState.entities,
      products: entityState.ids.map(id => entityState.entities[id])
    };
  }
);

export const selectProductsCount = createSelector(
  [selectEntityState],
  (entityState) => entityState.ids.length
);

// 🚀 OPTIMIZACIÓN: Selector para producto individual por internalId
export const selectProductById = createSelector(
  [selectEntityState, (state, internalId) => internalId],
  (entityState, internalId) => entityState.entities[internalId]
);

// 🚀 OPTIMIZACIÓN: Selector memoizado para productos con metadatos
export const selectProductsWithMetadata = createSelector(
  [selectEntityState],
  (entityState) => {
    const products = entityState.ids.map(id => entityState.entities[id]);
    return {
      products,
      count: products.length,
      hasProducts: products.length > 0,
      isEmpty: products.length === 0,
      productsByInternalId: entityState.entities,
      skus: new Set(products.map(p => p.sku))
    };
  }
);

// 🚀 OPTIMIZACIÓN: Totales con memoización más eficiente
export const selectTotals = createSelector(
  [selectEntityState, state => state.bag.bag.promotions],
  (entityState, promotions) => {
    // Evitar crear array completo si no es necesario
    const products = entityState.ids.map(id => entityState.entities[id]);
    return Utils.calculateTotals(products, promotions);
  },
);

export const selectSubTotal = createSelector([selectTotals], t => t.subTotal);
export const selectTotalBag = createSelector([selectTotals], t => t.totalBag);
export const selectTotalDiscount = createSelector(
  [selectTotals],
  t => t.totalDiscount,
);
export const selectTotalTaxes = createSelector(
  [selectTotals],
  t => t.totalTaxes,
);

// 🚀 OPTIMIZACIÓN CRÍTICA: Selector memoizado para cantidad total de productos
// Evita que IndexView se re-renderice por cambios en productos individuales
export const selectTotalQuantity = createSelector(
  [selectEntityState],
  (entityState) => {
    return entityState.ids.reduce((total, id) => {
      const product = entityState.entities[id];
      return total + (product?.quantity || 0);
    }, 0);
  }
);

