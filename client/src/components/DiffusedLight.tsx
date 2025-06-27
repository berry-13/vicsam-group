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
  /**
   * Disabilita le animazioni per migliorare le prestazioni
   */
  disableAnimation?: boolean;
}

export const DiffusedLight: React.FC<DiffusedLightProps> = ({
  children,
  className = '',
  intensity = 2,
  disableAnimation = false,
}) => {
  // Calcola l'opacità in base all'intensità (molto ridotta per meno contrasto)
  const getOpacity = () => {
    switch (intensity) {
      case 1: return 0.003;
      case 2: return 0.005;
      case 3: return 0.008;
      case 4: return 0.012;
      case 5: return 0.018;
      default: return 0.005;
    }
  };

  return (
    <div className={`relative min-h-full diffused-light-container ${className}`}>
      {/* Optimized diffused light - static or minimal animation */}
      <div 
        className={`absolute inset-0 pointer-events-none ${
          disableAnimation ? 'diffused-light-static' : 'diffused-light-optimized'
        }`}
        style={{
          background: `radial-gradient(
            ellipse 200% 150% at 50% 50%,
            hsl(var(--primary) / ${getOpacity()}) 0%,
            hsl(var(--primary) / ${getOpacity() * 0.7}) 20%,
            hsl(var(--accent) / ${getOpacity() * 0.5}) 40%,
            hsl(var(--secondary) / ${getOpacity() * 0.3}) 60%,
            transparent 80%
          )`
        }}
      />
      
      {/* Contenuto sopra l'effetto di luce */}
      {children}
    </div>
  );
};
