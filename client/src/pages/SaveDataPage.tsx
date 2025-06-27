import React, { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { Upload, AlertCircle, CheckCircle, Database, FileText, X, CheckCircle2, XCircle, FileCheck, FileX, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from '@/components/PageContainer';
import { Progress } from "@/components/ui/progress";
import Spinner from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export const SaveDataPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState<{
    message: string;
    results: Array<{
      originalFile: string;
      savedAs: string;
      customerVAT: string;
      isUpdate: boolean;
    }>;
  } | null>(null);
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
    setSuccess(null);
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
    setSuccess(null);
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
    setUploadProgress(0);

    try {
      const uploadResults = [];
      let successCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(((i + 1) / files.length) * 100);
        
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
        uploadResults.push({
          originalFile: file.name,
          savedAs: result.fileName,
          customerVAT: jsonData.CustomerVAT,
          isUpdate: result.isUpdate || false
        });
        successCount++;
      }
      
      const newFiles = uploadResults.filter(r => !r.isUpdate).length;
      const updatedFiles = uploadResults.filter(r => r.isUpdate).length;
      
      let successMessage = `${successCount} file processati con successo`;
      if (newFiles > 0 && updatedFiles > 0) {
        successMessage += ` ($${newFiles} nuovi, $${updatedFiles} aggiornati)`;
      } else if (newFiles > 0) {
        successMessage += ` (${newFiles} nuovi)`;
      } else if (updatedFiles > 0) {
        successMessage += ` (${updatedFiles} aggiornati)`;
      }
      
      setSuccess({
        message: successMessage,
        results: uploadResults
      });
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
      setUploadProgress(0);
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
    <PageContainer intensity={2}>
      <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-2xl">
        <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Caricamento File JSON
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Success Message */}
          {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <AlertTitle className="text-green-200 text-xl">
              Operazione completata
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
            <div className="space-y-3">
              <p className="font-medium">{success.message}</p>
              {success.results.length > 0 && (
              <div className="mt-4 space-y-2 pt-3">
                {success.results.map((result, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-xl transition-colors",
                    "hover:bg-green-100 dark:hover:bg-green-900"
                  )}
                >
                  <div className="mt-0.5">
                    {result.isUpdate ? (
                      <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <FileCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={result.isUpdate ? "secondary" : "default"} 
                        className={cn(
                          "text-xs",
                          result.isUpdate 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        )}
                      >
                        {result.isUpdate ? "Aggiornato" : "Nuovo"}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        {result.originalFile}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Salvato come: <span className="font-mono">{result.savedAs}</span></p>
                      <p>P.IVA Cliente: <span className="font-mono">{result.customerVAT}</span></p>
                    </div>
                  </div>
                </div>
                ))}
              </div>
              )}
            </div>
            </AlertDescription>
          </Alert>
          )}

          {/* Error Message */}
          {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <XCircle className="h-5 w-5" />
            <AlertTitle>Errore durante il caricamento</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>{error}</p>
                <div className="flex items-start gap-2 mt-3 p-2 bg-red-100 dark:bg-red-900 rounded-md">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Requisiti del file JSON:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Il file deve essere in formato JSON valido</li>
                      <li>Deve contenere il campo "CustomerVAT" con la P.IVA del cliente</li>
                      <li>L'estensione del file deve essere .json</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          )}

          {/* Upload Progress */}
          {loading && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Caricamento in corso...</span>
                <span className="font-medium">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Drag and Drop Area */}
          <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
            dragActive 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            loading && "opacity-50 pointer-events-none"
          )}
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
            disabled={loading}
          />
          <Button asChild variant="outline" disabled={loading}>
            <label htmlFor="file-input" className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            Seleziona File JSON
            </label>
          </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">File selezionati:</h4>
              <Badge variant="secondary">{files.length} file</Badge>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
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
                <Badge variant="secondary" className="text-xs">JSON</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
                </div>
              </div>
              ))}
            </div>
          </div>
          )}

          {/* Upload Button */}
          {files.length > 0 && (
          <div className="mt-6">
            <Button 
              onClick={uploadFiles} 
              className="w-full" 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Caricamento in corso...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Carica {files.length} file
                </>
              )}
            </Button>
          </div>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Informazioni utili:</p>
                <ul className="space-y-1 text-xs">
                  <li>• I file JSON devono contenere dati validi con il campo CustomerVAT</li>
                  <li>• Se un file per lo stesso cliente esiste già, verrà aggiornato</li>
                  <li>• I file vengono salvati con un nome univoco basato sulla P.IVA del cliente</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
      </div>
    </PageContainer>
  );
};
