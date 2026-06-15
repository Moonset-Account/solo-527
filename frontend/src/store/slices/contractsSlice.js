import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchContracts = createAsyncThunk(
  'contracts/fetchContracts',
  async (params = {}) => {
    const response = await api.get('/contracts/', { params });
    return response.data;
  }
);

export const fetchContractDetail = createAsyncThunk(
  'contracts/fetchContractDetail',
  async (id) => {
    const response = await api.get(`/contracts/${id}/`);
    return response.data;
  }
);

export const createContract = createAsyncThunk(
  'contracts/createContract',
  async (data) => {
    const response = await api.post('/contracts/', data);
    return response.data;
  }
);

export const updateContract = createAsyncThunk(
  'contracts/updateContract',
  async ({ id, data }) => {
    const response = await api.patch(`/contracts/${id}/`, data);
    return response.data;
  }
);

export const submitApproval = createAsyncThunk(
  'contracts/submitApproval',
  async ({ id, comments }) => {
    const response = await api.post(`/contracts/${id}/submit-approval/`, { comments });
    return response.data;
  }
);

export const approveContract = createAsyncThunk(
  'contracts/approveContract',
  async ({ id, comments }) => {
    const response = await api.post(`/contracts/${id}/approve/`, { comments });
    return response.data;
  }
);

export const rejectContract = createAsyncThunk(
  'contracts/rejectContract',
  async ({ id, comments }) => {
    const response = await api.post(`/contracts/${id}/reject/`, { comments });
    return response.data;
  }
);

export const requestRevision = createAsyncThunk(
  'contracts/requestRevision',
  async ({ id, comments }) => {
    const response = await api.post(`/contracts/${id}/request-revision/`, { comments });
    return response.data;
  }
);

export const addContractItem = createAsyncThunk(
  'contracts/addContractItem',
  async ({ id, data }) => {
    const response = await api.post(`/contracts/${id}/add-item/`, data);
    return response.data;
  }
);

export const removeContractItem = createAsyncThunk(
  'contracts/removeContractItem',
  async ({ contractId, itemId }) => {
    await api.delete(`/contracts/${contractId}/remove-item/${itemId}/`);
    return itemId;
  }
);

export const recordPayment = createAsyncThunk(
  'contracts/recordPayment',
  async ({ id, data }) => {
    const response = await api.post(`/contracts/${id}/record-payment/`, data);
    return response.data;
  }
);

export const fetchPendingApprovals = createAsyncThunk(
  'contracts/fetchPendingApprovals',
  async (params = {}) => {
    const response = await api.get('/contracts/pending-approval/', { params });
    return response.data.results || response.data;
  }
);

export const fetchMyContracts = createAsyncThunk(
  'contracts/fetchMyContracts',
  async (params = {}) => {
    const response = await api.get('/contracts/my-contracts/', { params });
    return response.data.results || response.data;
  }
);

export const fetchContractStatuses = createAsyncThunk(
  'contracts/fetchContractStatuses',
  async () => {
    const response = await api.get('/contracts/statuses/');
    return response.data.results || response.data;
  }
);

const initialState = {
  contracts: [],
  contractDetail: null,
  statuses: [],
  pendingApprovals: [],
  loading: false,
  detailLoading: false,
  error: null,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
};

const contractsSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    clearContractDetail: (state) => {
      state.contractDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = action.payload.results || action.payload;
        if (action.payload.count !== undefined) {
          state.pagination = {
            count: action.payload.count,
            next: action.payload.next,
            previous: action.payload.previous,
          };
        }
      })
      .addCase(fetchContracts.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchContractDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchContractDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.contractDetail = action.payload;
      })
      .addCase(fetchContractDetail.rejected, (state) => {
        state.detailLoading = false;
      })
      .addCase(fetchContractStatuses.fulfilled, (state, action) => {
        state.statuses = action.payload;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.pendingApprovals = action.payload;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.contracts.unshift(action.payload);
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        const index = state.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.contractDetail?.id === action.payload.id) {
          state.contractDetail = action.payload;
        }
      })
      .addCase(submitApproval.fulfilled, (state, action) => {
        if (state.contractDetail) {
          state.contractDetail.approval_status = 'pending';
        }
      })
      .addCase(approveContract.fulfilled, (state, action) => {
        if (state.contractDetail) {
          state.contractDetail.approval_status = 'approved';
        }
      })
      .addCase(rejectContract.fulfilled, (state, action) => {
        if (state.contractDetail) {
          state.contractDetail.approval_status = 'rejected';
        }
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        if (state.contractDetail) {
          if (!state.contractDetail.payments) {
            state.contractDetail.payments = [];
          }
          state.contractDetail.payments.unshift(action.payload);
        }
      })
      .addCase(addContractItem.fulfilled, (state, action) => {
        if (state.contractDetail) {
          if (!state.contractDetail.items) {
            state.contractDetail.items = [];
          }
          state.contractDetail.items.push(action.payload);
        }
      })
      .addCase(removeContractItem.fulfilled, (state, action) => {
        if (state.contractDetail?.items) {
          state.contractDetail.items = state.contractDetail.items.filter(
            item => item.id !== action.payload
          );
        }
      });
  },
});

export const { clearContractDetail } = contractsSlice.actions;
export default contractsSlice.reducer;
