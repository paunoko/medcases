import React, { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'md',
  showCloseButton = false,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  theme = 'dark',
}) => {
  const { t } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidthMap[maxWidth]} ${
          isDark
            ? 'bg-gray-900 border border-gray-700 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        } rounded-3xl shadow-2xl overflow-hidden animate-scale-in z-10 ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className={`absolute top-5 right-5 p-2 rounded-xl transition-colors cursor-pointer z-20 ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={t('common.close', { defaultValue: 'Sulje' })}
            aria-label={t('common.close', { defaultValue: 'Sulje' })}
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
