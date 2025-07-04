import React, { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { Upload, Database, FileText, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    failed: number;
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
      const uploadResults: Array<{ originalFile: string; savedAs: string; customerVAT: string; isUpdate: boolean }> = [];
      let successCount = 0;
      let failedCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          if (!jsonData.CustomerVAT) {
            throw new Error(`Il file ${file.name} non contiene il campo CustomerVAT richiesto`);
          }
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
        } catch {
          failedCount++;
        }
        setUploadProgress(Math.min(100, ((i + 1) / files.length) * 100));
      }
      const newFiles = uploadResults.filter(r => !r.isUpdate).length;
      const updatedFiles = uploadResults.filter(r => r.isUpdate).length;
      let successMessage = `${successCount} file processati con successo`;
      if (newFiles > 0 && updatedFiles > 0) {
        successMessage += ` (${newFiles} nuovi, ${updatedFiles} aggiornati)`;
      } else if (newFiles > 0) {
        successMessage += ` (${newFiles} nuovi)`;
      } else if (updatedFiles > 0) {
        successMessage += ` (${updatedFiles} aggiornati)`;
      }
      if (failedCount > 0) {
        successMessage += `, ${failedCount} file falliti`;
      }
      setSuccess({
        message: successMessage,
        results: uploadResults,
        failed: failedCount
      });
      setFiles([]);
    } catch {
      setError('Errore sconosciuto durante il salvataggio');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
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
          {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <AlertTitle className="text-green-200 text-xl">
              Operazione completata
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
            <div className="space-y-3">
              <p className="font-medium">{success.message}</p>
            </div>
            </AlertDescription>
          </Alert>
          )}
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
          {loading && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Caricamento in corso...</span>
                <span className="font-medium">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
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
          {files.length > 0 && !loading && (
          <div className="mt-6 text-center text-muted-foreground text-sm">
            {files.length} file pronti per il caricamento
          </div>
          )}
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
