import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getAriaLabel = () => {
    switch (theme) {
      case 'light':
        return 'Cambia a tema scuro';
      case 'dark':
        return 'Cambia a tema sistema';
      case 'system':
        return 'Cambia a tema chiaro';
      default:
        return 'Cambia tema';
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={getAriaLabel()}
    >
      {getIcon()}
    </Button>
  );
}
