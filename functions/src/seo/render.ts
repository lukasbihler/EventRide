// HTML-Templates der SEO-Seiten. Reines Server-HTML ohne JavaScript.
// Jeder Wert aus Firestore läuft durch esc() — auch in JSON-LD (jsonLd()).

import {LiveEvent, PublicEvent, Snapshot, isoStart, kategorie} from "./data";
import {SEO_CSS} from "./styles";

export const SITE = "https://www.eventride.at";
export const KRAMPUS_PATH = "/krampuslaeufe-kaernten";

const IOS_APP_ID = "6770869875";
// TODO: Provider-Token aus App Store Connect (Analytics → Kampagnen) eintragen.
const IOS_PROVIDER_TOKEN = "";
const ANDROID_PACKAGE = "at.eventride.app";

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONATE = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
  "September", "Oktober", "November", "Dezember"];
const MON_KURZ = ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

type PageEvent = PublicEvent | (Snapshot & { slug?: string | null });

// ── Helfer ───────────────────────────────────────────────────────────────────

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// JSON-LD in <script> — "<" escapen, damit kein "</script>" aus Firestore-Text
// den Block beenden kann.
function jsonLd(obj: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
}

function linkify(escaped: string): string {
  return escaped.replace(/\b(https?:\/\/|www\.)[^\s<]+/gi, (match) => {
    const trail = match.match(/[.,;:!?)]+$/)?.[0] ?? "";
    const url = trail ? match.slice(0, -trail.length) : match;
    const href = url.startsWith("www.") ? `https://${url}` : url;
    return `<a href="${href}" target="_blank" rel="nofollow noopener">${url}</a>${trail}`;
  });
}

function absatz(text: string): string {
  return text.split(/\n{2,}/)
    .map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${linkify(esc(p)).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function parts(day: string): { y: number; m: number; d: number; wd: number } {
  const [y, m, d] = day.split("-").map(Number);
  return {y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay()};
}

export function datumLang(day: string): string {
  const p = parts(day);
  return `${WOCHENTAGE[p.wd]}, ${p.d}. ${MONATE[p.m - 1]} ${p.y}`;
}

function datumBereich(ev: PageEvent): string {
  if (ev.startDay === ev.endDay) return datumLang(ev.startDay);
  const a = parts(ev.startDay);
  const b = parts(ev.endDay);
  const wa = WOCHENTAGE[a.wd].slice(0, 2);
  const wb = WOCHENTAGE[b.wd].slice(0, 2);
  if (a.y === b.y && a.m === b.m) return `${wa}, ${a.d}. – ${wb}, ${b.d}. ${MONATE[b.m - 1]} ${b.y}`;
  if (a.y === b.y) return `${wa}, ${a.d}. ${MONATE[a.m - 1]} – ${wb}, ${b.d}. ${MONATE[b.m - 1]} ${b.y}`;
  return `${datumLang(ev.startDay)} – ${datumLang(ev.endDay)}`;
}

function jahr(day: string): string {
  return day.slice(0, 4);
}

function ortText(ev: PageEvent): string {
  return [ev.gemeinde, ev.bezirk && ev.bezirk !== ev.gemeinde ? `Bezirk ${ev.bezirk}` : ""]
    .filter(Boolean).join(", ");
}

function imageUrl(typ: string): string {
  return `${SITE}/assets/og/${kategorie(typ).img}.jpg`;
}

function iosLink(campaign: string): string {
  const ct = encodeURIComponent(campaign.slice(0, 40)); // Apple: max. 40 Zeichen
  const pt = IOS_PROVIDER_TOKEN ? `pt=${IOS_PROVIDER_TOKEN}&` : "";
  return `https://apps.apple.com/at/app/eventride/id${IOS_APP_ID}?${pt}ct=${ct}&mt=8`;
}

function playLink(campaign: string): string {
  const referrer = `utm_source=eventride.at&utm_medium=seo&utm_campaign=${campaign}`;
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=${encodeURIComponent(referrer)}`;
}

// Beschreibung enthält beim Manager-Upload oft "Eintritt:\n…" und
// "Einlass ab HH:MM Uhr" als eigene Absätze — die stehen auf der Seite
// bereits im Faktenblock, daher hier ausblenden.
function bereinigteBeschreibung(ev: PageEvent): string {
  return ev.beschreibung.split(/\n{2,}/).filter((p) => {
    const t = p.trim();
    if (ev.eintritt && /^eintritt:/i.test(t)) return false;
    if (ev.uhrzeit && t === `Einlass ab ${ev.uhrzeit} Uhr`) return false;
    return true;
  }).join("\n\n");
}

function kurz(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// ── Icons ────────────────────────────────────────────────────────────────────

const ICON_PIN = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11Z\"></path><circle cx=\"12\" cy=\"10\" r=\"2.6\"></circle></svg>";
const ICON_ARROW = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 12h14\"></path><path d=\"m13 6 6 6-6 6\"></path></svg>";
const ICON_APPLE = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M17.05 12.54c-.02-2.2 1.8-3.25 1.88-3.3-1.02-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.79-3.32.79-.69 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.58 2.17-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.6 2.23 2.73 2.19 1.1-.04 1.52-.71 2.85-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.49zM14.88 5.96c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.97-.49 2.58-1.21z\"></path></svg>";
const ICON_PLAY = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\"><path fill=\"#5DA9FF\" d=\"M3.6 2.3c-.2.2-.32.53-.32.95v17.5c0 .42.12.75.33.95l.06.05L13.4 12v-.1L3.66 2.25l-.06.05z\"></path><path fill=\"#2FC69E\" d=\"M16.7 15.3 13.4 12v-.1l3.3-3.3.08.05 3.9 2.22c1.12.63 1.12 1.67 0 2.31l-3.9 2.21-.08.05z\"></path><path fill=\"#FF9A3C\" d=\"M16.78 15.25 13.4 11.9 3.6 21.7c.37.39.98.44 1.67.05l11.5-6.5z\"></path><path fill=\"#F5873A\" d=\"M16.78 8.6 5.27 2.1c-.69-.39-1.3-.34-1.67.05l9.8 9.75 3.38-3.3z\"></path></svg>";

// ── Layout ───────────────────────────────────────────────────────────────────

interface LayoutOpts {
  title: string;
  description: string;
  path: string;
  image: string;
  body: string;
  jsonLd?: unknown[];
  noindex?: boolean;
  ogType?: string;
}

function layout(o: LayoutOpts): string {
  const url = SITE + o.path;
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
${o.noindex ? "<meta name=\"robots\" content=\"noindex\">" : `<link rel="canonical" href="${esc(url)}">`}
<meta name="theme-color" content="#081221">
<meta name="apple-itunes-app" content="app-id=${IOS_APP_ID}">
<meta property="og:site_name" content="EventRide">
<meta property="og:locale" content="de_AT">
<meta property="og:type" content="${o.ogType ?? "website"}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(o.image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${esc(o.image)}">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;600&display=optional" media="print" onload="this.media='all'">
<style>${SEO_CSS}</style>
${(o.jsonLd ?? []).map(jsonLd).join("\n")}
</head>
<body>
<header class="nav">
  <a class="nav-logo" href="/"><img src="/assets/logo-256.png" alt="" width="32" height="32"><span>Event<span class="r">Ride</span></span></a>
  <nav class="nav-links" aria-label="Hauptnavigation">
    <a href="${KRAMPUS_PATH}">Krampusläufe</a>
    <a class="nav-cta" href="/#download">App holen</a>
  </nav>
</header>
<main>
${o.body}
</main>
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-l"><span class="fw">Event<span class="r">Ride</span></span><small>Mitfahrgelegenheiten zu Events in Kärnten</small></div>
    <nav class="footer-links" aria-label="Footer">
      <a href="/">Startseite</a>
      <a href="${KRAMPUS_PATH}">Krampusläufe Kärnten</a>
      <a href="/datenschutz.html">Datenschutz</a>
      <a href="/impressum.html">Impressum</a>
    </nav>
  </div>
</footer>
</body>
</html>`;
}

function breadcrumbs(items: { name: string; path: string }[]): { html: string; ld: unknown } {
  const html = `<nav class="crumbs" aria-label="Brotkrümel">${items.map((it, i) =>
    i === items.length - 1 ?
      `<span aria-current="page">${esc(it.name)}</span>` :
      `<a href="${esc(it.path)}">${esc(it.name)}</a><span class="sep" aria-hidden="true">›</span>`
  ).join("")}</nav>`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "item": SITE + it.path,
    })),
  };
  return {html, ld};
}

function storeButtons(campaign: string): string {
  return `<div class="store-row">
  <a class="store-btn" href="${esc(iosLink(campaign))}" rel="noopener">${ICON_APPLE}<span class="store-btn-txt"><small>Laden im</small><strong>App Store</strong></span></a>
  <a class="store-btn" href="${esc(playLink(campaign))}" rel="noopener">${ICON_PLAY}<span class="store-btn-txt"><small>Jetzt bei</small><strong>Google Play</strong></span></a>
</div>`;
}

export function eventCard(ev: LiveEvent): string {
  const p = parts(ev.startDay);
  const k = kategorie(ev.typ);
  const loc = [ev.gemeinde, ev.bezirk].filter(Boolean).join(" · ");
  return `<a class="ev-card" href="/event/${esc(ev.slug)}">
  <div class="ev-top"><div class="ev-cal"><strong>${p.d}</strong><span>${MON_KURZ[p.m - 1]}</span></div><span class="ev-typ ${k.cls}">${esc(k.label)}</span></div>
  <h3 class="ev-name">${esc(ev.name)}</h3>
  <div class="ev-loc">${ICON_PIN}${esc(loc)}</div>
  <div class="ev-go"><span>${esc(datumLang(ev.startDay))}</span>${ICON_ARROW}</div>
</a>`;
}

function cardSection(title: string, events: LiveEvent[]): string {
  if (events.length === 0) return "";
  return `<section class="related"><h2>${esc(title)}</h2><div class="ev-grid">${events.map(eventCard).join("")}</div></section>`;
}

// ── Event-Seite ──────────────────────────────────────────────────────────────

export interface EventPageInput {
  slug: string;
  ev: PageEvent;
  vorbei: boolean;
  entfernt: boolean;
  fahrten: number;
  related: { titel: string; events: LiveEvent[] }[];
}

export function renderEventPage(i: EventPageInput): string {
  const {ev, slug} = i;
  const k = kategorie(ev.typ);
  const path = `/event/${slug}`;
  const nameMitJahr = ev.name.includes(jahr(ev.startDay)) ? ev.name : `${ev.name} ${jahr(ev.startDay)}`;
  const title = `${nameMitJahr} – Termin, Ort & Mitfahrgelegenheit | EventRide`;
  const zeit = ev.uhrzeit ? ` ab ${ev.uhrzeit} Uhr` : "";
  const ort = ev.gemeinde ? ` in ${ev.gemeinde}` : "";
  const description = kurz(
    `${ev.name}: ${datumBereich(ev)}${zeit}${ort}${ev.bezirk && ev.bezirk !== ev.gemeinde ? ` (Bezirk ${ev.bezirk})` : ""}. ` +
    "Infos, Eintritt & Mitfahrgelegenheit mit EventRide.", 160);

  const crumbItems = [{name: "Startseite", path: "/"}];
  if (ev.typ === "e5") crumbItems.push({name: "Krampusläufe Kärnten", path: KRAMPUS_PATH});
  crumbItems.push({name: ev.name, path});
  const crumbs = breadcrumbs(crumbItems);

  const image = imageUrl(ev.typ);
  const beschreibung = bereinigteBeschreibung(ev);
  const adresseZeile = ev.adresse && ev.adresse !== ev.gemeinde ? ev.adresse : "";

  const eventLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.name,
    "startDate": isoStart(ev),
    "endDate": ev.endDay !== ev.startDay ? ev.endDay : isoStart(ev),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": adresseZeile || ev.gemeinde || "Kärnten",
      "address": {
        "@type": "PostalAddress",
        ...(adresseZeile ? {"streetAddress": adresseZeile} : {}),
        ...(ev.gemeinde ? {"addressLocality": ev.gemeinde} : {}),
        "addressRegion": "Kärnten",
        "addressCountry": "AT",
      },
    },
    "image": [image],
    "description": kurz(beschreibung || description, 500),
    "url": SITE + path,
  };
  if (ev.veranstalter) eventLd["organizer"] = {"@type": "Organization", "name": ev.veranstalter};

  const hinweis = i.entfernt ?
    "<p class=\"notice\">Dieser Termin ist derzeit nicht verfügbar – er wurde abgesagt, verschoben oder wird gerade überarbeitet.</p>" :
    i.vorbei ?
      `<p class="notice">Dieser Termin ist vorbei. Sobald der nächste Termin von ${esc(ev.name)} feststeht, findest du ihn hier und in der EventRide App.</p>` :
      "";

  const fakten = [
    ["Datum", esc(datumBereich(ev))],
    ev.uhrzeit ? ["Uhrzeit", `ab ${esc(ev.uhrzeit)} Uhr`] : null,
    ["Ort", [adresseZeile, ev.gemeinde].filter(Boolean).map(esc).join("<br>") || "Kärnten"],
    ev.bezirk ? ["Bezirk", esc(ev.bezirk)] : null,
    ["Kategorie", esc(k.label)],
    ev.eintritt ? ["Eintritt", linkify(esc(ev.eintritt)).replace(/\n/g, "<br>")] : null,
    ev.veranstalter ? ["Veranstalter", esc(ev.veranstalter)] : null,
  ].filter((f): f is string[] => !!f);

  const fahrtenZeile = !i.vorbei && i.fahrten >= 1 ?
    `<p class="fahrten"><strong>${i.fahrten} ${i.fahrten === 1 ? "Fahrt" : "Fahrten"}</strong> zu diesem Event in der App angeboten</p>` :
    "";

  const body = `<article class="page">
  ${crumbs.html}
  <header class="ev-head">
    <span class="ev-typ ${k.cls}">${esc(k.label)}</span>
    <h1>${esc(ev.name)}</h1>
    <p class="ev-sub">${ICON_PIN}${esc(datumBereich(ev))}${esc(zeit)}${ev.gemeinde ? ` · ${esc(ortText(ev))}` : ""}</p>
  </header>
  ${hinweis}
  <dl class="facts">${fakten.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join("")}</dl>
  <section class="cta">
    <h2>Mitfahren oder Plätze anbieten – in der App</h2>
    ${fahrtenZeile}
    <p>Kein Auto, keine Lust zu fahren oder noch Plätze frei? Mit EventRide findest du Leute aus deiner Gegend, die zum selben Event fahren. Kostenlos für iOS und Android.</p>
    ${storeButtons(`seo-${slug}`)}
  </section>
  ${beschreibung ? `<section class="desc"><h2>Infos zu ${esc(ev.name)}</h2>${absatz(beschreibung)}</section>` : ""}
  ${i.related.map((r) => cardSection(r.titel, r.events)).join("\n")}
</article>`;

  return layout({
    title,
    description,
    path,
    image,
    body,
    ogType: "article",
    noindex: i.entfernt,
    jsonLd: i.entfernt ? [crumbs.ld] : [eventLd, crumbs.ld],
  });
}

// ── Übersicht Krampusläufe ───────────────────────────────────────────────────

export function renderKrampusPage(events: LiveEvent[]): string {
  const saison = events.length ? jahr(events[0].startDay) : String(new Date().getFullYear());
  const title = `Krampusläufe Kärnten ${saison} – alle Termine & Mitfahrgelegenheit | EventRide`;
  const description = kurz(
    `Alle Krampusläufe und Perchtenläufe in Kärnten ${saison}: ${events.length} Termine nach Datum, ` +
    "mit Ort, Uhrzeit und Mitfahrgelegenheit über die EventRide App.", 160);
  const crumbs = breadcrumbs([
    {name: "Startseite", path: "/"},
    {name: "Krampusläufe Kärnten", path: KRAMPUS_PATH},
  ]);

  const proMonat = new Map<string, LiveEvent[]>();
  for (const ev of events) {
    const key = ev.startDay.slice(0, 7);
    proMonat.set(key, [...(proMonat.get(key) ?? []), ev]);
  }
  const liste = events.length ?
    [...proMonat.entries()].map(([key, evs]) => {
      const [y, m] = key.split("-").map(Number);
      return `<section class="related"><h2>${MONATE[m - 1]} ${y}</h2><div class="ev-grid">${evs.map(eventCard).join("")}</div></section>`;
    }).join("\n") :
    "<p class=\"notice\">Aktuell sind noch keine Krampusläufe eingetragen. Schau bald wieder vorbei – neue Termine kommen laufend dazu.</p>";

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Krampusläufe in Kärnten ${saison}`,
    "itemListElement": events.map((ev, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `${SITE}/event/${ev.slug}`,
      "name": ev.name,
    })),
  };

  const body = `<article class="page">
  ${crumbs.html}
  <header class="ev-head">
    <span class="ev-typ typ-e5">Krampuslauf</span>
    <h1>Krampusläufe in Kärnten ${esc(saison)}</h1>
    <p class="lead">Wenn es früh dunkel wird, ziehen in ganz Kärnten wieder Krampusse und Perchten durch die Orte – mit Glocken, Fackeln und kunstvoll geschnitzten Larven. Hier findest du alle Krampusläufe, die in der EventRide App eingetragen sind, nach Datum sortiert. Zu jedem Lauf siehst du in der App, wer aus deiner Gegend hinfährt, damit du sicher hin und wieder heim kommst.</p>
  </header>
  ${liste}
  <section class="cta">
    <h2>Gemeinsam zum Krampuslauf</h2>
    <p>Finde eine Mitfahrgelegenheit oder biete selbst freie Plätze an – kostenlos in der EventRide App.</p>
    ${storeButtons("seo-krampuslaeufe")}
  </section>
</article>`;

  return layout({title, description, path: KRAMPUS_PATH, image: imageUrl("e5"), body, jsonLd: [itemList, crumbs.ld]});
}

// ── 404 ──────────────────────────────────────────────────────────────────────

export function renderNotFound(path: string, upcoming: LiveEvent[]): string {
  const body = `<article class="page">
  <header class="ev-head">
    <h1>Seite nicht gefunden</h1>
    <p class="lead">Unter dieser Adresse gibt es (noch) kein Event. Vielleicht wurde es umbenannt oder ist schon lange vorbei.</p>
  </header>
  <p><a class="btn-p" href="${KRAMPUS_PATH}">Alle Krampusläufe in Kärnten</a> <a class="btn-s" href="/">Zur Startseite</a></p>
  ${cardSection("Demnächst in Kärnten", upcoming)}
</article>`;
  return layout({
    title: "Seite nicht gefunden | EventRide",
    description: "Diese Seite gibt es nicht. Alle Events in Kärnten findest du in der EventRide App.",
    path,
    image: imageUrl("e1"),
    body,
    noindex: true,
  });
}

// ── Sitemap ──────────────────────────────────────────────────────────────────

export function renderSitemap(urls: { path: string; lastmod?: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(SITE + u.path)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
}
