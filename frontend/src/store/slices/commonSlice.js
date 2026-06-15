import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchOperationLogs = createAsyncThunk(
  'common/fetchOperationLogs',
  async (params = {}) => {
    const response = await api.get('/common/operation-logs/', { params });
    return response.data;
  }
);

export const fetchLogsByObject = createAsyncThunk(
  'common/fetchLogsByObject',
  async ({ contentType, objectId }) => {
    const response = await api.get('/common/operation-logs/by-object/', {
      params: { content_type: contentType, object_id: objectId }
    });
    return response.data;
  }
);

export const fetchUsers = createAsyncThunk(
  'common/fetchUsers',
  async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data.results || response.data;
  }
);

export const fetchPublicSeaRules = createAsyncThunk(
  'common/fetchPublicSeaRules',
  async () => {
    const response = await api.get('/common/public-sea-rules/');
    return response.data.results || response.data;
  }
);

export const fetchSalesFunnel = createAsyncThunk(
  'common/fetchSalesFunnel',
  async (params = {}) => {
    const response = await api.get('/reports/sales-funnel/', { params });
    return response.data;
  }
);

export const fetchLeadSourceReport = createAsyncThunk(
  'common/fetchLeadSourceReport',
  async () => {
    const response = await api.get('/reports/lead-source/');
    return response.data;
  }
);

export const fetchSalesPerformance = createAsyncThunk(
  'common/fetchSalesPerformance',
  async () => {
    const response = await api.get('/reports/sales-performance/');
    return response.data;
  }
);

export const fetchTimeoutReport = createAsyncThunk(
  'common/fetchTimeoutReport',
  async (params = {}) => {
    const response = await api.get('/reports/timeout/', { params });
    return response.data;
  }
);

export const fetchTrendReport = createAsyncThunk(
  'common/fetchTrendReport',
  async (params = {}) => {
    const response = await api.get('/reports/trend/', { params });
    return response.data;
  }
);

export const fetchResponseNodeReport = createAsyncThunk(
  'common/fetchResponseNodeReport',
  async () => {
    const response = await api.get('/reports/response-node/');
    return response.data;
  }
);

const initialState = {
  operationLogs: [],
  users: [],
  publicSeaRules: [],
  salesFunnel: null,
  leadSourceReport: [],
  salesPerformance: [],
  timeoutReport: null,
  trendReport: null,
  responseNodeReport: [],
  loading: false,
};

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperationLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOperationLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.operationLogs = action.payload.results || action.payload;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(fetchPublicSeaRules.fulfilled, (state, action) => {
        state.publicSeaRules = action.payload;
      })
      .addCase(fetchSalesFunnel.fulfilled, (state, action) => {
        state.salesFunnel = action.payload;
      })
      .addCase(fetchLeadSourceReport.fulfilled, (state, action) => {
        state.leadSourceReport = action.payload;
      })
      .addCase(fetchSalesPerformance.fulfilled, (state, action) => {
        state.salesPerformance = action.payload;
      })
      .addCase(fetchTimeoutReport.fulfilled, (state, action) => {
        state.timeoutReport = action.payload;
      })
      .addCase(fetchTrendReport.fulfilled, (state, action) => {
        state.trendReport = action.payload;
      })
      .addCase(fetchResponseNodeReport.fulfilled, (state, action) => {
        state.responseNodeReport = action.payload;
      });
  },
});

export default commonSlice.reducer;
