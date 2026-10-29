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
