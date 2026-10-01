import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export async function loadCandidateProfile(profileDir) {
  const candidate = JSON.parse(await readFile(path.join(profileDir, 'candidate.json'), 'utf8'));
  if (!candidate.version || !candidate.sourceFile || path.basename(candidate.sourceFile) !== candidate.sourceFile ||
      !candidate.education || !candidate.english || !Array.isArray(candidate.facts) || !candidate.facts.length) {
    throw new Error('Hiányos önéletrajzi profil: candidate.json');
  }
  const cvText = await readFile(path.join(profileDir, candidate.sourceFile), 'utf8');
  const normalize = value => String(value).replace(/\s+/g, ' ').trim();
  const sourceTexts = new Map([[candidate.sourceFile, cvText]]);
  const ids = new Set();
  for (const fact of candidate.facts) {
    const sourceFile = fact.sourceFile || candidate.sourceFile;
    if (path.basename(sourceFile) !== sourceFile) throw new Error('Érvénytelen profilforrás útvonal.');
    if (!sourceTexts.has(sourceFile)) sourceTexts.set(sourceFile, await readFile(path.join(profileDir, sourceFile), 'utf8'));
    if (!fact.id || ids.has(fact.id) || !fact.label || !fact.evidence ||
        !Array.isArray(fact.terms) || !fact.terms.length || fact.terms.some(t => typeof t !== 'string' || !t.trim()) ||
        !normalize(sourceTexts.get(sourceFile)).includes(normalize(fact.evidence))) {
      throw new Error(`Önéletrajzi tény forrásbizonyíték nélkül vagy hibás sémával: ${fact.id}`);
    }
    ids.add(fact.id);
  }
  for (const item of [candidate.education, candidate.english, ...(candidate.certificates || [])]) {
    const sourceFile = item.sourceFile || candidate.sourceFile;
    if (path.basename(sourceFile) !== sourceFile) throw new Error('Érvénytelen profilforrás útvonal.');
    if (!sourceTexts.has(sourceFile)) sourceTexts.set(sourceFile, await readFile(path.join(profileDir, sourceFile), 'utf8'));
    if (!item.evidence || !normalize(sourceTexts.get(sourceFile)).includes(normalize(item.evidence))) throw new Error('Az önéletrajzi végzettség/nyelv forrása nem ellenőrizhető.');
  }
  if (candidate.sourceManifest) {
    const manifestPath = path.resolve(profileDir, candidate.sourceManifest);
    if (path.relative(profileDir, manifestPath).startsWith('..')) throw new Error('Érvénytelen forrásjegyzék útvonal.');
    const manifestText = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestText);
    for (const file of manifest.files) {
      const originalPath = path.resolve(profileDir, file.path);
      if (path.relative(profileDir, originalPath).startsWith('..')) throw new Error('Érvénytelen dokumentumútvonal.');
      const bytes = await readFile(originalPath);
      if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`Megváltozott szakmai forrás: ${file.path}`);
    }
    sourceTexts.set(candidate.sourceManifest, manifestText);
  }
  return { ...candidate, sourceFiles: [...sourceTexts.keys()], sourceSha256: createHash('sha256').update(JSON.stringify([...sourceTexts])).digest('hex') };
}

function parseSimpleYamlList(text, key) {
  const lines = text.split('\n');
  const startIdx = lines.findIndex((l) => l.trim().startsWith(`${key}:`));
  if (startIdx === -1) return [];
  const inlineMatch = lines[startIdx].match(new RegExp(`${key}:\\s*\\[(.*)\\]`));
  if (inlineMatch) {
    return inlineMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  const items = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^\s*-\s*(.+)$/);
    if (m) {
      items.push(m[1].trim().replace(/^["']|["']$/g, ''));
    } else if (line.trim() === '') {
      continue;
    } else {
      break;
    }
  }
  return items;
}

export async function loadProfile(profileDir) {
  const personaPath = path.join(profileDir, 'persona.md');
  const exclusionsPath = path.join(profileDir, 'exclusions.yaml');
  const preferredPath = path.join(profileDir, 'preferred_companies.yaml');
  const learnedPath = path.join(profileDir, 'learned_preferences.md');

  const [personaText, exclusionsText, preferredText, learnedText, candidate] = await Promise.all([
    readFile(personaPath, 'utf8'),
    readFile(exclusionsPath, 'utf8'),
    readFile(preferredPath, 'utf8'),
    readFile(learnedPath, 'utf8').catch(() => ''),
    loadCandidateProfile(profileDir),
  ]);

  const excludedCompanies = parseSimpleYamlList(exclusionsText, 'excluded_companies');
  const preferredCompanies = parseSimpleYamlList(preferredText, 'preferred_companies');

  const positionsSection = personaText.match(/## Keresett pozíciók[\s\S]*?\n(1\.[\s\S]*?)\n##/);
  const positions = positionsSection
    ? positionsSection[1]
        .split('\n')
        .map((l) => l.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
    : [];

  return {
    candidate,
    personaText,
    learnedText,
    excludedCompanies,
    preferredCompanies,
    positions, // ranked, index 0 = highest priority
  };
}
