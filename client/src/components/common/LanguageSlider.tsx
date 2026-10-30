import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSlider: React.FC = () => {
    const { i18n } = useTranslation();
    const languages = [
        { code: 'fi', label: 'FI', emoji: '🇫🇮' },
        { code: 'sv', label: 'SV', emoji: '🇸🇪' },
        { code: 'en', label: 'EN', emoji: '🇬🇧' }
    ];

    const currentCode = i18n.language.split('-')[0];
    const currentIndex = languages.findIndex(l => l.code === currentCode);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="bg-white border border-gray-200 p-1 rounded-full shadow-sm flex items-center relative h-10 min-w-[190px] overflow-hidden">
            <div className="absolute inset-1 z-0">
                <div 
                    className="absolute h-full bg-blue-600 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ 
                        width: `${100 / languages.length}%`,
                        left: `${safeIndex * (100 / languages.length)}%` 
                    }}
                />
            </div>
            
            {languages.map((lang, idx) => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`flex-1 relative z-10 h-full flex items-center justify-center gap-1.5 px-2 transition-colors duration-300 rounded-full cursor-pointer select-none ${
                        safeIndex === idx ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <span className="text-base">{lang.emoji}</span>
                    <span className="font-bold text-xs tracking-tight">{lang.label}</span>
                </button>
            ))}
        </div>
    );
};
