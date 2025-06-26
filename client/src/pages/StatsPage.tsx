import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { DataStats, FileData } from '../services/api';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Database, 
  Calendar,
  HardDrive,
  RefreshCw,
  PieChart,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<DataStats | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, filesData] = await Promise.all([
        apiService.getStats(),
        apiService.getFiles()
      ]);
      setStats(statsData);
      setFiles(filesData.files);
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT');
  };

  const getFileSizeDistribution = () => {
    if (!files.length) return [];
    
    const sizeRanges = [
      { label: '< 1KB', min: 0, max: 1024, count: 0, color: 'bg-primary' },
      { label: '1KB - 10KB', min: 1024, max: 10240, count: 0, color: 'bg-success' },
      { label: '10KB - 100KB', min: 10240, max: 102400, count: 0, color: 'bg-warning' },
      { label: '100KB - 1MB', min: 102400, max: 1048576, count: 0, color: 'bg-destructive' },
      { label: '> 1MB', min: 1048576, max: Infinity, count: 0, color: 'bg-muted' }
    ];

    files.forEach(file => {
      const range = sizeRanges.find(r => file.size >= r.min && file.size < r.max);
      if (range) range.count++;
    });

    return sizeRanges.filter(range => range.count > 0);
  };

  const getRecentFiles = () => {
    return files
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      .slice(0, 5);
  };

  const getAverageFileSize = () => {
    if (!files.length) return 0;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return totalSize / files.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  const sizeDistribution = getFileSizeDistribution();
  const recentFiles = getRecentFiles();
  const averageFileSize = getAverageFileSize();
  const maxSize = Math.max(...sizeDistribution.map(d => d.count));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Statistiche</h2>
          <p className="text-muted-foreground">
            Analisi dettagliata dei dati e file nel sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Totali</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {files.length > 0 ? 'file disponibili' : 'nessun file'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spazio Totale</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats?.totalSize || 0)}</div>
            <p className="text-xs text-muted-foreground">
              spazio utilizzato
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dimensione Media</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(averageFileSize)}</div>
            <p className="text-xs text-muted-foreground">
              per file
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dati Generali</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.generalDataCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              record salvati
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* File Size Distribution */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuzione Dimensioni File
            </CardTitle>
            <CardDescription>
              Analisi della distribuzione delle dimensioni dei file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sizeDistribution.length > 0 ? (
              sizeDistribution.map((range, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${range.color}`} />
                      <span className="text-sm font-medium">{range.label}</span>
                    </div>
                    <Badge variant="secondary">{range.count} file</Badge>
                  </div>
                  <Progress value={(range.count / maxSize) * 100} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Files */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              File Recenti
            </CardTitle>
            <CardDescription>
              Ultimi 5 file modificati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentFiles.length > 0 ? (
              recentFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(file.modified)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nessun file disponibile</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Riepilogo Sistema
          </CardTitle>
          <CardDescription>
            Informazioni generali sul sistema e ultimo aggiornamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.totalFiles || 0}</div>
              <p className="text-sm text-muted-foreground">File Totali</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{formatBytes(stats?.totalSize || 0)}</div>
              <p className="text-sm text-muted-foreground">Spazio Utilizzato</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-orange-600">
                {formatDate(stats?.lastUpdate || null)}
              </div>
              <p className="text-sm text-muted-foreground">Ultimo Aggiornamento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
