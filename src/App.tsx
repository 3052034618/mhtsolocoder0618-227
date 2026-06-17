import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { getRoleHomeRoute } from './utils';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppRoute } from './components/AppRoute';

import { Login } from './pages/Login';

import { CustomerHome } from './pages/Customer/Home';
import { CreateOrder } from './pages/Customer/CreateOrder';
import { OrderList } from './pages/Customer/OrderList';
import { OrderDetail } from './pages/Customer/OrderDetail';
import { RecurringService } from './pages/Customer/RecurringService';

import { DispatcherDashboard } from './pages/Dispatcher/Dashboard';
import { OrderManagement } from './pages/Dispatcher/OrderManagement';
import { ScheduleBoard } from './pages/Dispatcher/ScheduleBoard';
import { ReviewManagement } from './pages/Dispatcher/ReviewManagement';

import { CleanerHome } from './pages/Cleaner/Home';
import { CleanerOrderList } from './pages/Cleaner/OrderList';
import { ServiceDetail } from './pages/Cleaner/ServiceDetail';
import { CleanerProfile } from './pages/Cleaner/Profile';

import { CleanerManagement } from './pages/Admin/CleanerManagement';
import { PerformanceStats } from './pages/Admin/PerformanceStats';

function HomeRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user) {
    return <Navigate to={getRoleHomeRoute(user.role)} replace />;
  }
  
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <AppRoute>
                <Routes>
                  <Route path="" element={<CustomerHome />} />
                  <Route path="order" element={<CreateOrder />} />
                  <Route path="orders" element={<OrderList />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="recurring" element={<RecurringService />} />
                  <Route path="*" element={<Navigate to="/customer" replace />} />
                </Routes>
              </AppRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dispatcher/*"
          element={
            <ProtectedRoute allowedRoles={['dispatcher']}>
              <AppRoute>
                <Routes>
                  <Route path="" element={<DispatcherDashboard />} />
                  <Route path="orders" element={<OrderManagement />} />
                  <Route path="schedule" element={<ScheduleBoard />} />
                  <Route path="reviews" element={<ReviewManagement />} />
                  <Route path="*" element={<Navigate to="/dispatcher" replace />} />
                </Routes>
              </AppRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cleaner/*"
          element={
            <ProtectedRoute allowedRoles={['cleaner']}>
              <AppRoute>
                <Routes>
                  <Route path="" element={<CleanerHome />} />
                  <Route path="orders" element={<CleanerOrderList />} />
                  <Route path="orders/:id" element={<ServiceDetail />} />
                  <Route path="profile" element={<CleanerProfile />} />
                  <Route path="*" element={<Navigate to="/cleaner" replace />} />
                </Routes>
              </AppRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppRoute>
                <Routes>
                  <Route path="" element={<PerformanceStats />} />
                  <Route path="cleaners" element={<CleanerManagement />} />
                  <Route path="statistics" element={<PerformanceStats />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AppRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Router>
  );
}
