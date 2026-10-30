import { describe, it, expect } from 'vitest';
import { validatePatientCase, CaseValidationError } from './fileHelpers';

describe('validatePatientCase', () => {
  it('accepts a fully valid patient case structure', () => {
    const validData = {
      meta: {
        id: 'case-test-1',
        title: 'Akut pankreatit',
        created: '2026-10-30T12:00:00Z'
      },
      slides: [
        {
          id: 'slide-1',
          type: 'INFO',
          title: 'Anamnes',
          content: '45-årig kvinna söker akutmottagningen.'
        },
        {
          id: 'slide-2',
          type: 'MULTIPLE_CHOICE',
          title: 'Initiala prover',
          content: 'Buksmärtor med utstrålning mot ryggen.',
          question: 'Vilket prov är mest specifikt?',
          options: [
            { id: 'opt-1', text: 'S-Amylas', isCorrect: false },
            { id: 'opt-2', text: 'S-Lipas', isCorrect: true }
          ]
        }
      ]
    };

    const result = validatePatientCase(validData);
    expect(result.meta.title).toBe('Akut pankreatit');
    expect(result.slides).toHaveLength(2);
  });

  it('throws MISSING_META when meta object is omitted', () => {
    const invalidData = {
      slides: []
    };

    expect(() => validatePatientCase(invalidData)).toThrowError(CaseValidationError);
    try {
      validatePatientCase(invalidData);
    } catch (e) {
      expect((e as CaseValidationError).code).toBe('MISSING_META');
    }
  });

  it('throws MISSING_TITLE when title is not a string', () => {
    const invalidData = {
      meta: { id: 'c1' },
      slides: []
    };

    try {
      validatePatientCase(invalidData);
      expect.fail('Expected error');
    } catch (e) {
      expect((e as CaseValidationError).code).toBe('MISSING_TITLE');
    }
  });

  it('throws MISSING_SLIDES when slides array is missing', () => {
    const invalidData = {
      meta: { id: 'c1', title: 'Case Title' }
    };

    try {
      validatePatientCase(invalidData);
      expect.fail('Expected error');
    } catch (e) {
      expect((e as CaseValidationError).code).toBe('MISSING_SLIDES');
    }
  });

  it('throws INVALID_SLIDE when a slide has an unsupported type', () => {
    const invalidData = {
      meta: { id: 'c1', title: 'Case Title' },
      slides: [
        {
          id: 's1',
          type: 'CORRUPT_TYPE',
          title: 'Slide 1'
        }
      ]
    };

    try {
      validatePatientCase(invalidData);
      expect.fail('Expected error');
    } catch (e) {
      expect((e as CaseValidationError).code).toBe('INVALID_SLIDE');
    }
  });

  it('throws INVALID_SLIDE when MCQ slide is missing options array', () => {
    const invalidData = {
      meta: { id: 'c1', title: 'Case Title' },
      slides: [
        {
          id: 's1',
          type: 'MULTIPLE_CHOICE',
          title: 'MCQ Slide',
          question: 'Question text?'
          // options is missing
        }
      ]
    };

    try {
      validatePatientCase(invalidData);
      expect.fail('Expected error');
    } catch (e) {
      expect((e as CaseValidationError).code).toBe('INVALID_SLIDE');
    }
  });
});
