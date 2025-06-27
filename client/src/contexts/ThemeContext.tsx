import React, { createContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void; // Add this for backward compatibility
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export { ThemeProviderContext };

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    
    try {
      // Safely access localStorage with error handling
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      return storedTheme || defaultTheme;
    } catch (error) {
      // Fallback to defaultTheme if localStorage access fails
      console.warn('Failed to access localStorage for theme:', error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = window.document.documentElement;
    const currentClasses = root.classList;
    
    // Determine the target theme
    let targetTheme: string;
    if (theme === 'system') {
      targetTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      targetTheme = theme;
    }
    
    // Optimize by checking if the current class list already matches the intended theme
    const hasTargetTheme = currentClasses.contains(targetTheme);
    const hasOtherTheme = (targetTheme === 'dark' && currentClasses.contains('light')) || 
                          (targetTheme === 'light' && currentClasses.contains('dark'));
    
    // Only modify classes if necessary
    if (!hasTargetTheme || hasOtherTheme) {
      currentClasses.remove('light', 'dark');
      currentClasses.add(targetTheme);
      console.log('Applied theme:', targetTheme, 'Classes:', root.className);
    }
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes when theme is set to 'system'
    if (theme === 'system') {
      // Safety check for browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const root = window.document.documentElement;
        const targetTheme = e.matches ? 'dark' : 'light';
        const currentClasses = root.classList;
        
        // Optimize by checking if the current class list already matches the intended theme
        const hasTargetTheme = currentClasses.contains(targetTheme);
        const hasOtherTheme = (targetTheme === 'dark' && currentClasses.contains('light')) || 
                              (targetTheme === 'light' && currentClasses.contains('dark'));
        
        // Only modify classes if necessary
        if (!hasTargetTheme || hasOtherTheme) {
          currentClasses.remove('light', 'dark');
          currentClasses.add(targetTheme);
          console.log('System theme changed:', targetTheme);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      console.log('Setting theme to:', theme);
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    toggleTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
