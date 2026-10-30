import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCaseEditor } from '../hooks/useCaseEditor';
import { Home, Pencil, Eye, EyeOff, PanelRightClose, PanelRightOpen, FolderOpen, Save, ArrowRight, Info, CheckSquare, Scale, PenTool, Plus } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { SlideRenderer } from '../components/SlideRenderer';
import { SlideContainer } from '../components/slide/SlideContainer';
import { SlideTitle } from '../components/slide/SlideTitle';
import { SlideBody } from '../components/slide/SlideBody';
import { SlideInteraction } from '../components/slide/SlideInteraction';

import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

import { SortableSlideItem } from '../components/slide/SortableSlideItem';

export const EditorView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showConfirm } = useUI();
  const isEditMode = searchParams.get('mode') === 'edit';
  const [hasLoaded, setHasLoaded] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; filename: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewRevealed, setPreviewRevealed] = useState(false);
  const [dummyAnswers, setDummyAnswers] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const {
    caseData, updateMeta, activeSlideIndex, setActiveSlideIndex, imagePreviews,
    addSlide, deleteSlide, updateSlide, reorderSlides, attachImageToSlide, removeImageFromSlide, handleSave, handleLoad,
    hasUnsavedChanges
  } = useCaseEditor();

  const activeSlide = activeSlideIndex !== null ? caseData.slides[activeSlideIndex] : null;

  useEffect(() => {
    setPreviewRevealed(false);
  }, [activeSlideIndex, isPreview]);

  // Generate realistic dummy simulation answers in Preview mode
  useEffect(() => {
    if (!isPreview || !activeSlide) {
      setDummyAnswers([]);
      return;
    }

    if (activeSlide.type === 'MULTIPLE_CHOICE' || activeSlide.type === 'TRUE_FALSE') {
      const opts = activeSlide.type === 'TRUE_FALSE'
        ? [{ id: 'true', isCorrect: activeSlide.correctAnswer }, { id: 'false', isCorrect: !activeSlide.correctAnswer }]
        : (activeSlide as any).options || [];

      if (opts.length === 0) {
        setDummyAnswers([]);
        return;
      }

      const answers: any[] = [];
      const totalVotes = 25;
      const correctOpts = opts.filter((o: any) => o.isCorrect);
      const incorrectOpts = opts.filter((o: any) => !o.isCorrect);

      const correctVotesTotal = correctOpts.length > 0 ? Math.round(totalVotes * 0.64) : Math.round(totalVotes / opts.length);
      const remainingVotes = totalVotes - correctVotesTotal;

      for (let i = 0; i < correctVotesTotal; i++) {
        const targetOpt = correctOpts[i % correctOpts.length];
        answers.push({ socketId: `dummy-c-${i}`, answer: targetOpt.id });
      }

      if (incorrectOpts.length > 0) {
        for (let i = 0; i < remainingVotes; i++) {
          const targetOpt = incorrectOpts[i % incorrectOpts.length];
          answers.push({ socketId: `dummy-i-${i}`, answer: targetOpt.id });
        }
      } else {
        for (let i = 0; i < remainingVotes; i++) {
          answers.push({ socketId: `dummy-r-${i}`, answer: opts[i % opts.length].id });
        }
      }

      setDummyAnswers(answers);
    } else if (activeSlide.type === 'OPEN_TEXT') {
      const sampleBank = [
        'Lorem ipsum dolor',
        'Consectetur adipiscing',
        'Sed do eiusmod tempor',
        'Incididunt ut labore',
        'Dolore magna aliqua'
      ];

      setDummyAnswers([{ socketId: 'dummy-0', answer: sampleBank[0] }]);

      const timeouts: any[] = [];
      sampleBank.slice(1).forEach((ans, index) => {
        const delay = 1000 + (index * 1300) + Math.floor(Math.random() * 300);
        const tId = setTimeout(() => {
          setDummyAnswers(prev => [...prev, { socketId: `dummy-${index + 1}`, answer: ans }]);
        }, delay);
        timeouts.push(tId);
      });

      return () => {
        timeouts.forEach(tId => clearTimeout(tId));
      };
    } else {
      setDummyAnswers([]);
    }
  }, [isPreview, activeSlide]);

  const onFileLoad = async (file: File) => {
    await handleLoad(file);
    setHasLoaded(true);
  };

  const handleHome = async () => {
    if (hasUnsavedChanges) {
      const confirmed = await showConfirm({
        title: t('editor.unsavedChanges'),
        message: t('editor.unsavedChangesMsg'),
        confirmText: t('editor.stopEditing'),
        variant: 'destructive',
      });
      if (!confirmed) return;
    }
    navigate('/', { state: { tab: 'teacher' } });
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (hasUnsavedChanges) {
      const confirmed = await showConfirm({
        title: t('editor.loadNewFile'),
        message: t('editor.loadNewFileMsg'),
        confirmText: t('editor.loadAndDiscard'),
        variant: 'destructive'
      });
      if (!confirmed) {
        e.target.value = '';
        return;
      }
    }
    await handleLoad(file);
    e.target.value = '';
  };

  const onSave = async () => {
    const filename = await handleSave();
    setToast({ show: true, filename });

    // Auto-redirect after 5 seconds
    setTimeout(() => {
      navigate('/', { state: { tab: 'teacher' } });
    }, 5000);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save, Escape to close menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape' && showAddMenu) {
        setShowAddMenu(false);
      } else if (isPreview && (e.key === ' ' || e.key === 'Enter') && activeSlide?.type !== 'INFO') {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          setPreviewRevealed(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, showAddMenu, isPreview, activeSlide]);

  // Close add slide dropdown when clicking outside
  useEffect(() => {
    if (!showAddMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  const handleToastDismiss = () => {
    navigate('/', { state: { tab: 'teacher' } });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSlides(active.id as string, over.id as string);
    }
  };

  if (isEditMode && !hasLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 relative">
        <button
          onClick={() => navigate('/', { state: { tab: 'teacher' } })}
          className="absolute top-4 left-4 bg-white p-2 rounded-full shadow hover:bg-gray-50 text-2xl"
          title={t('common.home')}
        >
          <Home size={24} />
        </button>
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">{t('editor.viewTitle')} <Pencil size={24} /></h1>
          <p className="text-gray-500 mb-6">{t('editor.loadFile')}</p>

          <label className="block w-full border-2 border-dashed border-blue-300 rounded-lg p-8 cursor-pointer hover:bg-blue-50 transition-colors">
            <span className="text-blue-600 font-bold">{t('editor.selectFile')}</span>
            <input
              type="file"
              className="hidden"
              accept=".medcase,.zip"
              onChange={(e) => e.target.files?.[0] && onFileLoad(e.target.files[0])}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* LEFT: WYSIWYG Preview / Editor */}
      <main className="flex-1 min-w-0 p-4 flex flex-col bg-gray-900 overflow-hidden min-h-0 relative">
        <div className="flex-1 relative transition-all duration-300 min-h-0">
          {activeSlide ? (
            isPreview ? (
              <>
                <SlideRenderer
                  slide={activeSlide}
                  imageMap={imagePreviews}
                  isRevealed={previewRevealed}
                  answers={dummyAnswers}
                />
                {activeSlide.type !== 'INFO' && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-gray-900/90 backdrop-blur-md border border-gray-700/80 p-1.5 rounded-2xl shadow-2xl">
                    <button
                      onClick={() => setPreviewRevealed(prev => !prev)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                        previewRevealed
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {previewRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span>{previewRevealed ? t('teacher.tryHide') : t('teacher.tryReveal')}</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <SlideContainer>
                <SlideTitle
                  value={activeSlide.title}
                  mode="edit"
                  onChange={val => updateSlide(activeSlideIndex!, 'title', val)}
                />

                <SlideBody
                  content={activeSlide.content}
                  imageUrl={activeSlide.imageFileName ? imagePreviews[activeSlide.imageFileName] : null}
                  mode="edit"
                  onContentChange={val => updateSlide(activeSlideIndex!, 'content', val)}
                  onImageChange={file => attachImageToSlide(activeSlideIndex!, file)}
                  onImageRemove={() => removeImageFromSlide(activeSlideIndex!)}
                />

                <SlideInteraction
                  slide={activeSlide}
                  mode="edit"
                  onUpdate={(field, value) => updateSlide(activeSlideIndex!, field, value)}
                />
              </SlideContainer>
            )
          ) : (
            <div className="flex h-full flex-col mt-32 items-center justify-start text-gray-500 gap-6">
              <ArrowRight size={64} className="animate-bounce" />
              <div className="text-3xl font-bold uppercase tracking-widest text-gray-600">{t('editor.selectOrCreateSlide')}</div>
            </div>
          )}

          {/* Floating actions when sidebar is closed */}
          {!isSidebarOpen && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-gray-900/90 backdrop-blur-md border border-gray-700 p-1.5 rounded-2xl shadow-2xl">
              <button
                onClick={handleHome}
                className="p-2 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title={t('common.home')}
              >
                <Home size={18} />
              </button>

              <label
                className="p-2 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer"
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

              <div className="h-5 w-px bg-gray-700 mx-0.5" />

              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isPreview
                    ? 'bg-blue-600 hover:bg-blue-500 text-white ring-1 ring-blue-400'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                }`}
                title={isPreview ? t('editor.editMode') : t('editor.previewMode')}
              >
                {isPreview ? <Pencil size={15} /> : <Eye size={15} />}
                <span>{isPreview ? t('editor.editMode') : t('editor.previewMode')}</span>
              </button>

              <button
                onClick={onSave}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                title={t('editor.save')}
              >
                <Save size={15} />
                <span>{t('editor.save')}</span>
              </button>

              <div className="h-5 w-px bg-gray-700 mx-0.5" />

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title={t('editor.showSidebar')}
              >
                <PanelRightOpen size={18} />
                <span className="hidden sm:inline">{t('editor.showSidebar')}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT: Settings and Slides */}
      {isSidebarOpen && (
        <aside className="w-80 shrink-0 bg-gray-800 flex flex-col border-l border-gray-700 min-h-0 h-full">
          {/* Top action header: navigation, file ops, preview & save, sidebar toggle */}
          <div className="p-3 border-b border-gray-700 flex flex-col gap-2.5 shrink-0 bg-gray-800/95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleHome}
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
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title={t('editor.hideSidebar')}
              >
                <PanelRightClose size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`px-3 py-2 rounded-lg font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  isPreview
                    ? 'bg-blue-600 hover:bg-blue-500 text-white ring-1 ring-blue-400'
                    : 'bg-gray-700 hover:bg-gray-650 text-gray-200'
                }`}
                title={isPreview ? t('editor.editMode') : t('editor.previewMode')}
              >
                {isPreview ? <Pencil size={15} /> : <Eye size={15} />}
                <span className="truncate">{isPreview ? t('editor.editMode') : t('editor.previewMode')}</span>
              </button>

              <button
                onClick={onSave}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
              value={caseData.meta.title}
              onChange={e => updateMeta('title', e.target.value)}
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
                items={caseData.slides.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {caseData.slides.map((slide, idx) => (
                  <SortableSlideItem
                    key={slide.id}
                    slide={slide}
                    index={idx}
                    isActive={idx === activeSlideIndex}
                    onSelect={setActiveSlideIndex}
                    onDelete={deleteSlide}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* "+ New Slide" button directly below slides */}
            <div ref={addMenuRef} className="relative pt-1 pb-4">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full border-2 border-dashed border-gray-600 hover:border-blue-400 bg-gray-800/80 hover:bg-blue-600/10 text-gray-300 hover:text-white py-3 px-4 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 transition-all cursor-pointer group shadow-sm"
              >
                <Plus size={18} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                <span>{t('editor.newSlide')}</span>
              </button>

              {showAddMenu && (
                <div className="mt-2 bg-gray-700 border border-gray-600 rounded-xl shadow-2xl overflow-hidden z-20">
                  <button
                    onClick={() => { addSlide('INFO'); setShowAddMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 font-semibold text-sm text-gray-200 hover:text-white transition-colors border-b border-gray-600/80 cursor-pointer text-left"
                  >
                    <Info size={18} className="text-blue-400 shrink-0" />
                    <span>{t('editor.infoSlide')}</span>
                  </button>
                  <button
                    onClick={() => { addSlide('MULTIPLE_CHOICE'); setShowAddMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 font-semibold text-sm text-gray-200 hover:text-white transition-colors border-b border-gray-600/80 cursor-pointer text-left"
                  >
                    <CheckSquare size={18} className="text-amber-400 shrink-0" />
                    <span>{t('editor.multipleChoice')}</span>
                  </button>
                  <button
                    onClick={() => { addSlide('TRUE_FALSE'); setShowAddMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 font-semibold text-sm text-gray-200 hover:text-white transition-colors border-b border-gray-600/80 cursor-pointer text-left"
                  >
                    <Scale size={18} className="text-purple-400 shrink-0" />
                    <span>{t('editor.trueFalse')}</span>
                  </button>
                  <button
                    onClick={() => { addSlide('OPEN_TEXT'); setShowAddMenu(false); }}
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
      )}

      {/* TOAST */}
      {toast?.show && (
        <div className="fixed bottom-8 right-8 bg-gray-900 border border-gray-700 text-white p-6 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-up">
          <div className="flex items-start gap-4">
            <Save size={40} className="animate-bounce" />
            <div>
              <h3 className="font-bold text-xl mb-1 text-green-400">{t('editor.fileSaved')}</h3>
              <p className="text-gray-300 mb-2 break-all font-mono text-sm bg-gray-800 p-2 rounded">{toast.filename}</p>
              <p className="text-gray-400 text-sm mb-4">{t('editor.findInDownloads')}</p>
              <button
                onClick={handleToastDismiss}
                className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 w-full transition-colors"
              >
                {t('editor.backToHome')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};