import React, { createContext, useContext, useState, type ReactNode } from 'react';

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

// Internal Dialog Component
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

const DialogComponent: React.FC<{ dialog: DialogState }> = ({ dialog }) => {
  const isDestructive = dialog.variant === 'destructive';
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => dialog.type === 'alert' && dialog.resolve(true)}
      />
      
      {/* Modal Content */}
      <div className="relative bg-gray-900 border border-gray-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-2xl ${
              dialog.variant === 'destructive' ? 'bg-red-500/20 text-red-400' :
              dialog.variant === 'success' ? 'bg-green-500/20 text-green-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {dialog.variant === 'destructive' ? <AlertTriangle size={32} /> :
               dialog.variant === 'success' ? <CheckCircle size={32} /> :
               <Info size={32} />}
            </div>
            <h2 className="text-2xl font-bold text-white">{dialog.title}</h2>
          </div>
          
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            {dialog.message}
          </p>
          
          <div className="flex gap-3">
            {dialog.type === 'confirm' && (
              <button
                onClick={() => dialog.resolve(false)}
                className="flex-1 px-6 py-4 rounded-2xl font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {dialog.cancelText || 'Peruuta'}
              </button>
            )}
            <button
              onClick={() => dialog.resolve(true)}
              className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                isDestructive ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 
                'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
              }`}
            >
              {dialog.confirmText || (dialog.type === 'confirm' ? 'Vahvista' : 'OK')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
