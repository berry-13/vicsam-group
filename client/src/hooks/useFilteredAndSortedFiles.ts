import { useMemo } from "react";
import { ParsedFileData, ColumnFilter, SortConfig } from "../types/fileTypes";

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export const useFilteredAndSortedFiles = (
  files: ParsedFileData[],
  searchTerm: string,
  columnFilters: ColumnFilter,
  sortConfig: SortConfig
) => {
  return useMemo(() => {
    const filtered = files.filter((file) => {
      const matchesSearch =
        !searchTerm ||
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.OSProductName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.SQLServerVersion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.Version?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.Build?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.AppVersion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.ApplicationVersion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.DatabaseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.VersioneFiscale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.InstallationDir?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.ResellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.systemData?.ResellerVAT?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

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
        columnFilters.build.length > 0 &&
        !columnFilters.build.includes(file.systemData?.Build || "")
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
        columnFilters.databaseName &&
        !file.systemData?.DatabaseName?.toLowerCase().includes(
          columnFilters.databaseName.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        columnFilters.versioneFiscale.length > 0 &&
        !columnFilters.versioneFiscale.includes(file.systemData?.VersioneFiscale || "")
      ) {
        return false;
      }

      if (
        columnFilters.installationDir &&
        !file.systemData?.InstallationDir?.toLowerCase().includes(
          columnFilters.installationDir.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        columnFilters.resellerName &&
        !file.systemData?.ResellerName?.toLowerCase().includes(
          columnFilters.resellerName.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        columnFilters.resellerVAT &&
        !file.systemData?.ResellerVAT?.toLowerCase().includes(
          columnFilters.resellerVAT.toLowerCase()
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
          case "version": {
            const versionA = a.systemData?.Version || "";
            const versionB = b.systemData?.Version || "";
            const cmp = sortConfig.direction === "asc"
              ? compareVersions(versionA, versionB)
              : compareVersions(versionB, versionA);
            if (cmp !== 0) return cmp;
            const buildA = a.systemData?.Build || "";
            const buildB = b.systemData?.Build || "";
            return sortConfig.direction === "asc"
              ? compareVersions(buildA, buildB)
              : compareVersions(buildB, buildA);
          }
          case "build":
            aValue = a.systemData?.Build || "";
            bValue = b.systemData?.Build || "";
            return sortConfig.direction === "asc"
              ? compareVersions(aValue as string, bValue as string)
              : compareVersions(bValue as string, aValue as string);
          case "sqlServerVersion":
            aValue = a.systemData?.SQLServerVersion || "";
            bValue = b.systemData?.SQLServerVersion || "";
            break;
          case "appVersion":
            aValue = a.systemData?.AppVersion || "";
            bValue = b.systemData?.AppVersion || "";
            break;
          case "databaseName":
            aValue = a.systemData?.DatabaseName || "";
            bValue = b.systemData?.DatabaseName || "";
            break;
          case "versioneFiscale":
            aValue = a.systemData?.VersioneFiscale || "";
            bValue = b.systemData?.VersioneFiscale || "";
            break;
          case "installationDir":
            aValue = a.systemData?.InstallationDir || "";
            bValue = b.systemData?.InstallationDir || "";
            break;
          case "resellerName":
            aValue = a.systemData?.ResellerName || "";
            bValue = b.systemData?.ResellerName || "";
            break;
          case "resellerVAT":
            aValue = a.systemData?.ResellerVAT || "";
            bValue = b.systemData?.ResellerVAT || "";
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
  }, [files, searchTerm, columnFilters, sortConfig]);
};
