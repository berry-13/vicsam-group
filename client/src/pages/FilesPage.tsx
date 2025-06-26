import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import type { FileData } from "../services/api";
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
  AlertCircle,
  CheckCircle,
  Info,
  Code,
  Menu,
  Building,
  Server,
  Package,
  Filter,
  Grid,
  List,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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

type ViewMode = "grid" | "list";
type FilterType = "all" | "valid" | "invalid" | "outdated";

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<ParsedFileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: unknown;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [contentViewMode, setContentViewMode] = useState<"structured" | "raw">(
    "structured"
  );
  const [filterType, setFilterType] = useState<FilterType>("all");

  const parseSystemData = (
    content: unknown
  ): { systemData?: SystemData; isValidSystemData: boolean } => {
    try {
      if (
        content &&
        typeof content === "object" &&
        (content as SystemData).CustomerVAT
      ) {
        return {
          systemData: content as SystemData,
          isValidSystemData: true,
        };
      }
    } catch (error) {
      console.error("Errore nel parsing dei dati di sistema:", error);
    }
    return { isValidSystemData: false };
  };

  const getSQLServerVersionStatus = (version?: string) => {
    if (!version)
      return {
        status: "unknown",
        label: "Sconosciuta",
        color: "bg-muted text-muted-foreground",
      };

    const majorVersion = parseInt(version.split(".")[0]);
    if (majorVersion >= 16)
      return {
        status: "current",
        label: "Aggiornata",
        color: "bg-success/10 text-success-foreground border-success/20",
      };
    if (majorVersion >= 14)
      return {
        status: "supported",
        label: "Supportata",
        color: "bg-warning/10 text-warning-foreground border-warning/20",
      };
    return {
      status: "old",
      label: "Obsoleta",
      color: "bg-error/10 text-error-foreground border-error/20",
    };
  };

  const getVersionStatus = (version?: string) => {
    if (!version)
      return {
        status: "unknown",
        label: "Sconosciuta",
        color: "bg-muted text-muted-foreground",
      };

    const [major, minor] = version.split(".").map(Number);
    if (major >= 8 && minor >= 0)
      return {
        status: "current",
        label: "Aggiornata",
        color: "bg-success/10 text-success-foreground border-success/20",
      };
    if (major >= 7)
      return {
        status: "supported",
        label: "Supportata",
        color: "bg-warning/10 text-warning-foreground border-warning/20",
      };
    return {
      status: "old",
      label: "Obsoleta",
      color: "bg-error/10 text-error-foreground border-error/20",
    };
  };

  const loadFiles = useCallback(async () => {
    try {
      const data = await apiService.getFiles();

      const parsedFiles: ParsedFileData[] = await Promise.all(
        data.files.map(async (file) => {
          try {
            const fileContent = await apiService.getFileContent(file.name);
            const { systemData, isValidSystemData } = parseSystemData(
              fileContent.content
            );

            return {
              ...file,
              systemData,
              isValidSystemData,
            };
          } catch (error) {
            console.error(`Errore nel caricamento di ${file.name}:`, error);
            return {
              ...file,
              isValidSystemData: false,
            };
          }
        })
      );

      setFiles(parsedFiles);
    } catch (error) {
      console.error("Errore nel caricamento file:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
  };

  const handleViewFile = async (filename: string) => {
    try {
      const data = await apiService.getFileContent(filename);
      setSelectedFile({ name: data.filename, content: data.content });
    } catch (error) {
      console.error("Errore nel caricamento contenuto file:", error);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await apiService.downloadFile(filename);
    } catch (error) {
      console.error("Errore nel download file:", error);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await apiService.deleteFile(filename);
      setFiles(files.filter((f) => f.name !== filename));
    } catch (error) {
      console.error("Errore nella cancellazione file:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredFiles = () => {
    let filtered = files.filter(
      (file) =>
        file?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file?.systemData?.CustomerName?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        file?.systemData?.CustomerVAT?.toLowerCase().includes(
          searchTerm.toLowerCase()
        )
    );

    switch (filterType) {
      case "valid":
        filtered = filtered.filter((file) => file.isValidSystemData);
        break;
      case "invalid":
        filtered = filtered.filter((file) => !file.isValidSystemData);
        break;
      case "outdated":
        filtered = filtered.filter((file) => {
          const versionStatus = getVersionStatus(file.systemData?.Version);
          const sqlStatus = getSQLServerVersionStatus(
            file.systemData?.SQLServerVersion
          );
          return versionStatus.status === "old" || sqlStatus.status === "old";
        });
        break;
    }

    return filtered;
  };

  const filteredFiles = getFilteredFiles();

  // Component per visualizzazione strutturata
  const StructuredView: React.FC<{ data: SystemData }> = ({ data }) => (
    <ScrollArea className="h-[60vh]">
      <div className="space-y-6 p-1">
        {/* Informazioni Cliente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-primary" />
              Informazioni Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Nome Cliente
                </p>
                <p className="text-base font-semibold">
                  {data.CustomerName || "Non specificato"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Partita IVA</p>
                <p className="text-base font-mono">
                  {data.CustomerVAT || "Non specificata"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rivenditore</p>
                <p className="text-base">
                  {data.ResellerName || "Non specificato"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  P.IVA Rivenditore
                </p>
                <p className="text-base font-mono">
                  {data.ResellerVAT || "Non specificata"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informazioni Sistema */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5 text-success" />
              Configurazione Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Versione Applicazione
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold">
                    {data.Version || "N/A"}
                  </p>
                  <Badge className={getVersionStatus(data.Version).color}>
                    {getVersionStatus(data.Version).label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Build</p>
                <p className="text-base font-mono">{data.Build || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">SQL Server</p>
                <div className="flex items-center gap-2">
                  <p className="text-base">{data.SQLServerVersion || "N/A"}</p>
                  <Badge
                    className={
                      getSQLServerVersionStatus(data.SQLServerVersion).color
                    }
                  >
                    {getSQLServerVersionStatus(data.SQLServerVersion).label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Database</p>
                <p className="text-base font-mono">
                  {data.DatabaseName || "N/A"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Directory Installazione
              </p>
              <p className="text-sm font-mono bg-muted/50 p-2 rounded border">
                {data.InstallationDir || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Funzionalità Avanzate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-purple-600" />
              Funzionalità e Plugin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Custom Menu</span>
                <Badge
                  variant={data.ExistsCustomMenuItems ? "default" : "secondary"}
                >
                  {data.ExistsCustomMenuItems
                    ? `${data.CustomMenuItems?.length || 0} elementi`
                    : "Nessuno"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Plugin Documenti</span>
                <Badge
                  variant={data.ExistsDocumentPlugins ? "default" : "secondary"}
                >
                  {data.ExistsDocumentPlugins
                    ? `${data.DocumentPlugins?.length || 0} plugin`
                    : "Nessuno"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">
                  RegDoc Personalizzati
                </span>
                <Badge
                  variant={data.ExistsRegDocPers ? "default" : "secondary"}
                >
                  {data.ExistsRegDocPers ? "Presenti" : "Assenti"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">File Exe Utente</span>
                <Badge
                  variant={
                    data.ExistsUserfileExeFiles ? "default" : "secondary"
                  }
                >
                  {data.ExistsUserfileExeFiles ? "Presenti" : "Assenti"}
                </Badge>
              </div>
            </div>

            {/* Custom Menu Items Details */}
            {data.ExistsCustomMenuItems &&
              data.CustomMenuItems &&
              data.CustomMenuItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-3">
                    Dettagli Custom Menu Items
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.CustomMenuItems.map((item) => (
                      <div
                        key={item.IDVoceTS}
                        className="p-2 border rounded-lg bg-white"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            ID: {item.IDVoceTS}
                          </Badge>
                          <span className="text-sm font-medium">
                            {item.Description}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/70 font-mono">
                          {item.ClassID}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );

  // Component per card singolo file
  const FileCard: React.FC<{ file: ParsedFileData }> = ({ file }) => {
    const versionStatus = getVersionStatus(file.systemData?.Version);
    const sqlStatus = getSQLServerVersionStatus(
      file.systemData?.SQLServerVersion
    );

    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {file.isValidSystemData ? (
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
              )}
              <div className="min-w-0">
                <CardTitle className="text-lg truncate">
                  {file.systemData?.CustomerName || file.name}
                </CardTitle>
                {file.systemData?.CustomerVAT && (
                  <CardDescription className="font-mono">
                    P.IVA: {file.systemData.CustomerVAT}
                  </CardDescription>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewFile(file.name)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizza
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(file.name)}>
                  <Download className="h-4 w-4 mr-2" />
                  Scarica
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(file.name)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {file.isValidSystemData && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Versione App
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">
                      {file.systemData?.Version || "N/A"}
                    </span>
                    <Badge className={versionStatus.color}>
                      {versionStatus.label}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    SQL Server
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      {file.systemData?.SQLServerVersion || "N/A"}
                    </span>
                    <Badge className={sqlStatus.color}>
                      {sqlStatus.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <Calendar className="h-3 w-3" />
                  {formatDate(file.modified)}
                </div>
                {file.systemData?.ExistsCustomMenuItems && (
                  <Badge variant="outline">
                    {file.systemData.CustomMenuItems?.length || 0} custom menu
                  </Badge>
                )}
              </div>
            </>
          )}

          {!file.isValidSystemData && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <Calendar className="h-3 w-3" />
                {formatDate(file.modified)}
              </div>
              <Badge variant="secondary">
                Dati non strutturati
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Caricamento file in corso...
            </h3>
            <p className="text-sm text-muted-foreground">
              Stiamo analizzando i dati del sistema
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestione File Sistema
        </h1>
        <p className="text-muted-foreground">
          Visualizza e gestisci i file di configurazione salvati nel sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info rounded-lg">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{files.length}</p>
                <p className="text-sm text-muted-foreground">File totali</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {files.filter((f) => f.isValidSystemData).length}
                </p>
                <p className="text-sm text-muted-foreground">File validi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    files.filter((f) => {
                      const versionStatus = getVersionStatus(
                        f.systemData?.Version
                      );
                      const sqlStatus = getSQLServerVersionStatus(
                        f.systemData?.SQLServerVersion
                      );
                      return (
                        versionStatus.status === "old" ||
                        sqlStatus.status === "old"
                      );
                    }).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Obsoleti</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Menu className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    files.filter((f) => f.systemData?.ExistsCustomMenuItems)
                      .length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Con custom menu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Cerca per nome cliente, P.IVA o nome file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterType}
            onValueChange={(value: FilterType) => setFilterType(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i file</SelectItem>
              <SelectItem value="valid">Solo file validi</SelectItem>
              <SelectItem value="invalid">File non validi</SelectItem>
              <SelectItem value="outdated">Versioni obsolete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Results */}
      {filteredFiles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || filterType !== "all"
                ? "Nessun file trovato"
                : "Nessun file disponibile"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "I file di configurazione salvati appariranno qui"}
            </p>
            {(searchTerm || filterType !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
              >
                Rimuovi filtri
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {filteredFiles.map((file) => (
            <FileCard key={file.name} file={file} />
          ))}
        </div>
      )}

      {/* File Content Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => {
                const currentFile = selectedFile 
                  ? files.find((f) => f.name === selectedFile.name)
                  : null;
                
                return currentFile?.isValidSystemData ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    {currentFile.systemData?.CustomerName}
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    {selectedFile?.name}
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const currentFile = selectedFile 
                  ? files.find((f) => f.name === selectedFile.name)
                  : null;
                
                return currentFile?.isValidSystemData && (
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span>
                      P.IVA: {currentFile.systemData?.CustomerVAT}
                    </span>
                    <span>
                      Database: {currentFile.systemData?.DatabaseName}
                    </span>
                    <span>
                      Versione: {currentFile.systemData?.Version}
                    </span>
                  </div>
                );
              })()}
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
                {(() => {
                  const currentFile = selectedFile 
                    ? files.find((f) => f.name === selectedFile.name)
                    : null;
                    
                  return currentFile?.isValidSystemData ? (
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
                          riconosciuto. Utilizza la vista JSON Raw per
                          visualizzare il contenuto completo.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setContentViewMode("raw")}
                        >
                          Visualizza JSON Raw
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })()}
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Contenuto JSON Raw
                    </CardTitle>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Conferma eliminazione
            </AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà definitivamente il file selezionato dal
              sistema. L'operazione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
              Elimina definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
