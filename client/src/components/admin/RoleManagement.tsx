import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, AlertCircle, Plus } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  userCount: number;
  createdAt: string;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await authService.listRoles();
      // Map the API response to our expected format
      const mappedRoles = response.data.roles.map((role, index) => ({
        id: index + 1, // Generate an ID since API doesn't provide one
        name: role.name,
        displayName: role.name.charAt(0).toUpperCase() + role.name.slice(1), // Generate display name
        description: role.description,
        permissions: role.permissions,
        isSystemRole: role.isDefault || true, // Map isDefault to isSystemRole
        userCount: 0, // Default value since not provided by API
        createdAt: role.createdAt
      }));
      setRoles(mappedRoles);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load roles');
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'destructive';
      case 'manager': return 'secondary';
      case 'user': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading roles...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
              <CardDescription>
                Manage system roles and their associated permissions
              </CardDescription>
            </div>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{role.displayName}</div>
                      <div className="text-sm text-muted-foreground">{role.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{role.userCount} users</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {role.permissions.length} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isSystemRole ? 'secondary' : 'default'}>
                      {role.isSystemRole ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(role.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={role.isSystemRole}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Statistics</CardTitle>
          <CardDescription>
            Overview of role distribution across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Badge variant={getRoleBadgeVariant(role.name)} className="mb-2">
                    {role.displayName}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {role.userCount} users assigned
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{role.permissions.length}</p>
                  <p className="text-xs text-muted-foreground">permissions</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { RoleManagement };
