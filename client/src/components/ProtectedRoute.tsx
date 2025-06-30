import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL roles/permissions, otherwise ANY
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false
}) => {
  const { isAuthenticated, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requireAll 
      ? requiredRoles.every(role => hasRole(role))
      : requiredRoles.some(role => hasRole(role));
    
    if (!hasRequiredRoles) {
      return <Navigate to="/" replace />;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => hasPermission(permission))
      : requiredPermissions.some(permission => hasPermission(permission));
    
    if (!hasRequiredPermissions) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
