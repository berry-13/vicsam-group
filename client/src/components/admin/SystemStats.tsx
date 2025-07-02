import React, { useState, useEffect } from 'react';
import { adminService, type AdminStats } from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react';

const SystemStats: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemStats();
      setStats(response.data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load system statistics');
      console.error('Error loading system stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading system statistics...</div>
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

  if (!stats) {
    return null;
  }

  const activeUserPercentage = stats.totalUsers > 0 
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Statistics
          </CardTitle>
          <CardDescription>
            Overview of system performance and usage metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">User Activity</span>
                </div>
                <Badge variant="outline">{activeUserPercentage}% active</Badge>
              </div>
              <Progress value={activeUserPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{stats.activeUsers} active</span>
                <span>{stats.totalUsers} total</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">System Health</span>
                </div>
                <div className="flex items-center gap-2">
                  {getHealthIcon(stats.systemHealth)}
                  <Badge variant={getHealthBadgeVariant(stats.systemHealth)}>
                    {stats.systemHealth}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                All critical systems are operational
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Last Backup</span>
                </div>
              </div>
              <div className="text-sm">
                {stats.lastBackup 
                  ? new Date(stats.lastBackup).toLocaleDateString()
                  : 'No backup recorded'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                Automated backup system
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              System activity in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">User Logins</span>
                </div>
                <Badge variant="outline">{stats.recentActivity.logins}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">New Registrations</span>
                </div>
                <Badge variant="outline">{stats.recentActivity.registrations}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">System Errors</span>
                </div>
                <Badge variant="outline">{stats.recentActivity.errors}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Key system metrics and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Roles</span>
                <Badge variant="outline">{stats.totalRoles}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Permissions</span>
                <Badge variant="outline">{stats.totalPermissions}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">System Status</span>
                <div className="flex items-center gap-2">
                  {getHealthIcon(stats.systemHealth)}
                  <span className="text-sm capitalize">{stats.systemHealth}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime</span>
                <Badge variant="outline">99.9%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { SystemStats };
