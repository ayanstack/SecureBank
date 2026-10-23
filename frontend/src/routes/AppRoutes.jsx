import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AdminRoute from './AdminRoute';
import AppLayout from '../components/layout/AppLayout';
import AdminLayout from '../components/layout/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy-loaded public marketing pages
const HomePage = lazy(() => import('../pages/home/HomePage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const ServicesPage = lazy(() => import('../pages/public/ServicesPage'));
const SecurityPage = lazy(() => import('../pages/public/SecurityPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));

// Lazy-loaded auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Lazy-loaded customer banking pages
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const AccountsPage = lazy(() => import('../pages/accounts/AccountsPage'));
const TransferPage = lazy(() => import('../pages/transfers/TransferPage'));
const BeneficiariesPage = lazy(() => import('../pages/beneficiaries/BeneficiariesPage'));
const TransactionsPage = lazy(() => import('../pages/transactions/TransactionsPage'));
const StatementsPage = lazy(() => import('../pages/statements/StatementsPage'));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));

// AI & Advisory & Support
const AIAssistantPage = lazy(() => import('../pages/ai/AIAssistantPage'));
const AIAnalyticsPage = lazy(() => import('../pages/ai/AIAnalyticsPage'));
const AISavingsPage = lazy(() => import('../pages/ai/AISavingsPage'));
const SupportPage = lazy(() => import('../pages/support/SupportPage'));

// Lazy-loaded admin pages
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));

const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading SecureBank portal..." />}>
      <Routes>
        {/* Public Marketing & Informational Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmailPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected Customer Banking Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/beneficiaries" element={<BeneficiariesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/statements" element={<StatementsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/analytics" element={<AIAnalyticsPage />} />
          <Route path="/savings" element={<AISavingsPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>

        {/* Protected Administrative Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        {/* 404 Catch-All Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
