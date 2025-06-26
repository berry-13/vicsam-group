import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type];

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 min-w-[300px] max-w-[420px] rounded-lg border border-border bg-background p-4 shadow-lg transition-all duration-300',
        isVisible ? 'animate-in slide-in-from-right-full' : 'animate-out slide-out-to-right-full',
        {
          'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950': type === 'success',
          'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950': type === 'error',
          'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950': type === 'warning',
          'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950': type === 'info',
        },
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('mt-0.5 h-5 w-5 flex-shrink-0', {
            'text-green-600 dark:text-green-400': type === 'success',
            'text-red-600 dark:text-red-400': type === 'error',
            'text-yellow-600 dark:text-yellow-400': type === 'warning',
            'text-blue-600 dark:text-blue-400': type === 'info',
          })}
        />
        <div className="flex-1 space-y-1">
          {title && (
            <h4 className={cn('text-sm font-semibold', {
              'text-green-800 dark:text-green-200': type === 'success',
              'text-red-800 dark:text-red-200': type === 'error',
              'text-yellow-800 dark:text-yellow-200': type === 'warning',
              'text-blue-800 dark:text-blue-200': type === 'info',
            })}>
              {title}
            </h4>
          )}
          {description && (
            <p className={cn('text-sm', {
              'text-green-700 dark:text-green-300': type === 'success',
              'text-red-700 dark:text-red-300': type === 'error',
              'text-yellow-700 dark:text-yellow-300': type === 'warning',
              'text-blue-700 dark:text-blue-300': type === 'info',
            })}>
              {description}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className={cn('ml-auto flex-shrink-0 rounded p-1 hover:bg-background/50 transition-colors', {
            'text-green-500 hover:text-green-600': type === 'success',
            'text-red-500 hover:text-red-600': type === 'error',
            'text-yellow-500 hover:text-yellow-600': type === 'warning',
            'text-blue-500 hover:text-blue-600': type === 'info',
          })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export { Toast };
