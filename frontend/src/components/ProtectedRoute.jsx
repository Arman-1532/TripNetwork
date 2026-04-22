import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Restricts access to routes based on user roles.
 * 
 * @param {Object} user - The current logged-in user object
 * @param {Array} allowedRoles - Array of roles allowed to access this route (e.g. ['admin'])
 * @param {React.ReactNode} children - The component to render if authorized
 */
const ProtectedRoute = ({ user, allowedRoles, children }) => {
  // Normalize user role to lowercase for consistent checking
  const userRole = (user?.role || '').toLowerCase();
  
  // If no user is logged in, redirect to login (handled by App.jsx, but good to have here)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if the user's role is in the allowed list
  // Note: We use lowercase comparison to match the logic in Sidebar.jsx etc.
  const isAuthorized = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

  if (!isAuthorized) {
    console.warn(`🔒 Access Denied: User role '${userRole}' not in allowed roles: [${allowedRoles}]`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
