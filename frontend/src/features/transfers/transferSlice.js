import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../../services/api';
import { fetchAccounts } from '../accounts/accountSlice';

export const executeTransfer = createAsyncThunk(
  'transfers/executeTransfer',
  async (
    { senderAccountId, beneficiaryId, amount, transactionPin, description, idempotencyKey },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const idKey = idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const response = await api.post(
        '/transfers',
        {
          senderAccountId,
          beneficiaryId,
          amount: Number(amount),
          transactionPin,
          description: description || undefined,
          idempotencyKey: idKey,
        },
        {
          headers: {
            'Idempotency-Key': idKey,
          },
        }
      );

      // Refresh accounts to reflect updated balance
      dispatch(fetchAccounts());
      return response.data.transfer;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchTransferById = createAsyncThunk(
  'transfers/fetchTransferById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/transfers/${id}`);
      return response.data.transfer;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const reverseTransfer = createAsyncThunk(
  'transfers/reverseTransfer',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.patch(`/transfers/${id}/reverse`);
      dispatch(fetchAccounts());
      return response.data.transfer;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  lastTransfer: null,
  currentTransfer: null,
  isExecuting: false,
  error: null,
  success: false,
};

const transferSlice = createSlice({
  name: 'transfers',
  initialState,
  reducers: {
    resetTransferState: (state) => {
      state.isExecuting = false;
      state.error = null;
      state.success = false;
      state.currentTransfer = null;
    },
    clearTransferError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(executeTransfer.pending, (state) => {
        state.isExecuting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(executeTransfer.fulfilled, (state, action) => {
        state.isExecuting = false;
        state.success = true;
        state.lastTransfer = action.payload;
        state.currentTransfer = action.payload;
      })
      .addCase(executeTransfer.rejected, (state, action) => {
        state.isExecuting = false;
        state.success = false;
        state.error = action.payload;
      })

      .addCase(fetchTransferById.fulfilled, (state, action) => {
        state.currentTransfer = action.payload;
      })

      .addCase(reverseTransfer.fulfilled, (state, action) => {
        state.currentTransfer = action.payload;
        if (state.lastTransfer && (state.lastTransfer.id || state.lastTransfer._id) === (action.payload.id || action.payload._id)) {
          state.lastTransfer = action.payload;
        }
      });
  },
});

export const { resetTransferState, clearTransferError } = transferSlice.actions;
export default transferSlice.reducer;
