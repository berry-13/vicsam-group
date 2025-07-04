import React from "react";
import { useAuth } from "../contexts/AuthContext";

export const SimpleSettingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  // Debug per capire che tipo di oggetto è user
  console.log('DEBUG - user object:', user);
  console.log('DEBUG - typeof user?.name:', typeof user?.name);
  console.log('DEBUG - user?.name:', user?.name);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings Debug</h1>
      
      <div className="bg-blue-50 p-4 rounded border">
        <h2 className="text-lg font-semibold mb-2">User Object Debug</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
          <div><strong>ID:</strong> {user?.id || 'N/A'}</div>
          <div><strong>Name Type:</strong> {typeof user?.name}</div>
          <div><strong>Name Value:</strong> {String(user?.name || 'N/A')}</div>
          <div><strong>FirstName:</strong> {user?.firstName || 'N/A'}</div>
          <div><strong>LastName:</strong> {user?.lastName || 'N/A'}</div>
          <div><strong>Has Admin Role:</strong> {hasRole('admin') ? 'YES' : 'NO'}</div>
          <div><strong>Roles:</strong> {JSON.stringify(user?.roles)}</div>
          <div><strong>Permissions:</strong> {JSON.stringify(user?.permissions)}</div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded border">
        <h2 className="text-lg font-semibold mb-2">Raw User Object</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
};
