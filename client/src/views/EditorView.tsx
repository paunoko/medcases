import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCaseEditor } from '../hooks/useCaseEditor';
import { Home, Pencil, FolderOpen, Save, ArrowRight, Info, CheckSquare, Scale, PenTool, Plus } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditMode = searchParams.get('mode') === 'edit';
  const [hasLoaded, setHasLoaded] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; filename: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const {
    caseData, setCaseData, activeSlideIndex, setActiveSlideIndex, imagePreviews,
    addSlide, deleteSlide, updateSlide, reorderSlides, attachImageToSlide, handleSave, handleLoad
  } = useCaseEditor();

  const activeSlide = activeSlideIndex !== null ? caseData.slides[activeSlideIndex] : null;

  const onFileLoad = async (file: File) => {
    await handleLoad(file);
    setHasLoaded(true);
  };

  const handleHome = () => {
    if (confirm('Haluatko varmasti poistua tallentamatta?')) {
      navigate('/', { state: { tab: 'teacher' } });
    }
  };

  const onSave = async () => {
    const filename = await handleSave();
    setToast({ show: true, filename });

    // Auto-redirect after 5 seconds
    setTimeout(() => {
      navigate('/', { state: { tab: 'teacher' } });
    }, 5000);
  };

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
          title="Takaisin etusivulle"
        >
          <Home size={24} />
        </button>
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">Muokkaa tapausta <Pencil size={24} /></h1>
          <p className="text-gray-500 mb-6">Lataa olemassa oleva .medcase tiedosto</p>

          <label className="block w-full border-2 border-dashed border-blue-300 rounded-lg p-8 cursor-pointer hover:bg-blue-50 transition-colors">
            <span className="text-blue-600 font-bold">Valitse tiedosto koneelta</span>
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
    <div className="flex h-screen flex-col bg-gray-900 text-white overflow-hidden">
      {/* HEADER */}
      <header className="bg-gray-800 border-b border-gray-700 text-white p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={handleHome} className="text-2xl hover:bg-gray-700 p-2 rounded transition-colors" title="Etusivulle"><Home size={24} /></button>
          <h1 className="font-bold text-xl uppercase tracking-wider text-gray-200">MedCases Editor</h1>
        </div>
        <div className="flex gap-4">
          <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-bold shadow transition-colors flex items-center gap-2">
            <FolderOpen size={20} /> Avaa
            <input type="file" className="hidden" accept=".medcase,.zip" onChange={(e) => e.target.files?.[0] && handleLoad(e.target.files[0])} />
          </label>
          <button onClick={onSave} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold shadow-lg transition-colors flex items-center gap-2">
            <Save size={20} /> Tallenna
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: WYSIWYG Preview / Editor */}
        <div className="flex-1 p-4 flex flex-col bg-gray-900 overflow-hidden min-h-0">
          <div className="flex-1 relative transition-all duration-300 min-h-0">
            {activeSlide ? (
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
                  onImageRemove={() => updateSlide(activeSlideIndex!, 'imageFileName', undefined)}
                />

                <SlideInteraction
                  slide={activeSlide}
                  mode="edit"
                  onUpdate={(field, value) => updateSlide(activeSlideIndex!, field, value)}
                />
              </SlideContainer>
            ) : (
              <div className="flex h-full flex-col mt-32 items-center justify-start text-gray-500 gap-6">
                <ArrowRight size={64} className="animate-bounce" />
                <div className="text-3xl font-bold uppercase tracking-widest text-gray-600">Valitse tai luo dia oikealta</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Settings and Slides (TeacherView w-80 panel) */}
        <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700 p-6 min-h-0">
          <div className="mb-6 bg-gray-750 p-4 rounded-xl border border-gray-700 shadow-inner bg-gray-900/50">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Tapauksen nimi</label>
            <input
              className="w-full bg-gray-800 border-2 border-gray-600 text-white font-bold p-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-lg"
              placeholder="Anna nimi..."
              value={caseData.meta.title}
              onChange={e => setCaseData({ ...caseData, meta: { ...caseData.meta, title: e.target.value } })}
            />
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-visible pr-2 space-y-3 custom-scrollbar">
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
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700 relative shrink-0">
            {showAddMenu && (
              <div className="absolute bottom-full left-0 w-full mb-3 bg-gray-700 border border-gray-600 rounded-xl shadow-2xl overflow-hidden z-20">
                <button onClick={() => { addSlide('INFO'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors border-b border-gray-600/50"><Info size={20} className="inline mr-2 -mt-1"/> Info-dia</button>
                <button onClick={() => { addSlide('MULTIPLE_CHOICE'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors border-b border-gray-600/50"><CheckSquare size={20} className="inline mr-2 -mt-1"/> Monivalinta</button>
                <button onClick={() => { addSlide('TRUE_FALSE'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors border-b border-gray-600/50"><Scale size={20} className="inline mr-2 -mt-1"/> Kyllä/Ei</button>
                <button onClick={() => { addSlide('OPEN_TEXT'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors"><PenTool size={20} className="inline mr-2 -mt-1"/> Avoin tekstivastaus</button>
              </div>
            )}
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-500 font-bold text-lg flex justify-center items-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
            >
              <Plus size={28} /> Uusi dia
            </button>
          </div>
        </div>

      </div>

      {/* TOAST */}
      {toast?.show && (
        <div className="fixed bottom-8 right-8 bg-gray-900 border border-gray-700 text-white p-6 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-up">
          <div className="flex items-start gap-4">
            <Save size={40} className="animate-bounce" />
            <div>
              <h3 className="font-bold text-xl mb-1 text-green-400">Tiedosto tallennettu!</h3>
              <p className="text-gray-300 mb-2 break-all font-mono text-sm bg-gray-800 p-2 rounded">{toast.filename}</p>
              <p className="text-gray-400 text-sm mb-4">Löydät sen selaimesi Lataukset-kansiosta.</p>
              <button
                onClick={handleToastDismiss}
                className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 w-full transition-colors"
              >
                Palaa etusivulle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};