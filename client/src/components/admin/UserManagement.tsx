import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, Shield } from 'lucide-react';

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions. The user management functionality is available in the dedicated Users page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Total Users</p>
                <p className="text-sm text-muted-foreground">Active accounts</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Verified Users</p>
                <p className="text-sm text-muted-foreground">Email verified</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Recent Logins</p>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Admin Users</p>
                <p className="text-sm text-muted-foreground">System administrators</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="flex gap-2">
              <Badge variant="outline">View All Users</Badge>
              <Badge variant="outline">Export Users</Badge>
              <Badge variant="outline">Manage Roles</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { UserManagement };
