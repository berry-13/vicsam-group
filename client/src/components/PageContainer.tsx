import React from 'react';
import { AnimatedBackground } from './AnimatedBackground';

interface PageContainerProps {
  /**
   * Contenuto della pagina
   */
  children: React.ReactNode;
  /**
   * Classe CSS aggiuntiva per il contenitore del contenuto
   */
  className?: string;
  /**
   * Se true, applica lo sfondo con gradiente come nella login page
   */
  withGradient?: boolean;
  /**
   * Intensità degli elementi decorativi (da 1 a 5)
   */
  intensity?: 1 | 2 | 3 | 4 | 5;
  /**
   * Se true, applica padding al contenuto principale
   */
  withPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  withGradient = false,
  intensity = 2,
  withPadding = true,
}) => {
  return (
    <AnimatedBackground 
      intensity={intensity}
      className={withGradient ? 'login-bg' : ''}
    >
      {/* Contenuto principale con z-index per stare sopra gli elementi decorativi */}
      <div 
        className={`
          relative z-10 min-h-screen
          ${withPadding ? 'flex-1 space-y-4 p-4 md:p-8 pt-6' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    </AnimatedBackground>
  );
};
