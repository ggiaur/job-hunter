"""Author the v21 application CVs; preserve v18-v20 without importing their builders.

Facts: profile/verified-documents-2026-09-30.md and user-clarifications-2026-09-30.md.
Editorial references: applications/2026-10-01/CV_V21.md.
"""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'applications/2026-10-01'

CSS = '''
*{box-sizing:border-box}body{margin:0;background:#e8edf2;color:#29394b;font-family:"Segoe UI",Arial,sans-serif;font-size:14px;line-height:1.6}
.sheet{width:210mm;height:297mm;background:white;margin:30px auto;box-shadow:0 14px 50px #152d4520;display:flex;flex-direction:column}
.masthead{background:#102b43;color:#fff;padding:32px 44px 27px;flex-shrink:0}
.header-top{display:flex;justify-content:space-between;gap:25px;align-items:center}.name{font:400 41px/1.13 Georgia,serif;margin:0 0 9px;letter-spacing:-.7px}.identity{font-size:12px;letter-spacing:2px;font-weight:600;color:#b8d9ed;margin:0}
.contacts{font-size:11.8px;line-height:1.85;text-align:right;color:#e4edf5;white-space:nowrap}.contacts a{color:inherit;text-decoration:none}
.application{margin:21px 0 0;padding-top:13px;border-top:1px solid #4b6b82;color:#d5e6f1;font-size:11.5px;letter-spacing:.1px}
.content{padding:31px 44px 20px;flex:1;min-height:0}.row{display:grid;grid-template-columns:119px minmax(0,1fr);gap:24px}.row+.row{margin-top:28px;padding-top:23px;border-top:1px solid #d9e2eb}
h2{font-size:10.5px;line-height:1.65;letter-spacing:1.35px;color:#2d6a8d;margin:3px 0 0;font-weight:700;text-transform:uppercase}p{margin:0 0 10px}.intro{font-size:15px;line-height:1.7;color:#263e53;margin:0}.intro strong{color:#102b43;font-weight:600}
h3{font-size:17px;line-height:1.35;font-weight:650;color:#102b43;margin:0 0 3px}.company{font-size:13.4px;color:#346783;font-weight:600;margin:0 0 5px}.context{font-size:12px;color:#5f7385;margin:0 0 13px}.date{font-size:11.5px;line-height:1.5;color:#697e8f;margin:11px 0 0;letter-spacing:0}
ul{list-style:none;margin:0;padding:0}li{font-size:13.7px;line-height:1.65;padding-left:14px;position:relative;margin:0 0 8px}li:last-child{margin-bottom:0}li:before{content:"";position:absolute;left:0;top:9px;width:4px;height:4px;border-radius:50%;background:#2d789e}
.project{font-size:13.7px;line-height:1.65;margin:0 0 16px}.project:last-child{margin-bottom:0}.project-title{font-weight:650;color:#163951}.project-context{font-size:11.6px;color:#61798b;display:block;margin:2px 0 4px}
.compact-head{padding:24px 44px 21px;background:#102b43;color:white;display:flex;justify-content:space-between;align-items:center}.compact-head b{font:400 24px Georgia,serif}.compact-head span{font-size:11.5px;letter-spacing:1.2px;color:#c8deed}
.job+.job{margin-top:21px;padding-top:18px;border-top:1px solid #e1e8ef}.job .context{margin-bottom:10px}.job h3{font-size:16px}
.course-list li{font-size:13px;margin-bottom:5px;line-height:1.55}.course-caption{font-size:11.8px;color:#61788b;margin:0 0 10px}.skill-line{font-size:13.4px;line-height:1.65;margin:0 0 8px}.skill-line:last-child{margin:0}.skill-line b{font-weight:650;color:#163951}
.education{font-size:13.7px;line-height:1.65;margin:0}.education b{font-weight:650;color:#163951}.subtle{font-size:12px;color:#5f7486}
.footer{margin:0 44px;height:36px;flex-shrink:0;border-top:1px solid #d9e2eb;color:#718395;font-size:10px;display:flex;justify-content:space-between;align-items:center}
.second .content{padding-top:29px}.second .row+.row{margin-top:14px;padding-top:10px}
nav{max-width:794px;margin:24px auto;text-align:right;font-size:13px}nav a{color:#1b658c;margin-left:17px}
@page{size:A4;margin:0}@media print{body{background:white}nav{display:none}.sheet{margin:0;box-shadow:none;break-after:page}.sheet:last-child{break-after:auto}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
@media screen and (max-width:820px){.sheet{width:100%;height:auto;min-height:297mm;margin:0 0 24px}.masthead{padding:28px}.header-top{display:block}.contacts{text-align:left;margin-top:18px}.name{font-size:37px}.content{padding:26px}.row{grid-template-columns:1fr;gap:10px}.row+.row{margin-top:22px;padding-top:18px}h2{font-size:11px}.date{margin-top:4px}.footer{margin:0 26px}.compact-head{padding:24px 26px}.compact-head span{font-size:10px}.application{margin-top:16px}}
'''

CVS = [
    dict(slug='Belinszki_Janos_CV_Nova_IT_igazgato_v21', target='Nova HR | IT igazgató',
         intro='<strong>Több mint 20 év IT-tapasztalat</strong> üzemeltetési és saját fejlesztési háttérrel. 2021 óta több telephelyes közintézmény informatikai működését és <strong>6 fős csapatát</strong> vezetem. Felelősségem a napi működésre, a fejlesztési igényekre, a beszállítói együttműködésre és az IT-költségtervezésre terjed ki.',
         current=[
             'A napi IT-működés és a fejlesztési feladatok szakmai irányítása; prioritások kijelölése, a végrehajtás és a határidők követése.',
             'IT-költségvetés tervezése és költségkövetés; fejlesztési igények felmérése, döntési anyagok és vezetői összefoglalók előkészítése.',
             'Beszerzési igények szakmai előkészítése, külső szolgáltatók munkájának követése és értékelése.',
             'Generatív AI-eszközök kísérleti bevezetése adminisztrációs és helpdesk-feladatokra; a biztonságos intézményi használat irányelveinek kialakítása.'
         ],
         projects=[
             ('ERP és webáruház összekapcsolása', 'Nimbusz-ANG Kft.', 'Az ERP-rendszer és az OpenCart webáruház közötti kapcsolatot saját PHP-fejlesztéssel valósítottam meg.'),
             ('Felhőalapú együttműködés', 'Vörösmarty Mihály Könyvtár', 'A levelezési és fájlkezelési rendszert Microsoft 365 / SharePoint környezetre állítottam át.'),
             ('Intézményi rendszerbevezetés', 'Vörösmarty Mihály Könyvtár', 'Összefogtam az integrált könyvtári rendszer bevezetését: az igényfelmérést, a szakmai beszerzési előkészítést és az átállást.')
         ],
         prior=['ERP-cseréhez kapcsolódó adatmigráció szakmai támogatása.', 'Automatizált riportok és vezetői kimutatások készítése; szakmai kapcsolattartás a szolgáltatókkal.'],
         skills=[('Infrastruktúra', 'Windows / Linux, Hyper-V, VPN; szerverkorszerűsítés és telephelyek közötti biztonságos kapcsolatok kialakítása.'), ('Fejlesztés és integráció', 'PHP, SQL, ERP-webáruház kapcsolat, automatizált riportok.'), ('Felhő és digitalizáció', 'Microsoft 365 / SharePoint; ChatGPT és Copilot intézményi alkalmazási lehetőségei.')]),
    dict(slug='Belinszki_Janos_CV_MAK_Osztalyvezeto_413_2026_v21', target='Magyar Államkincstár | Osztályvezető | 413/2026',
         intro='<strong>Több mint 20 év informatikai tapasztalat</strong>, 2021 óta osztályvezetői felelősség. Több telephelyes közintézmény IT-működését és <strong>6 fős csapatát</strong> irányítom. Vezetői munkám alapja az üzemeltetési háttér, a feladatok következetes szervezése, a felhasználói támogatás fejlesztése és a szállítói együttműködés.',
         current=[
             'A napi IT-működés és az infrastruktúra-fejlesztések szakmai irányítása; feladatpriorizálás, végrehajtás- és határidőkövetés.',
             'Fejlesztési igények felmérése, döntési anyagok és vezetői összefoglalók előkészítése; együttműködés a gazdasági, HR- és intézményi területekkel.',
             'IT-költségvetés tervezése, költségkövetés és beszerzési igények szakmai előkészítése.',
             'Külső szolgáltatók munkájának szakmai követése, a teljesítések értékelése és visszajelzése.'
         ],
         projects=[
             ('Felhasználói támogatás fejlesztése', 'Vörösmarty Mihály Könyvtár', 'Korszerűsítettem az IT-eszközparkot és a helpdesk-folyamatokat; biztosítottam a távoli munkavégzés technikai feltételeit.'),
             ('Több telephelyes infrastruktúra', 'Vörösmarty Mihály Könyvtár', 'Szerverkorszerűsítés, Hyper-V virtualizáció és biztonságos, telephelyek közötti VPN-kapcsolatok kialakítása.'),
             ('Intézményi rendszerbevezetés', 'Vörösmarty Mihály Könyvtár', 'Összefogtam az integrált könyvtári rendszer bevezetését az igényfelméréstől és a szakmai beszerzési előkészítéstől az átállásig.')
         ],
         prior=['ERP-cseréhez kapcsolódó adatmigráció szakmai támogatása; ERP és OpenCart webáruház összekötése saját PHP-fejlesztéssel.', 'Automatizált riportok és vezetői kimutatások készítése, szakmai kapcsolattartás a szolgáltatókkal.'],
         skills=[('Üzemeltetés', 'Windows / Linux, Hyper-V, VPN; helpdesk- és monitoringismeretek.'), ('Intézményi digitalizáció', 'Microsoft 365 / SharePoint-átállás; generatív AI-eszközök kísérleti bevezetése adminisztrációs és helpdesk-feladatokra.'), ('Üzleti rendszerek', 'SQL, ERP-adatmigráció, PHP-rendszerintegráció és riportautomatizálás.')])
]

def bullets(items, css=''):
    return '<ul class="'+css+'">'+''.join('<li>'+escape(item)+'</li>' for item in items)+'</ul>'

def row(label, body, date=''):
    return '<section class="row"><div><h2>'+label+'</h2>'+('<p class="date">'+date+'</p>' if date else '')+'</div><div>'+body+'</div></section>'

for cv in CVS:
    current = '<h3>Informatikai osztályvezető</h3><p class="company">Vörösmarty Mihály Könyvtár</p><p class="context">Több telephelyes közintézményi könyvtári hálózat</p>'+bullets(cv['current'])
    projects = ''.join('<p class="project"><span class="project-title">'+escape(title)+'</span><span class="project-context">'+escape(org)+'</span>'+escape(text)+'</p>' for title,org,text in cv['projects'])
    previous = '<div class="job"><h3>Senior informatikus</h3><p class="company">Nimbusz-ANG Kft.</p><p class="context">2014 - 2021 | Épületgépészeti vállalat</p>'+bullets(cv['prior'])+'</div>'
    previous += '<div class="job"><h3>Informatikus</h3><p class="company">Nimbusz Kft.</p><p class="context">2011 - 2014 | Több telephelyes vállalat</p>'+bullets(['Windows és Linux rendszerek üzemeltetése, telephelyi IT-támogatás és helpdesk; ügyviteli folyamatok egyszerűsítése és automatizálása.'])+'</div>'
    previous += '<div class="job"><h3>Junior informatikus</h3><p class="company">Cerbona Zrt.</p><p class="context">2005 - 2011 | 300+ fős élelmiszeripari vállalat</p>'+bullets(['Szerverüzemeltetés, Linux- és AIX-rendszerek támogatása, SQL-adatbázisok karbantartása és belső fejlesztések támogatása.'])+'</div>'
    skills = ''.join('<p class="skill-line"><b>'+escape(title)+':</b> '+escape(text)+'</p>' for title,text in cv['skills'])
    edu = '<p class="education"><b>Programozó matematikus</b><br>Nyíregyházi Főiskola · Főiskolai végzettség<br><span class="subtle">Tanulmányok: 2005/06 - 2008/09 · Záróvizsga: 2009</span></p>'
    courses = '<p class="course-caption">Gerilla Mentor Klub · 2026 · Tanúsítvánnyal igazolt online képzések</p>'+bullets(['AI vállalati bevezetés','AI a céges dokumentációban - RAG alapok kezdőknek','API-k használata (Számítógépes programok összekapcsolása)','MS Copilot alapok; Copilot'], 'course-list')
    page1 = row('Szakmai<br>profil','<p class="intro">'+cv['intro']+'</p>')+row('Vezetői<br>tapasztalat',current,'2021 - jelenleg')+row('Válogatott<br>megvalósítások',projects)
    page2 = row('Korábbi<br>tapasztalat',previous)+row('Technikai<br>háttér',skills)+row('Végzettség',edu)+row('Továbbképzés',courses)+row('Nyelvismeret<br>és egyéb','<p class="education">Magyar: anyanyelv · Angol: alapszint<br>B kategóriás jogosítvány</p>')
    html = f'''<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Belinszki János | {escape(cv['target'])} | v21</title><style>{CSS}</style></head><body>
<nav><a href="../../output/pdf/{cv['slug']}.pdf">PDF letöltése</a><a href="index.html">Állások és változatok</a></nav>
<article class="sheet"><header class="masthead"><div class="header-top"><div><h1 class="name">Belinszki János</h1><p class="identity">INFORMATIKAI VEZETŐ</p></div><div class="contacts">+36 20 311 1230<br><a href="mailto:belinszki.j@gmail.com">belinszki.j@gmail.com</a><br>Székesfehérvár / Budapest</div></div><p class="application">Pályázott pozíció: {escape(cv['target'])}</p></header><div class="content">{page1}</div><footer class="footer"><span>Belinszki János · Szakmai önéletrajz</span><span>1 / 2</span></footer></article>
<article class="sheet second"><header class="compact-head"><b>Belinszki János</b><span>INFORMATIKAI VEZETŐ</span></header><div class="content">{page2}</div><footer class="footer"><span>Belinszki János · Szakmai önéletrajz</span><span>2 / 2</span></footer></article>
</body></html>\n'''
    (OUT / (cv['slug']+'.html')).write_text(html,encoding='utf-8')
    print(cv['slug']+'.html')
