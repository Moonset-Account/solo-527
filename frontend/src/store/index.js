import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import leadsReducer from './slices/leadsSlice';
import consultationsReducer from './slices/consultationsSlice';
import contractsReducer from './slices/contractsSlice';
import commonReducer from './slices/commonSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadsReducer,
    consultations: consultationsReducer,
    contracts: contractsReducer,
    common: commonReducer,
  },
});

export default store;
