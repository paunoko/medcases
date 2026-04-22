import i18n from '../i18n';
import type { CaseSlide, StudentPayload } from '../types';

export const createStudentPayload = (
    slide: CaseSlide,
    state: 'WAITING' | 'ANSWERING' | 'LOCKED' | 'REVEALED'
): StudentPayload => {

    // Base structure
    const payload: StudentPayload = {
        slideId: slide.id,
        type: slide.type,
        state: state
    };

    // If in INFO state or answer is revealed, more info can be sent.
    // But let's keep it simple: Student sees text ONLY when the slide is active.

    if (slide.type === 'MULTIPLE_CHOICE') {
        payload.questionText = slide.question;
        // IMPORTANT: Map to a new object to exclude 'isCorrect' and 'teacherNotes'
        payload.options = slide.options.map(opt => ({
            id: opt.id,
            text: opt.text
        }));
    }

    else if (slide.type === 'TRUE_FALSE') {
        payload.questionText = slide.question;
        // Create artificial options
        payload.options = [
            { id: 'true', text: i18n.t('editor.yesTrue') },
            { id: 'false', text: i18n.t('editor.noFalse') }
        ];
    }

    else if (slide.type === 'OPEN_TEXT') {
        payload.questionText = slide.question;
        // No modelAnswer!
    }

    return payload;
};