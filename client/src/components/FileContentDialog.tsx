import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  CheckCircle,
  Code,
  X,
} from "lucide-react";
import { ApplicationIcon } from "./ApplicationIcon";
import { ParsedFileData } from "../types/fileTypes";

interface FileContentDialogProps {
  selectedFile: { name: string; content: unknown } | null;
  files: ParsedFileData[];
  onClose: () => void;
}

export const FileContentDialog: React.FC<FileContentDialogProps> = ({
  selectedFile,
  files,
  onClose,
}) => {
  const currentFile = selectedFile
    ? files.find((f) => f.name === selectedFile.name)
    : null;

  return (
    <Dialog open={!!selectedFile} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-[90vh] w-full p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-2 border-b bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
              {currentFile?.isValidSystemData ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <ApplicationIcon
                    version={currentFile.systemData?.ApplicationVersion}
                    size={20}
                  />
                  <span>{currentFile.systemData?.CustomerName}</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 text-slate-600" />
                  <span>{selectedFile?.name}</span>
                </>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          {currentFile?.isValidSystemData && (
            <div className="flex flex-wrap gap-3 px-6 pt-2 pb-2 bg-slate-50 dark:bg-slate-900/50">
              <Badge variant="secondary">
                P.IVA: {currentFile.systemData?.CustomerVAT}
              </Badge>
              <Badge variant="secondary">
                Database: {currentFile.systemData?.DatabaseName}
              </Badge>
              <Badge variant="secondary">
                Versione: {currentFile.systemData?.Version}
              </Badge>
            </div>
          )}

          <Separator className="my-0" />

          <div className="flex-1 flex flex-col justify-stretch px-6 py-4 overflow-hidden">
            <Card className="border-slate-200 dark:border-slate-800 shadow-none h-full flex flex-col">
              <CardHeader className="pb-2 bg-transparent flex flex-row items-center gap-2">
                <Code className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <CardTitle className="text-base font-medium">
                  Contenuto File JSON
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[60vh] w-full">
                  <pre className="text-sm bg-slate-950 text-slate-50 p-6 m-0 overflow-x-auto font-mono leading-relaxed min-h-full rounded-lg">
                    <code className="language-json">
                      {selectedFile
                        ? JSON.stringify(selectedFile.content, null, 2)
                        : "Caricamento..."}
                    </code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
