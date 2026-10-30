import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/common/Modal';

type DialogType = 'alert' | 'confirm';
type DialogVariant = 'primary' | 'destructive' | 'success';

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

interface DialogState extends DialogOptions {
  type: DialogType;
  resolve: (value: boolean) => void;
}

interface UIContextType {
  showAlert: (options: DialogOptions) => Promise<void>;
  showConfirm: (options: DialogOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const showAlert = (options: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        type: 'alert',
        resolve: () => {
          setDialog(null);
          resolve();
        },
      });
    });
  };

  const showConfirm = (options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        type: 'confirm',
        resolve: (value: boolean) => {
          setDialog(null);
          resolve(value);
        },
      });
    });
  };

  return (
    <UIContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialog && <DialogComponent dialog={dialog} />}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

const DialogComponent: React.FC<{ dialog: DialogState }> = ({ dialog }) => {
  const { t } = useTranslation();
  const isDestructive = dialog.variant === 'destructive';
  const isSuccess = dialog.variant === 'success';

  return (
    <Modal
      isOpen={true}
      onClose={() => dialog.resolve(dialog.type === 'alert')}
      maxWidth="md"
      closeOnBackdropClick={dialog.type === 'alert'}
      theme="dark"
    >
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`p-3 rounded-2xl ${
              isDestructive
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isDestructive ? (
              <AlertTriangle size={32} />
            ) : isSuccess ? (
              <CheckCircle2 size={32} />
            ) : (
              <Info size={32} />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{dialog.title}</h2>
        </div>

        <p className="text-gray-300 text-lg leading-relaxed mb-8">
          {dialog.message}
        </p>

        <div className="flex gap-3">
          {dialog.type === 'confirm' && (
            <button
              onClick={() => dialog.resolve(false)}
              className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer border border-gray-700"
            >
              {dialog.cancelText || t('common.cancel')}
            </button>
          )}
          <button
            onClick={() => dialog.resolve(true)}
            className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 shadow-red-950/30'
                : isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/30'
            }`}
          >
            {dialog.confirmText || (dialog.type === 'confirm' ? t('common.confirm') : 'OK')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
