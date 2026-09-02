// Pure, testable helpers -- no browser/network here.

export const POSITIVE_TERMS = ['it vezető', 'informatikai vezető', 'it manager', 'it osztályvezető',
  'infrastruktúra vezető', 'it operations manager', 'team lead', 'it projektmenedzser',
  'it project manager', 'cio', 'digitalizációs vezető', 'ai lead', 'head of ai', 'ai transformation'];

export const NEGATIVE_TERMS = ['helpdesk', '1st line', 'first line', 'software developer', 'fejlesztő',
  'takarító', 'pultos', 'sofőr', 'eladó'];

export const CHALLENGE_MARKERS = ['unusual traffic', 'recaptcha', 'captcha', 'verify you are human',
  'szokatlan forgalm', 'nem vagyok robot', "i'm not a robot"];

const ENGLISH_REQUIRED_MARKERS = ['felsőfokú angol', 'tárgyalóképes angol', 'anyanyelvi angol',
  'advanced english', 'native english', 'fluent english required'];

export function cheapScore(title, snippet) {
  const text = `${title || ''} ${snippet || ''}`.toLowerCase();
  if (NEGATIVE_TERMS.some((t) => text.includes(t))) return -1;
  return POSITIVE_TERMS.some((t) => text.includes(t)) ? 1 : 0;
}

export function matchesChallenge(text) {
  const lower = (text || '').toLowerCase();
  return CHALLENGE_MARKERS.some((m) => lower.includes(m));
}

export function relevanceReason(title, snippet) {
  const text = `${title || ''} ${snippet || ''}`.toLowerCase();
  if (ENGLISH_REQUIRED_MARKERS.some((m) => text.includes(m))) {
    return { relevant: false, reason: 'excluded: advanced/native English required (profile/persona.md exclusion)' };
  }
  const hit = POSITIVE_TERMS.find((t) => text.includes(t));
  if (hit) return { relevant: true, reason: `title/snippet matches target role term "${hit}"` };
  return { relevant: false, reason: 'no target-role term matched' };
}
