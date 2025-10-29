import {createSlice} from '@reduxjs/toolkit';

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isLoggedIn: false,
    isLoading: false,
    apiToken: null,
    syncronizingData: false,
    isSilentSyncing: false,
    apiError: false,
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = true;
    },
    logout: state => {
      state.user = null;
      state.isLoggedIn = false;
      state.apiToken = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setApiToken: (state, action) => {
      state.apiToken = action.payload;
      // state.isLoggedIn = true;
    },
    setSyncronizingData: (state, action) => {
      state.syncronizingData = action.payload;
    },
    setSilentSyncing: (state, action) => {
      state.isSilentSyncing = action.payload;
    },
    setApiError: (state, action) => {
      state.apiError = action.payload;
    },
  },
});

export const {
  login,
  logout,
  setLoading,
  setApiToken,
  setSyncronizingData,
  setSilentSyncing,
  setApiError,
} = authSlice.actions;
export default authSlice.reducer;
