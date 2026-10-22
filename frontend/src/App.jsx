import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { fetchCurrentUser, resetAuthState } from './features/auth/authSlice';
import { getAccessToken, clearAuthTokens } from './services/api';

export function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  // Global listener for session expired event triggered by Axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthTokens();
      dispatch(resetAuthState());
    };
    window.addEventListener('sb:session_expired', handleSessionExpired);
    return () => window.removeEventListener('sb:session_expired', handleSessionExpired);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;