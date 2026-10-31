import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCaseEditor } from '../hooks/useCaseEditor';
import { Home, Pencil, Eye, EyeOff, PanelRightOpen, FolderOpen, Save, CheckCircle2, FileText, Presentation } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { Modal } from '../components/common/Modal';
import { FilePickerView } from '../components/common/FilePickerView';
import { SlideRenderer } from '../components/SlideRenderer';
import { SlideContainer } from '../components/slide/SlideContainer';
import { SlideTitle } from '../components/slide/SlideTitle';
import { SlideBody } from '../components/slide/SlideBody';
import { SlideInteraction } from '../components/slide/SlideInteraction';
import { EditorSidebar } from '../components/editor/EditorSidebar';

import type { StudentAnswer } from '../types';

export const EditorView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showConfirm } = useUI();
  const isEditMode = searchParams.get('mode') === 'edit';
  const [hasLoaded, setHasLoaded] = useState(false);

  const [saveModal, setSaveModal] = useState<{ isOpen: boolean; filename: string } | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewRevealed, setPreviewRevealed] = useState(false);
  const [dummyAnswers, setDummyAnswers] = useState<StudentAnswer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    caseData, updateMeta, activeSlideIndex, setActiveSlideIndex, imagePreviews,
    addSlide, deleteSlide, updateSlide, reorderSlides, attachImageToSlide, removeImageFromSlide, handleSave, handleLoad,
    hasUnsavedChanges
  } = useCaseEditor();

  const activeSlide = (activeSlideIndex !== null && caseData.slides[activeSlideIndex])
    ? caseData.slides[activeSlideIndex]
    : null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewRevealed(false);
  }, [activeSlideIndex, isPreview]);

  // Generate realistic dummy simulation answers in Preview mode
  useEffect(() => {
    if (!isPreview || !activeSlide) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDummyAnswers([]);
      return;
    }

    if (activeSlide.type === 'MULTIPLE_CHOICE' || activeSlide.type === 'TRUE_FALSE') {
      const opts = activeSlide.type === 'TRUE_FALSE'
        ? [{ id: 'true', isCorrect: activeSlide.correctAnswer }, { id: 'false', isCorrect: !activeSlide.correctAnswer }]
        : activeSlide.options;

      const validOpts = opts.filter((o) => o && o.id);
      if (validOpts.length === 0) {
        setDummyAnswers([]);
        return;
      }

      const answers: StudentAnswer[] = [];
      const totalVotes = 25;
      const correctOpts = validOpts.filter((o) => o.isCorrect);
      const incorrectOpts = validOpts.filter((o) => !o.isCorrect);

      if (correctOpts.length > 0) {
        const correctVotesTotal = Math.round(totalVotes * 0.64);
        const remainingVotes = totalVotes - correctVotesTotal;

        for (let i = 0; i < correctVotesTotal; i++) {
          const targetOpt = correctOpts[i % correctOpts.length];
          if (targetOpt?.id) {
            answers.push({ slideId: activeSlide.id, answer: targetOpt.id });
          }
        }

        if (incorrectOpts.length > 0) {
          for (let i = 0; i < remainingVotes; i++) {
            const targetOpt = incorrectOpts[i % incorrectOpts.length];
            if (targetOpt?.id) {
              answers.push({ slideId: activeSlide.id, answer: targetOpt.id });
            }
          }
        } else {
          for (let i = 0; i < remainingVotes; i++) {
            const targetOpt = validOpts[i % validOpts.length];
            if (targetOpt?.id) {
              answers.push({ slideId: activeSlide.id, answer: targetOpt.id });
            }
          }
        }
      } else {
        // No option marked as correct yet: distribute votes across all available options
        for (let i = 0; i < totalVotes; i++) {
          const targetOpt = validOpts[i % validOpts.length];
          if (targetOpt?.id) {
            answers.push({ slideId: activeSlide.id, answer: targetOpt.id });
          }
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

      setDummyAnswers([{ slideId: activeSlide.id, answer: sampleBank[0] }]);

      const timeouts: ReturnType<typeof setTimeout>[] = [];
      sampleBank.slice(1).forEach((ans, index) => {
        const delay = 1000 + (index * 1300) + Math.floor(Math.random() * 300);
        const tId = setTimeout(() => {
          setDummyAnswers(prev => [...prev, { slideId: activeSlide.id, answer: ans }]);
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

  const onSave = useCallback(async () => {
    const filename = await handleSave();
    setSaveModal({ isOpen: true, filename });
  }, [handleSave]);

  // Keyboard shortcut Ctrl+S / Cmd+S to save, Space/Enter in preview to toggle reveal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      } else if (isPreview && (e.key === ' ' || e.key === 'Enter') && activeSlide?.type !== 'INFO') {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          setPreviewRevealed(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, isPreview, activeSlide]);

  if (isEditMode && !hasLoaded) {
    return (
      <FilePickerView
        title={t('landing.editExisting', { defaultValue: 'Muokkaa tapausta' })}
        onFileSelected={onFileLoad}
        onBack={() => navigate('/', { state: { tab: 'teacher' } })}
        variant="blue"
      />
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
            <div className="flex h-full w-full items-center justify-center p-6 animate-fade-in">
              <div className="max-w-md w-full bg-gray-800/70 border border-gray-700/70 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-sm">
                <div className="p-4 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/25 mb-5 shadow-inner">
                  <Presentation size={36} />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2.5">
                  {t('editor.emptyStateTitle')}
                </h2>

                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-sm">
                  {t('editor.emptyStateHint')}
                </p>

                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="mt-6 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
                  >
                    <PanelRightOpen size={18} />
                    <span>{t('editor.showSidebar')}</span>
                  </button>
                )}
              </div>
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
      <EditorSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onHome={handleHome}
        onFileInputChange={onFileInputChange}
        isPreview={isPreview}
        onTogglePreview={() => setIsPreview(!isPreview)}
        onSave={onSave}
        caseTitle={caseData.meta.title}
        onCaseTitleChange={title => updateMeta('title', title)}
        slides={caseData.slides}
        activeSlideIndex={activeSlideIndex}
        onSelectSlide={setActiveSlideIndex}
        onDeleteSlide={deleteSlide}
        onReorderSlides={reorderSlides}
        onAddSlide={addSlide}
      />

      {/* SAVE MODAL */}
      <Modal
        isOpen={!!saveModal?.isOpen}
        onClose={() => setSaveModal(null)}
        maxWidth="md"
        showCloseButton
        theme="dark"
      >
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">{t('editor.fileSaved')}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{t('editor.findInDownloads')}</p>
            </div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={20} className="text-emerald-400 shrink-0" />
              <span className="font-mono text-sm text-gray-200 truncate select-all">{saveModal?.filename}</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0 border border-emerald-500/20">
              .medcase
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setSaveModal(null)}
              className="flex-1 px-5 py-3.5 rounded-2xl font-bold bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer border border-gray-700"
            >
              {t('editor.continueEditing')}
            </button>
            <button
              onClick={() => navigate('/', { state: { tab: 'teacher' } })}
              className="flex-1 px-5 py-3.5 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Home size={18} />
              <span>{t('editor.backToMenu')}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};