import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { FileData } from '../services/api';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Search,
  Calendar,
  HardDrive,
  AlertTriangle,
  Loader2,
  Database,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  Code,
  Menu
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Interfaccia per i dati strutturati del JSON
interface CustomMenuItem {
  IDVoceTS: number;
  ClassID: string;
  Description: string;
}

interface SystemData {
  AppVersion?: string;
  DateTime?: string;
  ApplicationVersion?: string;
  InstallationDir?: string;
  DatabaseName?: string;
  SQLServerVersion?: string;
  CustomerVAT?: string;
  CustomerName?: string;
  ResellerVAT?: string;
  ResellerName?: string; 
  Version?: string;
  Build?: string;
  ExistsCustomMenuItems?: boolean;
  CustomMenuItems?: CustomMenuItem[];
  ExistsDocumentPlugins?: boolean;
  DocumentPlugins?: string[];
  ExistsRegDocPers?: boolean;
  ExistsUserfileExeFiles?: boolean;
  VersioneFiscale?: string;
}

interface ParsedFileData extends FileData {
  systemData?: SystemData;
  isValidSystemData: boolean;
}

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<ParsedFileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: unknown } | null>(null);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  const parseSystemData = (content: unknown): { systemData?: SystemData; isValidSystemData: boolean } => {
    try {
      if (content && typeof content === 'object' && (content as SystemData).CustomerVAT) {
        return {
          systemData: content as SystemData,
          isValidSystemData: true
        };
      }
    } catch (error) {
      console.error('Errore nel parsing dei dati di sistema:', error);
    }
    return { isValidSystemData: false };
  };

  const getSQLServerVersionStatus = (version?: string) => {
    if (!version) return { status: 'unknown', label: 'N/A', color: 'text-gray-500' };
    
    const majorVersion = parseInt(version.split('.')[0]);
    if (majorVersion >= 16) return { status: 'current', label: 'Aggiornata', color: 'text-green-600' };
    if (majorVersion >= 14) return { status: 'supported', label: 'Supportata', color: 'text-yellow-600' };
    return { status: 'old', label: 'Obsoleta', color: 'text-red-600' };
  };

  const getVersionStatus = (version?: string) => {
    if (!version) return { status: 'unknown', label: 'N/A', color: 'text-gray-500' };
    
    const [major, minor] = version.split('.').map(Number);
    if (major >= 8 && minor >= 0) return { status: 'current', label: 'Aggiornata', color: 'text-green-600' };
    if (major >= 7) return { status: 'supported', label: 'Supportata', color: 'text-yellow-600' };
    return { status: 'old', label: 'Obsoleta', color: 'text-red-600' };
  };

  const CustomMenuItemsSheet: React.FC<{ items: CustomMenuItem[] }> = ({ items }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Menu className="h-4 w-4 mr-2" />
          {items.length} elementi
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Custom Menu Items</SheetTitle>
          <SheetDescription>
            Elenco degli elementi personalizzati del menu ({items.length} elementi)
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-6 pb-6">
          {items.map((item, index) => (
            <Card key={item.IDVoceTS} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">ID: {item.IDVoceTS}</Badge>
                    <h4 className="font-medium">{item.Description}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {item.ClassID}
                  </p>
                </div>
              </div>
              {index < items.length - 1 && <Separator className="mt-4" />}
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );

  const StructuredView: React.FC<{ data: SystemData }> = ({ data }) => (
    <div className="space-y-6">
      {/* Informazioni Generali */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informazioni Generali
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Cliente</p>
              <p className="text-sm text-muted-foreground">{data.CustomerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">P.IVA Cliente</p>
              <p className="text-sm text-muted-foreground">{data.CustomerVAT || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Rivenditore</p>
              <p className="text-sm text-muted-foreground">{data.ResellerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">P.IVA Rivenditore</p>
              <p className="text-sm text-muted-foreground">{data.ResellerVAT || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Data/Ora</p>
              <p className="text-sm text-muted-foreground">{data.DateTime || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Directory Installazione</p>
              <p className="text-sm text-muted-foreground font-mono">{data.InstallationDir || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informazioni Tecniche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informazioni Tecniche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Versione Applicazione</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{data.Version || 'N/A'}</p>
                <Badge variant={getVersionStatus(data.Version).status === 'old' ? 'destructive' : 'default'}>
                  {getVersionStatus(data.Version).label}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Build</p>
              <p className="text-sm text-muted-foreground">{data.Build || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Versione App</p>
              <p className="text-sm text-muted-foreground">{data.AppVersion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Versione Applicazione</p>
              <p className="text-sm text-muted-foreground">{data.ApplicationVersion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Versione SQL Server</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{data.SQLServerVersion || 'N/A'}</p>
                <Badge variant={getSQLServerVersionStatus(data.SQLServerVersion).status === 'old' ? 'destructive' : 'default'}>
                  {getSQLServerVersionStatus(data.SQLServerVersion).label}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Database</p>
              <p className="text-sm text-muted-foreground">{data.DatabaseName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Versione Fiscale</p>
              <p className="text-sm text-muted-foreground">{data.VersioneFiscale || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funzionalità e Plugin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Menu className="h-5 w-5" />
            Funzionalità e Plugin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Custom Menu Items</p>
                <Badge variant={data.ExistsCustomMenuItems ? 'default' : 'secondary'}>
                  {data.ExistsCustomMenuItems ? 'Presenti' : 'Assenti'}
                </Badge>
              </div>
              {data.ExistsCustomMenuItems && data.CustomMenuItems && (
                <Badge variant="outline">
                  {data.CustomMenuItems.length} elementi
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Plugin Documenti</p>
                <Badge variant={data.ExistsDocumentPlugins ? 'default' : 'secondary'}>
                  {data.ExistsDocumentPlugins ? 'Presenti' : 'Assenti'}
                </Badge>
              </div>
              {data.ExistsDocumentPlugins && data.DocumentPlugins && (
                <Badge variant="outline">
                  {data.DocumentPlugins.length} plugin
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">RegDoc Personalizzati</p>
              <Badge variant={data.ExistsRegDocPers ? 'default' : 'secondary'}>
                {data.ExistsRegDocPers ? 'Presenti' : 'Assenti'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">File Exe Utente</p>
              <Badge variant={data.ExistsUserfileExeFiles ? 'default' : 'secondary'}>
                {data.ExistsUserfileExeFiles ? 'Presenti' : 'Assenti'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Menu Items Dettagli */}
      {data.ExistsCustomMenuItems && data.CustomMenuItems && data.CustomMenuItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              Custom Menu Items ({data.CustomMenuItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.CustomMenuItems.map((item, index) => (
                <div key={item.IDVoceTS} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">ID: {item.IDVoceTS}</Badge>
                        <h4 className="font-medium text-sm">{item.Description}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.ClassID}
                      </p>
                    </div>
                  </div>
                  {index < data.CustomMenuItems!.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Plugins Dettagli */}
      {data.ExistsDocumentPlugins && data.DocumentPlugins && data.DocumentPlugins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Document Plugins ({data.DocumentPlugins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.DocumentPlugins.map((plugin, index) => (
                <div key={index} className="p-2 bg-muted rounded">
                  <p className="text-sm font-mono">{plugin}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const loadFiles = async () => {
    try {
      const data = await apiService.getFiles();
      
      // Carica il contenuto di ogni file per il parsing
      const parsedFiles: ParsedFileData[] = await Promise.all(
        data.files.map(async (file) => {
          try {
            const fileContent = await apiService.getFileContent(file.name);
            const { systemData, isValidSystemData } = parseSystemData(fileContent.content);
            
            return {
              ...file,
              systemData,
              isValidSystemData
            };
          } catch (error) {
            console.error(`Errore nel caricamento di ${file.name}:`, error);
            return {
              ...file,
              isValidSystemData: false
            };
          }
        })
      );
      
      setFiles(parsedFiles);
    } catch (error) {
      console.error('Errore nel caricamento file:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initializeFiles = async () => {
      try {
        const data = await apiService.getFiles();
        
        // Carica il contenuto di ogni file per il parsing
        const parsedFiles: ParsedFileData[] = await Promise.all(
          data.files.map(async (file) => {
            try {
              const fileContent = await apiService.getFileContent(file.name);
              const { systemData, isValidSystemData } = parseSystemData(fileContent.content);
              
              return {
                ...file,
                systemData,
                isValidSystemData
              };
            } catch (error) {
              console.error(`Errore nel caricamento di ${file.name}:`, error);
              return {
                ...file,
                isValidSystemData: false
              };
            }
          })
        );
        
        setFiles(parsedFiles);
      } catch (error) {
        console.error('Errore nel caricamento file:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    initializeFiles();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
  };

  const handleViewFile = async (filename: string) => {
    try {
      const data = await apiService.getFileContent(filename);
      setSelectedFile({ name: data.filename, content: data.content });
    } catch (error) {
      console.error('Errore nel caricamento contenuto file:', error);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await apiService.downloadFile(filename);
    } catch (error) {
      console.error('Errore nel download file:', error);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await apiService.deleteFile(filename);
      setFiles(files.filter(f => f.name !== filename));
    } catch (error) {
      console.error('Errore nella cancellazione file:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT');
  };

  const filteredFiles = files.filter(file =>
    file?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file?.systemData?.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file?.systemData?.CustomerVAT?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Caricamento file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestione File</h2>
          <p className="text-muted-foreground">
            Visualizza, scarica ed elimina i file salvati nel sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary">
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            File Salvati
          </CardTitle>
          <CardDescription>
            Elenco di tutti i file disponibili nel sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                {searchTerm ? 'Nessun file trovato' : 'Nessun file disponibile'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Prova a modificare i termini di ricerca' : 'I file salvati appariranno qui'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>SQL Server</TableHead>
                  <TableHead>Versione</TableHead>
                  <TableHead>Custom Menu</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => {
                  const sqlStatus = getSQLServerVersionStatus(file.systemData?.SQLServerVersion);
                  const versionStatus = getVersionStatus(file.systemData?.Version);
                  
                  return (
                    <TableRow key={file.name}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {file.isValidSystemData ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="font-medium">
                              {file.systemData?.CustomerName || file.name}
                            </span>
                          </div>
                          {file.systemData?.CustomerVAT && (
                            <p className="text-xs text-muted-foreground">
                              P.IVA: {file.systemData.CustomerVAT}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className={sqlStatus.color}>
                              {file.systemData?.SQLServerVersion || 'N/A'}
                            </span>
                          </div>
                          <Badge 
                            variant={sqlStatus.status === 'old' ? 'destructive' : 
                                   sqlStatus.status === 'current' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {sqlStatus.label}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <span className={versionStatus.color}>
                            {file.systemData?.Version || 'N/A'}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            Build: {file.systemData?.Build || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {file.systemData?.ExistsCustomMenuItems && 
                         file.systemData?.CustomMenuItems && 
                         file.systemData.CustomMenuItems.length > 0 ? (
                          <CustomMenuItemsSheet items={file.systemData.CustomMenuItems} />
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Nessuno
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            {formatDate(file.modified)}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewFile(file.name)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {file.isValidSystemData ? (
                                    <>
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                      {file.systemData?.CustomerName}
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-5 w-5" />
                                      {file.name}
                                    </>
                                  )}
                                </DialogTitle>
                                <DialogDescription>
                                  {file.isValidSystemData ? (
                                    <div className="space-y-2 mt-2">
                                      <div className="flex gap-4">
                                        <span>P.IVA: {file.systemData?.CustomerVAT}</span>
                                        <span>Database: {file.systemData?.DatabaseName}</span>
                                        <span>Versione: {file.systemData?.Version}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    'Visualizzazione del contenuto del file selezionato'
                                  )}
                                </DialogDescription>
                                <div className="flex gap-2 mt-4">
                                  <Button
                                    variant={viewMode === 'structured' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('structured')}
                                  >
                                    <Info className="h-4 w-4 mr-2" />
                                    Strutturato
                                  </Button>
                                  <Button
                                    variant={viewMode === 'raw' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('raw')}
                                  >
                                    <Code className="h-4 w-4 mr-2" />
                                    JSON Raw
                                  </Button>
                                </div>
                              </DialogHeader>
                              <div className="mt-4">
                                {viewMode === 'structured' && file.isValidSystemData ? (
                                  <StructuredView data={file.systemData!} />
                                ) : (
                                  <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                    {selectedFile ? JSON.stringify(selectedFile.content, null, 2) : 'Caricamento...'}
                                  </pre>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare il file "{file.systemData?.CustomerName || file.name}"? 
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(file.name)}>
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
