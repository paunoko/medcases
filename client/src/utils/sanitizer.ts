import type { CaseSlide, StudentPayload } from '../types';

export const createStudentPayload = (
    slide: CaseSlide,
    state: 'WAITING' | 'ANSWERING' | 'LOCKED' | 'REVEALED'
): StudentPayload => {

    // Perusrunko
    const payload: StudentPayload = {
        slideId: slide.id,
        type: slide.type,
        state: state
    };

    // Jos ollaan INFO-tilassa tai vastaus on paljastettu, voidaan lähettää enemmän tietoa.
    // Mutta pidetään tämä yksinkertaisena: Opiskelija näkee tekstin VASTA kun slide on aktiivinen.

    if (slide.type === 'MULTIPLE_CHOICE') {
        payload.questionText = slide.question;
        // TÄRKEÄÄ: Mapataan uusi objekti, jotta 'isCorrect' ja 'teacherNotes' jäävät pois
        payload.options = slide.options.map(opt => ({
            id: opt.id,
            text: opt.text
        }));
    }

    else if (slide.type === 'TRUE_FALSE') {
        payload.questionText = slide.question;
        // Luodaan keinotekoiset vaihtoehdot
        payload.options = [
            { id: 'true', text: 'Kyllä / Tosi' },
            { id: 'false', text: 'Ei / Epätosi' }
        ];
    }

    else if (slide.type === 'OPEN_TEXT') {
        payload.questionText = slide.question;
        // Ei modelAnsweria!
    }

    return payload;
};