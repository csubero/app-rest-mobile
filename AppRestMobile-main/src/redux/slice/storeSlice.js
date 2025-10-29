import {createSlice} from '@reduxjs/toolkit';

export const storeSlice = createSlice({
  name: 'store',
  initialState: {
    name: '',
    code: '',
    branch_logo: '',
    branch_number: '',
    serverIp: '',
    socketIp: '',
    products: [],
    menus: [],
    productsFilterList: [],
    menuSelected: null,
  },
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setServerIp: (state, action) => {
      state.serverIp = action.payload;
    },
    setSocketIp: (state, action) => {
      state.socketIp = action.payload;
    },
    setMenus: (state, action) => {
      state.menus = action.payload;
    },
    setProductsFilterList: (state, action) => {
      state.productsFilterList = action.payload;
    },
    setMenuSelected: (state, action) => {
      state.menuSelected = action.payload;
    },
  },
});

export const {
  setProducts,
  setServerIp,
  setSocketIp,
  setMenus,
  setProductsFilterList,
  setMenuSelected,
} = storeSlice.actions;
export default storeSlice.reducer;
