import React from 'react';
import { Toast } from './ui/toast';
import { useToast } from '../hooks/useToast';

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  );
};
