import {createSlice} from '@reduxjs/toolkit';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    printer: null,
    language: '',
    bannerImage: '',
    kioskMode: false,
    lastSyncDate: null,
    currentView: 'menu', // 'menu', 'products', 'bag', 'payment', 'thankyou'
    copilot: {
      hasShown: false,
      isActive: false,
      currentStep: 0,
    },
  },
  reducers: {
    setPrinter: (state, action) => {
      state.printer = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setBannerImage: (state, action) => {
      state.bannerImage = action.payload;
    },
    setKioskMode: (state, action) => {
      state.kioskMode = action.payload;
    },
    setLastSyncDate: (state, action) => {
      state.lastSyncDate = action.payload;
    },
    setCopilotShown: (state, action) => {
      state.copilot.hasShown = action.payload;
    },
    setCopilotActive: (state, action) => {
      state.copilot.isActive = action.payload;
    },
    setCopilotStep: (state, action) => {
      state.copilot.currentStep = action.payload;
    },
    resetCopilot: state => {
      state.copilot = {
        hasShown: false,
        isActive: false,
        currentStep: 0,
      };
    },
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
  },
});

export default settingsSlice.reducer;

export const {
  setPrinter,
  setLanguage,
  setBannerImage,
  setKioskMode,
  setLastSyncDate,
  setCopilotShown,
  setCopilotActive,
  setCopilotStep,
  resetCopilot,
  setCurrentView,
} = settingsSlice.actions;
