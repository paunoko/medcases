import { useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { PatientCase, CaseSlide } from '../types';
import { saveCaseToZip, loadCaseFromZip } from '../utils/fileHelpers';
import { useUI } from '../context/UIContext';

const uuid = () => Math.random().toString(36).substr(2, 9);

export const useCaseEditor = () => {
    const { showAlert } = useUI();
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

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
    };

    const updateSlide = (index: number, field: string, value: any) => {
        setCaseData(prev => {
            const newSlides = [...prev.slides];
            newSlides[index] = { ...newSlides[index], [field]: value };
            return { ...prev, slides: newSlides };
        });
        setHasUnsavedChanges(true);
    };

    const reorderSlides = (activeId: string, overId: string) => {
        setCaseData(prev => {
            const oldIndex = prev.slides.findIndex(s => s.id === activeId);
            const newIndex = prev.slides.findIndex(s => s.id === overId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newSlides = arrayMove(prev.slides, oldIndex, newIndex);
                
                // Update active index if it was affected by reorder
                if (activeSlideIndex !== null) {
                    const currentActiveId = prev.slides[activeSlideIndex].id;
                    const newActiveIndex = newSlides.findIndex(s => s.id === currentActiveId);
                    setActiveSlideIndex(newActiveIndex);
                }
                
                setHasUnsavedChanges(true);
                return { ...prev, slides: newSlides };
            }
            return prev;
        });
    };

    const attachImageToSlide = (index: number, file: File) => {
        setImageFiles(prev => ({ ...prev, [file.name]: file }));
        const previewUrl = URL.createObjectURL(file);
        setImagePreviews(prev => ({ ...prev, [file.name]: previewUrl }));
        updateSlide(index, 'imageFileName', file.name);
        setHasUnsavedChanges(true);
    };

    const updateMeta = (field: keyof PatientCase['meta'], value: string) => {
        setCaseData(prev => ({
            ...prev,
            meta: { ...prev.meta, [field]: value }
        }));
        setHasUnsavedChanges(true);
    };

    // --- SAVE / LOAD ---

    const handleSave = async () => {
        const filename = await saveCaseToZip(caseData, imageFiles);
        setHasUnsavedChanges(false);
        return filename;
    };

    const handleLoad = async (file: File) => {
        try {
            const { caseData: loadedData, images, imageFiles: loadedFiles } = await loadCaseFromZip(file);
            setCaseData(loadedData);
            setImagePreviews(images);
            setImageFiles(loadedFiles);
            setActiveSlideIndex(0);
            setHasUnsavedChanges(false);
        } catch (e) {
            console.error("Lataus epäonnistui", e);
            showAlert({
                title: 'Lataus epäonnistui',
                message: 'Varmista, että tiedosto on oikea .medcase-tiedosto.',
                variant: 'destructive',
            });
        }
    };

    return {
        caseData,
        updateMeta,
        activeSlideIndex,
        setActiveSlideIndex,
        imagePreviews,
        addSlide,
        deleteSlide,
        updateSlide,
        reorderSlides,
        attachImageToSlide,
        handleSave,
        handleLoad,
        hasUnsavedChanges
    };
};