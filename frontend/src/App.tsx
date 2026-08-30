import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MyKpis } from './pages/MyKpis';
import { PmsHistoryPage } from './pages/PmsHistoryPage';
import { HistoryDetail } from './pages/HistoryDetail';
import { MyReports } from './pages/MyReports';
import { Profile } from './pages/Profile';
import { SessionExpired } from './pages/SessionExpired';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';

// HR Module Pages
import { HrDashboardPage } from './pages/hr/HrDashboardPage';
import { HrAddEmployeePage } from './pages/hr/HrAddEmployeePage';
import { HrEmployeeDirectoryPage } from './pages/hr/HrEmployeeDirectoryPage';
import { HrKpisPage } from './pages/hr/HrKpisPage';
import { HrManagersPage } from './pages/hr/HrManagersPage';
import { HrPmsLifecyclePage } from './pages/hr/HrPmsLifecyclePage';
import { HrReportsPage } from './pages/hr/HrReportsPage';

// Manager Module Pages
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { ManagerMyKpisPage } from './pages/manager/ManagerMyKpisPage';
import { ManagerEmployeesPage } from './pages/manager/ManagerEmployeesPage';
import { ManagerKpiReviewPage } from './pages/manager/ManagerKpiReviewPage';
import { ManagerReportsPage } from './pages/manager/ManagerReportsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-pms-green/20 border-t-pms-green animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const isHr = user?.role === 'ROLE_HR' || user?.role === 'HR';
    const isManager = user?.role === 'ROLE_MANAGER' || user?.role === 'MANAGER';

    if (requiredRole === 'HR' && !isHr) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (requiredRole === 'MANAGER' && !isManager) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Root index redirect based on role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-pms-green/20 border-t-pms-green animate-spin"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const isHr = user?.role === 'ROLE_HR' || user?.role === 'HR';
  const isManager = user?.role === 'ROLE_MANAGER' || user?.role === 'MANAGER';

  if (isHr) return <Navigate to="/hr/dashboard" replace />;
  if (isManager) return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Employee Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kpis"
            element={
              <ProtectedRoute>
                <MyKpis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <PmsHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/:id"
            element={
              <ProtectedRoute>
                <HistoryDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected Manager Routes */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/my-kpis"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerMyKpisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/employees"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerEmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/employees/:employeeId/review"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerKpiReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ManagerReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected HR Routes */}
          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrEmployeeDirectoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees/add"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrAddEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/kpis"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrKpisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/managers"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrManagersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/pms-lifecycle"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrPmsLifecyclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/lifecycle"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrPmsLifecyclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/reports"
            element={
              <ProtectedRoute requiredRole="HR">
                <HrReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Index Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
