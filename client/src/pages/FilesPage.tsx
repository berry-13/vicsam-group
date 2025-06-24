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
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: unknown } | null>(null);

  const loadFiles = async () => {
    try {
      const data = await apiService.getFiles();
      setFiles(data.files);
    } catch (error) {
      console.error('Errore nel caricamento file:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFiles();
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT');
  };

  const getFileIcon = (type: string) => {
    if (type.includes('json')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <TableHead>Nome File</TableHead>
                  <TableHead>Dimensione</TableHead>
                  <TableHead>Data Modifica</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span>{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(file.modified)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.type}</Badge>
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
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Contenuto del file: {selectedFile?.name}</DialogTitle>
                              <DialogDescription>
                                Visualizzazione del contenuto del file selezionato
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                {selectedFile ? JSON.stringify(selectedFile.content, null, 2) : 'Caricamento...'}
                              </pre>
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
                                Sei sicuro di voler eliminare il file "{file.name}"? 
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
