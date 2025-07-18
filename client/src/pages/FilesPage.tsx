import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  X,
  SortAsc,
  SortDesc,
} from "lucide-react";
import ALYIcon from "@/assets/ALY.ico";
import TSEIcon from "@/assets/TSE.ico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageContainer } from "@/components/PageContainer";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import Spinner from "@/components/ui/spinner";

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

type ViewMode = "grid" | "list" | "table";
type FilterType = "all" | "valid" | "invalid" | "outdated";
type SortDirection = "asc" | "desc" | null;

interface ColumnFilter {
  applicationVersion: string[];
  customerName: string;
  customerVAT: string;
  version: string[];
  sqlServerVersion: string[];
  databaseName: string;
  hasCustomMenus: boolean | null;
  status: string[];
}

interface SortConfig {
  column: string;
  direction: SortDirection;
}

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<ParsedFileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: unknown;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [contentViewMode, setContentViewMode] = useState<"structured" | "raw">(
    "structured"
  );
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Stati per filtri avanzati e ordinamento
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    applicationVersion: [],
    customerName: "",
    customerVAT: "",
    version: [],
    sqlServerVersion: [],
    databaseName: "",
    hasCustomMenus: null,
    status: [],
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "",
    direction: null,
  });

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

  const handleDelete = (filename: string) => {
    setFileToDelete(filename);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      await apiService.deleteFile(fileToDelete);
      setFiles(files.filter((f) => f.name !== fileToDelete));
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("Errore nella cancellazione file:", error);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
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

  // Funzioni per la gestione dei filtri e ordinamento
  const handleSort = (column: string) => {
    setSortConfig((prev) => ({
      column,
      direction:
        prev.column === column
          ? prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
            ? null
            : "asc"
          : "asc",
    }));
  };

  const handleColumnFilterChange = (
    column: keyof ColumnFilter,
    value: unknown
  ) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  const clearAllFilters = () => {
    setColumnFilters({
      applicationVersion: [],
      customerName: "",
      customerVAT: "",
      version: [],
      sqlServerVersion: [],
      databaseName: "",
      hasCustomMenus: null,
      status: [],
    });
    setSearchTerm("");
    setSortConfig({ column: "", direction: null });
  };

  // Ottieni valori unici per i filtri a dropdown
  const getUniqueValues = (field: keyof SystemData) => {
    const values = files
      .filter((f) => f.systemData?.[field])
      .map((f) => f.systemData![field] as string)
      .filter((v) => v && v.trim() !== "");
    return [...new Set(values)].sort();
  };

  // Applica filtri e ordinamento
  const filteredAndSortedFiles = useMemo(() => {
    const filtered = files.filter((file) => {
      // Filtro di ricerca generale
      const matchesSearch =
        !searchTerm ||
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.CustomerName?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        file.systemData?.CustomerVAT?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        file.systemData?.DatabaseName?.toLowerCase().includes(
          searchTerm.toLowerCase()
        );

      if (!matchesSearch) return false;

      // Filtro per tipo
      if (filterType !== "all") {
        if (filterType === "valid" && !file.isValidSystemData) return false;
        if (filterType === "invalid" && file.isValidSystemData) return false;
        if (filterType === "outdated") {
          return false;
        }
      }

      // Filtri per colonne specifiche
      if (
        columnFilters.applicationVersion.length > 0 &&
        !columnFilters.applicationVersion.includes(
          file.systemData?.ApplicationVersion || ""
        )
      ) {
        return false;
      }

      if (
        columnFilters.customerName &&
        !file.systemData?.CustomerName?.toLowerCase().includes(
          columnFilters.customerName.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        columnFilters.customerVAT &&
        !file.systemData?.CustomerVAT?.toLowerCase().includes(
          columnFilters.customerVAT.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        columnFilters.version.length > 0 &&
        !columnFilters.version.includes(file.systemData?.Version || "")
      ) {
        return false;
      }

      if (
        columnFilters.sqlServerVersion.length > 0 &&
        !columnFilters.sqlServerVersion.includes(
          file.systemData?.SQLServerVersion || ""
        )
      ) {
        return false;
      }

      if (
        columnFilters.databaseName &&
        !file.systemData?.DatabaseName?.toLowerCase().includes(
          columnFilters.databaseName.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        columnFilters.hasCustomMenus !== null &&
        Boolean(file.systemData?.ExistsCustomMenuItems) !==
          columnFilters.hasCustomMenus
      ) {
        return false;
      }

      if (columnFilters.status.length > 0) {
        const fileStatus = file.isValidSystemData ? "valido" : "invalido";
        if (!columnFilters.status.includes(fileStatus)) return false;
      }

      return true;
    });

    // Applica ordinamento
    if (sortConfig.column && sortConfig.direction) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date, bValue: string | number | Date;

        switch (sortConfig.column) {
          case "customerName":
            aValue = a.systemData?.CustomerName || a.name;
            bValue = b.systemData?.CustomerName || b.name;
            break;
          case "applicationVersion":
            aValue = a.systemData?.ApplicationVersion || "";
            bValue = b.systemData?.ApplicationVersion || "";
            break;
          case "customerVAT":
            aValue = a.systemData?.CustomerVAT || "";
            bValue = b.systemData?.CustomerVAT || "";
            break;
          case "version":
            aValue = a.systemData?.Version || "";
            bValue = b.systemData?.Version || "";
            break;
          case "sqlServerVersion":
            aValue = a.systemData?.SQLServerVersion || "";
            bValue = b.systemData?.SQLServerVersion || "";
            break;
          case "databaseName":
            aValue = a.systemData?.DatabaseName || "";
            bValue = b.systemData?.DatabaseName || "";
            break;
          case "modified":
            aValue = new Date(a.modified);
            bValue = new Date(b.modified);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [files, searchTerm, filterType, columnFilters, sortConfig]);

  // Component per visualizzazione strutturata ottimizzata
  const StructuredView: React.FC<{ data: SystemData }> = ({ data }) => {
    const [expandedExtension, setExpandedExtension] = useState<string | null>(null);

    // Gestisce l'apertura/chiusura dei popup per le estensioni
    const toggleExtensionDetails = (extensionType: string) => {
      setExpandedExtension(expandedExtension === extensionType ? null : extensionType);
    };

    // Component per indicatore di estendibilità
    const ExtensibilityIndicator: React.FC<{
      label: string;
      enabled: boolean;
      items?: Array<{ Description: string; ClassID?: string; IDVoceTS?: number }> | string[];
      type: string;
    }> = ({ label, enabled, items, type }) => (
      <div className="relative">
        <div 
          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
            enabled 
              ? 'bg-success/5 border-success/20 hover:bg-success/10 cursor-pointer' 
              : 'bg-muted/30 border-muted/30'
          }`}
          onClick={enabled && items?.length ? () => toggleExtensionDetails(type) : undefined}
          role={enabled && items?.length ? "button" : undefined}
          tabIndex={enabled && items?.length ? 0 : -1}
          aria-label={`${label}${enabled ? ' - Attivo' : ' - Non attivo'}${items?.length ? '. Clicca per dettagli' : ''}`}
        >
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
              enabled ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {enabled ? '✓' : '✗'}
            </div>
            {enabled && items?.length && (
              <div className="text-xs text-muted-foreground">
                ({items.length})
              </div>
            )}
          </div>
        </div>

        {/* Popup con dettagli */}
        {expandedExtension === type && enabled && items?.length && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{label}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setExpandedExtension(null)}
                  aria-label="Chiudi dettagli"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="p-2 text-xs bg-muted/10 rounded border">
                  {typeof item === 'string' ? (
                    <span className="font-mono">{item}</span>
                  ) : (
                    <div>
                      <div className="font-medium mb-1">{item.Description}</div>
                      {item.ClassID && (
                        <div className="text-muted-foreground font-mono">{item.ClassID}</div>
                      )}
                      {item.IDVoceTS && (
                        <div className="text-muted-foreground">ID: {item.IDVoceTS}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    return (
      <ScrollArea className="h-[60vh]">
        <div className="p-4 space-y-6">
          {/* Layout principale a due colonne */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Colonna sinistra - Informazioni statiche */}
            <div className="space-y-4">
              
              {/* Applicazione */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Applicazione</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ApplicationIcon version={data.ApplicationVersion} size={24} />
                    <div>
                      <div className="font-medium">{data.ApplicationVersion || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {data.Version && data.Build 
                          ? `${data.Version} – ${data.Build}`
                          : data.Version || 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cliente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Ragione sociale</div>
                    <div className="font-medium">{data.CustomerName || 'Non specificato'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">P. IVA</div>
                    <div className="font-mono text-sm">{data.CustomerVAT || 'Non specificata'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* SQL Server */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    SQL Server
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-sm text-muted-foreground">Versione</div>
                    <div className="font-mono text-sm">{data.SQLServerVersion || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* App Version (framework) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">App Version</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm">{data.AppVersion || 'N/A'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Colonna destra - Indicatori di estendibilità */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Indicatori di Estendibilità
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ExtensibilityIndicator
                    label="Custom Menu Items"
                    enabled={Boolean(data.ExistsCustomMenuItems)}
                    items={data.CustomMenuItems}
                    type="customMenu"
                  />
                  
                  <ExtensibilityIndicator
                    label="Document Plugins"
                    enabled={Boolean(data.ExistsDocumentPlugins)}
                    items={data.DocumentPlugins?.map(plugin => ({ Description: plugin }))}
                    type="documentPlugins"
                  />
                  
                  <ExtensibilityIndicator
                    label="Reg Doc Pers"
                    enabled={Boolean(data.ExistsRegDocPers)}
                    type="regDocPers"
                  />
                  
                  <ExtensibilityIndicator
                    label="User File EXE Files"
                    enabled={Boolean(data.ExistsUserfileExeFiles)}
                    type="userFileExe"
                  />
                </CardContent>
              </Card>

              {/* Informazioni aggiuntive */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-sm text-muted-foreground">Nome Database</div>
                    <div className="font-mono text-sm">{data.DatabaseName || 'N/A'}</div>
                  </div>
                </CardContent>
              </Card>

              {data.InstallationDir && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Installazione</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <div className="text-sm text-muted-foreground">Directory</div>
                      <div className="font-mono text-xs bg-muted/50 p-2 rounded border break-all">
                        {data.InstallationDir}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  // Componente per l'icona dell'applicazione
  const ApplicationIcon: React.FC<{ version?: string; size?: number }> = ({
    version,
    size = 20,
  }) => {
    if (!version) return null;

    const iconSrc =
      version === "ALY" ? ALYIcon : version === "TSE" ? TSEIcon : null;

    if (!iconSrc) return null;

    return (
      <img
        src={iconSrc}
        alt={`${version} Logo`}
        className="flex-shrink-0"
        style={{ width: size, height: size }}
        title={`Applicazione ${version}`}
      />
    );
  };

  // Component per card singolo file
  const FileCard: React.FC<{ file: ParsedFileData }> = ({ file }) => {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
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
                <CardTitle className="text-base truncate leading-tight">
                  {file.systemData?.CustomerName || file.name}
                </CardTitle>
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

        <CardContent className="pt-0 pb-3">
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
      </Card>
    );
  };

  // Componente per filtri delle colonne
  const ColumnFilterPopover: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted"
          title={`Filtra ${title}`}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="font-medium">{title}</div>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );

  // Componente header di tabella con ordinamento
  const SortableTableHead: React.FC<{
    column: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ column, children, className }) => (
    <TableHead className={className}>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => handleSort(column)}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          <div className="flex items-center gap-1">
            {children}
            {sortConfig.column === column && (
              <>
                {sortConfig.direction === "asc" && (
                  <SortAsc className="h-3 w-3" />
                )}
                {sortConfig.direction === "desc" && (
                  <SortDesc className="h-3 w-3" />
                )}
              </>
            )}
          </div>
        </Button>
      </div>
    </TableHead>
  );

  // Componente per la visualizzazione della tabella
  const DataTable: React.FC = () => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead column="applicationVersion" className="w-20">
              App
            </SortableTableHead>
            <SortableTableHead column="customerName" className="min-w-[200px]">
              <div className="flex items-center gap-2">
                Cliente
                <ColumnFilterPopover
                  title="Filtra per Cliente"
                >
                  <Input
                    placeholder="Nome cliente..."
                    value={columnFilters.customerName}
                    onChange={(e) =>
                      handleColumnFilterChange("customerName", e.target.value)
                    }
                  />
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <SortableTableHead column="customerVAT" className="w-32">
              <div className="flex items-center gap-2">
                P.IVA
                <ColumnFilterPopover
                  title="Filtra per P.IVA"
                >
                  <Input
                    placeholder="P.IVA..."
                    value={columnFilters.customerVAT}
                    onChange={(e) =>
                      handleColumnFilterChange("customerVAT", e.target.value)
                    }
                  />
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <SortableTableHead column="version" className="w-24">
              <div className="flex items-center gap-2">
                Versione
                <ColumnFilterPopover
                  title="Filtra per Versione"
                >
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getUniqueValues("Version").map((version) => (
                      <div
                        key={version}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`version-${version}`}
                          checked={columnFilters.version.includes(version)}
                          onCheckedChange={(checked) => {
                            const newVersions = checked
                              ? [...columnFilters.version, version]
                              : columnFilters.version.filter(
                                  (v) => v !== version
                                );
                            handleColumnFilterChange("version", newVersions);
                          }}
                        />
                        <label
                          htmlFor={`version-${version}`}
                          className="text-sm"
                        >
                          {version}
                        </label>
                      </div>
                    ))}
                  </div>
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <SortableTableHead column="sqlServerVersion" className="w-32">
              <div className="flex items-center gap-2">
                SQL Server
                <ColumnFilterPopover
                  title="Filtra per SQL Server"
                >
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getUniqueValues("SQLServerVersion").map((version) => (
                      <div
                        key={version}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`sql-${version}`}
                          checked={columnFilters.sqlServerVersion.includes(
                            version
                          )}
                          onCheckedChange={(checked) => {
                            const newVersions = checked
                              ? [...columnFilters.sqlServerVersion, version]
                              : columnFilters.sqlServerVersion.filter(
                                  (v) => v !== version
                                );
                            handleColumnFilterChange(
                              "sqlServerVersion",
                              newVersions
                            );
                          }}
                        />
                        <label htmlFor={`sql-${version}`} className="text-sm">
                          {version}
                        </label>
                      </div>
                    ))}
                  </div>
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <SortableTableHead column="databaseName" className="w-40">
              <div className="flex items-center gap-2">
                Database
                <ColumnFilterPopover
                  title="Filtra per Database"
                >
                  <Input
                    placeholder="Nome database..."
                    value={columnFilters.databaseName}
                    onChange={(e) =>
                      handleColumnFilterChange("databaseName", e.target.value)
                    }
                  />
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <TableHead className="w-24">Status</TableHead>
            <SortableTableHead column="modified" className="w-32">
              Data
            </SortableTableHead>
            <TableHead className="w-24">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedFiles.map((file) => {
            return (
              <TableRow
                key={file.name}
                className="hover:bg-muted/30"
              >
                <TableCell>
                  <div className="flex items-center justify-center">
                    <ApplicationIcon
                      version={file.systemData?.ApplicationVersion}
                      size={16}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {file.isValidSystemData ? (
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div
                        className="font-medium truncate"
                        title={file.systemData?.CustomerName || file.name}
                      >
                        {file.systemData?.CustomerName || file.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">
                    {file.systemData?.CustomerVAT || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono">
                    {file.systemData?.Version || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className="text-sm font-mono truncate"
                    title={file.systemData?.SQLServerVersion}
                  >
                    {file.systemData?.SQLServerVersion || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className="text-sm truncate"
                    title={file.systemData?.DatabaseName}
                  >
                    {file.systemData?.DatabaseName || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {file.systemData?.ExistsCustomMenuItems && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {file.systemData.CustomMenuItems?.length || 0} custom
                      </Badge>
                    )}
                    {file.systemData?.ExistsDocumentPlugins && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {file.systemData.DocumentPlugins?.length || 0} plugins
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(file.modified)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewFile(file.name)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizza
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(file.name)}
                      >
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {filteredAndSortedFiles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun file trovato con i filtri applicati
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <PageContainer intensity={1}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <h3 className="text-lg font-semibold">
            Caricamento file in corso...
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Stiamo analizzando i dati del sistema
        </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer intensity={4} withPadding={false} className="space-y-6 p-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <div className="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
                <ApplicationIcon version="ALY" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    files.filter(
                      (f) => f.systemData?.ApplicationVersion === "ALY"
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">ALY</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex items-center justify-center">
                <ApplicationIcon version="TSE" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    files.filter(
                      (f) => f.systemData?.ApplicationVersion === "TSE"
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">TSE</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    files.filter((f) => f.systemData?.ExistsDocumentPlugins)
                      .length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Con plugins</p>
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
      <div className="flex flex-col gap-4">
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
              </SelectContent>
            </Select>

            {/* Filtro per applicazioni */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Package className="h-4 w-4 mr-2" />
                  App ({columnFilters.applicationVersion.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <div className="font-medium">Filtra per Applicazione</div>
                  {["ALY", "TSE"].map((app) => (
                    <div key={app} className="flex items-center space-x-2">
                      <Checkbox
                        id={`app-${app}`}
                        checked={columnFilters.applicationVersion.includes(app)}
                        onCheckedChange={(checked) => {
                          const newApps = checked
                            ? [...columnFilters.applicationVersion, app]
                            : columnFilters.applicationVersion.filter(
                                (a) => a !== app
                              );
                          handleColumnFilterChange(
                            "applicationVersion",
                            newApps
                          );
                        }}
                      />
                      <label
                        htmlFor={`app-${app}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <ApplicationIcon version={app} size={16} />
                        {app}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Pulsante per cancellare tutti i filtri */}
            {(searchTerm ||
              filterType !== "all" ||
              columnFilters.applicationVersion.length > 0 ||
              columnFilters.customerName ||
              columnFilters.customerVAT ||
              columnFilters.version.length > 0 ||
              columnFilters.sqlServerVersion.length > 0 ||
              columnFilters.databaseName ||
              columnFilters.hasCustomMenus !== null ||
              columnFilters.status.length > 0) && (
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Cancella filtri
              </Button>
            )}

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
      </div>

      {/* Results */}
      {filteredAndSortedFiles.length === 0 ? (
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
              <Button variant="outline" onClick={clearAllFilters}>
                Rimuovi filtri
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <DataTable />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {filteredAndSortedFiles.map((file) => (
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
                );
              })()}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const currentFile = selectedFile
                  ? files.find((f) => f.name === selectedFile.name)
                  : null;

                return (
                  currentFile?.isValidSystemData && (
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span>P.IVA: {currentFile.systemData?.CustomerVAT}</span>
                      <span>
                        Database: {currentFile.systemData?.DatabaseName}
                      </span>
                      <span>Versione: {currentFile.systemData?.Version}</span>
                    </div>
                  )
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Conferma eliminazione
            </AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà definitivamente il file "{fileToDelete}"
              dal sistema. L'operazione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Elimina definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};
