import React from 'react';
import { isAuthenticated } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
    return null;
  }

  return children;
};

export default ProtectedRoute;
