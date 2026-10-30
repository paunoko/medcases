// --- CORE HELPER TYPES ---

export type SlideType = 'INFO' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT';

// --- DATA STRUCTURES (Saved JSON) ---

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean; // Known by the teacher, not sent to the student immediately
}

// 1. Info slide (text/image only)
export interface InfoSlide {
  id: string;
  type: 'INFO';
  title: string;
  content: string;
  imageFileName?: string;
}

// 2. Multiple Choice
export interface MultipleChoiceSlide {
  id: string;
  type: 'MULTIPLE_CHOICE';
  title: string;
  content: string; // Introduction text
  imageFileName?: string;
  question: string; // The actual question
  options: Option[];
  allowMultiple?: boolean;
  explanation?: string; // Debrief notes / explanation revealed after voting
}

// 3. True/False (Boolean)
export interface BooleanSlide {
  id: string;
  type: 'TRUE_FALSE';
  title: string;
  content: string;
  imageFileName?: string;
  question: string;
  correctAnswer: boolean;
  explanation?: string; // Debrief notes / explanation revealed after voting
}

// 4. Open text
export interface OpenTextSlide {
  id: string;
  type: 'OPEN_TEXT';
  title: string;
  content: string;
  imageFileName?: string;
  question: string;
  modelAnswer?: string; // Model answer for the teacher / discussion
  explanation?: string; // Debrief notes / explanation revealed after voting
}

// Union type that aggregates all slides
export type CaseSlide = 
  | InfoSlide 
  | MultipleChoiceSlide 
  | BooleanSlide 
  | OpenTextSlide;

// Root object (.medcase file content)
export interface PatientCase {
  meta: {
    id: string;
    title: string;
    created: string;
  };
  slides: CaseSlide[];
}

// --- APPLICATION STATE (UI State) ---

// Data sent to the student (Sanitized!)
export interface StudentPayload {
  slideId: string;
  type: SlideType;
  questionText?: string;
  options?: { id: string; text: string }[]; // NOTE: no isCorrect info
  allowMultiple?: boolean;
  state: 'WAITING' | 'ANSWERING' | 'REVEALED';
}