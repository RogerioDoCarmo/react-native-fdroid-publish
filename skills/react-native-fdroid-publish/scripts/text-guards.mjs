// Pure text guards shared by glab-fdroid.mjs (before posting) and scripts/check.mjs (CI).

// Library names a reviewer needs to verify a removal ("Google Play Services",
// "Play Install Referrer") pass; a store, a store link or another platform does not.
export const OTHER_STORES =
  /\b(?:Apple|App Store|iPhone|iPad|iOS|TestFlight|Google Play(?! Services)|Play Store|Play Console)\b|apps\.apple\.com|play\.google\.com/iu;

// The lines of a live template a filled-in body must still carry: headings,
// field labels, every checkbox's wording, the label command and Closes rfp#N.
export function templateGaps(template, body) {
  const lines = body.split('\n').map((line) => line.trim());
  const gaps = [];
  for (const raw of template.split('\n')) {
    const line = raw.trim();
    const box = /^[*-] \[[ xX]\] (.+)$/u.exec(line);
    if (box) {
      if (!body.includes(box[1].trim())) gaps.push(line);
    } else if (line.startsWith('Closes rfp#')) {
      if (!/^Closes rfp#\d+$/mu.test(body)) gaps.push(line);
    } else if (line.startsWith('/label ')) {
      if (!lines.includes(line)) gaps.push(line);
    } else {
      const head = /^#{2,4} [^:]*:?/u.exec(line)?.[0] ?? /^[A-Z][^:]{1,60}:(?=\s*$)/u.exec(line)?.[0];
      if (head && !lines.some((l) => l.startsWith(head))) gaps.push(line);
    }
  }
  return gaps;
}
