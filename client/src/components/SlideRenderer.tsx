import React from 'react';
import type { CaseSlide } from '../types';
import { SlideContainer } from './slide/SlideContainer';
import { SlideTitle } from './slide/SlideTitle';
import { SlideBody } from './slide/SlideBody';
import { SlideInteraction } from './slide/SlideInteraction';

interface Props {
    slide: CaseSlide;
    imageMap?: Record<string, string>; // Filename -> Blob URL
    answers?: any[]; // Student answers (only in teacher view)
    isRevealed?: boolean;
}

export const SlideRenderer: React.FC<Props> = ({ slide, imageMap, answers = [], isRevealed = false }) => {
    // Get image URL
    const imageUrl = slide.imageFileName && imageMap ? imageMap[slide.imageFileName] : null;

    return (
        <SlideContainer>
            <SlideTitle 
                value={slide.title} 
                mode="view" 
            />

            <SlideBody 
                content={slide.content} 
                imageUrl={imageUrl} 
                mode="view" 
            />

            <SlideInteraction 
                slide={slide} 
                mode="view" 
                answers={answers} 
                isRevealed={isRevealed} 
            />
        </SlideContainer>
    );
};