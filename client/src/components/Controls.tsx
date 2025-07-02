import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  RefreshCw,
  Grid,
  List,
  X,
  Package,
} from "lucide-react";
import { ApplicationIcon } from "./ApplicationIcon";
import { ViewMode, FilterType, ColumnFilter } from "../types/fileTypes";

interface ControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  columnFilters: ColumnFilter;
  onColumnFilterChange: (column: keyof ColumnFilter, value: unknown) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  columnFilters,
  onColumnFilterChange,
  viewMode,
  setViewMode,
  refreshing,
  onRefresh,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Cerca per nome cliente, app version, OS product..."
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
