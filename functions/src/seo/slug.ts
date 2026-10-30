// Slug-Erzeugung für die öffentlichen Event-Seiten (/event/{slug}).
//
// Der Slug ist zugleich der Serien-Schlüssel: gleicher Name + gleiche Gemeinde
// = gleiche Serie = gleiche URL über die Jahre. Deshalb fliegen alle reinen
// Zahlen-Tokens raus — Jahreszahlen ("2026") und Ordnungszahlen ("19.
// Ebentaler Krampuslauf"), die sich jährlich ändern und die Serie sonst
// jedes Jahr abreißen lassen würden.

const UMLAUTE: Record<string, string> = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"};

// Gemeinde-Präfixe, die zu unspezifisch sind, um zu prüfen, ob der Name die
// Gemeinde schon enthält ("St. Veit" → "st" würde auf "Stadtfest" passen).
const UNSPEZIFISCH = new Set(["st", "sankt", "bad", "maria", "markt", "stadt", "am", "an", "im", "in"]);

const MAX_LEN = 80;

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => UMLAUTE[c])
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !/^\d+$/.test(t));
}

// Zusätze ab "in"/"am"/… gehören nicht in den Slug:
// "Ebenthal in Kärnten" → "ebenthal", "Klagenfurt am Wörthersee" → "klagenfurt".
const ZUSATZ_AB = new Set(["am", "an", "im", "in", "ob", "bei"]);

function gemeindeKern(tokens: string[]): string[] {
  const cut = tokens.findIndex((t, i) => i > 0 && ZUSATZ_AB.has(t));
  return cut > 0 ? tokens.slice(0, cut) : tokens;
}

// "Paternioner Teiflstreibn" + "Paternion" → Gemeinde steckt schon im Namen.
// Toleranz von 2 Zeichen für Adjektivformen und "h" ignoriert, weil Adjektive
// es oft verlieren ("Ebenthal" → "Ebentaler").
function nameEnthaeltGemeinde(nameTokens: string[], gemeindeTokens: string[]): boolean {
  const kern = gemeindeTokens.find((t) => t.length >= 4 && !UNSPEZIFISCH.has(t));
  if (!kern) return false;
  const ohneH = (s: string) => s.replace(/h/g, "");
  const k = ohneH(kern);
  const praefix = k.slice(0, Math.max(5, k.length - 2));
  return nameTokens.some((t) => ohneH(t).startsWith(praefix));
}

export function toSeriesKey(name: string, gemeinde: string): string {
  const nameTokens = tokenize(name);
  const gemeindeTokens = gemeindeKern(tokenize(gemeinde));
  const tokens = nameEnthaeltGemeinde(nameTokens, gemeindeTokens) ?
    nameTokens :
    [...nameTokens, ...gemeindeTokens];

  let slug = "";
  for (const t of tokens) {
    const next = slug ? `${slug}-${t}` : t;
    if (next.length > MAX_LEN) break;
    slug = next;
  }
  return slug || "event";
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length <= MAX_LEN + 4;
}
