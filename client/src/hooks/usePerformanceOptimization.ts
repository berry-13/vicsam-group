import { useState, useEffect } from 'react';

interface PerformanceSettings {
  performanceMode: boolean;
  disableAnimations: boolean;
  reducedIntensity: boolean;
}

/**
 * Hook per rilevare le prestazioni GPU e adattare automaticamente le impostazioni
 */
export const usePerformanceOptimization = (): PerformanceSettings => {
  const [settings, setSettings] = useState<PerformanceSettings>({
    performanceMode: false,
    disableAnimations: false,
    reducedIntensity: false,
  });

  useEffect(() => {
    const detectPerformance = () => {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Check device type and capabilities
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEnd = isMobile || navigator.hardwareConcurrency <= 4;
      
      // Check GPU performance indicators
      let isLowGPU = false;
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') as WebGLRenderingContext;
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Check for integrated/low-end GPUs
            isLowGPU = /Intel|integrated|HD Graphics|UHD Graphics|Iris/i.test(renderer) ||
                      /Mali|Adreno [1-5]/i.test(renderer);
          }
        }
      } catch {
        // If WebGL detection fails, assume low performance
        isLowGPU = true;
      }

      // Check memory constraints with fallback for unsupported browsers
      const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
      // Default to assuming adequate memory (8GB) if deviceMemory API is not supported
      const deviceMemory = navigatorWithMemory.deviceMemory ?? 8;
      const hasLowMemory = deviceMemory <= 4;
      
      // Determine settings based on capabilities
      const shouldUsePerformanceMode = isLowEnd || isLowGPU || hasLowMemory;
      const shouldDisableAnimations = prefersReducedMotion || isLowGPU;
      const shouldReduceIntensity = isMobile || isLowGPU;

      setSettings({
        performanceMode: shouldUsePerformanceMode,
        disableAnimations: shouldDisableAnimations,
        reducedIntensity: shouldReduceIntensity,
      });

      // Log detected configuration for debugging
      console.log('Performance Detection:', {
        isMobile,
        isLowEnd,
        isLowGPU,
        hasLowMemory,
        prefersReducedMotion,
        finalSettings: {
          performanceMode: shouldUsePerformanceMode,
          disableAnimations: shouldDisableAnimations,
          reducedIntensity: shouldReduceIntensity,
        }
      });
    };

    detectPerformance();

    // Listen for media query changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => detectPerformance();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return settings;
};
