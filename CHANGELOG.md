# MedCases – Muutosloki (Changelog)

Kaikki merkittävät muutokset MedCases-projektiin dokumentoidaan tähän tiedostoon.
Formaatti perustuu [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) -ohjeistukseen ja versiointi noudattaa [Semanttista versiointia](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-30

### Lisätty (Added)
- **Kanoninen 1080p-virtuaalikangas (1:1 WYSIWYG)**: Dynaaminen 16:9 mittakaavasuhde takaa täydellisen näkymäidenttisyyden editorin ja luentosalin valkokankaan välillä.
- **Monitapauksisuus samalla huonekoodilla (`switchCase`)**: Opettaja voi esittää useita potilastapauksia saman luennon aikana suoraan sivupalkista ilman opiskelijoiden uudelleenliittymistä.
- **Yhtenäinen `AppHeader`-komponentti**: Pikselilleen identtinen yläpalkki aloitusnäkymän ja tiedostonvalinnan välillä.
- **Brändin mukainen EKG-kuvake**: Moniresoluutioiset `favicon.svg`, `favicon.ico` ja `apple-touch-icon.png` selaimen välilehtiin ja mobiilikirjanmerkkeihin.
- **Automaattitestaus (Vitest)**: Yksikkötestit sanitointilogiikalle (`sanitizer.test.ts`) ja tiedostovalidoinnille (`fileHelpers.test.ts`).
- **GitHub Actions CI -automaatioputki**: `.github/workflows/ci.yml` suorittaa lintoimisen, testit ja asiakas- sekä palvelinbuildit automaattisesti jokaiselle pushille ja pull requestille.
- **Konfiguroitava palvelinportti**: Palvelin lukee ympäristömuuttujan `PORT` (`process.env.PORT || 3000`).

### Muutettu (Changed)
- **Koodinpätkintä (Code Splitting)**: `TeacherView` ja `EditorView` ladataan dynaamisesti `React.lazy()`-mekanismilla. Asiakaspaketin koko pieneni 610 kB:sta 384 kB:aan (opiskelijoiden mobiililataus nopeutuu merkittävästi luentosaleissa).
- **Ruotsinkieliset käännökset (`sv.json`)**: Hiottu luonnollisemmiksi ("Välj det första patientfallet", "Avsluta redigering", "Avsluta utan att spara").
- **Tiedostonvalinnan UX**: Poistettu kaksoiskuvake ja tekstitoistot selkeyttäen pudotuslaatikkoa.
- **Lisenssimerkinnät**: Yhdenmukaistettu `GPL-3.0-only` ja tekijätiedot kautta koko repositorion.

### Korjattu (Fixed)
- **Tietoturvapaikkaukset**: Korjattu kaikki 24 npm-haavoittuvuutta transitiivisissa riippuvuuksissa (`npm audit fix`).
- **ESLint & React 19 -hygienia**: Korjattu 47 ESLint- ja tyyppihuomautusta (mm. ref-päivitykset renderissä, tyhjät catch-lohkot, `any`-tyypitykset).
- **Istunnon lopetuksen paluu**: "Lopeta istunto" ohjaa suoraan alkunäkymään opettajan välilehdelle.

---

## [1.0.0] - 2026-10-28

- Alkuperäinen prototyyppijulkaisu: perustoiminnallisuus opettajan ja opiskelijan Socket.io-huoneille, peruseditori ja ZIP-tiedostomuodon tuki.
