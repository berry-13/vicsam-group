import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Server, Package, X } from "lucide-react";
import { ApplicationIcon } from "./ApplicationIcon";
import { SystemData } from "../types/fileTypes";

interface StructuredViewProps {
  data: SystemData;
}

export const StructuredView: React.FC<StructuredViewProps> = ({ data }) => {
  const [expandedExtension, setExpandedExtension] = useState<string | null>(null);

  const toggleExtensionDetails = (extensionType: string) => {
    setExpandedExtension(expandedExtension === extensionType ? null : extensionType);
  };

  const ExtensibilityIndicator: React.FC<{
    label: string;
    enabled: boolean;
    items?: Array<{ Description: string; ClassID?: string; IDVoceTS?: number }> | string[];
    type: string;
  }> = ({ label, enabled, items, type }) => (
    <div className="relative">
      <div 
        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
          enabled 
            ? 'bg-success/5 border-success/20 hover:bg-success/10 cursor-pointer' 
            : 'bg-muted/30 border-muted/30'
        }`}
        onClick={enabled && items?.length ? () => toggleExtensionDetails(type) : undefined}
        role={enabled && items?.length ? "button" : undefined}
        tabIndex={enabled && items?.length ? 0 : -1}
        aria-label={`${label}${enabled ? ' - Attivo' : ' - Non attivo'}${items?.length ? '. Clicca per dettagli' : ''}`}
      >
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
            enabled ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {enabled ? '✓' : '✗'}
          </div>
          {enabled && items?.length && (
            <div className="text-xs text-muted-foreground">
              ({items.length})
            </div>
          )}
        </div>
      </div>

      {expandedExtension === type && enabled && items?.length && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{label}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setExpandedExtension(null)}
                aria-label="Chiudi dettagli"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="p-2 text-xs bg-muted/10 rounded border">
                {typeof item === 'string' ? (
                  <span className="font-mono">{item}</span>
                ) : (
                  <div>
                    <div className="font-medium mb-1">{item.Description}</div>
                    {item.ClassID && (
                      <div className="text-muted-foreground font-mono">{item.ClassID}</div>
                    )}
                    {item.IDVoceTS && (
                      <div className="text-muted-foreground">ID: {item.IDVoceTS}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ScrollArea className="h-[60vh]">
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Applicazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <ApplicationIcon version={data.ApplicationVersion} size={24} />
                  <div>
                    <div className="font-medium">{data.ApplicationVersion || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {data.Version && data.Build 
                        ? `${data.Version} – ${data.Build}`
                        : data.Version || 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Ragione sociale</div>
                  <div className="font-medium">{data.CustomerName || 'Non specificato'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">P. IVA</div>
                  <div className="font-mono text-sm">{data.CustomerVAT || 'Non specificata'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  SQL Server
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-sm text-muted-foreground">Versione</div>
                  <div className="font-mono text-sm">{data.SQLServerVersion || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">App Version</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm">{data.AppVersion || 'N/A'}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Indicatori di Estendibilità
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ExtensibilityIndicator
                  label="Custom Menu Items"
                  enabled={Boolean(data.ExistsCustomMenuItems)}
                  items={data.CustomMenuItems}
                  type="customMenu"
                />
                
                <ExtensibilityIndicator
                  label="Document Plugins"
                  enabled={Boolean(data.ExistsDocumentPlugins)}
                  items={data.DocumentPlugins?.map(plugin => ({ Description: plugin }))}
                  type="documentPlugins"
                />
                
                <ExtensibilityIndicator
                  label="Reg Doc Pers"
                  enabled={Boolean(data.ExistsRegDocPers)}
                  type="regDocPers"
                />
                
                <ExtensibilityIndicator
                  label="User File EXE Files"
                  enabled={Boolean(data.ExistsUserfileExeFiles)}
                  type="userFileExe"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="text-sm text-muted-foreground">Nome Database</div>
                  <div className="font-mono text-sm">{data.DatabaseName || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>

            {data.InstallationDir && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Installazione</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="text-sm text-muted-foreground">Directory</div>
                    <div className="font-mono text-xs bg-muted/50 p-2 rounded border break-all">
                      {data.InstallationDir}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
