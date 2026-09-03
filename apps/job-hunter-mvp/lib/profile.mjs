import { readFile } from 'node:fs/promises';
import path from 'node:path';

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

  const [personaText, exclusionsText, preferredText, learnedText] = await Promise.all([
    readFile(personaPath, 'utf8'),
    readFile(exclusionsPath, 'utf8'),
    readFile(preferredPath, 'utf8'),
    readFile(learnedPath, 'utf8').catch(() => ''),
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
    personaText,
    learnedText,
    excludedCompanies,
    preferredCompanies,
    positions, // ranked, index 0 = highest priority
  };
}
