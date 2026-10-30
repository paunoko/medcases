import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, ImagePlus, Maximize2, X } from 'lucide-react';

interface Props {
  content: string;
  imageUrl?: string | null;
  mode: 'view' | 'edit';
  onContentChange?: (val: string) => void;
  onImageChange?: (file: File) => void;
  onImageRemove?: () => void;
  placeholder?: string;
}

export const SlideBody: React.FC<Props> = ({ 
  content, 
  imageUrl, 
  mode, 
  onContentChange, 
  onImageChange, 
  onImageRemove,
  placeholder
}) => {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder || t('editor.slideContentPlaceholder');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const hasImage = !!imageUrl;

  return (
    <div className={`flex flex-row gap-6 flex-1 min-h-0 ${(content || hasImage || mode === 'edit') ? '' : 'hidden'}`}>
      
      {/* CONTENT AREA */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        {mode === 'edit' && !hasImage && (
          <div className="absolute top-0 right-0 z-10">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-700 font-semibold text-sm rounded-lg border border-dashed border-gray-300 hover:border-blue-400 cursor-pointer shadow-sm transition-all">
              <ImagePlus size={16} />
              <span>{t('editor.addImage')}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={e => e.target.files?.[0] && onImageChange?.(e.target.files[0])} 
              />
            </label>
          </div>
        )}

        {mode === 'edit' ? (
          <textarea
            className={`flex-1 min-h-0 overflow-y-auto prose max-w-none text-3xl leading-relaxed text-gray-900 font-medium whitespace-pre-wrap bg-transparent border-2 border-dashed border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none resize-none transition-colors rounded-lg p-2 -ml-2 custom-scrollbar ${!hasImage ? 'pr-36' : ''}`}
            placeholder={effectivePlaceholder}
            value={content}
            onChange={e => onContentChange?.(e.target.value)}
          />
        ) : (
          content && (
            <div className="flex-1 min-h-0 overflow-y-auto prose max-w-none text-3xl leading-relaxed text-gray-900 font-medium whitespace-pre-wrap custom-scrollbar pr-4">
              {content}
            </div>
          )
        )}
      </div>

      {/* IMAGE AREA */}
      {hasImage && (
        <div 
          onClick={() => mode === 'view' && setIsLightboxOpen(true)}
          className={`flex-1 min-h-0 flex justify-center items-center rounded-lg overflow-hidden border-2 transition-all relative group ${
            mode === 'edit' 
              ? 'border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50' 
              : 'bg-black/5 border-gray-200 cursor-zoom-in'
          }`}
          title={mode === 'view' ? t('teacher.enlargeImage') : undefined}
        >
          <img
            src={imageUrl}
            alt="Slide attachment"
            className={`w-full h-full object-contain ${mode === 'edit' ? 'opacity-90 group-hover:opacity-40 transition-opacity' : 'group-hover:scale-[1.01] transition-transform duration-300'}`}
          />

          {/* View mode: enlarge hint overlay on hover */}
          {mode === 'view' && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-lg pointer-events-none">
              <Maximize2 size={16} />
              <span>{t('teacher.enlargeImage')}</span>
            </div>
          )}

          {/* Edit mode: replace / delete controls */}
          {mode === 'edit' && (
            <>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                <span className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg text-xl">{t('editor.changeImage')}</span>
              </div>
              <button 
                className="absolute top-4 right-4 bg-red-500 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 z-10 transition-all scale-90 hover:scale-100 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  onImageRemove?.();
                }}
                title={t('editor.removeImage')}
              >
                <Trash2 size={24} />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={e => e.target.files?.[0] && onImageChange?.(e.target.files[0])} 
              />
            </>
          )}
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN MODAL (View mode only, rendered to body via Portal) */}
      {isLightboxOpen && imageUrl && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors cursor-pointer z-10 shadow-lg"
            title={t('common.close')}
          >
            <X size={28} />
          </button>

          <img
            src={imageUrl}
            alt="Enlarged medical view"
            className="max-w-[95vw] max-h-[92vh] object-contain rounded-lg shadow-2xl select-none"
            onClick={e => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-gray-900/80 border border-gray-700/60 px-4 py-1.5 rounded-full pointer-events-none shadow-lg">
            {t('teacher.closeImageHint')}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
