import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../../services/api';

export const fetchStatementSummary = createAsyncThunk(
  'statements/fetchStatementSummary',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/statements/${accountId}/summary`);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchMiniStatement = createAsyncThunk(
  'statements/fetchMiniStatement',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/statements/${accountId}/mini`);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAccountStatement = createAsyncThunk(
  'statements/fetchAccountStatement',
  async ({ accountId, type, status, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (type) params.type = type;
      if (status) params.status = status;

      const response = await api.get(`/statements/${accountId}`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchMonthlyStatement = createAsyncThunk(
  'statements/fetchMonthlyStatement',
  async ({ accountId, month, year }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/statements/${accountId}/monthly`, {
        params: { month, year },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const emailStatement = createAsyncThunk(
  'statements/emailStatement',
  async ({ accountId, email }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/statements/${accountId}/email`, { email });
      return response.data.message || 'Statement emailed successfully';
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Trigger file download helper for CSV
export const downloadCSVStatement = async (accountId, accountNumber = '') => {
  try {
    const response = await api.get(`/statements/${accountId}/download/csv`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SecureBank_Statement_${accountNumber || accountId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// Trigger file download helper for PDF
export const downloadPDFStatement = async (accountId, accountNumber = '') => {
  try {
    const response = await api.get(`/statements/${accountId}/download/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SecureBank_Statement_${accountNumber || accountId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

const initialState = {
  summary: null,
  miniStatement: [],
  statementData: {
    transactions: [],
    pagination: { currentPage: 1, totalPages: 1, limit: 20 },
  },
  monthlyStatement: null,
  isLoading: false,
  isEmailing: false,
  error: null,
  emailSuccess: null,
};

const statementSlice = createSlice({
  name: 'statements',
  initialState,
  reducers: {
    clearStatementError: (state) => {
      state.error = null;
    },
    clearEmailSuccess: (state) => {
      state.emailSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Summary
      .addCase(fetchStatementSummary.fulfilled, (state, action) => {
        state.summary = action.payload.summary;
      })

      // Mini
      .addCase(fetchMiniStatement.fulfilled, (state, action) => {
        state.miniStatement = action.payload.transactions || [];
      })

      // Full Statement
      .addCase(fetchAccountStatement.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccountStatement.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statementData = {
          transactions: action.payload.transactions || [],
          pagination: action.payload.pagination || { currentPage: 1, totalPages: 1 },
        };
      })
      .addCase(fetchAccountStatement.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Monthly
      .addCase(fetchMonthlyStatement.fulfilled, (state, action) => {
        state.monthlyStatement = action.payload;
      })

      // Email
      .addCase(emailStatement.pending, (state) => {
        state.isEmailing = true;
        state.error = null;
      })
      .addCase(emailStatement.fulfilled, (state, action) => {
        state.isEmailing = false;
        state.emailSuccess = action.payload;
      })
      .addCase(emailStatement.rejected, (state, action) => {
        state.isEmailing = false;
        state.error = action.payload;
      });
  },
});

export const { clearStatementError, clearEmailSuccess } = statementSlice.actions;
export default statementSlice.reducer;
