import { useState, useCallback } from "react";
import { ColumnFilter } from "../types/fileTypes";

export const useFilters = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    applicationVersion: [],
    customerName: "",
    osProductName: "",
    version: [],
    build: [],
    sqlServerVersion: [],
    appVersion: "",
    databaseName: "",
    versioneFiscale: [],
    installationDir: "",
    resellerName: "",
    resellerVAT: "",
    hasExtensions: null,
  });

  const handleColumnFilterChange = useCallback((
    column: keyof ColumnFilter,
    value: unknown
  ) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters({
      applicationVersion: [],
      customerName: "",
      osProductName: "",
      version: [],
      build: [],
      sqlServerVersion: [],
      appVersion: "",
      databaseName: "",
      versioneFiscale: [],
      installationDir: "",
      resellerName: "",
      resellerVAT: "",
      hasExtensions: null,
    });
  }, []);

  const hasActiveFilters =
    columnFilters.applicationVersion.length > 0 ||
    columnFilters.customerName ||
    columnFilters.osProductName ||
    columnFilters.version.length > 0 ||
    columnFilters.build.length > 0 ||
    columnFilters.sqlServerVersion.length > 0 ||
    columnFilters.appVersion ||
    columnFilters.databaseName ||
    columnFilters.versioneFiscale.length > 0 ||
    columnFilters.installationDir ||
    columnFilters.resellerName ||
    columnFilters.resellerVAT ||
    columnFilters.hasExtensions !== null;

  return {
    columnFilters,
    handleColumnFilterChange,
    clearAllFilters,
    hasActiveFilters,
  };
};
