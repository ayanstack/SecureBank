import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../../services/api';

export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts');
      return response.data.accounts || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAccountById = createAsyncThunk(
  'accounts/fetchAccountById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/accounts/${id}`);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createAccount = createAsyncThunk(
  'accounts/createAccount',
  async ({ accountType }, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts', { accountType });
      return response.data.account;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const freezeAccount = createAsyncThunk(
  'accounts/freezeAccount',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/accounts/${id}/freeze`);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const unfreezeAccount = createAsyncThunk(
  'accounts/unfreezeAccount',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/accounts/${id}/unfreeze`);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const closeAccount = createAsyncThunk(
  'accounts/closeAccount',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/accounts/${id}/close`);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const setPrimaryAccount = createAsyncThunk(
  'accounts/setPrimaryAccount',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/accounts/${id}/primary`);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  accounts: [],
  selectedAccount: null,
  isLoading: false,
  isMutating: false,
  error: null,
};

const accountSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setSelectedAccount: (state, action) => {
      state.selectedAccount = action.payload;
    },
    clearAccountError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        if (!state.selectedAccount && action.payload.length > 0) {
          // Select primary account by default or the first one
          const primary = action.payload.find((a) => a.isPrimary) || action.payload[0];
          state.selectedAccount = primary;
        } else if (state.selectedAccount) {
          // Update selected account with fresh data
          const updated = action.payload.find((a) => (a.id || a._id) === (state.selectedAccount.id || state.selectedAccount._id));
          if (updated) state.selectedAccount = updated;
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Account By Id
      .addCase(fetchAccountById.fulfilled, (state, action) => {
        state.selectedAccount = action.payload;
      })

      // Create Account
      .addCase(createAccount.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.isMutating = false;
        state.accounts.push(action.payload);
        if (!state.selectedAccount) {
          state.selectedAccount = action.payload;
        }
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })

      // Freeze / Unfreeze / Close / SetPrimary
      .addCase(freezeAccount.fulfilled, (state, action) => {
        const idx = state.accounts.findIndex((a) => (a.id || a._id) === (action.payload.id || action.payload._id));
        if (idx !== -1) state.accounts[idx] = action.payload;
        if (state.selectedAccount && (state.selectedAccount.id || state.selectedAccount._id) === (action.payload.id || action.payload._id)) {
          state.selectedAccount = action.payload;
        }
      })
      .addCase(unfreezeAccount.fulfilled, (state, action) => {
        const idx = state.accounts.findIndex((a) => (a.id || a._id) === (action.payload.id || action.payload._id));
        if (idx !== -1) state.accounts[idx] = action.payload;
        if (state.selectedAccount && (state.selectedAccount.id || state.selectedAccount._id) === (action.payload.id || action.payload._id)) {
          state.selectedAccount = action.payload;
        }
      })
      .addCase(closeAccount.fulfilled, (state, action) => {
        const idx = state.accounts.findIndex((a) => (a.id || a._id) === (action.payload.id || action.payload._id));
        if (idx !== -1) state.accounts[idx] = action.payload;
        if (state.selectedAccount && (state.selectedAccount.id || state.selectedAccount._id) === (action.payload.id || action.payload._id)) {
          state.selectedAccount = action.payload;
        }
      })
      .addCase(setPrimaryAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.map((a) => ({
          ...a,
          isPrimary: (a.id || a._id) === (action.payload.id || action.payload._id),
        }));
        if (state.selectedAccount && (state.selectedAccount.id || state.selectedAccount._id) === (action.payload.id || action.payload._id)) {
          state.selectedAccount = { ...state.selectedAccount, isPrimary: true };
        }
      });
  },
});

export const { setSelectedAccount, clearAccountError } = accountSlice.actions;
export default accountSlice.reducer;
