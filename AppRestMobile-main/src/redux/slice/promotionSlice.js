import {createSlice} from '@reduxjs/toolkit';

export const promotionSlice = createSlice({
  name: 'promotion',
  initialState: {
    promotions: [],
    promo_banners: [],
  },
  reducers: {
    setPromotionsList: (state, action) => {
      state.promotions = action.payload;
    },
    setPromotionBannersList: (state, action) => {
      state.promo_banners = action.payload;
    },
  },
});

export const {setPromotionsList, setPromotionBannersList} =
  promotionSlice.actions;
export default promotionSlice.reducer;
