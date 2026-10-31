import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Pencil, 
  Eye, 
  PanelRightClose, 
  FolderOpen, 
  Save, 
  Info, 
  CheckSquare, 
  Scale, 
  PenTool, 
  Plus 
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { SortableSlideItem } from '../slide/SortableSlideItem';
import type { CaseSlide } from '../../types';

interface EditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onHome: () => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPreview: boolean;
  onTogglePreview: () => void;
  onSave: () => void;
  caseTitle: string;
  onCaseTitleChange: (title: string) => void;
  slides: CaseSlide[];
  activeSlideIndex: number | null;
  onSelectSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onReorderSlides: (activeId: string, overId: string) => void;
  onAddSlide: (type: CaseSlide['type']) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  isOpen,
  onClose,
  onHome,
  onFileInputChange,
  isPreview,
  onTogglePreview,
  onSave,
  caseTitle,
  onCaseTitleChange,
  slides,
  activeSlideIndex,
  onSelectSlide,
  onDeleteSlide,
  onReorderSlides,
  onAddSlide,
}) => {
  const { t } = useTranslation();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderSlides(active.id as string, over.id as string);
    }
  };

  // Close add slide dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showAddMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddMenu(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAddMenu]);

  if (!isOpen) return null;

  return (
    <aside className="w-80 shrink-0 bg-gray-800 flex flex-col border-l border-gray-700 min-h-0 h-full animate-fade-in">
      {/* Top action header: navigation, file ops, preview & save, sidebar toggle */}
      <div className="p-3 border-b border-gray-700 flex flex-col gap-2.5 shrink-0 bg-gray-800/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={onHome}
              className="p-2 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title={t('common.home')}
            >
              <Home size={18} />
            </button>

            <label
              className="p-2 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title={t('editor.open')}
            >
              <FolderOpen size={18} />
              <input
                type="file"
                className="hidden"
                accept=".medcase,.zip"
                onChange={onFileInputChange}
              />
            </label>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title={t('editor.hideSidebar')}
          >
            <PanelRightClose size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onTogglePreview}
            className={`px-3 py-2 rounded-xl font-bold text-xs shadow transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${
              isPreview
                ? 'bg-blue-600 hover:bg-blue-500 text-white ring-1 ring-blue-400 shadow-blue-600/25'
                : 'bg-gray-700 hover:bg-gray-650 text-gray-200'
            }`}
            title={isPreview ? t('editor.editMode') : t('editor.previewMode')}
          >
            {isPreview ? <Pencil size={15} /> : <Eye size={15} />}
            <span className="truncate">{isPreview ? t('editor.editMode') : t('editor.previewMode')}</span>
          </button>

          <button
            onClick={onSave}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            title={t('editor.save')}
          >
            <Save size={15} />
            <span className="truncate">{t('editor.save')}</span>
          </button>
        </div>
      </div>

      {/* Case Name Input */}
      <div className="px-4 py-3 border-b border-gray-700 shrink-0 bg-gray-800">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          {t('editor.caseName')}
        </label>
        <input
          className="w-full bg-gray-900 border border-gray-600 focus:border-blue-500 text-white font-semibold px-3 py-2 rounded-lg focus:outline-none transition-colors text-sm"
          placeholder={t('editor.caseNamePlaceholder')}
          value={caseTitle}
          onChange={e => onCaseTitleChange(e.target.value)}
        />
      </div>

      {/* Slides List with "+ New Slide" at end */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext
            items={slides.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {slides.map((slide, idx) => (
              <SortableSlideItem
                key={slide.id}
                slide={slide}
                index={idx}
                isActive={idx === activeSlideIndex}
                onSelect={onSelectSlide}
                onDelete={onDeleteSlide}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* "+ New Slide" button directly below slides */}
        <div ref={addMenuRef} className="relative pt-1 pb-4">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`w-full border-2 py-3 px-4 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 transition-all cursor-pointer group shadow-sm ${
              slides.length === 0
                ? 'border-blue-500/80 bg-blue-600/15 text-white hover:bg-blue-600/25 ring-2 ring-blue-500/20'
                : 'border-dashed border-gray-600 hover:border-blue-400 bg-gray-800/80 hover:bg-blue-600/10 text-gray-300 hover:text-white'
            }`}
          >
            <Plus size={18} className={slides.length === 0 ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400 transition-colors'} />
            <span>{t('editor.newSlide')}</span>
          </button>

          {showAddMenu && (
            <div className="mt-2 bg-gray-700 border border-gray-600 rounded-xl shadow-2xl overflow-hidden z-20">
              <button
                onClick={() => { onAddSlide('INFO'); setShowAddMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 font-semibold text-sm text-gray-200 hover:text-white transition-colors border-b border-gray-600/80 cursor-pointer text-left"
              >
                <Info size={18} className="text-blue-400 shrink-0" />
                <span>{t('editor.infoSlide')}</span>
              </button>
              <button
                onClick={() => { onAddSlide('MULTIPLE_CHOICE'); setShowAddMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 font-semibold text-sm text-gray-200 hover:text-white transition-colors border-b border-gray-600/80 cursor-pointer text-left"
              >
                <CheckSquare size={18} className="text-amber-400 shrink-0" />
                <span>{t('editor.multipleChoice')}</span>
              </button>
              <button
                onClick={() => { onAddSlide('TRUE_FALSE'); setShowAddMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 font-semibold text-sm text-gray-200 hover:text-white transition-colors border-b border-gray-600/80 cursor-pointer text-left"
              >
                <Scale size={18} className="text-purple-400 shrink-0" />
                <span>{t('editor.trueFalse')}</span>
              </button>
              <button
                onClick={() => { onAddSlide('OPEN_TEXT'); setShowAddMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 font-semibold text-sm text-gray-200 hover:text-white transition-colors cursor-pointer text-left"
              >
                <PenTool size={18} className="text-emerald-400 shrink-0" />
                <span>{t('editor.openText')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
