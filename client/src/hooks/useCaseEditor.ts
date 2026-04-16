import { useState } from 'react';
import type { PatientCase, CaseSlide } from '../types';
import { saveCaseToZip, loadCaseFromZip } from '../utils/fileHelpers';

const uuid = () => Math.random().toString(36).substr(2, 9);

export const useCaseEditor = () => {
    const [caseData, setCaseData] = useState<PatientCase>({
        meta: {
            id: uuid(),
            title: '',
            description: '',
            author: '',
            created: new Date().toISOString(),
        },
        slides: []
    });

    // Files in memory (filename -> File)
    const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
    // Previews (filename -> blobUrl)
    const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

    const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);

    // --- ACTIONS ---

    const addSlide = (type: CaseSlide['type']) => {
        const newSlide: any = {
            id: uuid(),
            type,
            title: '',
            content: '',
            question: type !== 'INFO' ? '' : undefined,
            options: type === 'MULTIPLE_CHOICE' ? [] : undefined,
            correctAnswer: type === 'TRUE_FALSE' ? true : undefined
        };

        setCaseData(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
        setActiveSlideIndex(caseData.slides.length);
    };

    const deleteSlide = (index: number) => {
        setCaseData(prev => {
            const newSlides = prev.slides.filter((_, i) => i !== index);
            return { ...prev, slides: newSlides };
        });

        if (activeSlideIndex === index) {
            setActiveSlideIndex(null);
        } else if (activeSlideIndex !== null && activeSlideIndex > index) {
            setActiveSlideIndex(activeSlideIndex - 1);
        }
    };

    const updateSlide = (index: number, field: string, value: any) => {
        setCaseData(prev => {
            const newSlides = [...prev.slides];
            newSlides[index] = { ...newSlides[index], [field]: value };
            return { ...prev, slides: newSlides };
        });
    };

    const attachImageToSlide = (index: number, file: File) => {
        setImageFiles(prev => ({ ...prev, [file.name]: file }));
        const previewUrl = URL.createObjectURL(file);
        setImagePreviews(prev => ({ ...prev, [file.name]: previewUrl }));
        updateSlide(index, 'imageFileName', file.name);
    };

    // --- SAVE / LOAD ---

    const handleSave = () => saveCaseToZip(caseData, imageFiles);

    const handleLoad = async (file: File) => {
        try {
            const { caseData: loadedData, images, imageFiles: loadedFiles } = await loadCaseFromZip(file);
            setCaseData(loadedData);
            setImagePreviews(images);
            setImageFiles(loadedFiles);
            setActiveSlideIndex(0);
        } catch (e) {
            console.error("Lataus epäonnistui", e);
            alert("Tiedoston lataus epäonnistui. Varmista että se on \".medcase\"-tiedosto.");
        }
    };

    return {
        caseData,
        setCaseData,
        activeSlideIndex,
        setActiveSlideIndex,
        imagePreviews,
        addSlide,
        deleteSlide,
        updateSlide,
        attachImageToSlide,
        handleSave,
        handleLoad
    };
};