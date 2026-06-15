import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchConsultations = createAsyncThunk(
  'consultations/fetchConsultations',
  async (params = {}) => {
    const response = await api.get('/consultations/', { params });
    return response.data;
  }
);

export const fetchConsultationDetail = createAsyncThunk(
  'consultations/fetchConsultationDetail',
  async (id) => {
    const response = await api.get(`/consultations/${id}/`);
    return response.data;
  }
);

export const createConsultation = createAsyncThunk(
  'consultations/createConsultation',
  async (data) => {
    const response = await api.post('/consultations/', data);
    return response.data;
  }
);

export const updateConsultation = createAsyncThunk(
  'consultations/updateConsultation',
  async ({ id, data }) => {
    const response = await api.patch(`/consultations/${id}/`, data);
    return response.data;
  }
);

export const fetchTreatmentItems = createAsyncThunk(
  'consultations/fetchTreatmentItems',
  async (params = {}) => {
    const response = await api.get('/consultations/treatment-items/', { params });
    return response.data.results || response.data;
  }
);

export const addTreatmentItem = createAsyncThunk(
  'consultations/addTreatmentItem',
  async ({ id, data }) => {
    const response = await api.post(`/consultations/${id}/add-treatment-item/`, data);
    return response.data;
  }
);

export const removeTreatmentItem = createAsyncThunk(
  'consultations/removeTreatmentItem',
  async ({ consultationId, itemId }) => {
    await api.post(`/consultations/${consultationId}/remove-treatment-item/${itemId}/`);
    return itemId;
  }
);

export const fetchMyConsultations = createAsyncThunk(
  'consultations/fetchMyConsultations',
  async (params = {}) => {
    const response = await api.get('/consultations/my-consultations/', { params });
    return response.data.results || response.data;
  }
);

const initialState = {
  consultations: [],
  consultationDetail: null,
  treatmentItems: [],
  loading: false,
  detailLoading: false,
  error: null,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
};

const consultationsSlice = createSlice({
  name: 'consultations',
  initialState,
  reducers: {
    clearConsultationDetail: (state) => {
      state.consultationDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConsultations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConsultations.fulfilled, (state, action) => {
        state.loading = false;
        state.consultations = action.payload.results || action.payload;
        if (action.payload.count !== undefined) {
          state.pagination = {
            count: action.payload.count,
            next: action.payload.next,
            previous: action.payload.previous,
          };
        }
      })
      .addCase(fetchConsultations.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchConsultationDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchConsultationDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.consultationDetail = action.payload;
      })
      .addCase(fetchConsultationDetail.rejected, (state) => {
        state.detailLoading = false;
      })
      .addCase(fetchTreatmentItems.fulfilled, (state, action) => {
        state.treatmentItems = action.payload;
      })
      .addCase(createConsultation.fulfilled, (state, action) => {
        state.consultations.unshift(action.payload);
      })
      .addCase(updateConsultation.fulfilled, (state, action) => {
        const index = state.consultations.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.consultations[index] = action.payload;
        }
        if (state.consultationDetail?.id === action.payload.id) {
          state.consultationDetail = action.payload;
        }
      })
      .addCase(addTreatmentItem.fulfilled, (state, action) => {
        if (state.consultationDetail) {
          if (!state.consultationDetail.treatment_items) {
            state.consultationDetail.treatment_items = [];
          }
          state.consultationDetail.treatment_items.push(action.payload);
        }
      })
      .addCase(removeTreatmentItem.fulfilled, (state, action) => {
        if (state.consultationDetail?.treatment_items) {
          state.consultationDetail.treatment_items = state.consultationDetail.treatment_items.filter(
            item => item.id !== action.payload
          );
        }
      });
  },
});

export const { clearConsultationDetail } = consultationsSlice.actions;
export default consultationsSlice.reducer;
