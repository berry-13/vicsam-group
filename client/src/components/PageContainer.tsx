import React from 'react';
import { AnimatedBackground } from './AnimatedBackground';
import { DiffusedLight } from './DiffusedLight';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

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
  /**
   * Forza modalità performance (overrides auto-detection)
   */
  forcePerformanceMode?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  withGradient = false,
  intensity = 2,
  withPadding = true,
  forcePerformanceMode,
}) => {
  const performanceSettings = usePerformanceOptimization();
  
  // Use forced setting or auto-detected setting
  const usePerformanceMode = forcePerformanceMode ?? performanceSettings.performanceMode;
  const disableAnimations = performanceSettings.disableAnimations;
  const adjustedIntensity = performanceSettings.reducedIntensity ? Math.min(intensity, 2) as 1 | 2 | 3 | 4 | 5 : intensity;

  return (
    <AnimatedBackground 
      intensity={adjustedIntensity}
      performanceMode={usePerformanceMode}
      className={withGradient ? 'login-bg' : ''}
    >
      <DiffusedLight 
        intensity={adjustedIntensity} 
        disableAnimation={disableAnimations}
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
      </DiffusedLight>
    </AnimatedBackground>
  );
};
