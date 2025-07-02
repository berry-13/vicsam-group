import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
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
import { AlertTriangle } from "lucide-react";
import Spinner from "@/components/ui/spinner";

import { ParsedFileData, ViewMode, FilterType } from "../types/fileTypes";
import { parseSystemData } from "../utils/fileUtils";
import { useFilteredAndSortedFiles, useSorting, useFilters } from "../hooks";
import {
  StatsCards,
  Controls,
  DataTable,
  FileCard,
  FileContentDialog,
  EmptyState,
} from "../components";

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

  const { sortConfig, handleSort, resetSort } = useSorting();
  const { 
    columnFilters, 
    handleColumnFilterChange, 
    clearAllFilters: clearColumnFilters, 
    hasActiveFilters 
  } = useFilters();

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

  const clearAllFilters = () => {
    clearColumnFilters();
    setSearchTerm("");
    resetSort();
  };

  const hasFilters = Boolean(searchTerm || filterType !== "all" || hasActiveFilters);

  const filteredAndSortedFiles = useFilteredAndSortedFiles(
    files,
    searchTerm,
    filterType,
    columnFilters,
    sortConfig
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
      <StatsCards files={files} />

      <Controls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onClearFilters={clearAllFilters}
        hasActiveFilters={hasFilters}
      />

      {filteredAndSortedFiles.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onClearFilters={clearAllFilters}
        />
      ) : viewMode === "table" ? (
        <DataTable
          files={filteredAndSortedFiles}
          columnFilters={columnFilters}
          sortConfig={sortConfig}
          onColumnFilterChange={handleColumnFilterChange}
          onSort={handleSort}
          onView={handleViewFile}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {filteredAndSortedFiles.map((file) => (
            <FileCard
              key={file.name}
              file={file}
              onView={handleViewFile}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <FileContentDialog
        selectedFile={selectedFile}
        files={files}
        contentViewMode={contentViewMode}
        setContentViewMode={setContentViewMode}
        onClose={() => setSelectedFile(null)}
      />

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


