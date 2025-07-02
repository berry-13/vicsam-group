import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Code,
} from "lucide-react";
import { StructuredView } from "./StructuredView";
import { ApplicationIcon } from "./ApplicationIcon";
import { ParsedFileData } from "../types/fileTypes";

interface FileContentDialogProps {
  selectedFile: { name: string; content: unknown } | null;
  files: ParsedFileData[];
  contentViewMode: "structured" | "raw";
  setContentViewMode: (mode: "structured" | "raw") => void;
  onClose: () => void;
}

export const FileContentDialog: React.FC<FileContentDialogProps> = ({
  selectedFile,
  files,
  contentViewMode,
  setContentViewMode,
  onClose,
}) => {
  const currentFile = selectedFile
    ? files.find((f) => f.name === selectedFile.name)
    : null;

  return (
    <Dialog open={!!selectedFile} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentFile?.isValidSystemData ? (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                <ApplicationIcon
                  version={currentFile.systemData?.ApplicationVersion}
                  size={20}
                />
                {currentFile.systemData?.CustomerName}
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                {selectedFile?.name}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentFile?.isValidSystemData && (
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <span>P.IVA: {currentFile.systemData?.CustomerVAT}</span>
                <span>Database: {currentFile.systemData?.DatabaseName}</span>
                <span>Versione: {currentFile.systemData?.Version}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Tabs
            value={contentViewMode}
            onValueChange={(value) =>
              setContentViewMode(value as "structured" | "raw")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="structured"
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Vista Strutturata
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                JSON Raw
              </TabsTrigger>
            </TabsList>

            <TabsContent value="structured" className="mt-4">
              {currentFile?.isValidSystemData ? (
                <StructuredView data={currentFile.systemData!} />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Dati non strutturati
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Questo file non contiene dati di sistema in formato
                      riconosciuto. Utilizza la vista JSON Raw per visualizzare
                      il contenuto completo.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setContentViewMode("raw")}
                    >
                      Visualizza JSON Raw
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contenuto JSON Raw</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[50vh] w-full">
                    <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-x-auto font-mono">
                      {selectedFile
                        ? JSON.stringify(selectedFile.content, null, 2)
                        : "Caricamento..."}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
