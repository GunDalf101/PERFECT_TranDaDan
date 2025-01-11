import React ,{useEffect, useState} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './UserContext';
import Loading from '../../components/Loading/Loading';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <Loading />;
  }
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
