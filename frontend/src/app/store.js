import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';
import accountReducer from '../features/accounts/accountSlice';
import transactionReducer from '../features/transactions/transactionSlice';
import transferReducer from '../features/transfers/transferSlice';
import beneficiaryReducer from '../features/beneficiaries/beneficiarySlice';
import statementReducer from '../features/statements/statementSlice';
import notificationReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    accounts: accountReducer,
    transactions: transactionReducer,
    transfers: transferReducer,
    beneficiaries: beneficiaryReducer,
    statements: statementReducer,
    notifications: notificationReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
