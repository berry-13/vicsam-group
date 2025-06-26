import React from 'react';
import { useToast, ToastContext, type ToastContextType } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastContainer';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { success, error, warning, info } = useToast();

  const value: ToastContextType = {
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};
