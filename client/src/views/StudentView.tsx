import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudentSession } from '../hooks/useStudentSession';
import { Eye, CheckCircle2, Lock, Send, WifiOff } from 'lucide-react';

export const StudentView = ({ onSessionChange }: { onSessionChange?: (inSession: boolean) => void }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const {
    isConnected, isJoining, joinedRoomId, activeSlide, isWaiting, hasAnswered, error, clearError,
    joinRoom, submitAnswer
  } = useStudentSession();

  useEffect(() => {
    if (onSessionChange) {
      onSessionChange(!!joinedRoomId);
    }
  }, [joinedRoomId, onSessionChange]);

  const [code, setCode] = useState(searchParams.get('room') || '');
  const [textAns, setTextAns] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Reset inputs when slide changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTextAns('');
    setSelectedOptions([]);
  }, [activeSlide?.slideId]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);
    if (error) {
      clearError();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isConnected && code.length === 4 && !isJoining) {
      joinRoom(code);
    }
  };

  // 1. LOGIN / ROOM CODE ENTRY
  if (!joinedRoomId) {
    return (
      <div className="w-full flex flex-col items-center animate-fade-in">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/60 w-full space-y-5 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm font-semibold text-center animate-fade-in">
              {t(`errors.${error}`, { defaultValue: error })}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
              {t('student.roomCode')}
            </label>
            <input
              type="tel"
              maxLength={4}
              autoFocus
              className="w-full text-center text-4xl font-mono font-black tracking-widest py-3 px-4 border-2 border-gray-200 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-blue-950 placeholder:text-gray-300 disabled:opacity-50"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="0000"
              disabled={isJoining}
            />
          </div>

          <button
            disabled={!isConnected || code.length < 4 || isJoining}
            onClick={() => joinRoom(code)}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-4 rounded-xl text-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer flex items-center justify-center gap-2.5"
          >
            {isJoining && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{isJoining ? t('student.connecting') : t('student.join')}</span>
          </button>
        </div>
        {!isConnected && <p className="mt-4 text-gray-400 text-sm font-medium animate-pulse">{t('student.connecting')}</p>}
      </div>
    );
  }

  // 2. WAITING FOR TEACHER
  if (isWaiting || !activeSlide) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center relative">
        {!isConnected && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 animate-pulse">
            <WifiOff size={16} />
            <span>{t('student.reconnecting')}</span>
          </div>
        )}
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 animate-pulse">
            <Eye size={44} />
          </div>
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full mb-3">
            {t('student.roomPin')}: {joinedRoomId}
          </span>
          <h2 className="text-2xl font-extrabold text-blue-950 leading-snug">{t('student.lookAtProjector')}</h2>
          <p className="text-gray-500 mt-2 text-base font-medium">{t('student.waitingForTeacher')}</p>
        </div>
      </div>
    );
  }

  // 3. INFO SLIDE (Passive observation)
  if (activeSlide.type === 'INFO') {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center relative">
        {!isConnected && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 animate-pulse">
            <WifiOff size={16} />
            <span>{t('student.reconnecting')}</span>
          </div>
        )}
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full mb-4">
            {t('student.roomPin')}: {joinedRoomId}
          </span>
          <h2 className="text-2xl font-extrabold text-gray-800">{t('student.info')}</h2>
          <p className="text-gray-500 mt-3 text-base font-medium">{t('student.readFromScreen')}</p>
        </div>
      </div>
    );
  }

  // 4. ACTIVE RESPONSE FORM
  return (
    <div className="min-h-full w-full max-w-lg mx-auto flex flex-col p-4 sm:p-6 bg-white sm:rounded-3xl sm:shadow-lg sm:border sm:border-gray-100 sm:my-6 relative">
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 animate-pulse">
          <WifiOff size={16} />
          <span>{t('student.reconnecting')}</span>
        </div>
      )}
      {/* Header */}
      <div className="pb-4 border-b border-gray-100 mb-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800">
            {activeSlide.type === 'MULTIPLE_CHOICE'
              ? (activeSlide.allowMultiple ? t('student.multipleChoiceHint') : t('student.singleChoiceHint'))
              : activeSlide.type === 'TRUE_FALSE'
                ? t('student.trueFalseHint')
                : activeSlide.type === 'OPEN_TEXT'
                  ? t('student.openTextHint')
                  : null}
          </div>
          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md shrink-0">
            {t('student.roomPin')}: {joinedRoomId}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 leading-snug tracking-tight">
          {activeSlide.questionText}
        </h2>
      </div>

      {/* Main Interaction Area */}
      <div className="flex-1 flex flex-col justify-center">
        {hasAnswered ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-950 p-8 rounded-2xl text-center shadow-sm">
            <CheckCircle2 size={52} className="text-emerald-600 mb-3 mx-auto stroke-[2.5]" />
            <div className="font-extrabold text-2xl text-emerald-950 mb-1">{t('student.answerSent')}</div>
            <p className="text-emerald-800/80 font-medium text-base">{t('student.lookAtResults')}</p>
          </div>
        ) : activeSlide.state === 'REVEALED' && activeSlide.type !== 'OPEN_TEXT' ? (
          <div className="bg-gray-50 text-gray-600 p-8 rounded-2xl text-center border-2 border-dashed border-gray-300">
            <Lock size={40} className="text-gray-400 mb-2 mx-auto" />
            <div className="font-extrabold text-xl text-gray-800 mb-1">{t('student.answeringLocked')}</div>
            <p className="text-gray-500 text-sm font-medium">{t('student.lookAtResults')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSlide.type === 'MULTIPLE_CHOICE' && (
              <>
                <div className="space-y-3">
                  {activeSlide.options?.map((opt, i) => {
                    const isSelected = selectedOptions.includes(opt.id);
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (activeSlide.allowMultiple) {
                            setSelectedOptions(prev =>
                              prev.includes(opt.id)
                                ? prev.filter(id => id !== opt.id)
                                : [...prev, opt.id]
                            );
                          } else {
                            setSelectedOptions([opt.id]);
                          }
                        }}
                        className={`w-full min-h-[64px] p-4 sm:p-5 text-left border-2 rounded-2xl transition-all shadow-sm flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/20 shadow-md scale-[1.01]'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70 text-gray-900 active:scale-[0.99]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-colors shadow-sm ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 border border-gray-200 text-gray-700'
                          }`}>
                            {letter}
                          </div>
                          <span className="text-lg sm:text-xl font-bold leading-snug break-words">
                            {opt.text}
                          </span>
                        </div>

                        {/* Radio or Checkbox indicator */}
                        {activeSlide.allowMultiple ? (
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-blue-600 text-white shadow-sm' : 'border-2 border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle2 size={18} className="stroke-[2.5]" />}
                          </div>
                        ) : (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-2 border-blue-600' : 'border-2 border-gray-300'
                          }`}>
                            {isSelected && <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => submitAnswer(selectedOptions)}
                  disabled={selectedOptions.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-4 rounded-xl text-xl mt-4 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                >
                  {t('student.submitAnswer')}
                </button>
              </>
            )}

            {activeSlide.type === 'TRUE_FALSE' && (
              <>
                <div className="space-y-3">
                  {activeSlide.options?.map(opt => {
                    const isSelected = selectedOptions.includes(opt.id);
                    const label = opt.id === 'true' ? t('editor.yesTrue') : (opt.id === 'false' ? t('editor.noFalse') : opt.text);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOptions([opt.id])}
                        className={`w-full min-h-[64px] p-5 text-left border-2 rounded-2xl transition-all shadow-sm flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/20 shadow-md scale-[1.01]'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70 text-gray-900 active:scale-[0.99]'
                        }`}
                      >
                        <span className="text-2xl font-black tracking-tight">
                          {label}
                        </span>

                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-2 border-blue-600' : 'border-2 border-gray-300'
                        }`}>
                          {isSelected && <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => selectedOptions[0] && submitAnswer(selectedOptions[0])}
                  disabled={selectedOptions.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-4 rounded-xl text-xl mt-4 shadow-md transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                >
                  {t('student.submitAnswer')}
                </button>
              </>
            )}

            {activeSlide.type === 'OPEN_TEXT' && (
              <div className="w-full space-y-4">
                <textarea
                  className="w-full border-2 border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl p-4 text-lg font-medium text-gray-900 h-44 outline-none transition-all resize-none shadow-sm placeholder:text-gray-400"
                  placeholder={t('student.writeAnswer')}
                  value={textAns}
                  onChange={e => setTextAns(e.target.value)}
                />
                <button
                  onClick={() => textAns.trim() && submitAnswer(textAns.trim())}
                  disabled={!textAns.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-4 rounded-xl text-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t('student.send')}</span>
                  <Send size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
