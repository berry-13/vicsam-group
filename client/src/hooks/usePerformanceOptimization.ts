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
      
      // Check GPU performance indicators with robust error handling
      let isLowGPU = false;
      try {
        // Safety check for document availability
        if (typeof document === 'undefined') {
          console.warn('Document is not available, defaulting to low GPU performance');
          isLowGPU = true;
        } else {
          const canvas = document.createElement('canvas');
          
          // Verify canvas creation was successful
          if (!canvas) {
            console.warn('Canvas creation failed, defaulting to low GPU performance');
            isLowGPU = true;
          } else {
            // Try WebGL2 first, then fallback to WebGL1
            let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
            
            try {
              gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
              if (!gl) {
                gl = canvas.getContext('webgl') as WebGLRenderingContext;
              }
            } catch (contextError) {
              console.warn('WebGL context creation failed:', contextError);
              gl = null;
            }
            
            if (!gl) {
              console.warn('WebGL is not supported or disabled, defaulting to low GPU performance');
              isLowGPU = true;
            } else {
              try {
                // Attempt to get debug renderer info extension
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                
                if (!debugInfo) {
                  console.warn('WEBGL_debug_renderer_info extension not available, using fallback GPU detection');
                  // Fallback: check for basic WebGL capabilities
                  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                  const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
                  
                  // Basic heuristics for low-end detection when extension is unavailable
                  isLowGPU = (maxTextureSize && maxTextureSize < 4096) || 
                            (maxVertexAttribs && maxVertexAttribs < 16);
                } else {
                  try {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    
                    if (!renderer || typeof renderer !== 'string') {
                      console.warn('Unable to retrieve GPU renderer info, using conservative fallback');
                      isLowGPU = true;
                    } else {
                      // Enhanced GPU detection patterns
                      const lowEndPatterns = [
                        /Intel.*HD Graphics/i,
                        /Intel.*UHD Graphics/i,
                        /Intel.*Iris.*5[0-9][0-9]/i, // Iris 5xx series and below
                        /Intel.*integrated/i,
                        /Mali-[1-4][0-9][0-9]/i, // Mali 400 series and below
                        /Adreno [1-5][0-9][0-9]/i, // Adreno 500 series and below
                        /PowerVR.*SGX/i,
                        /VideoCore/i,
                        /SwiftShader/i, // Software renderer
                        /Microsoft.*Basic.*Render/i // Windows basic renderer
                      ];
                      
                      isLowGPU = lowEndPatterns.some(pattern => pattern.test(renderer));
                      
                      if (isLowGPU) {
                        console.info('Low-end GPU detected:', renderer);
                      } else {
                        console.info('GPU detected:', renderer);
                      }
                    }
                  } catch (paramError) {
                    console.warn('Failed to retrieve GPU parameters:', paramError);
                    isLowGPU = true;
                  }
                }
              } catch (extensionError) {
                console.warn('Error accessing WebGL extensions:', extensionError);
                isLowGPU = true;
              }
            }
            
            // Clean up canvas
            try {
              canvas.width = 0;
              canvas.height = 0;
            } catch (cleanupError) {
              console.warn('Canvas cleanup failed:', cleanupError);
            }
          }
        }
      } catch (error) {
        // Comprehensive error logging for debugging
        console.error('WebGL GPU detection failed with unexpected error:', error);
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
