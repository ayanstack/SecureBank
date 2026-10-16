import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../../services/api';
import { fetchAccounts } from '../accounts/accountSlice';

export const depositMoney = createAsyncThunk(
  'transactions/depositMoney',
  async ({ accountId, amount, description }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/deposit', {
        accountId,
        amount: Number(amount),
        description: description || undefined,
      });
      // Refresh accounts to sync updated balance
      dispatch(fetchAccounts());
      return response.data.transaction;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const withdrawMoney = createAsyncThunk(
  'transactions/withdrawMoney',
  async ({ accountId, amount, description }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/withdraw', {
        accountId,
        amount: Number(amount),
        description: description || undefined,
      });
      dispatch(fetchAccounts());
      return response.data.transaction;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchTransactionHistory = createAsyncThunk(
  'transactions/fetchTransactionHistory',
  async ({ accountId, type, status, page = 1, limit = 15 }, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (type) params.type = type;
      if (status) params.status = status;

      const response = await api.get(`/transactions/history/${accountId}`, { params });
      return {
        transactions: response.data.transactions || [],
        pagination: response.data.pagination || {
          currentPage: page,
          limit,
          totalTransactions: response.data.count || 0,
          totalPages: 1,
        },
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transactions/fetchTransactionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data.transaction;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  transactions: [],
  pagination: {
    currentPage: 1,
    limit: 15,
    totalTransactions: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  selectedTransaction: null,
  isLoading: false,
  isOperating: false,
  error: null,
  successMessage: null,
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearTransactionError: (state) => {
      state.error = null;
    },
    clearTransactionSuccess: (state) => {
      state.successMessage = null;
    },
    setSelectedTransaction: (state, action) => {
      state.selectedTransaction = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Deposit
      .addCase(depositMoney.pending, (state) => {
        state.isOperating = true;
        state.error = null;
      })
      .addCase(depositMoney.fulfilled, (state, action) => {
        state.isOperating = false;
        state.transactions.unshift(action.payload);
        state.successMessage = 'Deposit completed successfully';
      })
      .addCase(depositMoney.rejected, (state, action) => {
        state.isOperating = false;
        state.error = action.payload;
      })

      // Withdraw
      .addCase(withdrawMoney.pending, (state) => {
        state.isOperating = true;
        state.error = null;
      })
      .addCase(withdrawMoney.fulfilled, (state, action) => {
        state.isOperating = false;
        state.transactions.unshift(action.payload);
        state.successMessage = 'Withdrawal completed successfully';
      })
      .addCase(withdrawMoney.rejected, (state, action) => {
        state.isOperating = false;
        state.error = action.payload;
      })

      // History
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Detail
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.selectedTransaction = action.payload;
      });
  },
});

export const { clearTransactionError, clearTransactionSuccess, setSelectedTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;
