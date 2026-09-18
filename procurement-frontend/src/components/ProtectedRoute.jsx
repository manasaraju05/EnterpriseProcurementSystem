import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // If token doesn't exist, route directly to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Always return children when token exists
  return children;
};

export default ProtectedRoute;