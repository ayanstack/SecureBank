import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthTokens, clearAuthTokens, getAccessToken, getErrorMessage } from '../../services/api';
import { disconnectSocket } from '../../services/socket';

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      setAuthTokens(accessToken, refreshToken);
      return { user, accessToken };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ verificationToken }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-email', { verificationToken });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ resetToken, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/reset-password', { resetToken, newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/me');
      return response.data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ firstName, lastName }, { rejectWithValue }) => {
    try {
      const payload = {};
      if (firstName !== undefined && firstName !== '') payload.firstName = firstName.trim();
      if (lastName !== undefined && lastName !== '') payload.lastName = lastName.trim();

      const response = await api.patch('/users/profile', payload);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const setTransactionPin = createAsyncThunk(
  'auth/setTransactionPin',
  async ({ pin }, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/transaction-pin', { pin });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const changeTransactionPin = createAsyncThunk(
  'auth/changeTransactionPin',
  async ({ currentPin, newPin }, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/transaction-pin', { currentPin, newPin });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      const refreshToken = (await import('../../services/api')).getRefreshToken();
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthTokens();
      disconnectSocket();
      dispatch(authSlice.actions.resetAuthState());
    }
  }
);

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('sb_user') || sessionStorage.getItem('sb_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();
const hasToken = Boolean(getAccessToken());

const initialState = {
  user: initialUser,
  isAuthenticated: hasToken,
  isLoading: false,
  isInitializing: Boolean(hasToken && !initialUser),
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isInitializing = false;
      state.error = null;
      state.successMessage = null;
      try {
        localStorage.removeItem('sb_user');
        sessionStorage.removeItem('sb_user');
      } catch {}
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearAuthSuccess: (state) => {
      state.successMessage = null;
    },
    setPinStatus: (state, action) => {
      if (state.user) {
        state.user.isTransactionPinSet = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
        try {
          localStorage.setItem('sb_user', JSON.stringify(action.payload.user));
        } catch {}
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message || 'Registration successful. Please verify your email.';
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitializing = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        try {
          localStorage.setItem('sb_user', JSON.stringify(action.payload));
        } catch {}
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitializing = false;
        // Do NOT log out on network loss or transient 500 server errors!
        // Only clear tokens if the backend explicitly rejected the credentials
        const err = typeof action.payload === 'string' ? action.payload.toLowerCase() : '';
        if (
          err.includes('unauthorized') ||
          err.includes('expired') ||
          err.includes('authentication required') ||
          err.includes('session has been revoked') ||
          err.includes('user account no longer exists')
        ) {
          state.isAuthenticated = false;
          state.user = null;
          clearAuthTokens();
        }
      })

      // Change Password — backend invalidates ALL sessions, so force re-login
      .addCase(changePassword.fulfilled, (state) => {
        state.successMessage = 'Password changed successfully. Please log in again.';
        state.isAuthenticated = false;
        state.user = null;
        clearAuthTokens();
      })

      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        state.successMessage = 'Profile updated successfully';
        try {
          localStorage.setItem('sb_user', JSON.stringify(state.user));
        } catch {}
      })

      // Set Transaction PIN
      .addCase(setTransactionPin.fulfilled, (state) => {
        if (state.user) {
          state.user.isTransactionPinSet = true;
        }
        state.successMessage = 'Transaction PIN configured successfully';
      })

      // Change Transaction PIN
      .addCase(changeTransactionPin.fulfilled, (state) => {
        state.successMessage = 'Transaction PIN changed successfully';
      });
  },
});

export const { resetAuthState, clearAuthError, clearAuthSuccess, setPinStatus } = authSlice.actions;
export default authSlice.reducer;
