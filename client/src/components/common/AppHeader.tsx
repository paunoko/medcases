import React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, HelpCircle } from 'lucide-react';
import { LanguageSlider } from './LanguageSlider';

interface AppHeaderProps {
    showAboutButton?: boolean;
    onAboutClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    showAboutButton = false,
    onAboutClick
}) => {
    const { t } = useTranslation();

    return (
        <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 z-20 shadow-xs">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <Activity size={24} className="stroke-[2.5]" />
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-2xl font-black text-blue-950 tracking-tight">MedCases</h1>
                        <span className="hidden md:inline-block text-xs font-semibold text-gray-500 border-l border-gray-200 pl-2">
                            {t('landing.tagline')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right actions: Info button & Language */}
            <div className="flex items-center gap-3">
                {showAboutButton && (
                    <button
                        onClick={onAboutClick}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 transition-colors cursor-pointer"
                        title={t('landing.aboutApp')}
                    >
                        <HelpCircle size={18} className="text-blue-600" />
                        <span className="hidden sm:inline">{t('landing.aboutApp')}</span>
                    </button>
                )}
                <LanguageSlider />
            </div>
        </header>
    );
};
