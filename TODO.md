# MedCases – Kehityksen TODO-lista

Tämä tehtävälista pohjautuu koodikannan kattavaan auditointiin. Listaan on koottu havaitut puutteet, bugit ja kehityskohteet priorisoituna ja konkreettisin ratkaisuehdotuksin.

---

## 1. Datarakenne ja tiedostomuoto (.medcase)

- [x] **1.1 Standardoi ZIP-paketin JSON-tiedostonimi (`case.json`)**
  - **Prioriteetti:** Korkea (yhteensopivuusbugi)
  - **Tiedostot:** `client/src/utils/fileHelpers.ts`, `data-description.md`
  - **Ongelma:** Dokumentaatio (`data-description.md`) määrittelee nimeksi `case.json`, mutta `fileHelpers.ts` kirjoitti ja luki kovakoodattua `data.json`-nimeä.
  - **Toimenpiteet:**
    - `saveCaseToZip` kirjoittaa tiedoston aina nimellä `case.json`.
    - `loadCaseFromZip` lukee tiedoston `case.json`. Jos tiedostoa ei löydy, heitetään virheilmoitus.

- [ ] **1.2 Poista tai ota käyttöön toteuttamaton data (Dead Schema Fields)**
  - **Prioriteetti:** Keskitaso (koodin selkeys)
  - **Tiedostot:** `client/src/types.ts`, `server/src/types.ts`, `client/src/hooks/useCaseEditor.ts`, `client/src/views/TeacherView.tsx`, `client/src/views/EditorView.tsx`
  - **Ongelma:** Tyypeissä ja skeemassa roikkuu kenttiä, joita ei käytetä tai joita ei voi syöttää editorissa.
  - **Toimenpiteet:**
    - **`teacherNotes`:** Joko lisätään editoriin (`EditorView.tsx` / `SlideInteraction.tsx`) syöttökenttä opettajan muistiinpanoille, tai poistetaan kenttä kokonaan tyypeistä ja `TeacherView.tsx`-esitysnäkymästä.
    - **`meta.description` ja `meta.author`:** Poistetaan tyypeistä ja alustuksista, ellei niille luoda syöttökenttiä editoriin.
    - **`RoomStatus = 'LOCKED'`:** Poistetaan käyttämätön tila palvelimen ja asiakkaan tyypeistä, ellei diaan haluta erillistä vastaamisen lukitsemistoimintoa ennen paljastusta.

- [ ] **1.3 Paranna mallivastauksen (`modelAnswer`) editorikokemusta**
  - **Prioriteetti:** Keskitaso
  - **Tiedostot:** `client/src/components/slide/SlideInteraction.tsx`, `client/src/hooks/useCaseEditor.ts`
  - **Ongelma:** Mallivastauksen syöttökenttä editorissa on yksirivinen `<input>`, johon on vaikea kirjoittaa pitkiä lääketieteellisiä perusteluja tai vastauksia. Lisäksi kenttää ei alusteta `useCaseEditor.ts`-hookissa.
  - **Toimenpiteet:**
    - Vaihda `SlideInteraction.tsx`:n syöttökenttä `<textarea>`-elementiksi.
    - Alusta `modelAnswer: ''` `useCaseEditor.ts`:n `addSlide('OPEN_TEXT')`-haarassa.

- [ ] **1.4 Yhtenäistä Kyllä/Ei -sanamuodot**
  - **Prioriteetti:** Matala / Käytettävyys
  - **Tiedostot:** `client/src/i18n/locales/{fi,en,sv}.json`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/StudentView.tsx`, `client/src/utils/sanitizer.ts`
  - **Ongelma:** Valinnoissa käytetään yhdistelmämuotoa *"Kyllä / Tosi"* ja *"Ei / Epätosi"*, mikä on tarpeettoman kömpelöä tavallisissa kliinisissä kysymyksissä.
  - **Toimenpiteet:**
    - Päivitä käännösavaimet `editor.yesTrue` ja `editor.noFalse` muotoon *"Kyllä"* / *"Ei"* (FI), *"Yes"* / *"No"* (EN) ja *"Ja"* / *"Nej"* (SV).

---

## 2. Kysymyslogiikka ja luokkatilanteen pedagoginen UX

- [ ] **2.1 Toteuta Yksivalinta (Single choice) vs. Monivalinta (`allowMultiple`)**
  - **Prioriteetti:** Korkea (pedagoginen logiikka ja tilastot)
  - **Tiedostot:** `client/src/types.ts`, `server/src/types.ts`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/EditorView.tsx`, `client/src/views/StudentView.tsx`, `server/src/index.ts`, `client/src/utils/sanitizer.ts`
  - **Ongelma:** Opiskelija voi aina valita useita vaihtoehtoja, jolloin yksivalintakysymyksissä tulospalkkien summa ylittää 100 %. Editorissa ei voi valita, onko kyseessä yksi- vai monivalinta.
  - **Toimenpiteet:**
    - Lisää `allowMultiple?: boolean` tyyppeihin `MultipleChoiceSlide`, `StudentPayload` ja `BroadcastPayload`.
    - **Oletuksena `allowMultiple: false` (yksivalinta):**
      - Editorissa oikea vastaus valitaan radiopainikkeella (vain yksi valinta).
      - Opiskelijanäkymässä uusi valinta korvaa edellisen, ja ohjeena lukee *"Yksivalinta (valitse yksi)"*.
      - Valkokankaalla tulospalkkien summa on tasan 100 %.
      - Backend varmistaa ja leikkaa vastauksen enintään 1 valintaan.
    - **Jos `allowMultiple: true` (monivalinta):**
      - Editorissa valintaruutu "Salli useampi valinta", jolloin useita vaihtoehtoja voi merkitä oikeaksi.
      - Opiskelija voi valita useita, ja ohjeena lukee *"Monivalinta – valitse kaikki sopivat"*.
      - Tulokset esitetään prosentteina vastaajien kokonaismäärästä.

- [ ] **2.2 Suojaa avoimen tekstin vastaukset salissa ja lisää moderointi (OPEN_TEXT)**
  - **Prioriteetti:** Korkea (luokkatilanteen turvallisuus & vilpinesto)
  - **Tiedostot:** `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/TeacherView.tsx`, `server/src/index.ts`
  - **Ongelma:** Vapaat tekstivastaukset tulevat valkokankaalle reaaliajassa. Nykyinen CSS-blurraus (`blur-[6px]`) jättää tekstit DOM-puuhun ja lyhyet sanat ovat luettavissa sumennuksen läpi. Asiattomia kommentteja ei voi moderoida.
  - **Toimenpiteet:**
    - Vastausvaiheessa (`!isRevealed`) valkokankaalla näytetään ainoastaan määrälaskuri (esim. *"💬 Vastauksia vastaanotetaan... 14 vastausta saapunut"*). Tekstejä ei renderöidä näkyville.
    - Vastaukset paljastetaan vasta kun opettaja klikkaa *"LUKITSE & PALJASTA"*.
    - Lisätään opettajalle kunkin vastauksen kohdalle `Piilota ✕` -painike asiattomien vastausten poistamiseksi kankaalta.

- [ ] **2.3 Korjaa mobiilivastaamisen vahinkopainallukset & tyhjät vastaukset**
  - **Prioriteetti:** Keskitaso (mobiili-UX)
  - **Tiedostot:** `client/src/views/StudentView.tsx`
  - **Ongelma:** Kyllä/Ei -vaihtoehdon hipaisu mobiilissa lähettää vastauksen heti ilman peruutusmahdollisuutta. Avoimessa tekstissä voi lähettää tyhjän vastauksen.
  - **Toimenpiteet:**
    - TRUE_FALSE: Napin painallus korostaa valinnan, ja lähetys vaatii erillisen *"LÄHETÄ VASTAUS"* -painikkeen painalluksen.
    - OPEN_TEXT: Estä tyhjän vastauksen lähettäminen (`disabled={!textAns.trim()}`).

---

## 3. Kuvat ja tiedostojen käsittely (Editor & Assets)

- [ ] **3.1 Korjaa kuvatiedostojen nimikollisio**
  - **Prioriteetti:** Keskitaso (datan eheys)
  - **Tiedostot:** `client/src/hooks/useCaseEditor.ts`, `client/src/utils/fileHelpers.ts`
  - **Ongelma:** Kuvat tallennetaan suoraan tiedostonimellä (`[file.name]: file`). Jos kahteen eri diaan liitetään eri kuvat, joilla on sama nimi (esim. `image.png`), jälkimmäinen korvaa edellisen.
  - **Toimenpiteet:**
    - Avainna kuvat yksilöivällä tunnisteella, esim. `${slide.id}_${file.name}` tai generoimalla kuvalle uniikki ID/hash.

- [ ] **3.2 Selaimen Object URL -muistivuotojen korjaus**
  - **Prioriteetti:** Keskitaso (muistinhallinta)
  - **Tiedostot:** `client/src/hooks/useCaseEditor.ts`, `client/src/utils/fileHelpers.ts`, `client/src/views/TeacherView.tsx`
  - **Ongelma:** `URL.createObjectURL()`-metodilla luotuja osoitteita ei vapauteta koskaan `URL.revokeObjectURL()`-kutsulla.
  - **Toimenpiteet:**
    - Lisää purkufunktiot (`useEffect` cleanup), jotka vapauttavat Blob URL -osoitteet komponentin poistuessa tai kuvan korvautuessa.

- [ ] **3.3 Tiedoston skeeman validointi ladattaessa**
  - **Prioriteetti:** Keskitaso (virheensieto)
  - **Tiedostot:** `client/src/utils/fileHelpers.ts`
  - **Ongelma:** `loadCaseFromZip` ajaa `JSON.parse` suoraan tyyppipakotuksella. Korruptoitunut tiedosto kaataa sovelluksen.
  - **Toimenpiteet:**
    - Lisää kevyt runtime-skeematarkistus ladattaessa (tarkista vähintään `meta.title` ja että `slides` on taulukko: `Array.isArray(caseData.slides)`). Heitä selkeä käyttäjälle näkyvä virheilmoitus puutteellisesta tiedostosta.

---

## 4. Backendin arkkitehtuuri, tietoturva ja vikasietoisuus

- [ ] **4.1 Korjaa palvelimen jumiutuminen ikuiseen silmukkaan (Kriittinen DoS) & vakioi rajat**
  - **Prioriteetti:** Kriittinen (palvelimen vakaus)
  - **Tiedostot:** `server/src/index.ts`
  - **Ongelma:** Huonekoodin arvonnassa `while (rooms.has(roomId))` pyörii ilman yrityskertalaskuria tai aktiivisten huoneiden maksimimäärää. Huoneiden kertyessä palvelimen prosessi jumiutuu 100 % CPU:lle ja kaatuu. Koodissa on myös useita nimeämättömiä taikalukuja (magic numbers).
  - **Toimenpiteet:**
    - Määrittele selkeät nimetyt vakiot:
      - `MAX_ACTIVE_ROOMS = 100`
      - `MAX_ROOM_ATTEMPTS = 20`
      - `ROOM_CODE_MIN = 1000` ja `ROOM_CODE_RANGE = 9000`
      - `TEACHER_THROTTLE_MS = 1000`
    - Tarkista huonemaksimi `CREATE_ROOM`-kutsussa: jos raja ylittyy, palauta virhe.
    - Rajoita `while`-silmukka `MAX_ROOM_ATTEMPTS`-yrityskertaan. Jos vapaata 4-numeroista koodia ei löydy, hylkää pyyntö virheellä.

- [ ] **4.2 Tallenna opettajan Reconnection Token selaimeen (F5- ja selauspäivitystuki)**
  - **Prioriteetti:** Korkea (opetustilanteen vikasietoisuus)
  - **Tiedostot:** `client/src/hooks/useTeacherSession.ts`
  - **Ongelma:** Palvelimella on `teacherSecret`- ja `RECONNECT_TEACHER`-tuki, mutta asiakaspuolella tunnistetta säilytetään vain Reactin `useRef`-muuttujassa. Jos opettaja päivittää sivun (F5) tai avaa välilehden uudelleen, tila nollautuu ja opettaja menettää huoneensa hallinnan lopullisesti.
  - **Toimenpiteet:**
    - Määrittele vakio `TEACHER_SESSION_KEY = 'medcases_teacher_session'` tallennusavaimelle.
    - Tallenna `roomId` ja `teacherSecret` selaimen `sessionStorage`-muistiin `ROOM_CREATED`-tapahtumassa avaimella `TEACHER_SESSION_KEY`.
    - Sivun latautuessa tarkista `sessionStorage` ja lähetä automaattisesti `RECONNECT_TEACHER`, jos aktiivinen istunto löytyy.
    - Siivoa `sessionStorage` kun opettaja päättää istunnon (`endSession`).

- [ ] **4.3 Huoneiden elinkaari ja inaktiivisuusaikakatkaisu**
  - **Prioriteetti:** Keskitaso / Ylläpito
  - **Tiedostot:** `server/src/index.ts`
  - **Ongelma:** Palvelimella on kovakoodattu 60 sekunnin `disconnectTimer` (`60000`), mutta auki jätetyt ja unohdetut istunnot, joissa yhteys säilyy auki, voivat roikkua muistissa loputtomiin.
  - **Toimenpiteet:**
    - Määrittele selkeät aikarajavakiot:
      - `TEACHER_DISCONNECT_GRACE_MS = 60_000` (60 s toipumisaika yhteyden katketessa)
      - `ROOM_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000` (30 min inaktiivisuusaika)
    - Korvaa kovakoodattu `60000` vakiolla `TEACHER_DISCONNECT_GRACE_MS`.
    - Lisää huoneelle inaktiivisuusaikakatkaisu (`ROOM_INACTIVITY_TIMEOUT_MS`), joka nollautuu aina kun huoneessa tapahtuu toimintaa (opettajan siirtymät, opiskelijoiden vastaukset) ja siivoaa hylätyt huoneet.
