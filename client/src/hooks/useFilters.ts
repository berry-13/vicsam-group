import { useState, useCallback } from "react";
import { ColumnFilter } from "../types/fileTypes";

export const useFilters = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    applicationVersion: [],
    customerName: "",
    osProductName: "",
    version: [],
    sqlServerVersion: [],
    appVersion: "",
    hasExtensions: null,
    status: [],
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
      sqlServerVersion: [],
      appVersion: "",
      hasExtensions: null,
      status: [],
    });
  }, []);

  const hasActiveFilters = 
    columnFilters.applicationVersion.length > 0 ||
    columnFilters.customerName ||
    columnFilters.osProductName ||
    columnFilters.version.length > 0 ||
    columnFilters.sqlServerVersion.length > 0 ||
    columnFilters.appVersion ||
    columnFilters.hasExtensions !== null ||
    columnFilters.status.length > 0;

  return {
    columnFilters,
    handleColumnFilterChange,
    clearAllFilters,
    hasActiveFilters,
  };
};
