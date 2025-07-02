import { useMemo } from "react";
import { ParsedFileData, ColumnFilter, FilterType, SortConfig } from "../types/fileTypes";

export const useFilteredAndSortedFiles = (
  files: ParsedFileData[],
  searchTerm: string,
  filterType: FilterType,
  columnFilters: ColumnFilter,
  sortConfig: SortConfig
) => {
  return useMemo(() => {
    const filtered = files.filter((file) => {
      const matchesSearch =
        !searchTerm ||
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.CustomerName?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        file.systemData?.OSProductName?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        file.systemData?.AppVersion?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        file.systemData?.SQLServerVersion?.toLowerCase().includes(
          searchTerm.toLowerCase()
        );

      if (!matchesSearch) return false;

      if (filterType !== "all") {
        if (filterType === "valid" && !file.isValidSystemData) return false;
        if (filterType === "invalid" && file.isValidSystemData) return false;
        if (filterType === "outdated") {
          return false;
        }
      }

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
        columnFilters.osProductName &&
        !file.systemData?.OSProductName?.toLowerCase().includes(
          columnFilters.osProductName.toLowerCase()
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
        columnFilters.appVersion &&
        !file.systemData?.AppVersion?.toLowerCase().includes(
          columnFilters.appVersion.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        columnFilters.hasExtensions !== null &&
        Boolean(
          file.systemData?.ExistsCustomMenuItems ||
          file.systemData?.ExistsDocumentPlugins ||
          file.systemData?.ExistsVBScriptItems ||
          file.systemData?.ExistsRegDocPers ||
          file.systemData?.ExistsDBObjectsVic ||
          file.systemData?.ExistsUserfileExeFiles
        ) !== columnFilters.hasExtensions
      ) {
        return false;
      }

      if (columnFilters.status.length > 0) {
        const fileStatus = file.isValidSystemData ? "valido" : "invalido";
        if (!columnFilters.status.includes(fileStatus)) return false;
      }

      return true;
    });

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
          case "osProductName":
            aValue = a.systemData?.OSProductName || "";
            bValue = b.systemData?.OSProductName || "";
            break;
          case "version":
            aValue = a.systemData?.Version || "";
            bValue = b.systemData?.Version || "";
            break;
          case "sqlServerVersion":
            aValue = a.systemData?.SQLServerVersion || "";
            bValue = b.systemData?.SQLServerVersion || "";
            break;
          case "appVersion":
            aValue = a.systemData?.AppVersion || "";
            bValue = b.systemData?.AppVersion || "";
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
};
