import {createSlice} from '@reduxjs/toolkit';

export const companySlice = createSlice({
  name: 'company',
  initialState: {
    companies: [],
    companySelected: null,
    storeSelected: null,
    pointOfSaleSelected: null,
    tableData: null,
    waiterData: null,
  },
  reducers: {
    setCompanies: (state, action) => {
      state.companies = action.payload;
    },
    setCompanySelected: (state, action) => {
      state.companySelected = action.payload;
    }, //
    setStoreSelected: (state, action) => {
      state.storeSelected = action.payload;
    },
    setPointOfSaleSelected: (state, action) => {
      state.pointOfSaleSelected = action.payload;
    },
    setTableData: (state, action) => {
      if (
        action.payload &&
        state.tableData?.tableInternalId &&
        !action.payload.tableInternalId
      ) {
        state.tableData = {
          ...action.payload,
          tableInternalId: state.tableData.tableInternalId,
        };
      } else {
        state.tableData = action.payload;
      }
    },
    clearTableData: state => {
      state.tableData = null;
    },
    setWaiterData: (state, action) => {
      state.waiterData = action.payload;
    },
    clearWaiterData: state => {
      state.waiterData = null;
    },
  },
});

export const {
  setCompanies,
  setCompanySelected,
  setStoreSelected,
  setPointOfSaleSelected,
  setTableData,
  clearTableData,
  setWaiterData,
  clearWaiterData,
} = companySlice.actions;

export default companySlice.reducer;
