import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCaseEditor } from '../hooks/useCaseEditor';
import { SlideRenderer } from '../components/SlideRenderer';

export const EditorView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditMode = searchParams.get('mode') === 'edit';
  const [hasLoaded, setHasLoaded] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; filename: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const {
    caseData, setCaseData, activeSlideIndex, setActiveSlideIndex, imagePreviews,
    addSlide, deleteSlide, updateSlide, attachImageToSlide, handleSave, handleLoad
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

  if (isEditMode && !hasLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 relative">
        <button
          onClick={() => navigate('/', { state: { tab: 'teacher' } })}
          className="absolute top-4 left-4 bg-white p-2 rounded-full shadow hover:bg-gray-50 text-2xl"
          title="Takaisin etusivulle"
        >
          🏠
        </button>
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Muokkaa tapausta ✏️</h1>
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
    <div className="flex h-screen flex-col">
      {/* HEADER */}
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={handleHome} className="text-2xl hover:bg-gray-700 p-1 rounded" title="Etusivulle">🏠</button>
          <h1 className="font-bold text-xl">MedCases Editor ✏️</h1>
        </div>
        <div className="flex gap-4">
          <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            📂 Avaa
            <input type="file" className="hidden" accept=".medcase,.zip" onChange={(e) => e.target.files?.[0] && handleLoad(e.target.files[0])} />
          </label>
          <button onClick={onSave} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold">
            💾 Tallenna
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* VASEN: Navigaatio ja Perustiedot */}
        <div className="w-80 bg-gray-100 border-r flex flex-col overflow-y-auto p-4">
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase">Tapauksen nimi</label>
            <input
              className="w-full border p-2 rounded mt-1"
              value={caseData.meta.title}
              onChange={e => setCaseData({ ...caseData, meta: { ...caseData.meta, title: e.target.value } })}
            />
          </div>

          <div className="space-y-2 mb-4">
            {caseData.slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIndex(idx)}
                className={`p-3 border rounded cursor-pointer transition-colors ${idx === activeSlideIndex ? 'border-blue-500 bg-white shadow' : 'bg-gray-50 hover:bg-white'}`}
              >
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex justify-between">
                  {slide.type}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Haluatko varmasti poistaa dian?')) {
                        deleteSlide(idx);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 px-1"
                    title="Poista dia"
                  >
                    🗑️
                  </button>
                </div>
                <div className="truncate font-medium text-sm">{slide.title}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t relative">
            {showAddMenu && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white border rounded shadow-lg overflow-hidden z-10">
                <button onClick={() => { addSlide('INFO'); setShowAddMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Info</button>
                <button onClick={() => { addSlide('MULTIPLE_CHOICE'); setShowAddMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Monivalinta</button>
                <button onClick={() => { addSlide('TRUE_FALSE'); setShowAddMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Kyllä/Ei</button>
                <button onClick={() => { addSlide('OPEN_TEXT'); setShowAddMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Teksti</button>
              </div>
            )}
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold flex justify-center items-center gap-2"
            >
              <span>+</span> Lisää dia
            </button>
          </div>
        </div>

        {/* KESKI: Editori Form */}
        <div className="w-96 bg-white border-r overflow-y-auto p-6 shadow-[inset_-5px_0_10px_rgba(0,0,0,0.05)]">
          {activeSlide ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-1">Diaotsikko</label>
                <input
                  className="w-full border p-2 rounded font-bold"
                  value={activeSlide.title}
                  onChange={e => updateSlide(activeSlideIndex!, 'title', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Sisältöteksti</label>
                <textarea
                  className="w-full border p-2 rounded h-32 text-sm"
                  value={activeSlide.content}
                  onChange={e => updateSlide(activeSlideIndex!, 'content', e.target.value)}
                />
              </div>

              <div className="bg-gray-50 p-3 rounded border border-dashed">
                <label className="block text-xs font-bold mb-2 uppercase text-gray-500">Liitekuva</label>
                <input type="file" accept="image/*" className="text-sm" onChange={e => e.target.files?.[0] && attachImageToSlide(activeSlideIndex!, e.target.files[0])} />
              </div>

              {/* Tyyppikohtaiset kentät */}
              {(activeSlide.type !== 'INFO') && (
                <div>
                  <label className="block text-sm font-bold mb-1 text-blue-800">Kysymys oppilaalle</label>
                  <input
                    className="w-full border-2 border-blue-100 p-2 rounded"
                    value={activeSlide.question || ''}
                    onChange={e => updateSlide(activeSlideIndex!, 'question', e.target.value)}
                  />
                </div>
              )}

              {activeSlide.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold">Vastausvaihtoehdot</label>
                  {activeSlide.options?.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="checkbox" checked={opt.isCorrect} onChange={e => {
                        const opts = [...activeSlide.options];
                        opts[i].isCorrect = e.target.checked;
                        updateSlide(activeSlideIndex!, 'options', opts);
                      }} />
                      <input className="flex-1 border p-1 text-sm rounded" value={opt.text} onChange={e => {
                        const opts = [...activeSlide.options];
                        opts[i].text = e.target.value;
                        updateSlide(activeSlideIndex!, 'options', opts);
                      }} />
                      <button className="text-red-500 font-bold px-2" onClick={() => {
                        const opts = activeSlide.options.filter((_, idx) => idx !== i);
                        updateSlide(activeSlideIndex!, 'options', opts);
                      }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => updateSlide(activeSlideIndex!, 'options', [...activeSlide.options, { id: Math.random().toString(), text: '', isCorrect: false }])} className="text-xs text-blue-600 underline">
                    + Lisää vaihtoehto
                  </button>
                </div>
              )}

              {activeSlide.type === 'TRUE_FALSE' && (
                <div>
                  <label className="block text-sm font-bold">Oikea vastaus</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={activeSlide.correctAnswer ? 'true' : 'false'}
                    onChange={e => updateSlide(activeSlideIndex!, 'correctAnswer', e.target.value === 'true')}
                  >
                    <option value="true">Kyllä / Tosi</option>
                    <option value="false">Ei / Epätosi</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-20">Valitse dia</div>
          )}
        </div>

        {/* OIKEA: Esikatselu */}
        <div className="flex-1 bg-gray-200 p-8 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-4xl h-full shadow-2xl">
            {activeSlide && <SlideRenderer slide={activeSlide} imageMap={imagePreviews} />}
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast?.show && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white p-6 rounded-lg shadow-2xl z-50 max-w-md animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💾</div>
            <div>
              <h3 className="font-bold text-lg mb-1">Tiedosto tallennettu!</h3>
              <p className="text-gray-300 mb-2 break-all font-mono text-sm">{toast.filename}</p>
              <p className="text-green-400 font-bold mb-4">Löydät sen Lataukset-kansiosta.</p>
              <button
                onClick={handleToastDismiss}
                className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold hover:bg-gray-100 w-full"
              >
                OK, palaa etusivulle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};