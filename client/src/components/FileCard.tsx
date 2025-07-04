import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  Calendar,
  Server,
  MoreVertical,
} from "lucide-react";
import { ApplicationIcon } from "./ApplicationIcon";
import { ParsedFileData } from "../types/fileTypes";
import { formatDate } from "../utils/fileUtils";

interface FileCardProps {
  file: ParsedFileData;
  onView: (filename: string) => void;
  onDownload: (filename: string) => void;
  onDelete: (filename: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onView,
  onDownload,
  onDelete,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {file.isValidSystemData ? (
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            )}

            <ApplicationIcon
              version={file.systemData?.ApplicationVersion}
              size={18}
            />

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold truncate leading-tight">
                {file.systemData?.CustomerName || file.name}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {file.systemData?.CustomerVAT && (
                  <span className="font-mono">
                    P.IVA: {file.systemData.CustomerVAT}
                  </span>
                )}
                {file.systemData?.Version && (
                  <span className="font-mono">
                    v{file.systemData.Version}
                  </span>
                )}
                {file.systemData?.DatabaseName && (
                  <span
                    className="truncate max-w-[120px]"
                    title={file.systemData.DatabaseName}
                  >
                    DB: {file.systemData.DatabaseName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(file.name)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizza
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(file.name)}>
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(file.name)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardContent className="p-0">
          {file.isValidSystemData && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(file.modified)}
                </div>
                {file.systemData?.SQLServerVersion && (
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    <span className="truncate font-mono">
                      {file.systemData.SQLServerVersion}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {file.systemData?.ExistsCustomMenuItems && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    {file.systemData.CustomMenuItems?.length || 0} custom
                  </Badge>
                )}
                {file.systemData?.ApplicationVersion && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[10px] bg-primary/10"
                  >
                    {file.systemData.ApplicationVersion}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {!file.isValidSystemData && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <Calendar className="h-3 w-3" />
                {formatDate(file.modified)}
              </div>
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Dati non strutturati
              </Badge>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};
