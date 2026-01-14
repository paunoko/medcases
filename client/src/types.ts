// --- YLEISET APUTYYPIT ---

export type SlideType = 'INFO' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT';

// --- DATA RAKENTEET (Tallennettu JSON) ---

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean; // Opettajan tiedossa, ei lähetetä oppilaalle heti
}

// 1. Info-dia (vain tekstiä/kuvaa)
export interface InfoSlide {
  id: string;
  type: 'INFO';
  title: string;
  content: string;
  imageFileName?: string;
  teacherNotes?: string;
}

// 2. Monivalinta
export interface MultipleChoiceSlide {
  id: string;
  type: 'MULTIPLE_CHOICE';
  title: string;
  content: string; // Johdantoteksti
  imageFileName?: string;
  teacherNotes?: string;
  question: string; // Varsinainen kysymys
  options: Option[];
}

// 3. Kyllä/Ei (Boolean)
export interface BooleanSlide {
  id: string;
  type: 'TRUE_FALSE';
  title: string;
  content: string;
  imageFileName?: string;
  teacherNotes?: string;
  question: string;
  correctAnswer: boolean;
}

// 4. Vapaa teksti
export interface OpenTextSlide {
  id: string;
  type: 'OPEN_TEXT';
  title: string;
  content: string;
  imageFileName?: string;
  teacherNotes?: string;
  question: string;
  modelAnswer?: string; // Mallivastaus opettajalle
}

// Union-tyyppi, joka kokoaa kaikki diat
export type CaseSlide = 
  | InfoSlide 
  | MultipleChoiceSlide 
  | BooleanSlide 
  | OpenTextSlide;

// Juuriobjekti (.medcase tiedoston sisältö)
export interface PatientCase {
  meta: {
    id: string;
    title: string;
    description: string;
    author: string;
    created: string;
  };
  slides: CaseSlide[];
}

// --- SOVELLUSTILA (UI State) ---

// Data, joka lähetetään opiskelijalle (Sanitoitu!)
export interface StudentPayload {
  slideId: string;
  type: SlideType;
  questionText?: string;
  options?: { id: string; text: string }[]; // HUOM: ei isCorrect-tietoa
  state: 'WAITING' | 'ANSWERING' | 'LOCKED' | 'REVEALED';
}