"""Build the two reviewed, job-specific CVs from explicit candidate facts.

Requires reportlab, pypdf and pypdfium2. Sources are indexed in profile/INDEX.md.
The generated PDFs and editable HTML files are the deliverables.
"""
from pathlib import Path
import os
from html import escape
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
HTML = ROOT / 'applications' / '2026-10-01'
PREVIEW = ROOT / '.runtime' / 'cv-preview'
for folder in [OUT, HTML, PREVIEW]:
    folder.mkdir(parents=True, exist_ok=True)

font_dir = Path(os.environ.get('CV_FONT_DIR', 'C:/Windows/Fonts'))
pdfmetrics.registerFont(TTFont('CV', str(font_dir / 'calibri.ttf')))
pdfmetrics.registerFont(TTFont('CV-Bold', str(font_dir / 'calibrib.ttf')))
pdfmetrics.registerFontFamily('CV', normal='CV', bold='CV-Bold', italic='CV', boldItalic='CV-Bold')
INK = colors.HexColor('#193441')
TEAL = colors.HexColor('#157A78')
GREY = colors.HexColor('#52636B')
STYLES = {
    'name': ParagraphStyle('name', fontName='CV-Bold', fontSize=29, leading=32, textColor=INK, spaceAfter=5),
    'title': ParagraphStyle('title', fontName='CV-Bold', fontSize=14, leading=18, textColor=TEAL, spaceAfter=6),
    'contact': ParagraphStyle('contact', fontName='CV', fontSize=10, leading=14, textColor=GREY, spaceAfter=9),
    'target': ParagraphStyle('target', fontName='CV', fontSize=10, leading=14, textColor=GREY, spaceAfter=10),
    'section': ParagraphStyle('section', fontName='CV-Bold', fontSize=11, leading=15, textColor=TEAL, spaceBefore=12, spaceAfter=7, keepWithNext=True),
    'role': ParagraphStyle('role', fontName='CV-Bold', fontSize=12, leading=16, textColor=INK, spaceBefore=5, spaceAfter=3, keepWithNext=True),
    'meta': ParagraphStyle('meta', fontName='CV', fontSize=10, leading=14, textColor=GREY, spaceAfter=6, keepWithNext=True),
    'body': ParagraphStyle('body', fontName='CV', fontSize=11, leading=14.7, textColor=INK, spaceAfter=7, alignment=TA_LEFT),
    'bullet': ParagraphStyle('bullet', fontName='CV', fontSize=11, leading=14.7, textColor=INK, leftIndent=11, firstLineIndent=-9, spaceAfter=5),
    'proof': ParagraphStyle('proof', fontName='CV-Bold', fontSize=11, leading=15, textColor=TEAL, spaceBefore=3, spaceAfter=7),
}

COMMON_CURRENT = [
    '6 fős informatikai csapat irányítása: feladatok priorizálása, a végrehajtás és a határidők követése.',
    'Több telephely napi IT-működésének és infrastruktúra-fejlesztéseinek szakmai irányítása.',
    'IT-költségvetés tervezése és költségkövetés; fejlesztési igények, döntési anyagok és vezetői összefoglalók előkészítése.',
    'Külső szolgáltatók munkájának szakmai követése és értékelése; együttműködés a gazdasági, HR- és intézményi területekkel.',
]
VERSIONS = [
    dict(slug='Belinszki_Janos_CV_Nova_IT_igazgato_v19', target='Nova HR | IT igazgató',
         headline='Informatikai vezető | Üzemeltetés, fejlesztés, digitalizáció',
         summary='Több mint 20 év informatikai tapasztalat, operatív és saját fejlesztési háttérből felépített vezetői pálya. 2021 óta egy több telephelyes közintézmény IT-működését és 6 fős csapatát irányítom. Az infrastruktúra-fejlesztésekhez költségtervezési, beszállítói és rendszerintegrációs tapasztalatot kapcsolok; saját PHP-fejlesztéssel valósítottam meg ERP és OpenCart webáruház összekötését.',
         current=COMMON_CURRENT + ['Generatív AI-eszközök kísérleti bevezetése adminisztrációs és helpdesk-folyamatok támogatására; a biztonságos használat intézményi irányelveinek kialakítása.'],
         projects=[
             ('Felhőalapú együttműködés', 'Levelezési és fájlkezelési rendszer átállítása Microsoft 365 / SharePoint környezetre.'),
             ('Rendszerbevezetés', 'Integrált könyvtári rendszer bevezetésének összefogása: igényfelmérés, szakmai beszerzési előkészítés és átállás.'),
             ('Infrastruktúra megújítása', 'Hyper-V környezet kialakítása, szerverkorszerűsítés és telephelyek közötti biztonságos VPN-kapcsolat.')],
         previous=[
             'ERP és OpenCart webáruház kapcsolatának saját PHP-fejlesztése; üzleti rendszerek technikai összekapcsolása.',
             'ERP-cseréhez kapcsolódó adatmigráció szakmai támogatása; automatizált riportok és vezetői kimutatások készítése.'],
         skills=[('Vezetés', 'Csapatirányítás, fejlesztési igények és döntések előkészítése, IT-költségvetés, beszállítók szakmai követése.'), ('Technológia', 'Microsoft 365 / SharePoint, Windows / Linux, Hyper-V, VPN; PHP, ERP-webáruház integráció, SQL.'), ('Digitalizáció', 'Rendszerbevezetés, riportautomatizálás, generatív AI-eszközök gyakorlati kipróbálása és bevezetési szempontjai.')]),
    dict(slug='Belinszki_Janos_CV_MAK_Osztalyvezeto_413_2026_v19', target='Magyar Államkincstár | Osztályvezető | 413/2026',
         headline='Informatikai vezető | Csapatirányítás és IT-szolgáltatások',
         summary='Több mint 20 éves informatikai tapasztalattal, 2021 óta informatikai osztályvezetőként irányítom egy több telephelyes közintézmény IT-működését és 6 fős csapatát. Vezetői munkámhoz üzemeltetési, helpdesk-, infrastruktúra-fejlesztési és beszállítói tapasztalat társul. A napi feladatokat fejlesztési igényekkel, költségtervezéssel és vezetői döntés-előkészítéssel kapcsolom össze.',
         current=COMMON_CURRENT + ['IT-eszközpark és helpdesk-folyamatok modernizálása, távoli munkavégzési feltételek biztosítása.'],
         projects=[
             ('Több telephelyes infrastruktúra', 'Biztonságos VPN-kapcsolatok kialakítása, szerverkorszerűsítés és Hyper-V virtualizációs környezet létrehozása.'),
             ('Intézményi rendszerbevezetés', 'Integrált könyvtári rendszer bevezetésének összefogása; igényfelmérés és szakmai beszerzési előkészítés.'),
             ('Munkatársakat támogató megoldások', 'Microsoft 365 / SharePoint-átállás; AI-eszközök kísérleti használata adminisztrációs és helpdesk-feladatokra.')],
         previous=[
             'ERP-cseréhez kapcsolódó adatmigráció szakmai támogatása; automatizált riportok és vezetői kimutatások készítése.',
             'ERP és OpenCart webáruház összekötésének saját PHP-fejlesztése; szakmai kapcsolattartás a szolgáltatókkal.'],
         skills=[('Szolgáltatás és vezetés', 'Csapatirányítás, feladatpriorizálás, helpdesk-folyamatok, fejlesztési igények és vezetői összefoglalók.'), ('Üzemeltetési háttér', 'Windows / Linux, Microsoft 365 / SharePoint, Hyper-V, VPN; helpdesk és monitoring területén szerzett ismeretek.'), ('Tervezés és együttműködés', 'IT-költségvetés, költségkövetés, beszerzési igények szakmai előkészítése és szállítói kapcsolattartás.')]),
]

def blocks(v):
    b = [('name', 'Belinszki János'), ('title', v['headline']),
         ('contact', '+36 20 311 1230 | belinszki.j@gmail.com | Székesfehérvár / Budapest'),
         ('target', 'Pályázott pozíció: ' + v['target']),
         ('proof', '20+ év IT-tapasztalat   |   6 fős csapat   |   Vezetői szerep 2021 óta'),
         ('body', v['summary']), ('section', 'SZAKMAI TAPASZTALAT'),
         ('role', 'Informatikai osztályvezető'),
         ('meta', 'Vörösmarty Mihály Könyvtár | 2021 - jelenleg | Több telephelyes közintézmény')]
    b += [('bullet', x) for x in v['current']]
    b += [('section', 'KIEMELT MEGVALÓSÍTÁSOK')]
    b += [('body', '<b>' + title + '.</b> ' + body) for title, body in v['projects']]
    b += [('break', ''), ('section', 'KORÁBBI SZAKMAI TAPASZTALAT'),
          ('role', 'Senior informatikus'), ('meta', 'Nimbusz-ANG Kft. | 2014 - 2021 | Épületgépészeti vállalat')]
    b += [('bullet', x) for x in v['previous']]
    b += [('role', 'Informatikus'), ('meta', 'Nimbusz Kft. | 2011 - 2014 | Több telephelyes vállalat'),
          ('bullet', 'Windows és Linux rendszerek üzemeltetése, telephelyi IT-támogatás és helpdesk; ügyviteli folyamatok egyszerűsítése és automatizálása.'),
          ('role', 'Junior informatikus'), ('meta', 'Cerbona Zrt. | 2005 - 2011 | 300+ fős élelmiszeripari vállalat'),
          ('bullet', 'Szerverüzemeltetés, Linux- és AIX-rendszerek támogatása, SQL-adatbázisok karbantartása és belső fejlesztések támogatása.'),
          ('section', 'SZAKMAI KOMPETENCIÁK')]
    b += [('body', '<b>' + title + ':</b> ' + body) for title, body in v['skills']]
    b += [('section', 'VÉGZETTSÉG'), ('body', '<b>Programozó matematikus | Nyíregyházi Főiskola</b><br/>Főiskolai végzettség. Tanulmányok: 2005/06 - 2008/09; záróvizsga: 2009.'),
          ('section', 'RELEVÁNS TOVÁBBKÉPZÉSEK | 2026'),
          ('body', 'Gerilla Mentor Klub - tanúsítvánnyal igazolt online képzések:<br/>AI vállalati bevezetés; AI a céges dokumentációban - RAG alapok kezdőknek;<br/>API-k használata (Számítógépes programok összekapcsolása);<br/>MS Copilot alapok; Copilot.'),
          ('section', 'NYELVISMERET ÉS EGYÉB'),
          ('body', 'Magyar: anyanyelv. Angol: alapszint. B kategóriás jogosítvány.')]
    return b

def decorate(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(TEAL)
    canvas.setLineWidth(1.7)
    canvas.line(46, A4[1]-28, A4[0]-46, A4[1]-28)
    canvas.setFont('CV', 9)
    canvas.setFillColor(GREY)
    canvas.drawString(46, 25, 'Belinszki János | Szakmai önéletrajz')
    canvas.drawRightString(A4[0]-46, 25, str(doc.page) + ' / 2')
    canvas.restoreState()

CSS = '''*{box-sizing:border-box}body{margin:0;background:#eaf0f2;color:#193441;font:15px/1.45 Calibri,Arial,sans-serif}main{max-width:820px;margin:30px auto;background:white;padding:45px 55px;box-shadow:0 8px 35px #19344118;border-top:5px solid #157a78}.name{font-size:38px;font-weight:700;margin:0}.title{font-size:20px;color:#157a78;font-weight:700;margin:4px 0}.contact,.target,.meta{color:#52636b;font-size:14px}.proof{color:#157a78;font-weight:700;padding:12px 0;border-bottom:1px solid #d4e1e3}.section{font-size:15px;letter-spacing:1px;color:#157a78;font-weight:700;margin:24px 0 9px}.role{font-size:17px;font-weight:700;margin:16px 0 2px}.meta{margin:0 0 8px}.body{margin:8px 0}.bullet{margin:6px 0;padding-left:16px;position:relative}.bullet:before{content:'•';position:absolute;left:0}.pagebreak{border:0;border-top:1px solid #d4e1e3;margin:28px 0}a{color:#157a78}nav{max-width:820px;margin:20px auto;text-align:right}@media print{body{background:white}nav{display:none}main{box-shadow:none;border:0;margin:0;padding:0}.pagebreak{break-before:page;border:0;margin:0}@page{size:A4;margin:16mm}}@media(max-width:600px){main{margin:0;padding:25px}.name{font-size:32px}.contact{font-size:13px}}'''

for v in VERSIONS:
    content = blocks(v)
    pdf_path = OUT / (v['slug'] + '.pdf')
    doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, rightMargin=46, leftMargin=46, topMargin=43, bottomMargin=42,
                            title='Belinszki János - ' + v['target'], author='Belinszki János')
    story = [PageBreak() if kind == 'break' else Paragraph(('• ' if kind == 'bullet' else '') + text, STYLES[kind]) for kind, text in content]
    doc.build(story, onFirstPage=decorate, onLaterPages=decorate)
    reader = PdfReader(pdf_path)
    assert len(reader.pages) == 2, f'{pdf_path.name}: {len(reader.pages)} pages, expected 2'
    extracted = '\n'.join(page.extract_text() for page in reader.pages)
    for expected in ['Belinszki János', 'Programozó matematikus', 'Angol: alapszint', 'OpenCart']:
        assert expected in extracted, f'Missing readable text: {expected}'
    for page_index in range(len(reader.pages)):
        assert len(reader.pages[page_index].extract_text()) > 500
    rendered = pdfium.PdfDocument(str(pdf_path))
    for i in range(len(rendered)):
        rendered[i].render(scale=1.4).to_pil().save(PREVIEW / (v['slug'] + f'-{i+1}.png'))
    html_blocks = ''.join('<hr class="pagebreak">' if kind == 'break' else f'<p class="{kind}">{text}</p>' for kind, text in content)
    html = f'<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(v["target"])} - Belinszki János</title><style>{CSS}</style><nav><a href="../../output/pdf/{v["slug"]}.pdf">Letölthető PDF</a> · <a href="./index.html">Állások és CV-k</a></nav><main>{html_blocks}</main></html>\n'
    (HTML / (v['slug'] + '.html')).write_text(html, encoding='utf-8')
    print(f'{pdf_path.name}: 2 pages, {pdf_path.stat().st_size} bytes; text and page images available')
