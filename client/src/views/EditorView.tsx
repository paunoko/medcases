import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCaseEditor } from '../hooks/useCaseEditor';
import { useResizeText } from '../hooks/useResizeText';

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

  const contentRef = useRef<HTMLTextAreaElement>(null);
  useResizeText(contentRef, [activeSlide?.content, activeSlide?.imageFileName]);

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
    <div className="flex h-screen flex-col bg-gray-900 text-white overflow-hidden">
      {/* HEADER */}
      <header className="bg-gray-800 border-b border-gray-700 text-white p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={handleHome} className="text-2xl hover:bg-gray-700 p-2 rounded transition-colors" title="Etusivulle">🏠</button>
          <h1 className="font-bold text-xl uppercase tracking-wider text-gray-200">MedCases Editor</h1>
        </div>
        <div className="flex gap-4">
          <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-bold shadow transition-colors flex items-center gap-2">
            📂 Avaa
            <input type="file" className="hidden" accept=".medcase,.zip" onChange={(e) => e.target.files?.[0] && handleLoad(e.target.files[0])} />
          </label>
          <button onClick={onSave} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold shadow-lg transition-colors flex items-center gap-2">
            💾 Tallenna
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* VASEN: WYSIWYG Esikatselu / Editori */}
        <div className="flex-1 p-4 flex flex-col bg-gray-900 overflow-hidden min-h-0">
          <div className="flex-1 relative transition-all duration-300 min-h-0">
            {activeSlide ? (
              <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 text-left text-gray-900 p-8 gap-6 animate-fade-in min-h-0">
                
                {/* Otsikko */}
                <input
                  className="text-5xl font-bold text-gray-800 shrink-0 w-full bg-transparent border-b-2 border-dashed border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:outline-none transition-colors pb-2"
                  placeholder="Dian otsikko..."
                  value={activeSlide.title}
                  onChange={e => updateSlide(activeSlideIndex!, 'title', e.target.value)}
                />

                {/* Keskiosa: Teksti ja Kuva (50/50) */}
                <div className="flex flex-row gap-6 flex-1 min-h-0">
                  {/* Sisältöteksti */}
                  <textarea
                    ref={contentRef}
                    className="flex-1 min-h-0 overflow-y-auto prose max-w-none text-3xl leading-snug text-gray-700 whitespace-pre-wrap bg-transparent border-2 border-dashed border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none resize-none transition-colors rounded-lg p-2 -ml-2 custom-scrollbar"
                    placeholder="Kirjoita tapauksen tai dian teksti tähän..."
                    value={activeSlide.content}
                    onChange={e => updateSlide(activeSlideIndex!, 'content', e.target.value)}
                  />

                  {/* Kuva */}
                  <div className="flex-1 min-h-0 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-colors relative group">
                    {(activeSlide.imageFileName && imagePreviews[activeSlide.imageFileName]) ? (
                      <>
                        <img
                          src={imagePreviews[activeSlide.imageFileName]}
                          alt="Attachment"
                          className="w-full h-full object-contain opacity-90 group-hover:opacity-40 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          <span className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg text-xl">Vaihda kuva</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-gray-400 font-bold text-2xl group-hover:text-blue-500 transition-colors text-center p-4">
                        + Lisää kuva (valinnainen)
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={e => e.target.files?.[0] && attachImageToSlide(activeSlideIndex!, e.target.files[0])} 
                    />
                    {activeSlide.imageFileName && (
                      <button 
                        className="absolute top-4 right-4 bg-red-500 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 z-10 transition-all scale-90 hover:scale-100"
                        onClick={(e) => {
                          e.preventDefault();
                          updateSlide(activeSlideIndex!, 'imageFileName', undefined);
                        }}
                        title="Poista kuva"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Interaktio (Alaosa) */}
                <div className={`shrink-0 flex flex-col gap-6 ${(!activeSlide.imageFileName || !imagePreviews[activeSlide.imageFileName]) ? 'mt-auto' : ''}`}>
                  {activeSlide.type !== 'INFO' && (
                    <input
                      className="text-4xl font-semibold text-blue-900 w-full bg-transparent border-b-2 border-dashed border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors pb-2"
                      placeholder="Kirjoita kysymys tähän..."
                      value={activeSlide.question || ''}
                      onChange={e => updateSlide(activeSlideIndex!, 'question', e.target.value)}
                    />
                  )}

                  {activeSlide.type === 'MULTIPLE_CHOICE' && (
                    <div className="flex flex-wrap gap-4">
                      {activeSlide.options?.map((opt, i) => (
                        <div key={i} className={`relative p-6 border-4 flex-1 min-w-[200px] basis-full lg:basis-[calc(50%-1rem)] 2xl:basis-[calc(25%-1rem)] rounded-2xl flex items-center shadow-sm transition-all focus-within:border-blue-500 ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                          <div className="flex w-full items-start gap-4">
                            <input 
                              type="checkbox" 
                              className="w-8 h-8 mt-1 rounded shrink-0 accent-green-600 cursor-pointer"
                              checked={opt.isCorrect} 
                              onChange={e => {
                                const opts = [...activeSlide.options];
                                opts[i].isCorrect = e.target.checked;
                                updateSlide(activeSlideIndex!, 'options', opts);
                              }} 
                              title="Merkitse oikeaksi vastaukseksi"
                            />
                            <textarea 
                              rows={2}
                              className="font-bold text-2xl flex-1 bg-transparent focus:outline-none w-full resize-none leading-tight" 
                              placeholder="Vaihtoehto..."
                              value={opt.text} 
                              onChange={e => {
                                const opts = [...activeSlide.options];
                                opts[i].text = e.target.value;
                                updateSlide(activeSlideIndex!, 'options', opts);
                              }} 
                            />
                            <button 
                              className="text-gray-400 hover:text-red-500 shrink-0 p-2" 
                              onClick={() => {
                                const opts = activeSlide.options.filter((_, idx) => idx !== i);
                                updateSlide(activeSlideIndex!, 'options', opts);
                              }}
                            >
                              ✖
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateSlide(activeSlideIndex!, 'options', [...activeSlide.options, { id: Math.random().toString(), text: '', isCorrect: false }])} 
                        className="p-6 border-4 border-dashed border-gray-300 rounded-2xl flex-1 min-w-[250px] text-gray-500 font-bold text-2xl hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center bg-gray-50 hover:bg-blue-50"
                      >
                        + Lisää vaihtoehto
                      </button>
                    </div>
                  )}

                  {activeSlide.type === 'TRUE_FALSE' && (
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-6 p-6 border-4 border-gray-200 rounded-2xl bg-gray-50 flex-1 hover:border-blue-300 transition-colors">
                        <span className="font-bold text-2xl text-gray-700 uppercase tracking-wider">Oikea vastaus:</span>
                        <select
                          className="flex-1 text-2xl font-bold bg-white border-2 border-gray-300 rounded-xl p-3 focus:border-blue-500 focus:outline-none shadow-sm cursor-pointer"
                          value={activeSlide.correctAnswer ? 'true' : 'false'}
                          onChange={e => updateSlide(activeSlideIndex!, 'correctAnswer', e.target.value === 'true')}
                        >
                          <option value="true">Kyllä / Tosi</option>
                          <option value="false">Ei / Epätosi</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeSlide.type === 'OPEN_TEXT' && (
                    <div className="mt-4 p-6 bg-yellow-50 border-4 border-dashed border-yellow-300 rounded-2xl flex flex-col gap-2 hover:border-yellow-400 transition-colors focus-within:border-yellow-500">
                      <label className="font-bold text-xl text-yellow-800 uppercase tracking-wider">Opettajan mallivastaus (näytetään oppilaille):</label>
                      <input
                        className="w-full bg-transparent text-2xl text-gray-800 focus:outline-none placeholder-yellow-600/50"
                        placeholder="Kirjoita mallivastaus..."
                        value={activeSlide.modelAnswer || ''}
                        onChange={e => updateSlide(activeSlideIndex!, 'modelAnswer', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col mt-32 items-center justify-start text-gray-500 gap-6">
                <div className="text-6xl animate-bounce">👉</div>
                <div className="text-3xl font-bold uppercase tracking-widest text-gray-600">Valitse tai luo dia oikealta</div>
              </div>
            )}
          </div>
        </div>

        {/* OIKEA: Asetukset ja Diat (TeacherView w-80 paneeli) */}
        <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700 p-6 overflow-hidden">
          <div className="mb-6 bg-gray-750 p-4 rounded-xl border border-gray-700 shadow-inner bg-gray-900/50">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Tapauksen nimi</label>
            <input
              className="w-full bg-gray-800 border-2 border-gray-600 text-white font-bold p-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-lg"
              placeholder="Anna nimi..."
              value={caseData.meta.title}
              onChange={e => setCaseData({ ...caseData, meta: { ...caseData.meta, title: e.target.value } })}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {caseData.slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIndex(idx)}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${idx === activeSlideIndex ? 'border-blue-500 bg-gray-700 shadow-lg scale-[1.02]' : 'border-gray-700 bg-gray-800 hover:bg-gray-700/80 hover:border-gray-500'}`}
              >
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider flex justify-between items-center mb-2">
                  <span className={idx === activeSlideIndex ? 'text-blue-300' : ''}>{slide.type.replace('_', ' ')}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Haluatko varmasti poistaa dian?')) {
                        deleteSlide(idx);
                      }
                    }}
                    className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-800 transition-colors"
                    title="Poista dia"
                  >
                    🗑️
                  </button>
                </div>
                <div className="truncate font-bold text-gray-100 text-lg">{slide.title || '(Nimetön dia)'}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700 relative shrink-0">
            {showAddMenu && (
              <div className="absolute bottom-full left-0 w-full mb-3 bg-gray-700 border border-gray-600 rounded-xl shadow-2xl overflow-hidden z-20">
                <button onClick={() => { addSlide('INFO'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors border-b border-gray-600/50">ℹ️ Info-dia</button>
                <button onClick={() => { addSlide('MULTIPLE_CHOICE'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors border-b border-gray-600/50">☑️ Monivalinta</button>
                <button onClick={() => { addSlide('TRUE_FALSE'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors border-b border-gray-600/50">⚖️ Kyllä/Ei</button>
                <button onClick={() => { addSlide('OPEN_TEXT'); setShowAddMenu(false); }} className="block w-full text-left px-5 py-4 hover:bg-gray-600 font-bold text-white transition-colors">✍️ Avoin tekstivastaus</button>
              </div>
            )}
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-500 font-bold text-lg flex justify-center items-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
            >
              <span className="text-2xl">➕</span> Uusi dia
            </button>
          </div>
        </div>

      </div>

      {/* TOAST */}
      {toast?.show && (
        <div className="fixed bottom-8 right-8 bg-gray-900 border border-gray-700 text-white p-6 rounded-2xl shadow-2xl z-50 max-w-md animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-bounce">💾</div>
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