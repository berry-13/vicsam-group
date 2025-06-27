import React from 'react';

interface DiffusedLightProps {
  /**
   * Contenuto da renderizzare sopra l'effetto di luce diffusa
   */
  children?: React.ReactNode;
  /**
   * Classe CSS aggiuntiva per il contenitore principale
   */
  className?: string;
  /**
   * Intensità della luce diffusa (da 1 a 5)
   * 1 = molto sottile, 5 = più visibile
   */
  intensity?: 1 | 2 | 3 | 4 | 5;
}

export const DiffusedLight: React.FC<DiffusedLightProps> = ({
  children,
  className = '',
  intensity = 2,
}) => {
  // Calcola l'opacità in base all'intensità (molto ridotta per meno contrasto)
  const getOpacity = () => {
    switch (intensity) {
      case 1: return 0.005;
      case 2: return 0.008;
      case 3: return 0.012;
      case 4: return 0.018;
      case 5: return 0.025;
      default: return 0.008;
    }
  };

  return (
    <div className={`relative min-h-full diffused-light-container ${className}`}>
      {/* Single smooth diffused light - GPU accelerated, bigger and more movement */}
      <div 
        className="absolute inset-0 pointer-events-none diffused-light-enhanced"
        style={{
          background: `radial-gradient(
            ellipse 250% 180% at 50% 50%,
            hsl(var(--primary) / ${getOpacity()}) 0%,
            hsl(var(--primary) / ${getOpacity() * 0.8}) 15%,
            hsl(var(--accent) / ${getOpacity() * 0.6}) 30%,
            hsl(var(--secondary) / ${getOpacity() * 0.4}) 50%,
            hsl(var(--muted) / ${getOpacity() * 0.2}) 70%,
            transparent 85%
          )`
        }}
      />
      
      {/* Contenuto sopra l'effetto di luce */}
      {children}
    </div>
  );
};
