# Project Structure

```text
medcases/
├── package.json              # Juuri: Orkestroi serverin ja clientin käynnistyksen
├── .gitignore                # Git-asetukset (sis. .medcase-eston)
├── README.md                 # Dokumentaatio
│
├── server/                   # Backend (Node.js + Socket.io)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Palvelimen ainoa ajettava tiedosto (logiikka)
│       └── types.ts          # Palvelimen tarvitsemat tyyppimääritykset
│
└── client/                   # Frontend (React + Vite + Tailwind)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── tailwind.config.js
    │
    └── src/
        ├── main.tsx          # Reactin entry point
        ├── App.tsx           # Reititys (Router): /, /teacher, /editor
        ├── index.css         # Tailwindin importit
        ├── types.ts          # "Master"-tyypit (Slide, PatientCase, jne.)
        │
        ├── utils/            # Apufunktiot
        │   ├── fileHelpers.ts    # ZIP-pakkaus/purku ja Blob-hallinta
        │   └── sanitizer.ts      # Datan siivoaminen opiskelijoille
        │
        ├── hooks/            # Sovelluslogiikka (Custom Hooks)
        │   ├── useTeacherSession.ts  # Opettajan socket-logiikka
        │   ├── useStudentSession.ts  # Opiskelijan socket-logiikka
        │   └── useCaseEditor.ts      # Editorin tilanhallinta
        │
        ├── components/       # UI-komponentit
        │   └── SlideRenderer.tsx     # Osaa piirtää minkä tahansa sliden
        │
        └── views/            # Päänäkymät
            ├── LandingView.tsx       # Aloitussivu (Opiskelija/Opettaja valinta)
            ├── EditorView.tsx        # Editorin UI
            ├── TeacherView.tsx       # Opettajan dashboard
            └── StudentView.tsx       # Opiskelijan mobiili-UI
```