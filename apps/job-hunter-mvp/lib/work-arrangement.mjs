export function detectWorkArrangement(locationText = '', descriptionText = '') {
  // Structured locations can contain standalone labels. Body text needs
  // working-arrangement context, not just 'hybrid' technology/methodology.
  if (/\b(?:remote|telecommute|hybrid)\b|hibrid|távmunka/i.test(locationText || '')) return 'remote/hibrid';
  const clauses = (descriptionText || '').split(/[.\n;]+/);
  for (const clause of clauses) {
    if (/(?:nincs|nem|no|without)[^,;]{0,35}(?:home\s?office|remote|hibrid|hybrid|távmunka)|(?:home\s?office|remote|hibrid|hybrid|távmunka)[^,;]{0,25}(?:nem lehetséges|nem biztosított|not available)/i.test(clause)) continue;
    if (/home\s?office|távmunka|otthoni munkavégzés|(?:hibrid|hybrid|remote)[^,;]{0,25}(?:munkavégzés|munkarend|work(?:ing)?\b|munkahely)|(?:munkavégzés|munkarend|work arrangement|working model)\s*:?\s*(?:hibrid|hybrid|remote)/i.test(clause)) return 'remote/hibrid';
  }
  return null;
}
