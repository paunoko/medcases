import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudentSession } from '../hooks/useStudentSession';
import { Eye, CheckCircle2 } from 'lucide-react';

export const StudentView = ({ onSessionChange }: { onSessionChange?: (inSession: boolean) => void }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const {
    isConnected, joinedRoomId, activeSlide, isWaiting, hasAnswered, error,
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
    setTextAns('');
    setSelectedOptions([]);
  }, [activeSlide?.slideId]);

  // 1. LOGIN
  if (!joinedRoomId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">MedCases</h1>

        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">{t('student.roomCode')}</label>
            <input
              type="tel"
              maxLength={4}
              className="w-full text-center text-3xl tracking-widest p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              value={code} onChange={e => setCode(e.target.value)} placeholder="0000"
            />
          </div>

          <button
            disabled={!isConnected || code.length < 4}
            onClick={() => joinRoom(code)}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {t('student.join')}
          </button>
        </div>
        {!isConnected && <p className="mt-4 text-gray-400 text-sm">{t('student.connecting')}</p>}
      </div>
    );
  }

  // 2. WAITING
  if (isWaiting || !activeSlide) {
    return (
      <div className="h-full bg-blue-600 flex flex-col items-center justify-center text-white p-8 text-center">
        <Eye size={64} className="mb-4 animate-bounce mx-auto" />
        <h2 className="text-2xl font-bold">{t('student.lookAtProjector')}</h2>
        <p className="opacity-80 mt-2">{t('student.waitingForTeacher')}</p>
      </div>
    );
  }

  // 3. INFO SLIDE (Passive)
  if (activeSlide.type === 'INFO') {
    return (
      <div className="h-full bg-gray-100 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700">{t('student.info')}</h2>
        <p className="text-gray-500 mt-2">{t('student.readFromScreen')}</p>
      </div>
    );
  }

  // 4. RESPONSE FORM
  return (
    <div className="h-full bg-white flex flex-col p-4">
      <div className="py-4 border-b mb-4">
        <h2 className="text-lg font-medium text-gray-800 leading-snug">{activeSlide.questionText}</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        {hasAnswered ? (
          <div className="bg-green-100 text-green-800 p-8 rounded-xl text-center">
            <CheckCircle2 size={40} className="mb-2 mx-auto" />
            <div className="font-bold text-xl">{t('student.answerSent')}</div>
          </div>
        ) : (activeSlide.state === 'REVEALED' || activeSlide.state === 'LOCKED') && activeSlide.type !== 'OPEN_TEXT' ? (
          <div className="bg-gray-100 text-gray-500 p-8 rounded-xl text-center border-2 border-dashed border-gray-300">
            <div className="font-bold text-xl">{t('student.answeringLocked')}</div>
          </div>
        ) : (
          <>
            {activeSlide.type === 'MULTIPLE_CHOICE' && (
              <>
                {activeSlide.options?.map(opt => {
                  const isSelected = selectedOptions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedOptions(prev =>
                          prev.includes(opt.id)
                            ? prev.filter(id => id !== opt.id)
                            : [...prev, opt.id]
                        );
                      }}
                      className={`w-full p-6 text-left border-2 rounded-xl text-lg font-bold transition-all shadow-sm ${isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.text}</span>
                        {isSelected && <CheckCircle2 size={24} className="text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => submitAnswer(selectedOptions)}
                  disabled={selectedOptions.length === 0}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('student.submitAnswer')}
                </button>
              </>
            )}

            {activeSlide.type === 'TRUE_FALSE' && activeSlide.options?.map(opt => (
              <button
                key={opt.id}
                onClick={() => submitAnswer(opt.id)}
                className="w-full p-6 text-left border-2 border-gray-200 rounded-xl text-lg font-bold hover:bg-blue-50 hover:border-blue-500 active:bg-blue-600 active:text-white transition-all shadow-sm"
              >
                {opt.id === 'true' ? t('editor.yesTrue') : (opt.id === 'false' ? t('editor.noFalse') : opt.text)}
              </button>
            ))}

            {activeSlide.type === 'OPEN_TEXT' && (
              <div className="w-full">
                <textarea
                  className="w-full border-2 border-gray-300 rounded-xl p-4 text-lg h-40 mb-4 focus:border-blue-500"
                  placeholder={t('student.writeAnswer')}
                  value={textAns} onChange={e => setTextAns(e.target.value)}
                />
                <button
                  onClick={() => submitAnswer(textAns)}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-xl"
                >
                  {t('student.send')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};