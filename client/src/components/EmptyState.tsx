import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters,
  onClearFilters,
}) => {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {hasFilters ? "Nessun file trovato" : "Nessun file disponibile"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {hasFilters
            ? "Prova a modificare i filtri di ricerca"
            : "I file di configurazione salvati appariranno qui"}
        </p>
        {hasFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Rimuovi filtri
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
