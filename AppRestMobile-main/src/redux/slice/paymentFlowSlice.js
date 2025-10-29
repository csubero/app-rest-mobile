import {createSlice} from '@reduxjs/toolkit';

const products = {
  selectedProductIds: [],
};

const splits = {
  splitCount: 2,
  selectedSplits: [],
  paidSplits: [],
  unpaidSplits: [],
  totalSplitAmount: 0,
  lastSplitTimestamp: null,
  isBlocked: false,
};

const initialState = {
  step: 0,
  isSplit: false,
  splitType: 'equal',
  splits: {...splits},
  products: {...products},
  // Nuevo estado para productos en proceso de pago
  productsInPayment: [], // Array de internalIds de productos siendo pagados
};

const paymentFlowSlice = createSlice({
  name: 'paymentFlow',
  initialState,
  reducers: {
    setPaymentStep: (state, action) => {
      state.step = action.payload;
    },
    setIsSplit: (state, action) => {
      state.isSplit = action.payload;
    },
    setSplitType: (state, action) => {
      state.splitType = action.payload;
    },
    setTotalSplitAmount: (state, action) => {
      state.splits.totalSplitAmount = action.payload;
    },
    setSelectedProductIds: (state, action) => {
      state.products.selectedProductIds = action.payload;
    },
    setSplitCount: (state, action) => {
      if (!state.splits.isBlocked) {
        state.splits.splitCount = action.payload;
      }
    },
    setSelectedSplits: (state, action) => {
      state.splits.selectedSplits = action.payload;
    },
    // Nuevos reducers para manejar el pago de splits
    markSplitAsPaid: (state, action) => {
      state.splits.selectedSplits.forEach(split => {
        const alreadyPaid = state.splits.paidSplits.includes(split);
        const stillUnpaid = state.splits.unpaidSplits.includes(split);

        if (!alreadyPaid && !stillUnpaid) {
          state.splits.paidSplits.push(split);
        }
      });

      state.splits.selectedSplits = [];
    },
    blockSplits: state => {
      state.splits.isBlocked = true;
    },
    unblockSplits: state => {
      state.splits.isBlocked = false;
    },
    setPaidSplits: (state, action) => {
      state.splits.paidSplits = action.payload;
      state.splits.unpaidSplits = Array.from(
        {length: state.splits.splitCount},
        (_, i) => i,
      ).filter(id => !action.payload.includes(id));
      state.splits.isBlocked = action.payload.length > 0;
    },

    setUnpaidSplits: (state, action) => {
      state.splits.unpaidSplits = action.payload;
    },

    initializeSplits: (state, action) => {
      const {splitCount, selectedSplits = [], paidSplits = []} = action.payload;

      state.splits.splitCount = splitCount;
      state.splits.selectedSplits = selectedSplits;
      state.splits.paidSplits = paidSplits;
      state.splits.unpaidSplits = Array.from(
        {length: splitCount},
        (_, i) => i + 1,
      ).filter(id => !paidSplits.includes(id));

      // Bloquear si ya hay splits pagados
      state.splits.isBlocked = paidSplits.length > 0;
    },
    resetPaymentFlow: state => {
      // Solo resetear si no está bloqueado por splits
      if (!state.splits.isBlocked) {
        return initialState;
      }

      state.step = 0;
      state.isSplit = true;
      state.splitType = 'equal';
      // Si está bloqueado, no hacer nada (mantener el estado actual)
      return state;
    },

    // Nuevos reducers para manejar productos en proceso de pago
    setProductsInPayment: (state, action) => {
      state.productsInPayment = action.payload;
    },
    addProductToPayment: (state, action) => {
      const productId = action.payload;
      if (!state.productsInPayment.includes(productId)) {
        state.productsInPayment.push(productId);
      }
    },
    removeProductFromPayment: (state, action) => {
      const productId = action.payload;
      state.productsInPayment = state.productsInPayment.filter(id => id !== productId);
    },
    clearProductsInPayment: (state) => {
      state.productsInPayment = [];
    },

    // Versión alternativa que permite forzar el reset cuando sea necesario
    forceResetPaymentFlow: () => initialState,
  },
});

export const {
  setPaymentStep,
  setIsSplit,
  setSplitType,
  setSelectedProductIds,
  setSplitCount,
  setSelectedSplits,
  setSplitMetadata,
  markSplitAsPaid,
  blockSplits,
  unblockSplits,
  initializeSplits,
  resetPaymentFlow,
  forceResetPaymentFlow,
  setTotalSplitAmount,
  setUnpaidSplits,
  setPaidSplits,
  setProductsInPayment,
  addProductToPayment,
  removeProductFromPayment,
  clearProductsInPayment,
} = paymentFlowSlice.actions;

export default paymentFlowSlice.reducer;
