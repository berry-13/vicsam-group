import React, { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { Upload, AlertCircle, CheckCircle, Database, FileText, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const SaveDataPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const jsonFiles = droppedFiles.filter(file => 
      file.type === 'application/json' || file.name.endsWith('.json')
    );
    
    if (jsonFiles.length !== droppedFiles.length) {
      setError('Solo i file JSON sono supportati');
      return;
    }
    
    setFiles(prev => [...prev, ...jsonFiles]);
    setError(null);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const jsonFiles = selectedFiles.filter(file => 
      file.type === 'application/json' || file.name.endsWith('.json')
    );
    
    if (jsonFiles.length !== selectedFiles.length) {
      setError('Solo i file JSON sono supportati');
      return;
    }
    
    setFiles(prev => [...prev, ...jsonFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Seleziona almeno un file JSON');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const uploadResults = [];
      
      for (const file of files) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Verifica che il JSON contenga CustomerVAT
        if (!jsonData.CustomerVAT) {
          throw new Error(`Il file ${file.name} non contiene il campo CustomerVAT richiesto`);
        }
        
        // Aggiungi metadati al JSON esistente invece di wrapparlo
        const dataToSave = {
          ...jsonData,
          _metadata: {
            originalFileName: file.name,
            uploadDate: new Date().toISOString()
          }
        };
        
        const result = await apiService.saveData(dataToSave);
        uploadResults.push(result.fileName);
      }
      
      setSuccess(`${files.length} file JSON salvati con successo: ${uploadResults.join(', ')}`);
      setFiles([]);
    } catch (err) {
      console.error('Errore durante l\'upload:', err);
      
      if (err instanceof SyntaxError) {
        setError('Errore: uno dei file non è un JSON valido');
      } else if (err instanceof Error) {
        // Gestisci errori dal server
        if (err.message.includes('CustomerVAT è richiesto')) {
          setError('Errore: Il file JSON deve contenere il campo "CustomerVAT"');
        } else if (err.message.includes('non contiene il campo CustomerVAT')) {
          setError(err.message);
        } else {
          setError(`Errore: ${err.message}`);
        }
      } else {
        setError('Errore sconosciuto durante il salvataggio');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Salva File JSON</h2>
          <p className="text-muted-foreground">
            Carica e salva file JSON nel sistema tramite drag-and-drop
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Caricamento File JSON
            </CardTitle>
            <CardDescription>
              Trascina e rilascia i file JSON o clicca per selezionarli
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Success/Error Messages */}
            {success && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Trascina i file JSON qui
              </h3>
              <p className="text-muted-foreground mb-4">
                Oppure clicca per selezionare i file dal tuo computer
              </p>
              <input
                type="file"
                multiple
                accept=".json,application/json"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <Button asChild variant="outline">
                <label htmlFor="file-input" className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Seleziona File JSON
                </label>
              </Button>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">File selezionati:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">JSON</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {files.length > 0 && (
              <div className="mt-6">
                <Button onClick={uploadFiles} className="w-full" disabled={loading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {loading ? 'Caricamento in corso...' : `Carica ${files.length} file`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
