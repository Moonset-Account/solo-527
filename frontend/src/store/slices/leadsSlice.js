import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (params = {}) => {
    const response = await api.get('/leads/', { params });
    return response.data;
  }
);

export const fetchLeadDetail = createAsyncThunk(
  'leads/fetchLeadDetail',
  async (id) => {
    const response = await api.get(`/leads/${id}/`);
    return response.data;
  }
);

export const createLead = createAsyncThunk(
  'leads/createLead',
  async (data) => {
    const response = await api.post('/leads/', data);
    return response.data;
  }
);

export const updateLead = createAsyncThunk(
  'leads/updateLead',
  async ({ id, data }) => {
    const response = await api.patch(`/leads/${id}/`, data);
    return response.data;
  }
);

export const fetchLeadSources = createAsyncThunk(
  'leads/fetchLeadSources',
  async () => {
    const response = await api.get('/leads/sources/');
    return response.data.results || response.data;
  }
);

export const fetchLeadStatuses = createAsyncThunk(
  'leads/fetchLeadStatuses',
  async () => {
    const response = await api.get('/leads/statuses/');
    return response.data.results || response.data;
  }
);

export const fetchCustomers = createAsyncThunk(
  'leads/fetchCustomers',
  async (params = {}) => {
    const response = await api.get('/leads/customers/', { params });
    return response.data.results || response.data;
  }
);

export const createCustomer = createAsyncThunk(
  'leads/createCustomer',
  async (data) => {
    const response = await api.post('/leads/customers/', data);
    return response.data;
  }
);

export const addFollowup = createAsyncThunk(
  'leads/addFollowup',
  async (data) => {
    const response = await api.post('/leads/followups/', data);
    return response.data;
  }
);

export const assignLead = createAsyncThunk(
  'leads/assignLead',
  async ({ id, userId }) => {
    const response = await api.post(`/leads/${id}/assign/`, { user_id: userId });
    return response.data;
  }
);

export const changeLeadStatus = createAsyncThunk(
  'leads/changeLeadStatus',
  async ({ id, statusId }) => {
    const response = await api.post(`/leads/${id}/change-status/`, { status_id: statusId });
    return response.data;
  }
);

export const claimPublicSeaLead = createAsyncThunk(
  'leads/claimPublicSeaLead',
  async (id) => {
    const response = await api.post(`/leads/${id}/claim/`);
    return response.data;
  }
);

export const fetchMyLeads = createAsyncThunk(
  'leads/fetchMyLeads',
  async (params = {}) => {
    const response = await api.get('/leads/my-leads/', { params });
    return response.data.results || response.data;
  }
);

export const fetchPublicSeaLeads = createAsyncThunk(
  'leads/fetchPublicSeaLeads',
  async (params = {}) => {
    const response = await api.get('/leads/public-sea/', { params });
    return response.data.results || response.data;
  }
);

export const fetchTimeoutLeads = createAsyncThunk(
  'leads/fetchTimeoutLeads',
  async (params = {}) => {
    const response = await api.get('/leads/timeout/', { params });
    return response.data.results || response.data;
  }
);

const initialState = {
  leads: [],
  leadDetail: null,
  sources: [],
  statuses: [],
  customers: [],
  loading: false,
  detailLoading: false,
  error: null,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    clearLeadDetail: (state) => {
      state.leadDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload.results || action.payload;
        if (action.payload.count !== undefined) {
          state.pagination = {
            count: action.payload.count,
            next: action.payload.next,
            previous: action.payload.previous,
          };
        }
      })
      .addCase(fetchLeads.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchLeadDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchLeadDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.leadDetail = action.payload;
      })
      .addCase(fetchLeadDetail.rejected, (state) => {
        state.detailLoading = false;
      })
      .addCase(fetchLeadSources.fulfilled, (state, action) => {
        state.sources = action.payload;
      })
      .addCase(fetchLeadStatuses.fulfilled, (state, action) => {
        state.statuses = action.payload;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers = action.payload;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.leads.unshift(action.payload);
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        const index = state.leads.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
        if (state.leadDetail?.id === action.payload.id) {
          state.leadDetail = action.payload;
        }
      })
      .addCase(addFollowup.fulfilled, (state, action) => {
        if (state.leadDetail) {
          if (!state.leadDetail.followups) {
            state.leadDetail.followups = [];
          }
          state.leadDetail.followups.unshift(action.payload);
        }
      });
  },
});

export const { clearLeadDetail } = leadsSlice.actions;
export default leadsSlice.reducer;
