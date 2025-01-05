import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserContext';



const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};


const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  return children;
};


export { ProtectedRoute, PublicRoute };