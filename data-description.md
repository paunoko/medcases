# MedCases Data Format (`.medcase`)

A `.medcase` file is essentially a standard ZIP archive containing a patient case definition and all its associated media assets. This guide explains how to construct your own patient cases manually by writing the underlying JSON.

## Archive Structure

A working `.medcase` archive must have the following internal structure:

```
my-case-name.medcase/ (ZIP Archive)
├── case.json         # The main JSON file defining the case data
└── images/           # Directory containing all referenced image files
    ├── patient.jpg
    └── ekg.png
```

## The `case.json` Structure

The root of `case.json` consists of two main sections: `meta` and `slides`.

### Root Object
- `meta` (Object, Required): Metadata about the case.
- `slides` (Array of Slide Objects, Required): The ordered list of slides the case contains.

### `meta` Object Fields
- `id` (String, Required): A unique identifier for the case (e.g., `"case-101"`).
- `title` (String, Required): The display title of the case.
- `description` (String, Required): A brief summary or description of the case.
- `author` (String, Required): The creator's name.
- `created` (String, Required): ISO 8601 formatted date string (e.g., `"2023-10-27T10:00:00Z"`).

## Slide Types and Fields

Every slide object in the `slides` array shares a set of common base fields, but also requires specific fields depending on its `type`. 

### Common Base Fields (Available on all slides)
- `id` (String, Required): A unique identifier for the slide (e.g., `"slide-1"`).
- `type` (String, Required): Determines the slide type. Must be one of: `"INFO"`, `"MULTIPLE_CHOICE"`, `"TRUE_FALSE"`, or `"OPEN_TEXT"`.
- `title` (String, Required): The title of the slide.
- `content` (String, Required): The main descriptive text or introduction for the slide context.
- `imageFileName` (String, Optional): The exact filename of an image stored in the `images/` directory. If provided, the app will display this graphic.
- `teacherNotes` (String, Optional): Private notes visible only to the teacher/presenter.

---

### 1. Information Slide (`type: "INFO"`)
Used for presenting context, patient history, or test results without asking the student a question.

**Specific fields:** None beyond the common base fields.

---

### 2. Multiple Choice Slide (`type: "MULTIPLE_CHOICE"`)
Presents a multiple-choice question to the student with several options.

**Specific fields:**
- `question` (String, Required): The actual question text being asked.
- `options` (Array of Objects, Required): A list of possible answers. Each object contains:
  - `id` (String, Required): Unique identifier for the option.
  - `text` (String, Required): The text of the choice.
  - `isCorrect` (Boolean, Optional/Recommended): Marks whether this option is the correct answer. This indicates the correct choice for the teacher's view and model answers.

---

### 3. True/False Slide (`type: "TRUE_FALSE"`)
Presents a simple True/False or Yes/No binary question.

**Specific fields:**
- `question` (String, Required): The question text being asked.
- `correctAnswer` (Boolean, Required): The correct answer to the question (`true` or `false`).

---

### 4. Open Text Slide (`type: "OPEN_TEXT"`)
Presents a question where the student answers by typing free-form text.

**Specific fields:**
- `question` (String, Required): The question text being asked.
- `modelAnswer` (String, Optional): A model standard answer that is provided to the teacher for reference when grading or leading the discussion.

---

## Complete Example `case.json`

Here is a fully functioning example incorporating all slide types. Save this as `case.json`, put any required images in an `images/` folder, zip them together, and change the file extension to `.medcase`.

```json
{
  "meta": {
    "id": "case-cardio-1",
    "title": "Rintakipupotilas päivystyksessä",
    "description": "55-vuotias mies, äkillinen rintakipu.",
    "author": "Dr. Meikäläinen",
    "created": "2023-10-27T10:00:00Z"
  },
  "slides": [
    {
      "id": "slide-1-info",
      "type": "INFO",
      "title": "Esitiedot",
      "content": "Potilas saapuu ambulanssilla. Kertoo, että rintaa puristaa voimakkaasti. Kipu säteilee vasempaan käteen.",
      "imageFileName": "patient_arrival.jpg",
      "teacherNotes": "Muista kysyä opiskelijoilta riskitekijöistä (tupakointi, verenpaine) ennen seuraavaa diaa."
    },
    {
      "id": "slide-2-mcq",
      "type": "MULTIPLE_CHOICE",
      "title": "EKG:n tulkinta",
      "content": "Hoitaja ottaa oheisen 12-kytkentäisen EKG:n.",
      "imageFileName": "ekg_v1.png",
      "question": "Mikä on ensisijainen EKG-löydös?",
      "options": [
        { "id": "opt-1", "text": "Normaali sinusrytmi", "isCorrect": false },
        { "id": "opt-2", "text": "ST-nousuinfarkti (STEMI)", "isCorrect": true },
        { "id": "opt-3", "text": "Eteisvärinä", "isCorrect": false }
      ]
    },
    {
      "id": "slide-3-tf",
      "type": "TRUE_FALSE",
      "title": "Lääkitys",
      "content": "Potilaan kivut jatkuvat 8/10 NRS-asteikolla.",
      "question": "Annetaanko tälle potilaalle välittömästi asetyylisalisyylihappoa (ASA) pureskeltavaksi?",
      "correctAnswer": true,
      "teacherNotes": "Annetaan 250 mg ASA pureskeltuna, ellei ole vasta-aiheita."
    },
    {
      "id": "slide-4-open",
      "type": "OPEN_TEXT",
      "title": "Jatkohoito",
      "content": "Ensihoitolääkkeet on annettu. EKG:ssa edelleen ST-nousut kytkennöissä V2-V5.",
      "question": "Mikä on potilaan kiireellisin jatkohoitopaikka ja -toimenpide?",
      "modelAnswer": "Välitön siirto PCI-keskukseen (pallolaajennukseen)."
    }
  ]
}
```