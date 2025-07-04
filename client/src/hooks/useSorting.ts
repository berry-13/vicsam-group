import { useState, useCallback } from "react";
import { SortConfig } from "../types/fileTypes";

export const useSorting = () => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "",
    direction: null,
  });

  const handleSort = useCallback((column: string) => {
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
  }, []);

  const resetSort = useCallback(() => {
    setSortConfig({ column: "", direction: null });
  }, []);

  return {
    sortConfig,
    handleSort,
    resetSort,
  };
};
