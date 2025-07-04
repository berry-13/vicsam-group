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
  Search,
  RefreshCw,
  Grid,
  List,
  X,
  Package,
  Monitor,
} from "lucide-react";
import { ApplicationIcon } from "./ApplicationIcon";
import { ViewMode, ColumnFilter, ParsedFileData } from "../types/fileTypes";
import { getUniqueValues } from "../utils/fileUtils";

interface ControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  columnFilters: ColumnFilter;
  onColumnFilterChange: (column: keyof ColumnFilter, value: unknown) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  files: ParsedFileData[];
}

export const Controls: React.FC<ControlsProps> = ({
  searchTerm,
  setSearchTerm,
  columnFilters,
  onColumnFilterChange,
  viewMode,
  setViewMode,
  refreshing,
  onRefresh,
  onClearFilters,
  hasActiveFilters,
  files,
}) => {
  const osProducts = getUniqueValues(files, "OSProductName");
  const sqlVersions = getUniqueValues(files, "SQLServerVersion");
  const appVersions = getUniqueValues(files, "AppVersion");
  const versions = getUniqueValues(files, "Version");
  const builds = getUniqueValues(files, "Build");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Cerca in tutte le colonne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
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
                          : columnFilters.applicationVersion.filter((a) => a !== app);
                        onColumnFilterChange("applicationVersion", newApps);
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Monitor className="h-4 w-4 mr-2" />
                OS Product ({columnFilters.osProductName ? 1 : 0})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <div className="font-medium">Filtra per OS Product</div>
                {osProducts.map((os) => (
                  <div key={os} className="flex items-center space-x-2">
                    <Checkbox
                      id={`os-${os}`}
                      checked={columnFilters.osProductName === os}
                      onCheckedChange={(checked) => {
                        onColumnFilterChange("osProductName", checked ? os : "");
                      }}
                    />
                    <label htmlFor={`os-${os}`} className="text-sm">
                      {os}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                SQL Version ({columnFilters.sqlServerVersion.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <div className="font-medium">Filtra per SQL Server Version</div>
                {sqlVersions.map((sql) => (
                  <div key={sql} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sql-${sql}`}
                      checked={columnFilters.sqlServerVersion.includes(sql)}
                      onCheckedChange={(checked) => {
                        const newSql = checked
                          ? [...columnFilters.sqlServerVersion, sql]
                          : columnFilters.sqlServerVersion.filter((v) => v !== sql);
                        onColumnFilterChange("sqlServerVersion", newSql);
                      }}
                    />
                    <label htmlFor={`sql-${sql}`} className="text-sm">
                      {sql}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                App Version ({columnFilters.appVersion ? 1 : 0})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <div className="font-medium">Filtra per App Version</div>
                {appVersions.map((ver) => (
                  <div key={ver} className="flex items-center space-x-2">
                    <Checkbox
                      id={`appver-${ver}`}
                      checked={columnFilters.appVersion === ver}
                      onCheckedChange={(checked) => {
                        onColumnFilterChange("appVersion", checked ? ver : "");
                      }}
                    />
                    <label htmlFor={`appver-${ver}`} className="text-sm">
                      {ver}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Version/Build (
                {columnFilters.version.length || columnFilters.build.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <div className="font-medium">Filtra per Version</div>
                {versions.map((ver) => (
                  <div key={ver} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ver-${ver}`}
                      checked={columnFilters.version.includes(ver)}
                      onCheckedChange={(checked) => {
                        const newVers = checked
                          ? [...columnFilters.version, ver]
                          : columnFilters.version.filter((v) => v !== ver);
                        onColumnFilterChange("version", newVers);
                      }}
                    />
                    <label htmlFor={`ver-${ver}`} className="text-sm">
                      {ver}
                    </label>
                  </div>
                ))}
                <div className="font-medium pt-2">Filtra per Build</div>
                {builds.map((build) => (
                  <div key={build} className="flex items-center space-x-2">
                    <Checkbox
                      id={`build-${build}`}
                      checked={columnFilters.build.includes(build)}
                      onCheckedChange={(checked) => {
                        const newBuilds = checked
                          ? [...columnFilters.build, build]
                          : columnFilters.build.filter((v) => v !== build);
                        onColumnFilterChange("build", newBuilds);
                      }}
                    />
                    <label htmlFor={`build-${build}`} className="text-sm">
                      {build}
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
          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Cancella filtri
            </Button>
          )}
          <Button onClick={onRefresh} disabled={refreshing} variant="outline">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Aggiorna
          </Button>
        </div>
      </div>
    </div>
  );
};
