import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { arrayMove } from '@dnd-kit/sortable';
import type { PatientCase, CaseSlide } from '../types';
import { saveCaseToZip, loadCaseFromZip, revokeImageUrls, CaseValidationError } from '../utils/fileHelpers';
import { useUI } from '../context/UIContext';

const uuid = () => Math.random().toString(36).substr(2, 9);

export const useCaseEditor = () => {
    const { t } = useTranslation();
    const { showAlert } = useUI();
    const [caseData, setCaseData] = useState<PatientCase>({
        meta: {
            id: uuid(),
            title: '',
            created: new Date().toISOString(),
        },
        slides: []
    });

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Files in memory (filename -> File)
    const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
    // Previews (filename -> blobUrl)
    const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

    const imagePreviewsRef = useRef<Record<string, string>>({});
    useEffect(() => {
        imagePreviewsRef.current = imagePreviews;
    }, [imagePreviews]);

    // Clean up all object URLs when editor unmounts
    useEffect(() => {
        return () => {
            revokeImageUrls(imagePreviewsRef.current);
        };
    }, []);

    const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null);

    // --- ACTIONS ---

    const addSlide = (type: CaseSlide['type']) => {
        const newSlide = {
            id: uuid(),
            type,
            title: '',
            content: '',
            question: type !== 'INFO' ? '' : undefined,
            options: type === 'MULTIPLE_CHOICE' ? [] : undefined,
            allowMultiple: type === 'MULTIPLE_CHOICE' ? false : undefined,
            correctAnswer: type === 'TRUE_FALSE' ? true : undefined,
            modelAnswer: type === 'OPEN_TEXT' ? '' : undefined
        } as unknown as CaseSlide;

        setCaseData(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
        setActiveSlideIndex(caseData.slides.length);
        setHasUnsavedChanges(true);
    };

    const deleteSlide = (index: number) => {
        const slideToDelete = caseData.slides[index];
        if (slideToDelete?.imageFileName) {
            const imgName = slideToDelete.imageFileName;
            if (imagePreviews[imgName]) {
                URL.revokeObjectURL(imagePreviews[imgName]);
            }
            setImagePreviews(prev => {
                const next = { ...prev };
                delete next[imgName];
                return next;
            });
            setImageFiles(prev => {
                const next = { ...prev };
                delete next[imgName];
                return next;
            });
        }

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

    const updateSlide = (index: number, field: string, value: unknown) => {
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

    const removeImageFromSlide = (index: number) => {
        const slide = caseData.slides[index];
        if (slide?.imageFileName) {
            const fileName = slide.imageFileName;
            if (imagePreviews[fileName]) {
                URL.revokeObjectURL(imagePreviews[fileName]);
            }
            setImagePreviews(prev => {
                const next = { ...prev };
                delete next[fileName];
                return next;
            });
            setImageFiles(prev => {
                const next = { ...prev };
                delete next[fileName];
                return next;
            });
        }
        updateSlide(index, 'imageFileName', undefined);
        setHasUnsavedChanges(true);
    };

    const attachImageToSlide = (index: number, file: File) => {
        const slide = caseData.slides[index];
        if (!slide) return;

        // Clean up previous image on this slide if exists
        if (slide.imageFileName) {
            const oldName = slide.imageFileName;
            if (imagePreviews[oldName]) {
                URL.revokeObjectURL(imagePreviews[oldName]);
            }
            setImagePreviews(prev => {
                const next = { ...prev };
                delete next[oldName];
                return next;
            });
            setImageFiles(prev => {
                const next = { ...prev };
                delete next[oldName];
                return next;
            });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const internalName = `slide_${slide.id}.${ext}`;
        const newFile = new File([file], internalName, { type: file.type });
        const previewUrl = URL.createObjectURL(newFile);

        setImageFiles(prev => ({ ...prev, [internalName]: newFile }));
        setImagePreviews(prev => ({ ...prev, [internalName]: previewUrl }));
        updateSlide(index, 'imageFileName', internalName);
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
            revokeImageUrls(imagePreviewsRef.current);
            setCaseData(loadedData);
            setImagePreviews(images);
            setImageFiles(loadedFiles);
            setActiveSlideIndex(0);
            setHasUnsavedChanges(false);
        } catch (e) {
            console.error("Load failed", e);
            const message = e instanceof CaseValidationError
                ? String(t(`errors.${e.code}`, e.params || { defaultValue: e.message }))
                : (e instanceof Error ? e.message : t('editor.uploadFailedMsg'));
            showAlert({
                title: t('editor.uploadFailed'),
                message,
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
        removeImageFromSlide,
        handleSave,
        handleLoad,
        hasUnsavedChanges
    };
};