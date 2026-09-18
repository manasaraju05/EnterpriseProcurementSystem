import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import RaiseRequest from './components/RaiseRequest';
import PaymentPage from './components/PaymentPage';
import SupplierDashboard from './components/SupplierDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';

function App() {
  return (
    // Root dark theme animated background layer
    <div className="animated-bg">
      
      {/* Moving glowing frosted glass blocks */}
      <div className="ambient-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>

      {/* Main app content layer resting securely on top */}
      <div className="app-content">
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/raise-request"
              element={
                <ProtectedRoute>
                  <RaiseRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-dashboard"
              element={
                <ProtectedRoute>
                  <SupplierDashboard />
                </ProtectedRoute>
              }
            />

            {/* Default Redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </div>

    </div>
  );
}

export default App;