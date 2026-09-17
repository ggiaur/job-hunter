import { readFile } from 'node:fs/promises';

// An absent search key reduces coverage; it must not prevent the independent
// public Profession acquisition, nor send fake credentials to SerpApi.
export async function loadSearchCredential({ env = process.env, secretPath = '/home/dockeruser/.job-hunter-secrets/serpapi.env' } = {}) {
  const usable = value => typeof value === 'string' && value.trim() && value.trim() !== 'GITHUB_DIRECT_PROFESSION_FALLBACK';
  if (usable(env.SERPAPI_API_KEY)) return env.SERPAPI_API_KEY.trim();
  let contents;
  try {
    contents = await readFile(secretPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error('A keresési hitelesítő fájl nem olvasható.');
  }
  const value = contents.match(/^SERPAPI_API_KEY=(\S+)\s*$/m)?.[1];
  return usable(value) ? value.trim() : null;
}
