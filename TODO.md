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

- [x] **1.2 Poista tai ota käyttöön toteuttamaton data (Dead Schema Fields)**
  - **Prioriteetti:** Keskitaso (koodin selkeys)
  - **Tiedostot:** `client/src/types.ts`, `server/src/types.ts`, `client/src/hooks/useCaseEditor.ts`, `client/src/views/TeacherView.tsx`, `client/src/utils/sanitizer.ts`, `client/src/views/StudentView.tsx`, `data-description.md`
  - **Ongelma:** Tyypeissä ja skeemassa roikkui kenttiä ja tiloja, joita ei käytetty tai joita ei voitu syöttää editorissa.
  - **Toimenpiteet:**
    - Poistettu `teacherNotes` tyypeistä, `TeacherView.tsx`:stä, `sanitizer.ts`:sta ja `data-description.md`:stä.
    - Poistettu `meta.description` ja `meta.author` tyypeistä, `useCaseEditor.ts`:sta ja `data-description.md`:stä.
    - Poistettu käyttämätön `LOCKED`-tila palvelimen ja asiakkaan tilatyypeistä ja komponenteista.

- [x] **1.3 Paranna mallivastauksen (`modelAnswer`) editorikokemusta**
  - **Prioriteetti:** Keskitaso
  - **Tiedostot:** `client/src/components/slide/SlideInteraction.tsx`, `client/src/hooks/useCaseEditor.ts`
  - **Ongelma:** Mallivastauksen syöttökenttä editorissa oli yksirivinen `<input>`, johon oli vaikea kirjoittaa monirivisiä vastauksia.
  - **Toimenpiteet:**
    - Vaihdettu `SlideInteraction.tsx`:n syöttökenttä `<textarea>`-elementiksi ja lisätty esitykseen `whitespace-pre-wrap`.
    - Alustettu `modelAnswer: ''` `useCaseEditor.ts`:n `addSlide('OPEN_TEXT')`-haarassa.

- [x] **1.4 Yhtenäistä Kyllä/Ei -sanamuodot**
  - **Prioriteetti:** Matala / Käytettävyys
  - **Tiedostot:** `client/src/i18n/locales/{fi,en,sv}.json`
  - **Ongelma:** Valinnoissa käytettiin yhdistelmämuotoa *"Kyllä / Tosi"* ja *"Ei / Epätosi"*, mikä oli kömpelöä tavallisissa kliinisissä kysymyksissä.
  - **Toimenpiteet:**
    - Päivitetty käännösavaimet `editor.yesTrue` ja `editor.noFalse` muotoon *"Kyllä"* / *"Ei"* (FI), *"Yes"* / *"No"* (EN) ja *"Ja"* / *"Nej"* (SV).

---

## 2. Kysymyslogiikka ja luokkatilanteen pedagoginen UX

- [x] **2.1 Toteuta Yksivalinta (Single choice) vs. Monivalinta (`allowMultiple`)**
  - **Prioriteetti:** Korkea (pedagoginen logiikka ja tilastot)
  - **Tiedostot:** `client/src/types.ts`, `server/src/types.ts`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/StudentView.tsx`, `server/src/index.ts`, `client/src/utils/sanitizer.ts`, `client/src/hooks/useCaseEditor.ts`, `data-description.md`
  - **Ongelma:** Opiskelija voi aina valita useita vaihtoehtoja, jolloin yksivalintakysymyksissä tulospalkkien summa ylittää 100 %. Editorissa ei voi valita, onko kyseessä yksi- vai monivalinta.
  - **Toimenpiteet:**
    - Lisätty `allowMultiple?: boolean` tyyppeihin `MultipleChoiceSlide`, `StudentPayload` ja `BroadcastPayload`.
    - **Oletuksena `allowMultiple: false` (yksivalinta):**
      - Editorissa oikea vastaus valitaan radiopainikkeella (vain yksi valinta).
      - Opiskelijanäkymässä uusi valinta korvaa edellisen, ja ohjeena lukee *"Yksivalinta (valitse yksi)"*.
      - Valkokankaalla tulospalkkien summa on tasan 100 %.
      - Backend varmistaa ja leikkaa vastauksen enintään 1 valintaan.
    - **Jos `allowMultiple: true` (monivalinta):**
      - Editorissa valintaruutu "Salli useampi valinta", jolloin useita vaihtoehtoja voi merkitä oikeaksi.
      - Opiskelija voi valita useita, ja ohjeena lukee *"Monivalinta – valitse kaikki sopivat"*.
      - Tulokset esitetään prosentteina vastaajien kokonaismäärästä.

- [x] **2.2 Suojaa avoimen tekstin vastaukset salissa ja lisää moderointi (OPEN_TEXT)**
  - **Prioriteetti:** Korkea (luokkatilanteen turvallisuus & vilpinesto)
  - **Tiedostot:** `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/TeacherView.tsx`, `client/src/hooks/useTeacherSession.ts`, `client/src/components/SlideRenderer.tsx`
  - **Ongelma:** Avoimen tekstin vastausten paljastus oli aiemmin peruuttamaton ja sidottu kiinteästi tilakoneeseen ilman mahdollisuutta sumettaa vastauksia takaisin peittoon.
  - **Toimenpiteet:**
    - Toteutettu reversiibeli esitystilan silmäkytkin (`Eye` / `EyeOff`), joka kytkee sumennuksen päälle tai pois kankaalla.
    - Lisätty silmäkytkin sekä vastausalueen kulmaan valkokankaalla (`SlideInteraction.tsx`) että opettajan sivupalkin toimintopainikkeeseen (`TeacherView.tsx`).
    - Pidetään vastaukset oletuksena sumennettuina vastausten saapuessa (antaa visuaalisen palautteen aktiivisuudesta).
    - Tilaa hallitaan diakohtaisesti (`openTextRevealed`), joten diojen välillä liikkuminen muistaa kunkin dian tilan.

- [x] **2.3 Korjaa mobiilivastaamisen vahinkopainallukset & tyhjät vastaukset**
  - **Prioriteetti:** Keskitaso (mobiili-UX)
  - **Tiedostot:** `client/src/views/StudentView.tsx`
  - **Ongelma:** Kyllä/Ei -vaihtoehdon hipaisu mobiilissa lähettää vastauksen heti ilman peruutusmahdollisuutta. Avoimessa tekstissä voi lähettää tyhjän vastauksen.
  - **Toimenpiteet:**
    - TRUE_FALSE: Valinta korostaa Kyllä/Ei -vaihtoehdon radiotyylisesti, ja vastaus lähetetään erillisestä *"LÄHETÄ VASTAUS"* -painikkeesta.
    - OPEN_TEXT: Estetty tyhjien ja pelkkiä välilyöntejä sisältävien vastausten lähettäminen (`disabled={!textAns.trim()}`) ja vastaus trimmataan lähetettäessä.

---

## 3. Kuvat ja tiedostojen käsittely (Editor & Assets)

- [x] **3.1 Korjaa kuvatiedostojen nimikollisio**
  - **Prioriteetti:** Keskitaso (datan eheys)
  - **Tiedostot:** `client/src/hooks/useCaseEditor.ts`, `client/src/utils/fileHelpers.ts`, `client/src/views/EditorView.tsx`
  - **Ongelma:** Kuvat tallennettiin suoraan käyttäjän tiedostonimellä (`[file.name]: file`). Jos kahteen eri diaan liitettiin eri kuvat, joilla on sama nimi (esim. `image.png`), jälkimmäinen korvasi edellisen.
  - **Toimenpiteet:**
    - Tallennusvaiheessa (`saveCaseToZip`) kuvat normalisoidaan ja tallennetaan suoraan dian mukaan (`slide1.png`, `slide2.jpg` jne.) sekä `case.json`:iin että zipin `images/`-hakemistoon.
    - Muokkausistunnossa kuvat erotellaan turvallisesti diakohtaisesti (`attachImageToSlide`), vanhat kuvat poistetaan korvattaessa, ja lisätty `removeImageFromSlide` sekä `deleteSlide`-siivous.

- [x] **3.2 Selaimen Object URL -muistivuotojen korjaus**
  - **Prioriteetti:** Keskitaso (muistinhallinta)
  - **Tiedostot:** `client/src/hooks/useCaseEditor.ts`, `client/src/utils/fileHelpers.ts`, `client/src/views/TeacherView.tsx`
  - **Ongelma:** `URL.createObjectURL()`-metodilla luotuja osoitteita ei vapautettu koskaan `URL.revokeObjectURL()`-kutsulla.
  - **Toimenpiteet:**
    - Lisätty apufunktio `revokeImageUrls` tiedostoon `fileHelpers.ts`.
    - Lisätty purkufunktiot (`useEffect` cleanup on unmount) sekä `useCaseEditor.ts`- että `TeacherView.tsx`-komponentteihin.
    - Vapautetaan vanhat osoitteet uutta tiedostoa ladattaessa, kuvaa poistettaessa tai korvattaessa ja esityksestä poistuttaessa.

- [x] **3.3 Tiedoston skeeman validointi ladattaessa**
  - **Prioriteetti:** Keskitaso (virheensieto)
  - **Tiedostot:** `client/src/utils/fileHelpers.ts`, `client/src/views/TeacherView.tsx`, `client/src/hooks/useCaseEditor.ts`
  - **Ongelma:** `loadCaseFromZip` ajoi `JSON.parse` suoraan tyyppipakotuksella. Korruptoitunut tiedosto kaatoi sovelluksen ilman selitystä.
  - **Toimenpiteet:**
    - Lisätty `validatePatientCase`-funktio, joka tarkistaa tapauksen metatiedot, dian tyypit, pakolliset kentät ja rakenteen.
    - Heitetään ja näytetään käyttäjälle selkeät virheilmoitukset puutteellisista tai epäkelvoista tiedostoista.

---

## 4. Backendin arkkitehtuuri, tietoturva ja vikasietoisuus

- [x] **4.1 Korjaa palvelimen jumiutuminen ikuiseen silmukkaan (Kriittinen DoS) & vakioi rajat**
  - **Prioriteetti:** Kriittinen (palvelimen vakaus)
  - **Tiedostot:** `server/src/index.ts`, `client/src/hooks/useTeacherSession.ts`, `client/src/views/TeacherView.tsx`
  - **Ongelma:** Huonekoodin arvonnassa `while (rooms.has(roomId))` pyöri ilman yrityskertalaskuria tai aktiivisten huoneiden maksimimäärää. Huoneiden kertyessä palvelimen prosessi jumiutui 100 % CPU:lle ja kaatui. Koodissa oli useita nimeämättömiä taikalukuja.
  - **Toimenpiteet:**
    - Määritelty nimetyt vakiot: `MAX_ACTIVE_ROOMS`, `MAX_ROOM_CREATION_ATTEMPTS`, `MAX_OPTIONS_COUNT`, `MAX_OPTION_TEXT_LENGTH`, `MAX_ANSWER_TEXT_LENGTH`, `ANSWERS_BATCH_INTERVAL_MS`, `TEACHER_RECONNECT_GRACE_PERIOD_MS`.
    - Tarkistetaan huonemaksimi `CREATE_ROOM`-kutsussa: jos raja ylittyy, palautetaan virhe eikä luoda uutta huonetta.
    - Rajoitettu `while`-silmukka yrityskertoihin. Jos vapaata 4-numeroista koodia ei löydy, hylätään pyyntö virheellä.
    - Välitetään ja näytetään virheilmoitus opettajalle käyttöliittymässä.

- [x] **4.2 Tallenna opettajan Reconnection Token selaimeen (F5- ja selauspäivitystuki)**
  - **Prioriteetti:** Korkea (opetustilanteen vikasietoisuus)
  - **Tiedostot:** `client/src/hooks/useTeacherSession.ts`, `server/src/index.ts`, `client/src/views/TeacherView.tsx`
  - **Ongelma:** Palvelimella oli `teacherSecret`- ja `RECONNECT_TEACHER`-tuki, mutta asiakaspuolella tunnistetta säilytettiin vain väliaikaisessa `useRef`-muuttujassa. Sivun päivitys (F5) nollasi tilan ja huoneen hallinta menetettiin.
  - **Toimenpiteet:**
    - Määritelty vakio `TEACHER_SESSION_KEY = 'medcases_teacher_session'`.
    - Tallennettu `{ roomId, teacherSecret, caseId }` selaimen `sessionStorage`-muistiin huoneen luonnissa.
    - Sivun latautuessa tarkistetaan `sessionStorage`: jos avattuun tapaukseen liittyy aktiivinen huone, kytkeydytään automaattisesti takaisin (`RECONNECT_TEACHER`).
    - Palvelin kuittaa onnistuneen palautumisen (`TEACHER_RECONNECTED`) ja synkronoi aktiivisen dian.
    - Siivotaan `sessionStorage` kun opettaja päättää istunnon (`endSession`) tai poistuu esityksestä.

- [x] **4.3 Huoneiden elinkaari ja inaktiivisuusaikakatkaisu**
  - **Prioriteetti:** Keskitaso / Ylläpito
  - **Tiedostot:** `server/src/index.ts`, `server/src/types.ts`
  - **Ongelma:** Auki jätetyt ja unohdetut istunnot voivat roikkua muistissa loputtomiin.
  - **Toimenpiteet:**
    - Lisätty `lastActivity`-aikaleima `RoomState`-tietorakenteeseen.
    - Päivitetään aktiivisuus huoneen luonnissa, dian vaihdossa, opiskelijan liittyessä ja vastauksissa.
    - Lisätty taustasiivous (`cleanupInactiveRooms`), joka tarkistaa 5 minuutin välein huoneet ja poistaa yli 60 minuuttia inaktiivisena olleet huoneet muistista.
    - Tyhjennetään `disconnectTimer` aina hallitusti myös `END_SESSION`-kutsussa.

---

## 5. Visuaalinen ilme, saavutettavuus ja luentosalikäytettävyys (WYSIWYG)

- [x] **5.1 Moderni typografia ja valkokankaan takariviluettavuus**
  - **Prioriteetti:** Korkea (luentosalin saavutettavuus)
  - **Tiedostot:** `client/src/index.css`, `client/index.html`, `client/tailwind.config.js`, `client/src/hooks/useResizeText.ts`, `client/src/components/slide/SlideBody.tsx`, `client/src/components/slide/SlideTitle.tsx`, `client/src/components/slide/SlideInteraction.tsx`
  - **Ongelma:** Käytössä oli oletusjärjestelmäfontti (`sans-serif`). `useResizeText` kutisti leipätekstin jopa `14px` kokoon, mikä oli luentosalin takariviltä täysin lukukelvoton.
  - **Toimenpiteet:**
    - Otettu käyttöön moderni, korkean x-korkeuden omaava kirjasinperhe (Inter).
    - Korjattu `useResizeText`: nostettu oletuskoko 36px:iin ja asetettu ehdoton takariviluettava alaraja (vähintään 24px leipätekstille; ei kutistu lukukelvottomaksi).
    - Parannettu otsikon, leipätekstin ja kysymysten kontrastia (`text-gray-900` ja `text-blue-950`) sekä riviväliä (`leading-relaxed`).

- [x] **5.2 Esitysnäkymän ja editorin 1:1 visuaalinen vastaavuus (WYSIWYG-kangas & taitettava sivupalkki)**
  - **Prioriteetti:** Korkea (opettajan valmistelukokemus ja luentosalikäytettävyys)
  - **Tiedostot:** `client/src/components/slide/SlideContainer.tsx`, `client/src/components/slide/SlideBody.tsx`, `client/src/components/slide/SlideTitle.tsx`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/EditorView.tsx`, `client/src/views/TeacherView.tsx`
  - **Ongelma:** Editorin yläpalkki ja näytön joustava venyminen aiheuttivat sen, että teksti rivittyi ja asettui eri tavalla editorissa kuin valkokankaalla. Lisäksi tyhjä kuvalohko pakotti tekstin 50 % leveyteen editorissa.
  - **Toimenpiteet:**
    - Toteutettu `SlideContainer`:iin dynaaminen 16:9 -esityskankaan kuvasuhdelukitus (`ResizeObserver`), joka varmistaa pikselintarkan 16:9 -esitysgeometrian riippumatta näytön koosta tai editorin yläpalkista.
    - Korjattu `SlideBody`: ilman kuvaa leipäteksti täyttää 100 % leveyden myös editorissa (+ Lisää kuva -painike yläkulmassa). Kuvan kanssa näkymä jakautuu automaattisesti 50/50 -tilaan molemmissa.
    - Yhdenmukaistettu `SlideTitle` ja `SlideInteraction` marginaalit ja tyhjän tilan käsittely.
    - Toteutettu taitettava sivupalkki (Collapse/Expand) ja täyden valkokankaan esitystila sekä `TeacherView`:ssa että `EditorView`:ssa.
    - Esitystilassa piilotetun sivupalkin korvaa yläoikean kulman leijuva ohjauspalkki (huonekoodi, opiskelijamäärä, QR-modaali, dianvaihtonapit vakiopaikoilla ja vastausten paljastus).
    - Lisätty esitykseen laiteohjaintuki / esitysklikkeri (nuolinäppäimet `←`/`→`, `PageUp`/`PageDown`, `Tab` sivupalkille).
    - Lisätty editoriin reaaliaikainen "Esikatselu / Muokkaa" -kytkin (`SlideRenderer`).

- [x] **5.3 Vastauspylväiden, tulosten ja oikean vastauksen korkeakontrastinen visualisointi**
  - **Prioriteetti:** Korkea (luentosalin näkyvyys & esteettömyys WCAG AA)
  - **Tiedostot:** `client/src/components/slide/SlideInteraction.tsx`, `client/src/i18n/locales/`
  - **Ongelma:** Monivalinnan vastauspylväs (`bg-blue-100 opacity-30`) oli videotykin valokeilassa lähes näkymätön. Oikean vastauksen erottelu pelkällä vihreällä ohuella reunuksella rikkoi WCAG 1.4.1 -kriteeriä (ei toiminut värisokeille).
  - **Toimenpiteet:**
    - Tulospalkit päivitetty erottuviksi ja teräväreunaisiksi (`border-r-4 border-blue-500` / `border-r-4 border-emerald-600` ja pehmeä `duration-1000 ease-out` -kasvuanimaatio).
    - Vastausprosenttimerkintä kasvatettu huomattavasti (`text-2xl lg:text-3xl font-black font-mono`) selkeällä kontrastilaatikolla.
    - Oikealle vastaukselle lisätty eksplisiittinen `CheckCircle2` -kuvake ja `OIKEA VASTAUS` -tekstitunnusmerkki (WCAG 1.4.1 -saavutettava).
    - Myös avoimen tekstin vastaukset ja mallivastaus päivitetty korkeakontrastisiksi.

- [x] **5.4 Lääketieteellisten kuvien Lightbox-suurennus (koko valkokankaan esitys)**
  - **Prioriteetti:** Keskitaso (kliininen pedagogiikka)
  - **Tiedostot:** `client/src/components/slide/SlideBody.tsx`, `client/src/i18n/locales/`
  - **Ongelma:** Röntgen- tai EKG-kuva vie vain pienen osan diasta eikä sitä voi zoomata, mikä tekee pienten yksityiskohtien havaitsemisesta takarivistä vaikeaa.
  - **Toimenpiteet:**
    - Toteutettu kuvalle klikattava täysikokoinen Lightbox-suurennustila esityksessä (`isLightboxOpen`), jolloin kuvaa voidaan tarkastella koko kankaan laajuisena (`max-w-[95vw] max-h-[92vh] object-contain`).
    - Lisätty leijuva suurennusvinkki ja zoom-kuvake kuvan päälle hover-tilassa esitystilassa.
    - Lisätty sulkemisnappi ja sulkeminen `Escape`-näppäimellä tai taustaa klikkaamalla.
    - Lisätty monikieliset käännökset (fi, en, sv).

- [x] **5.5 Mobiilivastaamisen (StudentView) ja komponenttityylien viimeistely**
  - **Prioriteetti:** Keskitaso (mobiili-UX & luentosalin yhtenäisyys)
  - **Tiedostot:** `client/src/views/StudentView.tsx`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/i18n/locales/`
  - **Ongelma:** Mobiilinäkymän kysymysteksti oli pientä (`text-lg`) ja visuaalinen ilme kaipasi modernisointia yhtenäisen design-järjestelmän mukaiseksi. Valkokankaan ja mobiilivastaamisen välillä oli epäyhtenäisyyttä mm. kysymystyyppien tunnisteissa ja vaihtoehtokirjaimissa.
  - **Toimenpiteet:**
    - Kasvatettu mobiilikysymysten kokoa ja vahvistettu kontrastia (`text-2xl sm:text-3xl font-extrabold text-blue-950`).
    - Yhdenmukaistettu kysymystyyppien tunnisteet (Monivalinta, Yksivalinta, Kyllä/Ei, Avoin tekstivastaus) valkokankaalle (`SlideInteraction.tsx`) ja mobiiliin (`StudentView.tsx`).
    - Lisätty vaihtoehtojen kirjaintunnisteet (A, B, C, D...) synkronoidusti sekä valkokankaalle (esitys- ja muokkaustila) että opiskelijoiden vastauskortteihin.
    - Suurennetut, ergonomiset kosketusalueet (`min-h-[64px]`), selkeät radio- ja valintaruututilat sekä taktiili painalluspalaute.
    - Uudistettu PIN-syöttö, odotustilat ja vastauksen lähetetty -vahvistuskortti saumattoman tyylikkääksi.

---

## 6. Kieli, symbolit, käytettävyysergonomia ja virheensieto

- [x] **6.1 Kielen ja typografian harmonisointi (toiston poisto & Sentence case)**
  - **Prioriteetti:** Korkea (käyttöliittymän ammattimaisuus ja selkeys)
  - **Tiedostot:** `client/src/i18n/locales/`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/StudentView.tsx`
  - **Ongelma:** Turhaa toistoa (esim. "Yksivalinta (valitse yksi)"), huutavaa ALL-CAPS -kirjoitusasua painikkeissa ja epäluontevia käännöksiä englanniksi ja ruotsiksi.
  - **Toimenpiteet:**
    - Karsittu tautologiat: valkokankaalta poistettu turhat yksivalintabannerit, monivalinnalle jätetty tarpeellinen opaste "Valitse kaikki sopivat".
    - Muutettu painikkeet ja toiminnot Sentence case -asuun ("Lukitse ja paljasta", "Lähetä vastaus", "Liity", "Avaa luokkahuone").
    - Luontevoitettu ja täydennetty FI-, EN- ja SV-käännökset kauttaaltaan.

- [x] **6.2 Käytettävyysergonomia ja pikanäppäimet (esitys & editori)**
  - **Prioriteetti:** Keskitaso (opettajan ergonomia)
  - **Tiedostot:** `client/src/views/TeacherView.tsx`, `client/src/views/EditorView.tsx`, `client/src/index.css`
  - **Toimenpiteet:**
    - Lisätty täyden ruudun kytkin (`Fullscreen`) esitystilan kelluvaan ohjauspalkkiin ja sivupalkkiin.
    - Lisätty esitystilaan `Space` / `Enter` -pikanäppäintuki vastausten paljastamiseksi ja `F` kokoruututilalle.
    - Lisätty editoriin `Ctrl+S` / `Cmd+S` -pikanäppäintallennus ja `Escape`-sulku valikoille.
    - Lisätty `touch-action: manipulation` poistamaan mobiililaitteiden 300 ms klikkausviive.

- [x] **6.3 Vikasietoisuus, verkkokatkokset ja virheiden lokalisointi**
  - **Prioriteetti:** Korkea (luentosalin luotettavuus)
  - **Tiedostot:** `server/src/index.ts`, `client/src/hooks/useStudentSession.ts`, `client/src/hooks/useTeacherSession.ts`, `client/src/utils/fileHelpers.ts`, `client/src/views/StudentView.tsx`, `client/src/views/TeacherView.tsx`, `client/src/hooks/useCaseEditor.ts`
  - **Toimenpiteet:**
    - Tallennetaan opiskelijan huonekoodi `sessionStorage`-muistiin, jolloin vahinkopäivitys (pull-to-refresh) tai F5 ei katkaise vastaamista.
    - Lisätty selkeä uudelleenyhdistysindikaattori verkkokatkoksen ajaksi.
    - Palvelimen ja tiedostovalidoinnin virheilmoitukset siirretty virhekoodeiksi ja lokalisoitu i18n-kieliavaimin (FI/EN/SV).

- [x] **6.4 Aloitusnäkymän brändäys, infomodaali ja opettajakorttien modernisointi**
  - **Prioriteetti:** Keskitaso (ensivaikutelma ja perehdytys)
  - **Tiedostot:** `client/src/views/LandingView.tsx`, `client/src/views/StudentView.tsx`, `client/src/i18n/locales/`
  - **Ongelma:** MedCases-nimi ja irrallinen stetoskooppilaatikko näkyivät vain opiskelijanäkymässä. Opettajatilasta puuttui brändäys ja toiminnot olivat sekavia erivärisiä palikoita. Sovelluksesta puuttui nopea perehdytysopaste ("Mikä tämä on?").
  - **Toimenpiteet:**
    - Tuotu yhtenäinen MedCases-brändiotsikko ja tunnus (`Activity`) pääsivun ylätunnisteeseen.
    - Poistettu opiskelijan PIN-kortista toistuva otsikko ja irrallinen stetoskooppisymboli.
    - Lisätty esteetön "Mikä MedCases on?" -infomodaali (`HelpCircle`), joka esittelee sovelluksen toiminnan opiskelijalle, opettajalle sekä yksityisyysperiaatteet (FI, EN, SV).
    - Modernisoitu opettajan toiminnot tyylikkäiksi, saavutettaviksi toimintokorteiksi selittein ja kuvakkein.

---

## 7. Tuotantovalmius, Deployment ja Dokumentaatio

- [x] **7.1 Tuotantovalmis Docker Compose, Caddy ja Automaattinen HTTPS**
  - **Prioriteetti:** Korkea (oppilaitosten IT-käyttöönotto)
  - **Tiedostot:** `docker-compose.yml`, `Caddyfile`, `.env.example`, `DEPLOYMENT.md`, `README.md`
  - **Toimenpiteet:**
    - Luotu tuotantovalmis `docker-compose.yml`, joka orkestroi MedCases-kontin ja Caddy 2 -välityspalvelimen.
    - Caddy hoitaa Let's Encrypt -SSL-sertifikaattien luomisen ja uusimisen automaattisesti ilman certbot-skriptejä.
    - Kirjoitettu kattava `DEPLOYMENT.md` mitoitusoppaineen (RAM, CPU, kaistanleveys), Nginx-esimerkkeineen ja IT-osaston GDPR/tietosuoja-tarkistuslistoineen.
    - Uudistettu ja ammattimaistettu `README.md` havainnollistavine arkkitehtuurikaavioineen ja pikaohjeineen.

---

## 8. Dian kanoninen skaalaus ja esitysmoottorin arkkitehtuuri

- [x] **8.1 Jaettu OptionCard-komponentti ja z-indeksi/vuotokorjaus**
  - **Prioriteetti:** Korkea (esitystilan ja editorin yhtenäisyys)
  - **Tiedostot:** `client/src/components/slide/OptionCard.tsx`, `client/src/components/slide/SlideInteraction.tsx`
  - **Toimenpiteet:**
    - Eristetty vastausvaihtoehdon kortti omaksi jaetuksi komponentiksi `OptionCard.tsx`.
    - Korjattu prosenttiluvun vuotaminen asettamalla `overflow-hidden` ja `min-w-0 flex-1 break-words`.
    - Korvattu häiritsevä täyskorkea taustapalkki siistillä kortin alareunan 10 px mittaripalkilla (Option B).

- [x] **8.2 Kanoninen virtuaalikangas (Canonical Canvas 1920x1080) ja täysi WYSIWYG-skaalaus**
  - **Prioriteetti:** Korkea (luentosalitekniikka, vanhat projektorit ja editori pienessä ikkunassa)
  - **Tiedostot:** `client/src/components/slide/SlideContainer.tsx`, `client/src/components/slide/SlideBody.tsx`, `client/src/components/slide/SlideInteraction.tsx`
  - **Toimenpiteet:**
    - Määritetty 1920x1080 kanoninen standardiresoluutio diasisällölle.
    - Toteutettu `SlideContainer.tsx`:ssä automaattinen CSS `transform: scale(scale)` -vektoriskaalaus.
    - Korjattu kuvan fullscreen-lightbox käyttämään Reactin `createPortal`-toimintoa `document.body`:yn.
    - Poistettu vanhentunut JS-silmukkapohjainen `useResizeText`.
    - Järjestetty vastausvaihtoehdot selkeäksi gridiksi (2 saraketta), jotta pitkät kliiniset lauseet mahtuvat optimaalisesti.

- [x] **8.3 Opiskelija-terminologia, sliden siivous, jaettu Huomioita-kenttä ja esikatselun paljastus**
  - **Prioriteetti:** Keskitaso / Viimeistely
  - **Tiedostot:** `client/src/types.ts`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/EditorView.tsx`, `client/src/i18n/locales/`, `data-description.md`
  - **Toimenpiteet:**
    - Poistettu turha toistava "Piilota/Paljasta vastaukset" -painike suoraan valkokankaan diasta.
    - Korvattu termi "oppilas" sanalla "opiskelija" kielitiedostoissa.
    - Tarkennettu mallivastauksen ja selitysten opasteita ("paljastetaan valkokankaalle vastauksen yhteydessä").
    - Lisätty `explanation`-kenttä kaikkiin kysymystyyppeihin (Monivalinta, Kyllä/Ei, Avoin kysymys) WYSIWYG-filosofiaa noudattaen: huomaamaton lisäyspainike, visuaalinen "NÄKYY VASTA PALJASTETTAESSA" -kehys ja automaattinen `💡 Huomioita / Selitys` -laatikko paljastuksen yhteydessä.
    - Piilotettu "Odotetaan vastauksia..." -teksti avoimessa kysymyksessä, kun vastaukset on jo paljastettu.
    - Lisätty editorin esikatseluun live-paljastustesti (`Space` tai kelluva kytkin).

- [x] **8.4 Jaettu SlideNotes-komponentti, Huomioita-terminologia ja esikatselun reaaliaikainen simulaatio**
  - **Prioriteetti:** Keskitaso / Viimeistely
  - **Tiedostot:** `client/src/components/slide/SlideNotes.tsx`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/EditorView.tsx`, `client/src/i18n/locales/`
  - **Toimenpiteet:**
    - Karsittu toistavat selitelaatikot: pidetty vain selkeä `👁️ NÄKYY VASTA VASTAUSTEN PALJASTUTTUA` -tunniste ja puhdas "Huomioita"-otsikko ilman sulkulausekkeita.
    - Yhtenäistetty terminologia kauttaaltaan: kaikissa kysymysmuodoissa aina "Huomioita", luovuttu erillisestä sanasta "Mallivastaus".
    - Luotu erillinen jaettu komponentti `SlideNotes.tsx`, joka yhdenmukaistaa ulkoasun ja lämpimän huomiovärin (`bg-amber-50/80 border-amber-300`) kaikkiin kysymystyyppeihin.
    - Rakennettu editorin esikatselutilaan luentosalisimulaatio: monivalinnassa/kyllä-ei:ssä generoidaan realistiset äänet prosenttipalkkien ja vihreän oikean vastauksen animoimiseksi, ja avoimessa kysymyksessä vastaukset ilmestyvät porrastetusti dynaamisilla viiveillä.

- [x] **8.5 Painiketekstien siivous (tuplaplussien poisto) ja Lorem ipsum -esimerkit esikatseluun**
  - **Prioriteetti:** Viimeistely / UX
  - **Tiedostot:** `client/src/i18n/locales/`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/views/EditorView.tsx`
  - **Toimenpiteet:**
    - Poistettu kirjoitettu `+`-merkki käännöksistä (`addNotes`, `addOption`, `addImage`), jolloin kuvakkeen kanssa ei synny tuplamerkintää (`+ + Lisää`).
    - Lisätty yhtenäinen `<Plus size={20} />` -kuvake "Lisää vaihtoehto" -painikkeeseen.
    - Vaihdettu avoimen kysymyksen esikatselun dummy-tekstit lääketieteellisistä termeistä neutraaleihin Lorem ipsum -fraaseihin.

- [x] **8.6 Editorin yläpalkin poisto, toimintojen integrointi sivupalkkiin ja uuden dian lisäyspainikkeen siirto**
  - **Prioriteetti:** Keskitaso / UX & Ergonomia
  - **Tiedostot:** `client/src/views/EditorView.tsx`
  - **Toimenpiteet:**
    - Poistettu editorin erillinen yläpalkki ja staattinen "MEDCASES EDITOR" -otsikko vapauttaen merkittävästi pystytilaa 16:9-esityskankaalle.
    - Siirretty ja yhdistetty toiminnot (Home, Avaa, Tallenna, Esikatselu, Sivupalkin sulkeminen) oikean sivupalkin eleganttiin ja selkeään yläpalkkiin.
    - Poistettu ahdas sulkemisnappi tapauksen nimen kentästä ja selkeytetty tapauksen nimen muokkausta.
    - Siirretty "+ Uusi dia" -painike ruudun alalaidasta suoraan viimeisen dian perään dialistassa ja lisätty ulkopuolisen klikkauksen tunnistava alasvetovalikko.
    - Lisätty sivupalkin ollessa suljettuna tyylikäs kelluva ohjauspalkki (Home, Avaa, Esikatselu, Tallenna, Avaa sivupalkki), jolloin täyden ruudun tilassa kaikki työkalut säilyvät vaivattomasti käden ulottuvilla.

- [x] **8.7 Korjattu esikatselutilan kaatuminen (valkoinen ruutu) ja lisätty ErrorBoundary**
  - **Prioriteetti:** Kriittinen / Vakaus
  - **Tiedostot:** `client/src/views/EditorView.tsx`, `client/src/components/slide/SlideInteraction.tsx`, `client/src/components/ErrorBoundary.tsx`, `client/src/App.tsx`
  - **Ongelma:** Esikatselun dummy-simulaatio kaatui `TypeError: Cannot read properties of undefined (reading 'id')` -virheeseen, jos monivalintakysymyksessä ei ollut vielä yhtäkään vaihtoehtoa merkitty oikeaksi (`correctOpts.length === 0`). Virhe kaatoi koko React-puun valkoiseksi ruuduksi ilman virherajaa.
  - **Toimenpiteet:**
    - Korjattu `EditorView.tsx`:n esikatselun ääntenjakologiikka jakamaan äänet turvallisesti kaikille vaihtoehdoille, jos oikeaa vastausta ei ole valittu.
    - Lisätty defenssiiviset `undefined`- ja `filter(Boolean)` -suojaukset `SlideInteraction.tsx`:n vaihtoehtoihin ja `getPercentage`-laskentaan.
    - Luotu koko sovelluksen kattava `ErrorBoundary`-komponentti estämään valkoisen ruudun tilanteet ja tarjoamaan selkeä toipumisnäkymä.

- [x] **8.8 Yhtenäinen Modal-komponentti, tallennuskuittauksen uudistus ja automaattinen poistuminen koko näytöstä**
  - **Prioriteetti:** Korkea / UX & Käytettävyys
  - **Tiedostot:** `client/src/components/common/Modal.tsx`, `client/src/context/UIContext.tsx`, `client/src/views/EditorView.tsx`, `client/src/views/TeacherView.tsx`, `client/src/views/LandingView.tsx`, `client/src/i18n/locales/`
  - **Toimenpiteet:**
    - Luotu keskitetty ja saavutettava `Modal`-komponentti (`client/src/components/common/Modal.tsx`), joka tarjoaa yhtenäisen taustasumennuksen (`backdrop-blur-sm`), pehmeät animaatiot, `Esc`-sulkeutumisen ja taustarullauksen lukituksen.
    - Korvattu editorin häiritsevä alakulman toast-ilmoitus ja 5 sekunnin pakkoulosheitto rauhallisella, keskitetyllä tallennusdialogilla ("Jatka muokkausta" ja "Palaa päävalikkoon").
    - Kytketty `UIContext` (`showAlert` ja `showConfirm`), opettajan QR-koodi-ikkuna sekä etusivun infoikkuna käyttämään samaa `Modal`-komponenttia.
    - Lisätty opettajan esitysnäkymään automaattinen koko näytön tilasta (`exitFullscreen`) poistuminen istunnon päättyessä tai näkymästä poistuttaessa.

- [x] **8.9 Esteettinen hienosäätö: Lucide-nuolet, pyöristysten harmonisointi, smaragdivärit ja sävyvarjot**
  - **Prioriteetti:** Viimeistely / Estetiikka
  - **Tiedostot:** `client/src/views/TeacherView.tsx`, `client/src/views/StudentView.tsx`, `client/src/views/LandingView.tsx`, `client/src/views/EditorView.tsx`, `client/src/components/slide/OptionCard.tsx`, `client/src/components/slide/SortableSlideItem.tsx`, `client/src/i18n/locales/`
  - **Toimenpiteet:**
    - Korvattu raa'at unicode-nuolimerkit (`←`, `→`) kielitiedostoista puhtailla Lucide-kuvakkeilla (`ChevronLeft`, `ChevronRight`).
    - Korvattu TeacherView'n vanhat 4 px kulmat (`rounded`) modernilla `rounded-xl` -muotoilulla ohjauspainikkeissa (edellinen/seuraava, paljastus ja lopetus).
    - Lisätty "Lopeta istunto" -painikkeeseen esteettinen `LogOut`-kuvake ja pehmeä punainen sävytyyli.
    - Yhtenäistetty kaikki vihreät korostukset puhtaaseen `emerald`-palettiin (poistettu hajanaiset `green-400`/`green-500`-luokat).
    - Kalibroitu kuvakkeiden viivanpaksuudet: poistettu ylikorostetut `stroke-[3]` -määritykset ja vakioitu `stroke-[2.5]` merkeille.
    - Lisätty päänappeihin modernit sävyvarjot (`shadow-blue-600/25`, `shadow-emerald-600/25`, `shadow-purple-600/30`).

- [x] **8.10 Aloitusnäkymän uudistus: yhtenäinen sijoittelu, liukuva roolipilleri ja visuaalinen syvyys**
  - **Prioriteetti:** Keskitaso / UX & Estetiikka
  - **Tiedostot:** `client/src/views/LandingView.tsx`, `client/src/views/StudentView.tsx`
  - **Ongelma:** Opiskelijan huonekoodikortti ja opettajan toimintovalikko kelluivat keskellä tyhjää ruutua kaukana roolisäätimen alapuolella päällekkäisten `flex-1`- ja `justify-center`-määrittelyjen vuoksi. Roolin vaihdosta puuttui sulava siirtymä, tausta oli steriili tasaharmaa, ja opettajan kortissa oli tarpeeton toistava otsikko.
  - **Toimenpiteet:**
    - Sidottu roolisäädin ja aktiivinen kortti yhteen kiinteään ylä-ankkuroituun sarakkeeseen (`max-w-md w-full pt-8 sm:pt-14 gap-5`), poistaen epäluonnollisen suuren tyhjän tilan sliderin ja kortin välistä.
    - Rakennettu roolisäätimeen sulavasti liukuva taustapilleri (`RoleSlider`, `transition-all duration-300 ease-out`), jossa sininen ja violetti korostus liukuu saumattomasti tilan vaihtuessa.
    - Poistettu opettajan kortista redundantti "Opettajan toiminnot" -otsikko; kolme selkeää toimintopainiketta asettuvat suoraan kortin kärkeen.
    - Harmonisoitu opiskelijan huonekoodikortin mitat ja muotoilu vastaamaan täsmälleen opettajan korttia (`w-full`, `rounded-3xl`, `shadow-xl shadow-slate-200/60`, `animate-fade-in`), säilyttäen selkeä vakiintunut terminologia ("Huonekoodi").
    - Lisätty hienovarainen lääketieteellisen moderni taustaliukuväri (`from-slate-50 via-blue-50/20 to-slate-100/60`) ja pehmeä valokehä (`ambient glow blur`).
    - Lisätty käyttäjän roolivalinnan pysyväismuisti (`localStorage` avaimella `medcases_selected_role`): ensikertalaiselle oletus on opiskelija, mutta opettajan läppärillä valinta muistetaan pysyvästi ilman uudelleenvalintaa.

- [x] **8.11 Työkalujen siirtymien uudistus: moderni tiedostonavaus, suora esityksen aloitus ja monitapauksisuus samalla huonekoodilla**
  - **Prioriteetti:** Korkea / UX & Opetustilanteen jatkuvuus
  - **Tiedostot:** `client/src/components/common/CaseFileDropzone.tsx`, `client/src/components/common/FilePickerView.tsx`, `client/src/components/common/LanguageSlider.tsx`, `client/src/views/TeacherView.tsx`, `client/src/views/EditorView.tsx`, `client/src/views/LandingView.tsx`, `client/src/hooks/useTeacherSession.ts`, `server/src/index.ts`, `client/src/i18n/locales/`
  - **Ongelma:** Olemassa olevaa tiedostoa avattaessa näkymä oli karu harmaa ikkuna irrallisella nurkkapainikkeella. Esitysmoodiin siirryttäessä vastaan tuli synkkä umpikujaruutu ("Avaa huone") ilman peruutusmahdollisuutta. Lisäksi jokainen uusi tapaus vaati uuden huonekoodin ja opiskelijoiden uudelleenliittymisen.
  - **Toimenpiteet:**
    - Luotu jaettu, moderni `FilePickerView`- ja `CaseFileDropzone`-komponentti: sisältää täyden MedCases-yläpalkin ("Etusivulle"-painike, brändi, kielivalitsin), hienovaraisen gradienttitaustan sekä houkuttelevan Drag & Drop -pudotusalueen.
    - Poistettu TeacherView'n synkkä "Avaa huone" -välinäyttö: huone luodaan automaattisesti socket-yhteyden kytkeytyessä, ja esityskangas aukeaa välittömästi ensimmäiseen diaan samalla kun sivupalkki kytkee PIN- ja QR-koodit.
    - Toteutettu monitapauksisuus samalla huonekoodilla (`switchCase`): opettaja voi vaihtaa seuraavaan `.medcase`-tiedostoon suoraan esityksen sivupalkista. Huonekoodi ja kaikki liittyneet opiskelijat säilyvät salissa, ja palvelimen vastausmuisti nollataan puhtaasti uutta tapausta varten (`CLEAR_ROOM_ANSWERS`).
    - Karsittu tiedostonvalintanäkymän tekstit: poistettu toistavat alaotsikot ja ylimääräiset muotoviittaukset pitäen näkymä minimalistisen puhtaana (.medcase-tiedostot).
    - Selkeytetty etusivun esitystoiminto: "Esitä potilastapauksia" (kuvaus: "Avaa esitys valkokankaalle. Voit käsitellä useita tapauksia samalla huonekoodilla."), viestien selkeästi ja luontevasti useamman tapauksen esittämisen saman huonekoodin alla. Poistettu myös tiedostonvalinnan yläkulmasta tarpeeton tuplapainike.
    - Yhdenmukaistettu yläpalkki uudella `AppHeader`-komponentilla: aloitusnäkymä ja tiedostonvalinta jakavat identtisen logon koon, typografian, taglinen ja kieliliukurin ilman visuaalista hyppimistä, piilottaen valintanäkymässä vain infopainikkeen.
    - Hienosäädetty esityssession otsikointi elinkaaren mukaan: aloituksessa "Valitse ensimmäinen potilastapaus" ja esityksen aikana sivupalkissa sekä vaihtomodaalissa "Valitse seuraava potilastapaus".
