import React from 'react';

interface AnimatedBackgroundProps {
  /**
   * Contenuto da renderizzare sopra lo sfondo decorativo
   */
  children?: React.ReactNode;
  /**
   * Classe CSS aggiuntiva per il contenitore principale
   */
  className?: string;
  /**
   * Intensità degli elementi decorativi (da 1 a 5)
   * 1 = molto leggero, 5 = molto visibile
   */
  intensity?: 1 | 2 | 3 | 4 | 5;
  /**
   * Modalità di performance per dispositivi con GPU limitata
   */
  performanceMode?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  className = '',
  intensity = 2,
  performanceMode = false,
}) => {
  // Calcola l'opacità in base all'intensità
  const getOpacity = (baseOpacity: number) => {
    const multiplier = intensity / 3; // Reduced multiplier for better performance
    return Math.min(baseOpacity * multiplier, 0.2); // Reduced cap to 20% opacity
  };

  // In performance mode, use static gradients only
  if (performanceMode) {
    return (
      <div 
        className={`
          min-h-screen relative overflow-hidden bg-background
          ${className}
        `}
      >
        {/* Static background gradients for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/70 to-transparent" />
          
          {/* Static decorative elements */}
          <div 
            className="absolute w-96 h-96 rounded-full blur-3xl"
            style={{
              backgroundColor: `hsl(var(--primary) / ${getOpacity(0.08)})`,
              top: '20%',
              left: '10%',
            }}
          />
          
          <div 
            className="absolute w-80 h-80 rounded-full blur-3xl"
            style={{
              backgroundColor: `hsl(var(--accent) / ${getOpacity(0.06)})`,
              bottom: '15%',
              right: '15%',
            }}
          />
          
          {intensity >= 3 && (
            <div 
              className="absolute w-60 h-60 rounded-full blur-2xl"
              style={{
                backgroundColor: `hsl(var(--secondary) / ${getOpacity(0.05)})`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        min-h-screen relative overflow-hidden bg-background
        ${className}
      `}
    >
      {/* Elementi decorativi di sfondo animati - ottimizzati */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/60 to-transparent" />
        
        {/* Solo 2 elementi principali animati per migliorare le prestazioni */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl animate-float-gentle"
          style={{
            backgroundColor: `hsl(var(--primary) / ${getOpacity(0.10)})`,
            top: '20%',
            left: '10%',
          }}
        />
        
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl animate-float-gentle-reverse"
          style={{
            backgroundColor: `hsl(var(--accent) / ${getOpacity(0.08)})`,
            bottom: '15%',
            right: '15%',
            animationDelay: '10s',
          }}
        />
        
        {/* Elementi aggiuntivi solo per intensità maggiore */}
        {intensity >= 3 && (
          <div 
            className="absolute w-60 h-60 rounded-full blur-2xl animate-pulse-gentle"
            style={{
              backgroundColor: `hsl(var(--secondary) / ${getOpacity(0.06)})`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animationDelay: '5s',
            }}
          />
        )}
        
        {/* Solo per intensità massima e solo se non in modalità performance */}
        {intensity >= 4 && (
          <div 
            className="absolute w-48 h-48 rounded-full blur-xl animate-drift-gentle"
            style={{
              backgroundColor: `hsl(var(--muted-foreground) / ${getOpacity(0.04)})`,
              top: '10%',
              right: '20%',
              animationDelay: '15s',
            }}
          />
        )}
      </div>
      
      {/* Contenuto sopra gli elementi decorativi */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
