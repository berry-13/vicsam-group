export interface CustomMenuItem {
  IDVoceTS: number;
  ClassID: string;
  Description: string;
}

export interface SystemData {
  AppVersion?: string;
  DateTime?: string;
  ApplicationVersion?: string;
  InstallationDir?: string;
  DatabaseName?: string;
  SQLServerVersion?: string;
  OSProductName?: string;
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
  ExistsDBObjectsVic?: boolean;
  ExistsVBScriptItems?: boolean;
  VersioneFiscale?: string;
}

import type { FileData } from "../services/api";

export interface ParsedFileData extends FileData {
  systemData?: SystemData;
  isValidSystemData: boolean;
}

export type ViewMode = "grid" | "list" | "table";
export type FilterType = "all" | "valid" | "invalid" | "outdated";
export type SortDirection = "asc" | "desc" | null;

export interface ColumnFilter {
  applicationVersion: string[];
  customerName: string;
  osProductName: string;
  version: string[];
  sqlServerVersion: string[];
  appVersion: string;
  hasExtensions: boolean | null;
  status: string[];
}

export interface SortConfig {
  column: string;
  direction: SortDirection;
}
