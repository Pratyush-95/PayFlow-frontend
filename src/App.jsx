import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import VerifyOtpPage from './pages/VerifyOtpPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import PaymentDetailsPage from './pages/PaymentDetailsPage.jsx';
import RefundsPage from './pages/RefundsPage.jsx';
import CreatePaymentPage from './pages/CreatePaymentPage.jsx';
import PaymentToolsPage from './pages/PaymentToolsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import PaymentResultPage from './pages/PaymentResultPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';

function ProtectedRoute({ children }) {
  return sessionStorage.getItem('payflow_token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/verify-otp" element={<VerifyOtpPage />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
    <Route path="/transactions" element={<TransactionsPage />} />
    <Route path="/transactions/:id" element={<PaymentDetailsPage />}/>
    <Route path="/refunds" element={<RefundsPage />} />
    <Route path="/create-payment" element={<CreatePaymentPage />}/>
    <Route path="/payment-tools" element={<PaymentToolsPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route
  path="/payment-success"
  element={<PaymentResultPage result="success" />}
/>

<Route
  path="/payment-failed"
  element={<PaymentResultPage result="failed" />}
/>

<Route
  path="/payment-pending"
  element={<PaymentResultPage result="pending" />}
/>

<Route
  path="/forgot-password"
  element={<ForgotPasswordPage />}
/>
  </Routes>;
}
