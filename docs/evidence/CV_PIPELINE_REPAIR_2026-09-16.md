# CV-alapú Job Hunter – javítási és átadási napló

## Felhasználói forrás

Belinszki János megadott önéletrajza: Nyíregyházi Egyetem, programtervező
informatikus, 2005–2008; több mint 20 év IT-tapasztalat; 2021-től 6 fős
IT-csapat vezetése, infrastruktúra, projektek, költségvetés és beszerzési
előkészítés. Két elvégzett online képzés: AI vállalati bevezetés (2026-07-19),
MS Copilot alapok (2026-08-04). A megadott adatokból nem következik pontos
BSc/MSc-fokozat, angol CEFR-szint vagy a tanúsítványok akkreditációja.
A telefonszámot és e-mail-címet nem másoltuk a szakmai profilfájlba.

## Elvégzett helyi javítások

1. A futtató betölti és átadja a CV-ből rögzített tényeket a közös
   hirdetésértékelőnek; a bizonyíték nélküli profilbetöltés hibát jelez.
2. Nincs diploma miatti automatikus kizárás. A végzettséget külön,
   tájékoztató mező mutatja.
3. A különírt „IT szolgáltatás menedzser” cím is felismerhető.
4. A hibrid projektmódszertan és hibrid technológia nem bizonyít otthoni
   munkavégzést; lejárt érvényességű hirdetés nem aktuális ajánlat.
5. Javított angol követelményfelismerés: például „fluent in English”,
   „English - strong verbal and written communication skills”, középszintű
   és társalgási angol. Az előnyként említett követelmény nem azonos a kötelezővel.
6. Az azonos munkáltató/cím korábbi PO-elutasítása az eredeti indokkal
   megmarad; nem kerül az alapértelmezett jelöltlistába, de auditálható.
7. SAP, Kubernetes és más speciális készségek nem következnek az ERP-,
   Docker- vagy AI-tanfolyami háttérből; bizonyítatlanságukat a riport jelzi.
8. A teljes futás automatikusan elkészíti a HTML- és Markdown-riportot is,
   ugyanahhoz a változatlan JSON-pillanatképhez kapcsolva.
9. Hiányzó SerpApi-kulcs esetén a közvetlen Profession-keresés működőképes
   marad. Nem küldünk hamis helyettesítő kulcsot; a lefedettségcsökkenés látható.
10. A SerpApi-kéréseknek 30 másodperces időkorlátjuk van; a sikeres és hibás
    lekérdezések külön szerepelnek a futási bizonyítékban.
11. A böngészőben visszatöltött elutasítás szűrése és a hibás/tiltott
    localStorage kezelése javítva. A „Mentés” felirat egyértelműen csak
    böngészőbeli tárolást jelent, nem automatikus profilfrissítést.
12. A GitHub munkafolyamat helyi definíciója ugyanazt a riportkészítőt
    használja, hibás futás után nem publikálja újként a régi eredményt,
    és a teljes determinisztikus tesztkészletet futtatja.

Ez javításcsoportok felsorolása, nem annak bizonyítása, hogy a rendszerben
nincs több hiba. A pontozás szabályalapú; az általános vezetői kulcsszavak
nem bizonyítanak minden speciális szakmai feltételt.

## Ellenőrzés

- 109 tesztből 108 sikeres, 1 kihagyott, 0 hibás.
- Node-szintaktika, cron-wrapper shell-szintaktika, YAML-feldolgozás és
  `git diff --check`: sikeres. Ez nem távoli GitHub Actions-futás.
- Korábbi célzott v2 ellenőrzés: 42 élő hirdetés, 39 pontozott, 3 erős
  angolkövetelmény miatt kizárt, 0 elérési hiba. A 16 alapértelmezett
  bejegyzés nem 16 kézzel jóváhagyott vagy biztosan egyedi ajánlat.
- Új, teljes, CV-alapú keresés: befejezve 2026-09-16 20:24:27 UTC-kor;
  a részletes eredmény a napló végén.

## Meglévő automatizmus

2026-09-16-i ellenőrzés: a felhasználói crontabban aktív a hétfő/csütörtök
08:00-kor futó Job Hunter-bejegyzés; `cron.service` aktív. A gép időzónája
Etc/UTC. A sor és az ütemezés nem módosult. Következő esedékes időpont:
2026-09-17 08:00 UTC. A wrapper az itt javított helyi `run.mjs` fájlt indítja.

## Megmaradt korlátok

- A kód és a profil helyi módosítás. Nem történt GitHub-push vagy kulcsfeltöltés.
- A böngészőgombok döntései nem szinkronizálódnak automatikusan a keresőbe.
- Nincs automatikus e-mail, értesítés vagy állásjelentkezés.
- A cégnév-/címaliasok nem teljes körűek; maradhat duplikáció vagy fel nem
  ismert korábbi döntés. Nem általánosítunk egy állás elutasításából minden
  munkáltatóra vagy városra vonatkozó tiltást.
- Speciális iparági tapasztalat, pontos vezetői időtartam, nyelvi megfelelés,
  tényleges bejárás és juttatások egyedi ellenőrzést igényelnek.
- Az EN-CO kontrollhirdetés keresőtalálatként megjelent, de a közvetlen
  200-as HTTP-válaszban nem volt kinyerhető JobPosting-adat. Ez nem igazolja
  sem a hirdetés aktivitását, sem a lezárását; nem lett ajánlatként betoldva.

## Befejezett teljes futás – 2026-09-16 20:24:27 UTC

[Változatlan forrás](job-hunter-runs/2026-09-16T20-24-27-620Z.json)
· [Böngészhető eredmény](current-cv-results.html)
· [Aktuális összefoglaló](../../CURRENT_RESULTS.md)

- 764 igazolt hirdetésoldal, nem 764 különböző állás.
- 41 pontozott, deduplikált bejegyzés; 688 kizárási bejegyzés; 86
  nem elérhető vagy nem igazolható oldal. A fennmaradó eltérés a deduplikáció.
- 19 küszöb feletti bejegyzésből 1 korábban elutasított; 18 ellenőrizendő
  bejegyzés az alapértelmezett listában, nem 18 jóváhagyott állás.
- Nulla diploma miatti kizárás. Minden pontozott és kizárt rekord ugyanazt
  az ellenőrzött CV-forráshasht tartalmazza, mint a betöltött profil.
- SerpApi: 16 sikeres lekérdezés, 1 időtúllépés. Közvetlen Profession:
  117 hirdetéslink, 1 keresőoldal HTTP 404. A keresési lefedettség nem teljes.
- Pillér és Swiss Medical elérte a pontozást és látható. EN-CO:
  NOT_ACQUIRED; a teljes kontrollhirdetés-készletre nem állítunk PASS-t.
- Az élő futás automatikusan elkészítette a HTML- és Markdown-riportot.
  Ezután a frissített böngészőállapot-kezeléssel újrageneráltuk a megjelenítést,
  új letöltés vagy az eredeti pillanatkép módosítása nélkül.
- A forráspéldány változatlansága, a CV-hash, a riporthivatkozások létezése,
  a Pillér megjelenése és a Deloitte alaplistából kimaradása ellenőrizve.
- A kód-, YAML-, shell- és diff-ellenőrzések sikeresek; 108 sikeres teszt,
  1 kihagyott. A távoli GitHub-kódot és hitelesítő adatokat nem módosítottuk.

## További kézi értékelés a teljes futásból

### WHC – Rendszermérnök csoportvezető

[Hirdetés](https://hu.linkedin.com/jobs/view/rendszerm%C3%A9rn%C3%B6k-csoportvezet%C5%91-at-whc-ltd-4453597605)

Budapest; rendszermérnöki csapat vezetése, központi IT-infrastruktúra
üzemeltetésének és fejlesztésének felügyelete, IT-beszerzés és riportolás.
Legalább 5 év szakmai és 2 év vezetői tapasztalatot, Microsoft-ismeretet,
középszintű angolt, B jogosítványt és aktív vezetést kér.
Az önéletrajzhoz szakmailag érdemben kapcsolódik. A magas rendelkezésre
állású/hibatűrő rendszerekkel szerzett gyakorlat, az angol megfelelés,
az aktív vezetés és a pontos bejárás külön ellenőrizendő.
Ez asszisztensi értékelés, nem a felhasználó APPLY döntése.

### HumanField – IT Manager: nem elsődleges ajánlás

[Hirdetés](https://www.profession.hu/allas/it-manager-humanfield-kft-3003207)

Új hirdetés a teljes futásban, Hajdú-Bihar megyei gyártóvállalati szerep.
SAP-ismeretet, gyártási IT-hátteret és aktív angolt kér; a megvizsgált
szövegben hibrid lehetőség nem szerepel. Az infrastruktúra- és csapatvezetés
kapcsolódik a CV-hez, de a távolság, az SAP és az aktív angol miatt nem
elsődleges ajánlás. Nem lett új általános helyszín- vagy SAP-tiltás.

További konkrét korlát: az összeragasztott szavakat tartalmazó forrásszöveg
(`tapasztalatSAP`) miatt az automatikus specialista-készségjelzés ennél a
hirdetésnél nem ismerte fel az SAP-t. A kézi értékelés ezt rögzíti;
az automatikus „nincs jelzett hiány” nem jelenti az összes feltétel teljesülését.
