import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Eye,
  Download,
  Trash2,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
} from "lucide-react";
import { ApplicationIcon } from "./ApplicationIcon";
import { ParsedFileData, ColumnFilter, SortConfig } from "../types/fileTypes";
import { getUniqueValues } from "../utils/fileUtils";

interface DataTableProps {
  files: ParsedFileData[];
  columnFilters: ColumnFilter;
  sortConfig: SortConfig;
  onColumnFilterChange: (column: keyof ColumnFilter, value: unknown) => void;
  onSort: (column: string) => void;
  onView: (filename: string) => void;
  onDownload: (filename: string) => void;
  onDelete: (filename: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  files,
  columnFilters,
  sortConfig,
  onColumnFilterChange,
  onSort,
  onView,
  onDownload,
  onDelete,
}) => {
  const ExtensibilityIndicator: React.FC<{
    file: ParsedFileData;
  }> = ({ file }) => {
    const hasExtensions = Boolean(
      file.systemData?.ExistsCustomMenuItems ||
      file.systemData?.ExistsDocumentPlugins ||
      file.systemData?.ExistsVBScriptItems ||
      file.systemData?.ExistsRegDocPers ||
      file.systemData?.ExistsDBObjectsVic ||
      file.systemData?.ExistsUserfileExeFiles
    );

    if (!hasExtensions) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-muted"></div>
        </div>
      );
    }

    const extensionItems = [
      { enabled: file.systemData?.ExistsCustomMenuItems, label: "Custom Menu Items", count: file.systemData?.CustomMenuItems?.length },
      { enabled: file.systemData?.ExistsDocumentPlugins, label: "Document Plugins", count: file.systemData?.DocumentPlugins?.length },
      { enabled: file.systemData?.ExistsVBScriptItems, label: "VB Scripts" },
      { enabled: file.systemData?.ExistsRegDocPers, label: "Reg Doc Pers" },
      { enabled: file.systemData?.ExistsDBObjectsVic, label: "DB Objects Vic" },
      { enabled: file.systemData?.ExistsUserfileExeFiles, label: "User File EXE Files" },
    ].filter(item => item.enabled);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-success/10"
          >
            <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-2">
            <div className="font-medium text-sm">Extensibility Features</div>
            {extensionItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span>{item.label}</span>
                {item.count && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    {item.count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

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

  const SortableTableHead: React.FC<{
    column: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ column, children, className }) => (
    <TableHead className={className}>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => onSort(column)}
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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead column="applicationVersion" className="w-16">
              App
            </SortableTableHead>
            <SortableTableHead column="customerName" className="min-w-[120px]">
              <div className="flex items-center gap-2">
                Cliente
                <ColumnFilterPopover title="Filtra per Cliente">
                  <Input
                    placeholder="Nome cliente..."
                    value={columnFilters.customerName}
                    onChange={(e) =>
                      onColumnFilterChange("customerName", e.target.value)
                    }
                  />
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <SortableTableHead column="osProductName" className="w-32">
              <div className="flex items-center gap-2">
                OS Product
                <ColumnFilterPopover title="Filtra per OS Product">
                  <Input
                    placeholder="OS Product..."
                    value={columnFilters.osProductName}
                    onChange={(e) =>
                      onColumnFilterChange("osProductName", e.target.value)
                    }
                  />
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <SortableTableHead column="sqlServerVersion" className="w-32">
              <div className="flex items-center gap-2">
                SQL Server
                <ColumnFilterPopover title="Filtra per SQL Server">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getUniqueValues(files, "SQLServerVersion").map((version) => (
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
                            onColumnFilterChange(
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
            <SortableTableHead column="version" className="w-56">
              <div className="flex items-center gap-2">
                Version
                <ColumnFilterPopover title="Filtra per Versione">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getUniqueValues(files, "Version").map((version) => (
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
                            onColumnFilterChange("version", newVersions);
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
            <TableHead className="w-16">Extensions</TableHead>
            <SortableTableHead column="appVersion" className="w-24">
              <div className="flex items-center gap-2">
                App Version
                <ColumnFilterPopover title="Filtra per App Version">
                  <Input
                    placeholder="App Version..."
                    value={columnFilters.appVersion}
                    onChange={(e) =>
                      onColumnFilterChange("appVersion", e.target.value)
                    }
                  />
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <SortableTableHead column="modified" className="w-32">
              <div className="flex items-center gap-2">
                Ultima modifica
                <ColumnFilterPopover title="Filtra per data">
                  <Input
                    placeholder="Data modifica..."
                    value={columnFilters.modified}
                    onChange={(e) =>
                      onColumnFilterChange("modified", e.target.value)
                    }
                  />
                </ColumnFilterPopover>
              </div>
            </SortableTableHead>
            <TableHead className="w-20">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.name} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center justify-center">
                  <ApplicationIcon
                    version={file.systemData?.ApplicationVersion}
                    size={16}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <div
                    className="font-medium truncate"
                    title={file.systemData?.CustomerName || file.name}
                  >
                    {file.systemData?.CustomerName || file.name}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm truncate">
                  {file.systemData?.OSProductName || "-"}
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
                <div className="text-sm font-mono">
                  {file.systemData?.Version && (
                    <div>
                      <span>{file.systemData.Version}</span>
                      {file.systemData?.Build && (
                        <div className="text-xs text-muted-foreground">
                          Build: {file.systemData.Build}
                        </div>
                      )}
                    </div>
                  ) || "-"}
                </div>
              </TableCell>
              <TableCell>
                <ExtensibilityIndicator file={file} />
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono">
                  {file.systemData?.AppVersion || "-"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {file.modified ? new Date(file.modified).toLocaleString() : "-"}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {files.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun file trovato con i filtri applicati
        </div>
      )}
    </div>
  );
};
