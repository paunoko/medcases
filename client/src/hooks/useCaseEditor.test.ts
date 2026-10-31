import { describe, it, expect } from 'vitest';
import { calculateNextActiveSlideIndex } from './useCaseEditor';

describe('calculateNextActiveSlideIndex', () => {
  it('returns null when the last remaining slide is deleted (0 slides left)', () => {
    // Only 1 slide existed at index 0, deleted it -> 0 slides left
    const next = calculateNextActiveSlideIndex(0, 0, 0);
    expect(next).toBeNull();
  });

  it('shifts focus to the next slide when deleting the active middle slide', () => {
    // 3 slides (0, 1, 2). Active is 1. Delete slide 1 -> 2 slides left.
    // The slide originally at index 2 now becomes index 1.
    const next = calculateNextActiveSlideIndex(1, 1, 2);
    expect(next).toBe(1);
  });

  it('shifts focus to the next slide when deleting the active first slide', () => {
    // 3 slides (0, 1, 2). Active is 0. Delete slide 0 -> 2 slides left.
    // The slide originally at index 1 now becomes index 0.
    const next = calculateNextActiveSlideIndex(0, 0, 2);
    expect(next).toBe(0);
  });

  it('shifts focus to the preceding slide when deleting the active last slide', () => {
    // 3 slides (0, 1, 2). Active is 2 (the last). Delete slide 2 -> 2 slides left (indices 0, 1).
    // Focus should move to index 1 (the preceding slide).
    const next = calculateNextActiveSlideIndex(2, 2, 2);
    expect(next).toBe(1);
  });

  it('decrements active index when a slide preceding the active slide is deleted', () => {
    // 4 slides (0, 1, 2, 3). Active is 2. Delete slide 0 -> 3 slides left.
    // The active slide shifts from index 2 to index 1.
    const next = calculateNextActiveSlideIndex(2, 0, 3);
    expect(next).toBe(1);
  });

  it('maintains active index when a slide following the active slide is deleted', () => {
    // 4 slides (0, 1, 2, 3). Active is 1. Delete slide 3 -> 3 slides left.
    // The active slide remains at index 1.
    const next = calculateNextActiveSlideIndex(1, 3, 3);
    expect(next).toBe(1);
  });

  it('defaults to 0 if currentIndex was null but slides remain', () => {
    const next = calculateNextActiveSlideIndex(null, 1, 2);
    expect(next).toBe(0);
  });
});
