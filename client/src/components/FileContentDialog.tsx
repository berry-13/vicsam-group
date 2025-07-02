import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  CheckCircle,
  Code,
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
      <DialogContent className="max-w-7xl max-h-[95vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentFile?.isValidSystemData ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <ApplicationIcon
                  version={currentFile.systemData?.ApplicationVersion}
                  size={20}
                />
                {currentFile.systemData?.CustomerName}
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 text-slate-600" />
                {selectedFile?.name}
              </>
            )}
          </DialogTitle>
          {currentFile?.isValidSystemData && (
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
              <div className="flex flex-wrap gap-6 mt-2">
                <span className="flex items-center gap-1">
                  <span className="font-medium">P.IVA:</span> {currentFile.systemData?.CustomerVAT}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Database:</span> {currentFile.systemData?.DatabaseName}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Versione:</span> {currentFile.systemData?.Version}
                </span>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Code className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                Contenuto File JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[70vh] w-full">
                <div className="relative">
                  <pre className="text-sm bg-slate-950 text-slate-50 p-6 m-0 overflow-x-auto font-mono leading-relaxed min-h-full">
                    <code className="language-json">
                      {selectedFile
                        ? JSON.stringify(selectedFile.content, null, 2)
                        : "Caricamento..."}
                    </code>
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
