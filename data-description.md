Patient case data is stored as a JSON object in a .medcase file. The file is a ZIP archive containing the following files:

- `case.json`: The patient case data
- `images/`: Directory containing image files referenced in the case data

```
{
  "meta": {
    "id": "case-101",
    "title": "Rintakipupotilas päivystyksessä",
    "description": "55-vuotias mies, äkillinen rintakipu.",
    "author": "Dr. Meikäläinen",
    "created": "2023-10-27T10:00:00Z"
  },
  "slides": [
    {
      "id": "slide-1",
      "type": "INFO",
      "title": "Esitiedot",
      "content": "Potilas saapuu ambulanssilla. Kertoo, että rintaa puristaa.",
      "imageFileName": "potilas_saapuu.jpg", 
      "teacherNotes": "Muista mainita riskitekijät (tupakointi)."
    },
    {
      "id": "slide-2",
      "type": "MULTIPLE_CHOICE",
      "title": "EKG:n tulkinta",
      "content": "Hoitaja ottaa oheisen EKG:n. Mitä näet?",
      "imageFileName": "ekg_v1.png",
      "question": "Mikä on EKG-löydös?",
      "options": [
        { "id": "opt-1", "text": "Normaali sinusrytmi", "isCorrect": false },
        { "id": "opt-2", "text": "ST-nousuinfarkti (STEMI)", "isCorrect": true },
        { "id": "opt-3", "text": "Eteisvärinä", "isCorrect": false }
      ]
    },
    {
      "id": "slide-3",
      "type": "OPEN_TEXT",
      "title": "Hoitolinjaus",
      "content": "Potilaan kivut jatkuvat.",
      "question": "Mitä lääkkeitä määräät välittömästi? Luettele lyhyesti.",
      "modelAnswer": "ASA, Nitro, Opioidi kivunlievitykseen, tarvittaessa happi."
    }
  ]
}
```