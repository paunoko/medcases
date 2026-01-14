import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { PatientCase } from '../types';

// Tyyppi puretuille kuville: tiedostonimi -> selaimen sisäinen URL
export type ImageMap = Record<string, string>;

export const saveCaseToZip = async (
    caseData: PatientCase,
    imageFiles: Record<string, File>
) => {
    const zip = new JSZip();

    // 1. Lisätään JSON
    zip.file("data.json", JSON.stringify(caseData, null, 2));

    // 2. Lisätään kuvat images-kansioon
    const imgFolder = zip.folder("images");
    if (imgFolder) {
        // Käydään läpi vain ne kuvat, joita oikeasti käytetään datassa
        caseData.slides.forEach(slide => {
            if (slide.imageFileName && imageFiles[slide.imageFileName]) {
                imgFolder.file(slide.imageFileName, imageFiles[slide.imageFileName]);
            }
        });
    }

    // 3. Generoidaan ja ladataan
    const blob = await zip.generateAsync({ type: "blob" });

    // Siivotaan tiedostonimi ja lisätään aikaleima
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

export const loadCaseFromZip = async (file: File) => {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    // 1. Luetaan JSON
    const jsonFile = loadedZip.file("data.json");
    if (!jsonFile) throw new Error("Virheellinen tiedosto: data.json puuttuu");

    const jsonStr = await jsonFile.async("string");
    const caseData = JSON.parse(jsonStr) as PatientCase;

    // 2. Luetaan kuvat ja luodaan niille Object URLit
    const images: ImageMap = {};
    const imageFiles: Record<string, File> = {}; // Tarvitaan editoria varten

    const imageFolder = loadedZip.folder("images");

    if (imageFolder) {
        const filePaths = Object.keys(imageFolder.files);

        // Ajetaan rinnakkain nopeuden vuoksi
        await Promise.all(filePaths.map(async (relativePath) => {
            // Ohitetaan kansiot
            if (imageFolder.files[relativePath].dir) return;

            const fileEntry = imageFolder.files[relativePath];
            const blob = await fileEntry.async("blob");

            const fileName = relativePath.split('/').pop() || relativePath;

            // Luodaan URL (esim. blob:http://localhost...)
            const objectUrl = URL.createObjectURL(blob);

            // Luodaan File-objekti editoria varten
            const fileObj = new File([blob], fileName, { type: blob.type });

            images[fileName] = objectUrl;
            imageFiles[fileName] = fileObj;
        }));
    }

    return { caseData, images, imageFiles };
};