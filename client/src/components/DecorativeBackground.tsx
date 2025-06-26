import React from 'react';

interface DecorativeBackgroundProps {
  /**
   * Contenuto da renderizzare sopra lo sfondo decorativo
   */
  children?: React.ReactNode;
  /**
   * Classe CSS aggiuntiva per il contenitore principale
   */
  className?: string;
  /**
   * Se true, applica lo sfondo con gradiente login-bg
   * Se false, usa solo gli elementi decorativi senza gradiente di sfondo
   */
  withGradient?: boolean;
  /**
   * Intensità degli elementi decorativi (da 1 a 5)
   * 1 = molto leggero, 5 = molto visibile
   */
  intensity?: 1 | 2 | 3 | 4 | 5;
}

export const DecorativeBackground: React.FC<DecorativeBackgroundProps> = ({
  children,
  className = '',
  withGradient = false,
  intensity = 3,
}) => {
  // Calcola l'opacità in base all'intensità
  const getOpacity = (baseOpacity: number) => {
    const multiplier = intensity / 3; // normalizza rispetto al valore medio
    return baseOpacity * multiplier;
  };

  return (
    <div 
      className={`
        min-h-screen relative overflow-hidden
        ${withGradient ? 'login-bg' : 'bg-background'}
        ${className}
      `}
    >
      {/* Elementi decorativi di sfondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Elemento decorativo in alto a destra */}
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl theme-transition"
          style={{
            backgroundColor: `hsl(var(--primary) / ${getOpacity(0.05)})`,
          }}
        />
        
        {/* Elemento decorativo in basso a sinistra */}
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl theme-transition"
          style={{
            backgroundColor: `hsl(var(--accent) / ${getOpacity(0.10)})`,
          }}
        />
        
        {/* Elemento decorativo centrale */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl theme-transition"
          style={{
            backgroundColor: `hsl(var(--primary) / ${getOpacity(0.03)})`,
          }}
        />
        
        {/* Elementi decorativi aggiuntivi per intensità maggiore */}
        {intensity >= 4 && (
          <>
            <div 
              className="absolute top-20 left-20 w-60 h-60 rounded-full blur-2xl theme-transition"
              style={{
                backgroundColor: `hsl(var(--secondary) / ${getOpacity(0.08)})`,
              }}
            />
            <div 
              className="absolute bottom-20 right-20 w-60 h-60 rounded-full blur-2xl theme-transition"
              style={{
                backgroundColor: `hsl(var(--accent) / ${getOpacity(0.06)})`,
              }}
            />
          </>
        )}
        
        {/* Elementi decorativi molto intensi */}
        {intensity === 5 && (
          <>
            <div 
              className="absolute top-1/4 right-1/4 w-40 h-40 rounded-full blur-xl theme-transition"
              style={{
                backgroundColor: `hsl(var(--primary) / ${getOpacity(0.12)})`,
              }}
            />
            <div 
              className="absolute bottom-1/4 left-1/4 w-40 h-40 rounded-full blur-xl theme-transition"
              style={{
                backgroundColor: `hsl(var(--muted) / ${getOpacity(0.15)})`,
              }}
            />
          </>
        )}
      </div>
      
      {/* Contenuto sopra gli elementi decorativi */}
      {children}
    </div>
  );
};
