import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import FirstLoginCheck from "./components/auth/FirstLoginCheck";

import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import DashboardPage from "./pages/admin/DashboardPage";

import CustomerDashboard from "./pages/user/CustomerDashboard";
import StatusPage from "./pages/user/StatusPage";
import EstimatedArrivalPage from "./pages/user/EstimatedArrivalPage";
import ItemsPage from "./pages/user/ItemsPage";
import AnnouncementsPage from "./pages/user/AnnouncementsPage";
import InvoicesPage from "./pages/user/InvoicesPage";
import SupportPage from "./pages/user/SupportPage";

import ReceivingPage from "./pages/china-team/ReceivingPage";
import PackagingPage from "./pages/china-team/PackagingPage";
import ChinaTeamDashboard from "./pages/china-team/DashboardPage";
import ContainerManagementPage from "./pages/china-team/ContainerManagementPage";

import SortingPage from "./pages/ghana-team/SortingPage";
import TaggingPage from "./pages/ghana-team/TaggingPage";
import CSVImportPage from "./pages/ghana-team/CSVImportPage";

import MyPackagesPage from "./pages/customer/MyPackagesPage";

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect authenticated users based on their role
  switch (user?.role) {
    case 'customer':
      return <Navigate to="/packages" replace />;
    case 'china_team':
      return <Navigate to="/china/dashboard" replace />;
    case 'ghana_team':
      return <Navigate to="/ghana/tagging" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FirstLoginCheck>
                  <MainLayout />
                </FirstLoginCheck>
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />

            {/* Customer Dashboard */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes */}
            <Route
              path="packages"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <MyPackagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="status"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <StatusPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="arrival"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <EstimatedArrivalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="items"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <ItemsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcements"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="support"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <SupportPage />
                </ProtectedRoute>
              }
            />

            {/* China Team Routes */}
            <Route
              path="china/dashboard"
              element={
                <ProtectedRoute allowedRoles={["china_team", "ghana_team", "admin"]}>
                  <ChinaTeamDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="china/receiving"
              element={
                <ProtectedRoute allowedRoles={["china_team", "admin"]}>
                  <ReceivingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="china/packaging"
              element={
                <ProtectedRoute allowedRoles={["china_team", "admin"]}>
                  <PackagingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="china/containers"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ContainerManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Ghana Team Routes */}
            <Route
              path="ghana/tagging"
              element={
                <ProtectedRoute allowedRoles={["ghana_team", "admin"]}>
                  <TaggingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="ghana/sorting"
              element={
                <ProtectedRoute allowedRoles={["ghana_team", "admin"]}>
                  <SortingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="ghana/csv-import"
              element={
                <ProtectedRoute allowedRoles={["ghana_team", "admin"]}>
                  <CSVImportPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
