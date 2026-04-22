import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizeText } from '../../hooks/useResizeText';
import { Trash2 } from 'lucide-react';

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
  const contentRef = useRef<any>(null); // HTMLDivElement or HTMLTextAreaElement
  useResizeText(contentRef, [content, imageUrl]);

  const hasImage = !!imageUrl;

  return (
    <div className={`flex flex-row gap-6 flex-1 min-h-0 ${(content || hasImage || mode === 'edit') ? '' : 'hidden'}`}>
      
      {/* CONTENT AREA */}
      {mode === 'edit' ? (
        <textarea
          ref={contentRef}
          className="flex-1 min-h-0 overflow-y-auto prose max-w-none text-3xl leading-snug text-gray-700 whitespace-pre-wrap bg-transparent border-2 border-dashed border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none resize-none transition-colors rounded-lg p-2 -ml-2 custom-scrollbar"
          placeholder={effectivePlaceholder}
          value={content}
          onChange={e => onContentChange?.(e.target.value)}
        />
      ) : (
        content && (
          <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto prose max-w-none text-3xl leading-snug text-gray-700 whitespace-pre-wrap custom-scrollbar pr-4">
            {content}
          </div>
        )
      )}

      {/* IMAGE AREA */}
      {(hasImage || mode === 'edit') && (
        <div className={`flex-1 min-h-0 flex justify-center items-center rounded-lg overflow-hidden border-2 transition-all relative group ${
          mode === 'edit' 
            ? 'border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50' 
            : 'bg-black/5 border-gray-200'
        }`}>
          {hasImage ? (
            <>
              <img
                src={imageUrl}
                alt="Slide attachment"
                className={`w-full h-full object-contain ${mode === 'edit' ? 'opacity-90 group-hover:opacity-40 transition-opacity' : ''}`}
              />
              {mode === 'edit' && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    <span className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg text-xl">{t('editor.changeImage')}</span>
                  </div>
                  <button 
                    className="absolute top-4 right-4 bg-red-500 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 z-10 transition-all scale-90 hover:scale-100"
                    onClick={(e) => {
                      e.preventDefault();
                      onImageRemove?.();
                    }}
                    title={t('editor.removeImage')}
                  >
                    <Trash2 size={24} />
                  </button>
                </>
              )}
            </>
          ) : (
            mode === 'edit' && (
              <div className="flex items-center justify-center h-full w-full text-gray-400 font-bold text-2xl group-hover:text-blue-500 transition-colors text-center p-4">
                {t('editor.addImageOptional')}
              </div>
            )
          )}

          {mode === 'edit' && (
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={e => e.target.files?.[0] && onImageChange?.(e.target.files[0])} 
            />
          )}
        </div>
      )}
    </div>
  );
};
