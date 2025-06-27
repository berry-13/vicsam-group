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
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  className = '',
  intensity = 2,
}) => {
  // Calcola l'opacità in base all'intensità
  const getOpacity = (baseOpacity: number) => {
    const multiplier = intensity / 2; // Increase visibility
    return Math.min(baseOpacity * multiplier, 0.3); // Cap at 30% opacity
  };

  return (
    <div 
      className={`
        min-h-screen relative overflow-hidden bg-background
        ${className}
      `}
    >
      {/* Elementi decorativi di sfondo animati */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/50 to-transparent" />
        
        {/* Elemento decorativo principale - si muove lentamente */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl animate-float-slow"
          style={{
            backgroundColor: `hsl(var(--primary) / ${getOpacity(0.15)})`,
            animationDelay: '0s',
            top: '20%',
            left: '10%',
          }}
        />
        
        {/* Elemento decorativo secondario - si muove in direzione opposta */}
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl animate-float-reverse"
          style={{
            backgroundColor: `hsl(var(--accent) / ${getOpacity(0.18)})`,
            animationDelay: '2s',
            bottom: '15%',
            right: '15%',
          }}
        />
        
        {/* Elemento decorativo centrale - movimento circolare */}
        <div 
          className="absolute w-72 h-72 rounded-full blur-3xl animate-orbit"
          style={{
            backgroundColor: `hsl(var(--secondary) / ${getOpacity(0.12)})`,
            animationDelay: '4s',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        
        {/* Always visible subtle elements */}
        <div 
          className="absolute w-40 h-40 rounded-full blur-2xl animate-drift"
          style={{
            backgroundColor: `hsl(var(--primary) / ${getOpacity(0.10)})`,
            animationDelay: '6s',
            top: '10%',
            right: '20%',
          }}
        />
        
        <div 
          className="absolute w-36 h-36 rounded-full blur-xl animate-shimmer"
          style={{
            backgroundColor: `hsl(var(--muted-foreground) / ${getOpacity(0.08)})`,
            animationDelay: '8s',
            bottom: '25%',
            left: '60%',
          }}
        />
        
        {/* Elementi decorativi aggiuntivi per intensità maggiore */}
        {intensity >= 3 && (
          <>
            <div 
              className="absolute w-60 h-60 rounded-full blur-2xl animate-pulse-slow"
              style={{
                backgroundColor: `hsl(var(--muted) / ${getOpacity(0.20)})`,
                animationDelay: '1s',
                top: '5%',
                right: '30%',
              }}
            />
            <div 
              className="absolute w-60 h-60 rounded-full blur-2xl animate-float-slow"
              style={{
                backgroundColor: `hsl(var(--primary) / ${getOpacity(0.08)})`,
                animationDelay: '3s',
                bottom: '40%',
                left: '25%',
              }}
            />
            {/* Extra floating element for more movement */}
            <div 
              className="absolute w-52 h-52 rounded-full blur-xl animate-wiggle"
              style={{
                backgroundColor: `hsl(var(--accent) / ${getOpacity(0.15)})`,
                animationDelay: '5s',
                top: '70%',
                right: '50%',
              }}
            />
          </>
        )}
        
        {/* Elementi decorativi molto intensi */}
        {intensity >= 4 && (
          <>
            <div 
              className="absolute w-40 h-40 rounded-full blur-xl opacity-20 animate-bounce-slow"
              style={{
                backgroundColor: `hsl(var(--accent) / ${getOpacity(0.18)})`,
                animationDelay: '5s',
                top: '60%',
                right: '10%',
              }}
            />
            <div 
              className="absolute w-48 h-48 rounded-full blur-2xl opacity-15 animate-orbit-reverse"
              style={{
                backgroundColor: `hsl(var(--primary) / ${getOpacity(0.12)})`,
                animationDelay: '6s',
                bottom: '30%',
                left: '40%',
              }}
            />
          </>
        )}

        {/* Elementi ultra intensi */}
        {intensity === 5 && (
          <>
            <div 
              className="absolute w-32 h-32 rounded-full blur-lg opacity-25 animate-wiggle"
              style={{
                backgroundColor: `hsl(var(--destructive) / ${getOpacity(0.08)})`,
                animationDelay: '7s',
                top: '75%',
                left: '60%',
              }}
            />
            <div 
              className="absolute w-44 h-44 rounded-full blur-xl opacity-20 animate-float-reverse"
              style={{
                backgroundColor: `hsl(var(--muted-foreground) / ${getOpacity(0.05)})`,
                animationDelay: '8s',
                top: '35%',
                right: '45%',
              }}
            />
          </>
        )}
      </div>
      
      {/* Contenuto sopra gli elementi decorativi */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
