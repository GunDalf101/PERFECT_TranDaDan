import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "./UserContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted URL
    return <Link to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;