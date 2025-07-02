import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  HardDrive,
  CheckCircle,
  Package,
  Menu,
} from "lucide-react";
import { ApplicationIcon } from "./ApplicationIcon";
import { ParsedFileData } from "../types/fileTypes";

interface StatsCardsProps {
  files: ParsedFileData[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ files }) => {
  const stats = {
    total: files.length,
    valid: files.filter((f) => f.isValidSystemData).length,
    aly: files.filter((f) => f.systemData?.ApplicationVersion === "ALY").length,
    tse: files.filter((f) => f.systemData?.ApplicationVersion === "TSE").length,
    withPlugins: files.filter((f) => f.systemData?.ExistsDocumentPlugins).length,
    withCustomMenu: files.filter((f) => f.systemData?.ExistsCustomMenuItems).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info rounded-lg">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">File totali</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.valid}</p>
              <p className="text-sm text-muted-foreground">File validi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <ApplicationIcon version="ALY" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.aly}</p>
              <p className="text-sm text-muted-foreground">ALY</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg flex items-center justify-center">
              <ApplicationIcon version="TSE" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.tse}</p>
              <p className="text-sm text-muted-foreground">TSE</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withPlugins}</p>
              <p className="text-sm text-muted-foreground">Con plugins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Menu className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withCustomMenu}</p>
              <p className="text-sm text-muted-foreground">Con custom menu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
