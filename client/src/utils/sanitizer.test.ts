import { describe, it, expect } from 'vitest';
import { createStudentPayload } from './sanitizer';
import type { MultipleChoiceSlide, BooleanSlide, OpenTextSlide, InfoSlide } from '../types';

describe('createStudentPayload', () => {
  it('strips isCorrect from multiple choice options to protect answers', () => {
    const slide: MultipleChoiceSlide = {
      id: 'slide-mcq-1',
      type: 'MULTIPLE_CHOICE',
      title: 'Antibiotic Therapy',
      content: 'Patient has high fever and productive cough.',
      question: 'Which initial antibiotic is indicated?',
      allowMultiple: false,
      options: [
        { id: 'opt-1', text: 'Amoxicillin', isCorrect: true },
        { id: 'opt-2', text: 'Vancomycin', isCorrect: false },
        { id: 'opt-3', text: 'Ciprofloxacin', isCorrect: false }
      ]
    };

    const payload = createStudentPayload(slide, 'ANSWERING');

    expect(payload.slideId).toBe('slide-mcq-1');
    expect(payload.type).toBe('MULTIPLE_CHOICE');
    expect(payload.state).toBe('ANSWERING');
    expect(payload.questionText).toBe('Which initial antibiotic is indicated?');
    expect(payload.allowMultiple).toBe(false);
    expect(payload.options).toHaveLength(3);

    // Verify isCorrect is never leaked
    payload.options?.forEach(opt => {
      expect(opt).toHaveProperty('id');
      expect(opt).toHaveProperty('text');
      expect(((opt as unknown) as Record<string, unknown>).isCorrect).toBeUndefined();
    });
  });

  it('generates boolean options without leaking correctAnswer', () => {
    const slide: BooleanSlide = {
      id: 'slide-tf-1',
      type: 'TRUE_FALSE',
      title: 'Contraindication Check',
      content: 'Patient has severe penicillin allergy.',
      question: 'Amoxicillin is safe to administer.',
      correctAnswer: false
    };

    const payload = createStudentPayload(slide, 'ANSWERING');

    expect(payload.slideId).toBe('slide-tf-1');
    expect(payload.type).toBe('TRUE_FALSE');
    expect(payload.options).toHaveLength(2);
    expect(payload.options?.map(o => o.id)).toEqual(['true', 'false']);
    expect(((payload as unknown) as Record<string, unknown>).correctAnswer).toBeUndefined();
  });

  it('omits modelAnswer from open text slides', () => {
    const slide: OpenTextSlide = {
      id: 'slide-open-1',
      type: 'OPEN_TEXT',
      title: 'Differential Diagnosis',
      content: 'Patient presenting with acute chest pain.',
      question: 'List the top 3 differential diagnoses.',
      modelAnswer: '1. STEMI / NSTEMI, 2. Aortic dissection, 3. Pulmonary embolism'
    };

    const payload = createStudentPayload(slide, 'ANSWERING');

    expect(payload.slideId).toBe('slide-open-1');
    expect(payload.type).toBe('OPEN_TEXT');
    expect(((payload as unknown) as Record<string, unknown>).modelAnswer).toBeUndefined();
  });

  it('handles INFO slides without question or options', () => {
    const slide: InfoSlide = {
      id: 'slide-info-1',
      type: 'INFO',
      title: 'Patient Overview',
      content: '65-year-old male with history of hypertension.'
    };

    const payload = createStudentPayload(slide, 'WAITING');

    expect(payload.slideId).toBe('slide-info-1');
    expect(payload.type).toBe('INFO');
    expect(payload.state).toBe('WAITING');
    expect(payload.questionText).toBeUndefined();
    expect(payload.options).toBeUndefined();
  });
});
