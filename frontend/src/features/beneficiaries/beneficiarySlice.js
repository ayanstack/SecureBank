import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../../services/api';

export const fetchBeneficiaries = createAsyncThunk(
  'beneficiaries/fetchBeneficiaries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/beneficiaries');
      return response.data.beneficiaries || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addBeneficiary = createAsyncThunk(
  'beneficiaries/addBeneficiary',
  async ({ name, accountNumber, ifscCode }, { rejectWithValue }) => {
    try {
      const response = await api.post('/beneficiaries', {
        name: name.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      });
      return response.data.beneficiary;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateBeneficiary = createAsyncThunk(
  'beneficiaries/updateBeneficiary',
  async ({ id, name, accountNumber, ifscCode }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/beneficiaries/${id}`, {
        name: name.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      });
      return response.data.beneficiary;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteBeneficiary = createAsyncThunk(
  'beneficiaries/deleteBeneficiary',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/beneficiaries/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const activateBeneficiary = createAsyncThunk(
  'beneficiaries/activateBeneficiary',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/beneficiaries/${id}/activate`);
      return response.data.beneficiary;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deactivateBeneficiary = createAsyncThunk(
  'beneficiaries/deactivateBeneficiary',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/beneficiaries/${id}/deactivate`);
      return response.data.beneficiary;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  beneficiaries: [],
  isLoading: false,
  isMutating: false,
  error: null,
  successMessage: null,
};

const beneficiarySlice = createSlice({
  name: 'beneficiaries',
  initialState,
  reducers: {
    clearBeneficiaryError: (state) => {
      state.error = null;
    },
    clearBeneficiarySuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchBeneficiaries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBeneficiaries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.beneficiaries = action.payload;
      })
      .addCase(fetchBeneficiaries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addBeneficiary.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(addBeneficiary.fulfilled, (state, action) => {
        state.isMutating = false;
        state.beneficiaries.unshift(action.payload);
        state.successMessage = 'Beneficiary added successfully';
      })
      .addCase(addBeneficiary.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateBeneficiary.fulfilled, (state, action) => {
        const idx = state.beneficiaries.findIndex((b) => (b.id || b._id) === (action.payload.id || action.payload._id));
        if (idx !== -1) state.beneficiaries[idx] = action.payload;
        state.successMessage = 'Beneficiary updated successfully';
      })

      // Delete
      .addCase(deleteBeneficiary.fulfilled, (state, action) => {
        state.beneficiaries = state.beneficiaries.filter((b) => (b.id || b._id) !== action.payload);
        state.successMessage = 'Beneficiary removed successfully';
      })

      // Activate / Deactivate
      .addCase(activateBeneficiary.fulfilled, (state, action) => {
        const idx = state.beneficiaries.findIndex((b) => (b.id || b._id) === (action.payload.id || action.payload._id));
        if (idx !== -1) state.beneficiaries[idx] = action.payload;
      })
      .addCase(deactivateBeneficiary.fulfilled, (state, action) => {
        const idx = state.beneficiaries.findIndex((b) => (b.id || b._id) === (action.payload.id || action.payload._id));
        if (idx !== -1) state.beneficiaries[idx] = action.payload;
      });
  },
});

export const { clearBeneficiaryError, clearBeneficiarySuccess } = beneficiarySlice.actions;
export default beneficiarySlice.reducer;
