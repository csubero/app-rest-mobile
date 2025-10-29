// store.ts (React Native)
import {configureStore} from '@reduxjs/toolkit';
import authReducer from './slice/authSlice';
import storeReducer from './slice/storeSlice';
import companyReducer from './slice/companySlice';
import bagReducer from './slice/bagSlice';
import settingsReducer from './slice/settingsSlice';
import promotionsReducer from './slice/promotionSlice';
import paymentFlowReducer from './slice/paymentFlowSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    store: storeReducer,
    company: companyReducer,
    bag: bagReducer,
    settings: settingsReducer,
    promotions: promotionsReducer,
    paymentFlow: paymentFlowReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: {ignoredPaths: ['bag.bag.products']},
      serializableCheck: {
        ignoredActions: [
          'bag/addProduct',
          'bag/updateProductByIndex',
          'bag/updateProductById',
        ],
        ignoredPaths: ['bag.bag.products'],
      },
    }),
  devTools: false,
});

// Hacer el store disponible globalmente para los WebSocket services
if (typeof global !== 'undefined') {
  global.__REDUX_STORE__ = store;
}
