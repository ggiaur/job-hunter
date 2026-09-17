# Ellenőrzött állásjelöltek – 2026. szeptember 16.

## Legutóbbi frissítés: 2026-09-16 20:06 UTC

Az alábbi korábbi ellenőrzési naplót megőrizzük. Az aktuális futás a
[v2 jelentés](cv-review-2026-09-16-v2.html): 42 élő lekérés, 39 pontozott,
3 erős angolkövetelmény miatti kizárás, 0 elérési hiba. A 17 legalább
60 pontos bejegyzésből a korábban elutasított Deloitte nem alapértelmezett
jelölt; a maradó 16 bejegyzés nem 16 kézzel jóváhagyott vagy biztosan egyedi állás.
A jelenlegi tesztállapot 100 sikeres, 1 kihagyott, 0 hibás.

A teljes keresés korábbi helyi futása is befejeződött: a 09:18-as pillanatkép
41 pontozott eredményt tartalmazott. A CV-s futások ennek jelöltjeit és az
EURO ONE hirdetését ellenőrizték újra; ez nem új, teljes piaci keresés.

További ellenőrzött lehetőség:
[BECK AND PARTNERS – IT igazgató](https://www.profession.hu/allas/it-igazgato-beck-and-partners-kft-budapest-2996778).
A közvetített budapesti partnercégnél 6 fős IT-csapat, stratégia, beszerzés és
költségvetés tartozik a szerephez. Heti 1 nap home office; legalább középfokú,
külföldi partnerekkel ténylegesen használt angol; legalább 5 év vezetői tapasztalat.
A CV 2021-es vezetői kezdete nem ad hónapot, ezért az öt teljes év külön
ellenőrizendő. A JSON-LD `remote/telecommute` helyszíne nem jelent teljes távmunkát:
a szöveg budapesti csapatot és heti egy otthoni napot ír.

A Pillér és Swiss Medical hirdetése a v2 élő ellenőrzéskor is elérhető volt.
A diploma, a két tanúsítvány, a módszertani „hibrid” és a munkarend
szétválasztása most már a közös feldolgozási útban is érvényesül.

## Korábbi ellenőrzési napló

Kézi ellenőrzés a nyilvános hirdetések alapján. Ez a lista nem automatikus
elfogadási jelentés: a szakmai illeszkedés bizonytalanságait külön jelzi.
A hirdetések az ellenőrzéskor elérhetők voltak és jelentkezést kínáltak;
a munkáltató tényleges felvételi státuszát külön nem erősítette meg.
A megvizsgált szövegekben konkrét alapbér nem szerepelt.

## PO-pontosítás és visszaemelt ajánlatok

A felhasználónak van diplomája. A diplomaelvárás miatti korábbi automatikus
kizárás téves volt; a helyi kódból eltávolítottuk. Nem jelentkezési akadály
önmagában az, hogy egy munkáltató diplomát kér.

### Pillér Nonprofit Kft. – Projektmenedzser

[Hirdetés](https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550)

- Budapest; konkrét hibrid munkarendet a megvizsgált hirdetés nem rögzít.
- Informatikai projektek tervezése és vezetése, erőforrás-, határidő- és
  kockázatkezelés, több szakterület koordinációja, döntés-előkészítés.
- Felsőfokú végzettséget és 3–5 év projektmenedzsment-tapasztalatot kér.
- A társalgási angol csak előny; a fejléc szerint nyelvtudás nem kötelező.
- Illeszkedés: a profilban korábban kifejezetten kedvelt IT-projektvezetői minta.
- Ellenőrizendő: konkrét munkarend, ingázás és fizetés.
- PO döntés: még nincs.

### Swiss Medical Services – Projektmenedzser, IT területen

[Hirdetés](https://www.profession.hu/allas/projektmenedzser-it-teruleten-swiss-medical-services-kft-budapest-2976894)

- Budapest XII. kerület, Győri út 20.; helyszíni munkavégzés.
- Informatikai rendszerfejlesztési és bevezetési projektek, külső fejlesztők
  koordinációja, költségvetés, ütemezés, kockázatok és projektlezárás.
- Középfokú angol; legalább három év IT-projektkoordinációs vagy vezetői tapasztalat.
- Illeszkedés: intézményi digitális rendszerek, IT-projektek és beszállítói koordináció;
  SQL-ismeret előny.
- Ellenőrizendő: agilis szoftverfejlesztési tapasztalat és a napi budapesti bejárás.
- PO döntés: még nincs.

### EURO ONE – IT szolgáltatás menedzser

[Hirdetés](https://www.profession.hu/allas/it-szolgaltatas-menedzser-euro-one-szamitastechnikai-zrt-budapest-2989032)

- Budapest XIV. kerület, Újvilág utca 50–52.; hibrid munkavégzés.
- Üzemeltetési szerződések, feladatok és változások koordinációja,
  ügyfélkapcsolat és havi teljesítések követése.
- Középfokú angol, angol kommunikáció és IT-szókincs; szakirányú felsőfokú végzettség.
- Illeszkedés: IT-üzemeltetés, szállítói/ügyfélkapcsolatok és koordináció.
- Ellenőrizendő: jelentős adminisztráció, közvetlen csapatvezetés nem igazolt;
  a végzettség szakirányának megfelelése nem ellenőrzött.
- PO döntés: még nincs.

### Javítás ellenőrzése

- A teljes helyi unit- és megjelenítési tesztkészlet: 86 sikeres, 1 kihagyott,
  0 hibás teszt.
- Közvetlen élő HTTP-lekéréssel és a javított pontozással a Pillér és Swiss
  Medical hirdetése is újra láthatóként szerepel. A strukturált érvényesség
  Pillérnél 2026-10-02, Swiss Medicalnél 2026-09-17.
- A javítás előtti további pontatlanság: a Pillér hirdetésében a hibrid
  projektmódszertan említését a program hibrid munkavégzésként pontozza.
  A kézi ismertetés ezért nem állít hibrid munkarendet, és nem használja
  ajánlási bizonyítékként az automatikus százalékot.
- Az EURO ONE különírt „szolgáltatás menedzser” címe a javítás előtti címillesztésen
  fennakadt; a javított címillesztés már felismeri. Az önéletrajz bekötésekor
  a hibrid módszertan félreértését és a lejárati dátum kezelését is javítottuk,
  regressziós tesztekkel.
- A teljes többforrásos újrafuttatást a javított diploma-szabállyal elindítottuk.
  Egy regionális SerpApi-lekérés HTTP 503 hibával végződött; a többi keresés
  adott találatot. Ez a bejegyzés nem állít befejezett teljes futást.

## 1. 2Connect Hungary – Vezetékes hálózatfelügyeleti csoportvezető

[Hirdetés](https://hu.linkedin.com/jobs/view/vezet%C3%A9kes-h%C3%A1l%C3%B3zatfel%C3%BCgyeleti-csoportvezet%C5%91-at-2connect-hungary-4461788288)

- Budapest, hibrid munkavégzés, heti három személyes irodai nap.
- Körülbelül 15 fős hálózatfelügyeleti csapat irányítása; kapacitástervezés,
  incidenskezelés, SLA/KPI, költségtervezés, automatizáció és AI alkalmazása.
- Legalább középszintű angol.
- Felsőfokú végzettség **vagy egyenértékű szakmai tapasztalat** elfogadott.
- Illeszkedés: tényleges csapatvezetés és infrastruktúra-üzemeltetés.
- Ellenőrizendő: többéves távközlési/NOC tapasztalat, szolgáltatói hálózati
  technológiák, 7×24 működés szervezése és vezetői készenlét vállalhatósága.
- PO döntés: még nincs.

Bizonyított programhiba a javítás előtti kódban: a `checkHigherEducationRequired` függvény
kötelező diplomának minősíti a hirdetés egyenértékű tapasztalatot is elfogadó
mondatát. Ezt az eredeti mondaton közvetlenül reprodukáltuk.
A felhasználó 2026-09-16-i pontosítása alapján a diploma miatti automatikus
kizárást teljesen eltávolítottuk a pontozásból; az elvárás tájékoztató jelzés,
pontlevonás nélkül. A korábbi diploma miatti kizárások nem elfogadott PO-szabályt tükröztek.

## 2. K&H – Application Middleware Platform Infrastructure Lead

[Hirdetés](https://hu.linkedin.com/jobs/view/application-middleware-platform-infrastructure-lead-at-k-h-csoport-4459695877)

- Budapest, IX. kerület, Lechner Ödön fasor 9.; 50% home office.
- Üzemeltetési csoport szakmai és operatív vezetése, feladattervezés,
  incidens- és változáskezelés, infrastruktúra-projektek támogatása.
- Legalább társalgási angol; a megvizsgált szövegben diplomaelvárás nem szerepel.
- Illeszkedés: infrastruktúra és tényleges csoportvezetés.
- Ellenőrizendő: Oracle WebLogic és OpenShift/Kubernetes szakmai ismeret;
  többműszakos működés és készenlét. Ezek megléte a tárolt profilból nem
  igazolható teljes körűen.
- PO döntés: még nincs.

## 3. Indotek Group – Projektmenedzser (junior IT), tartalék lehetőség

[Hirdetés](https://hu.linkedin.com/jobs/view/projektmenedzser-junior-it-at-indotek-group-4463061284)

- Budapest, XIII. kerület; hibrid lehetőséget a megvizsgált szöveg nem rögzít.
- IT-projektek koordinációja, költség- és ütemtervkövetés, beszállítói
  kapcsolatok, rendszerbevezetések támogatása; 2–3 év IT-projektmenedzsmentet kér.
- A megvizsgált szövegben kötelező diploma és angolszint nem szerepel.
  Ez nem bizonyítja, hogy az interjú során sem lesz ilyen elvárás.
- Korlát: junior/támogató szerep, saját csapat vezetése nem igazolt;
  a profil senioritásához képest visszalépés lehet. Nem elsődleges ajánlás.
- PO döntés: még nincs.

## Miért volt üres az automatikus lista?

A legfrissebb GitHub-futás (34704779607, 2026-09-12) bizonyítékai szerint:

- 122 elérhető, strukturált álláshirdetésből 122 kizárás történt:
  65 diploma, 39 magas angolkövetelmény, 18 munkakör miatt.
- A GitHubon hiányzott a SerpApi-kulcs, ezért a keresés Professionre szűkült;
  a SerpApi-lekérések HTTP 401 hibát adtak.
- A helyi futtató csak eredményfájlokat készít; nincs benne automatikus
  felhasználói értesítés vagy HTML-frissítés. A GitHub eredménylista külön készül.
- A korábbi helyi 15 találat régebbi kód eredménye, nem 15 kézzel jóváhagyott ajánlat.

Ez nem bizonyítja, hogy nincs megfelelő állás a piacon. A forráslefedettség,
a követelmények értelmezése és az eredmények átadása egyaránt hiányos.
