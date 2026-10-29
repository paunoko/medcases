import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { PatientCase, SlideType } from '../types';

// Type for extracted images: filename -> browser internal URL
export type ImageMap = Record<string, string>;

export const revokeImageUrls = (imageMap?: ImageMap | null) => {
    if (!imageMap) return;
    Object.values(imageMap).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error("Failed to revoke object URL", e);
            }
        }
    });
};

const CASE_FILENAME = 'case.json';
const IMAGES_FOLDER = 'images';

export const saveCaseToZip = async (
    caseData: PatientCase,
    imageFiles: Record<string, File>
) => {
    const zip = new JSZip();

    // 1. Prepare normalized slides with slide{index + 1}.{ext} image names
    const normalizedSlides = caseData.slides.map((slide, index) => {
        if (!slide.imageFileName || !imageFiles[slide.imageFileName]) {
            const { imageFileName: _, ...rest } = slide;
            return rest;
        }
        const ext = slide.imageFileName.split('.').pop()?.toLowerCase() || 'png';
        const zipImageName = `slide${index + 1}.${ext}`;
        return {
            ...slide,
            imageFileName: zipImageName
        };
    });

    const normalizedCase: PatientCase = {
        ...caseData,
        slides: normalizedSlides as PatientCase['slides']
    };

    // 2. Add JSON
    zip.file(CASE_FILENAME, JSON.stringify(normalizedCase, null, 2));

    // 3. Add images to images-folder
    const imgFolder = zip.folder(IMAGES_FOLDER);
    if (imgFolder) {
        caseData.slides.forEach((slide, index) => {
            if (slide.imageFileName && imageFiles[slide.imageFileName]) {
                const ext = slide.imageFileName.split('.').pop()?.toLowerCase() || 'png';
                const zipImageName = `slide${index + 1}.${ext}`;
                imgFolder.file(zipImageName, imageFiles[slide.imageFileName]);
            }
        });
    }

    // 4. Generate and download
    const blob = await zip.generateAsync({ type: "blob" });

    // Sanitize filename and add timestamp
    const safeName = caseData.meta.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = `${year}${month}${day}`;
    const filename = `${safeName}_${timestamp}.medcase`;

    saveAs(blob, filename);
    return filename;
};

export const validatePatientCase = (data: unknown): PatientCase => {
    if (!data || typeof data !== 'object') {
        throw new Error('Tiedosto ei sisällä kelvollista tapausta (virheellinen JSON).');
    }

    const c = data as Record<string, unknown>;

    if (!c.meta || typeof c.meta !== 'object') {
        throw new Error('Tapauksen metatiedot (meta) puuttuvat.');
    }

    const meta = c.meta as Record<string, unknown>;
    if (typeof meta.title !== 'string') {
        throw new Error('Tapauksen otsikko (meta.title) puuttuu tai on virheellinen.');
    }

    if (!Array.isArray(c.slides)) {
        throw new Error('Tapauksen diat (slides) puuttuvat tai eivät ole taulukko.');
    }

    const validTypes: SlideType[] = ['INFO', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_TEXT'];

    c.slides.forEach((slide: unknown, idx: number) => {
        if (!slide || typeof slide !== 'object') {
            throw new Error(`Dia #${idx + 1} on virheellinen.`);
        }
        const s = slide as Record<string, unknown>;
        if (typeof s.id !== 'string' || !s.id) {
            throw new Error(`Dian #${idx + 1} tunniste (id) puuttuu.`);
        }
        if (!validTypes.includes(s.type as SlideType)) {
            throw new Error(`Dian #${idx + 1} tyyppi '${s.type}' on tuntematon.`);
        }
        if (typeof s.title !== 'string') {
            throw new Error(`Dian #${idx + 1} otsikko (title) puuttuu tai on virheellinen.`);
        }
        if (s.type === 'MULTIPLE_CHOICE' && !Array.isArray(s.options)) {
            throw new Error(`Monivalintadian #${idx + 1} vastausvaihtoehdot (options) puuttuvat.`);
        }
    });

    return data as PatientCase;
};

export const loadCaseFromZip = async (file: File) => {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    // 1. Read and validate JSON
    const jsonFile = loadedZip.file(CASE_FILENAME);
    if (!jsonFile) throw new Error(`Virheellinen tiedosto: ${CASE_FILENAME} puuttuu`);

    const jsonStr = await jsonFile.async("string");
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonStr);
    } catch {
        throw new Error(`Tiedosto ${CASE_FILENAME} ei sisällä kelvollista JSON-dataa.`);
    }

    const caseData = validatePatientCase(parsed);

    // 2. Read images and create Object URLs
    const images: ImageMap = {};
    const imageFiles: Record<string, File> = {}; // Required for the editor

    const imageFolder = loadedZip.folder(IMAGES_FOLDER);

    if (imageFolder) {
        const filePaths = Object.keys(imageFolder.files);

        // Run in parallel for speed
        await Promise.all(filePaths.map(async (relativePath) => {
            // Skip directories
            if (imageFolder.files[relativePath].dir) return;

            const fileEntry = imageFolder.files[relativePath];
            const blob = await fileEntry.async("blob");

            const fileName = relativePath.split('/').pop() || relativePath;

            // Create URL (e.g., blob:http://localhost...)
            const objectUrl = URL.createObjectURL(blob);

            // Create File object for the editor
            const fileObj = new File([blob], fileName, { type: blob.type });

            images[fileName] = objectUrl;
            imageFiles[fileName] = fileObj;
        }));
    }

    return { caseData, images, imageFiles };
};