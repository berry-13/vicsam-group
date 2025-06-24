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
  PieChart
} from 'lucide-react';

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
      { label: '< 1KB', min: 0, max: 1024, count: 0 },
      { label: '1KB - 10KB', min: 1024, max: 10240, count: 0 },
      { label: '10KB - 100KB', min: 10240, max: 102400, count: 0 },
      { label: '100KB - 1MB', min: 102400, max: 1048576, count: 0 },
      { label: '> 1MB', min: 1048576, max: Infinity, count: 0 }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sizeDistribution = getFileSizeDistribution();
  const recentFiles = getRecentFiles();
  const averageFileSize = getAverageFileSize();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Statistiche</h1>
                <p className="text-sm text-gray-500">
                  Analisi dettagliata dei dati del sistema
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      File Totali
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.totalFiles || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HardDrive className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Spazio Utilizzato
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatBytes(stats?.totalSize || 0)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Dati Generali
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.generalDataCount || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Dimensione Media
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatBytes(averageFileSize)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
          {/* Size Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Distribuzione per Dimensione
              </h3>
              {sizeDistribution.length > 0 ? (
                <div className="space-y-3">
                  {sizeDistribution.map((range, index) => (
                    <div key={range.label} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className={`w-3 h-3 rounded-full mr-2 ${
                            ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'][index % 5]
                          }`}
                        ></div>
                        <span className="text-sm text-gray-700">{range.label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {range.count} file{range.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nessun dato disponibile</p>
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                File Recenti
              </h3>
              {recentFiles.length > 0 ? (
                <div className="space-y-3">
                  {recentFiles.map((file) => (
                    <div key={file.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(file.modified)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nessun file disponibile</p>
              )}
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Informazioni Sistema
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalFiles || 0}
                </div>
                <div className="text-sm text-gray-500">File Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatBytes(stats?.totalSize || 0)}
                </div>
                <div className="text-sm text-gray-500">Spazio Utilizzato</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(stats?.lastUpdate || null)}
                </div>
                <div className="text-sm text-gray-500">Ultimo Aggiornamento</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
