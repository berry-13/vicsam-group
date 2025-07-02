import React, { useState, useEffect } from 'react';
import { adminService, type SystemSetting, type HealthCheck } from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  AlertCircle, 
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive
} from 'lucide-react';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, healthResponse] = await Promise.all([
        adminService.getSystemSettings(),
        adminService.testSystemHealth()
      ]);
      
      setSettings(settingsResponse.data);
      setHealthChecks(healthResponse.data.checks);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load system settings');
      console.error('Error loading system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: string, value: string) => {
    try {
      setSaving(key);
      await adminService.updateSystemSetting(key, value);
      
      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      ));
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const handleHealthCheck = async () => {
    try {
      setRunningHealthCheck(true);
      const response = await adminService.testSystemHealth();
      setHealthChecks(response.data.checks);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to run health check');
    } finally {
      setRunningHealthCheck(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackingUp(true);
      const response = await adminService.performSystemBackup();
      if (response.data.success) {
        setError(null);
        // Show success message (you could use a toast here)
        alert(`Backup created successfully: ${response.data.backupId}`);
      } else {
        setError('Backup failed');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create backup');
    } finally {
      setBackingUp(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'ok': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value === 'true'}
            onCheckedChange={(checked) => 
              handleSettingChange(setting.key, checked.toString())
            }
            disabled={saving === setting.key}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            disabled={saving === setting.key}
            className="w-32"
          />
        );
      default:
        return (
          <Input
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            disabled={saving === setting.key}
            className="w-64"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading system settings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system behavior and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setting</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map(setting => (
                <TableRow key={setting.key}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{setting.key}</div>
                      <div className="text-sm text-muted-foreground">
                        {setting.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {renderSettingInput(setting)}
                      {saving === setting.key && (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{setting.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Monitor system component health and performance
                </CardDescription>
              </div>
              <Button 
                onClick={handleHealthCheck} 
                disabled={runningHealthCheck}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${runningHealthCheck ? 'animate-spin' : ''}`} />
                {runningHealthCheck ? 'Checking...' : 'Run Check'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(check.status)}
                    <div>
                      <div className="text-sm font-medium">{check.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {check.message}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.duration && (
                      <span className="text-xs text-muted-foreground">
                        {check.duration}ms
                      </span>
                    )}
                    <Badge variant={getHealthBadgeVariant(check.status)}>
                      {check.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Maintenance
            </CardTitle>
            <CardDescription>
              System backup and maintenance operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">System Backup</div>
                  <div className="text-sm text-muted-foreground">
                    Create a full system backup
                  </div>
                </div>
                <Button 
                  onClick={handleBackup} 
                  disabled={backingUp}
                  variant="outline"
                >
                  <Database className={`mr-2 h-4 w-4 ${backingUp ? 'animate-pulse' : ''}`} />
                  {backingUp ? 'Creating...' : 'Backup Now'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Clear Cache</div>
                  <div className="text-sm text-muted-foreground">
                    Clear system cache and temporary files
                  </div>
                </div>
                <Button variant="outline" disabled>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Restart Services</div>
                  <div className="text-sm text-muted-foreground">
                    Restart all system services
                  </div>
                </div>
                <Button variant="outline" disabled>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { SystemSettings };
