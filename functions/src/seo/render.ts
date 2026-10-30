// HTML-Templates der SEO-Seiten. Reines Server-HTML ohne JavaScript.
// Jeder Wert aus Firestore läuft durch esc() — auch in JSON-LD (jsonLd()).
//
// Optik wie die Website (public/style.css, Navy-Theme). Die Kategoriebilder
// der App sind nur dezent eingebunden: als ausgeblendeter Kopfbereich und
// als schwacher Schimmer rechts in den Eventkarten.

import {LiveEvent, PublicEvent, Snapshot, isoStart, kategorie} from "./data";
import {ALLE, BEZIRK_HUBS, Hub, KATEGORIE_HUBS, WOCHENENDE, hubForBezirk, hubForTyp} from "./hubs";
import {SEO_CSS} from "./styles";

export const SITE = "https://www.eventride.at";

const IOS_APP_ID = "6770869875";
// TODO: Provider-Token aus App Store Connect (Analytics → Kampagnen) eintragen.
const IOS_PROVIDER_TOKEN = "";
const ANDROID_PACKAGE = "at.eventride.app";

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONATE = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
  "September", "Oktober", "November", "Dezember"];
const MON_KURZ = ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

type PageEvent = PublicEvent | (Snapshot & { slug?: string | null });

// Was eine Eventkarte braucht — erfüllt von LiveEvent und Archiv-Snapshots.
export type CardEvent = Pick<PublicEvent, "name" | "startDay" | "endDay" | "uhrzeit" | "gemeinde" | "bezirk" | "typ"> & {
  slug: string | null;
};

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

function datumBereich(ev: Pick<PublicEvent, "startDay" | "endDay">): string {
  if (ev.startDay === ev.endDay) return datumLang(ev.startDay);
  const a = parts(ev.startDay);
  const b = parts(ev.endDay);
  const wa = WOCHENTAGE[a.wd].slice(0, 2);
  const wb = WOCHENTAGE[b.wd].slice(0, 2);
  if (a.y === b.y && a.m === b.m) return `${wa}, ${a.d}. – ${wb}, ${b.d}. ${MONATE[b.m - 1]} ${b.y}`;
  if (a.y === b.y) return `${wa}, ${a.d}. ${MONATE[a.m - 1]} – ${wb}, ${b.d}. ${MONATE[b.m - 1]} ${b.y}`;
  return `${datumLang(ev.startDay)} – ${datumLang(ev.endDay)}`;
}

// Kurzform für Karten und Untertitel: "Sa, 31. Okt." bzw. "Fr, 6. – So, 8. Nov.".
// Bewusst ohne "Heute/Morgen" — das HTML wird gecacht und von Google gespeichert.
function datumKurz(ev: Pick<PublicEvent, "startDay" | "endDay">, mitJahr = false): string {
  const a = parts(ev.startDay);
  const b = parts(ev.endDay);
  const jahr = mitJahr ? ` ${b.y}` : "";
  const wa = WOCHENTAGE[a.wd].slice(0, 2);
  if (ev.startDay === ev.endDay) return `${wa}, ${a.d}. ${MON_KURZ[a.m - 1]}.${jahr}`;
  const wb = WOCHENTAGE[b.wd].slice(0, 2);
  if (a.m === b.m) return `${wa}, ${a.d}. – ${wb}, ${b.d}. ${MON_KURZ[b.m - 1]}.${jahr}`;
  return `${wa}, ${a.d}. ${MON_KURZ[a.m - 1]}. – ${wb}, ${b.d}. ${MON_KURZ[b.m - 1]}.${jahr}`;
}

function jahr(day: string): string {
  return day.slice(0, 4);
}

// Farbklasse des Kategorie-Chips (wie public/style.css).
function typCls(typ: string): string {
  return ({e2: "typ-e2", e3: "typ-e3", e4: "typ-e4", e5: "typ-e5", e6: "typ-e3"} as Record<string, string>)[typ] ?? "typ-e1";
}

function imageUrl(img: string): string {
  return `${SITE}/assets/og/${img}.jpg`;
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

function mapsLink(ev: PageEvent): string | null {
  const q = [ev.adresse, ev.gemeinde].filter(Boolean);
  if (q.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([...q, "Kärnten"].join(", "))}`;
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

// Material Icons wie in der App (Apache 2.0) für den Faktenblock.
function icon(path: string, cls = ""): string {
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
}
const P_DATE = "M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z";
const P_TIME = "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z";
const P_PIN = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";
const P_TICKET = "M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54zM11 15h2v2h-2zm0-4h2v2h-2zm0-4h2v2h-2z";
const P_PERSON = "M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z";
const P_LABEL = "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z";

// Website-Icons (aus public/index.html).
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
  headImg?: string; // Bild-Key des Kopfbereichs (Preload)
  body: string;
  hubs: Set<string>; // Pfade der Übersichtsseiten mit Inhalt (für Footer-Links)
  jsonLd?: unknown[];
  noindex?: boolean;
  ogType?: string;
}

function footerLinks(hubs: Hub[], aktiv: Set<string>): string {
  return hubs.filter((h) => aktiv.has(h.path))
    .map((h) => `<a href="${h.path}">${esc(h.crumb)}</a>`).join("");
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
${o.headImg ? `<link rel="preload" as="image" href="/assets/og/${o.headImg}-640.jpg" media="(max-width: 639px)">\n<link rel="preload" as="image" href="/assets/og/${o.headImg}.jpg" media="(min-width: 640px)">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;600&display=optional" media="print" onload="this.media='all'">
<style>${SEO_CSS}</style>
${(o.jsonLd ?? []).map(jsonLd).join("\n")}
</head>
<body>
<header class="nav">
  <a class="nav-logo" href="/"><img src="/assets/logo-64.png" alt="" width="32" height="32"><span>Event<span class="r">Ride</span></span></a>
  <nav class="nav-links" aria-label="Hauptnavigation">
    <a href="${ALLE.path}">Alle Events</a>
    <a class="nav-we" href="${WOCHENENDE.path}">Wochenende</a>
    <a class="nav-cta" href="/#download">App holen</a>
  </nav>
</header>
<main>
${o.body}
</main>
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-l"><span class="fw">Event<span class="r">Ride</span></span><small>Mitfahrgelegenheiten zu Events in Kärnten</small></div>
    <div class="footer-cols">
      <nav aria-label="Kategorien"><strong>Events nach Kategorie</strong>${footerLinks([ALLE, WOCHENENDE, ...KATEGORIE_HUBS], o.hubs)}</nav>
      <nav aria-label="Bezirke"><strong>Events nach Bezirk</strong>${footerLinks(BEZIRK_HUBS, o.hubs)}</nav>
      <nav aria-label="EventRide"><strong>EventRide</strong><a href="/">Startseite</a><a href="/datenschutz.html">Datenschutz</a><a href="/impressum.html">Impressum</a></nav>
    </div>
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

// Kopfbereich: Kategoriebild schwach im Hintergrund, nach unten ausgeblendet.
function head(img: string, inner: string): string {
  return `<header class="ev-head">
  <picture><source media="(min-width: 640px)" srcset="/assets/og/${img}.jpg"><img class="head-img" src="/assets/og/${img}-640.jpg" alt="" width="640" height="336"></picture>
  ${inner}
</header>`;
}

function storeButtons(campaign: string): string {
  return `<div class="store-row">
  <a class="store-btn" href="${esc(iosLink(campaign))}" rel="noopener">${ICON_APPLE}<span class="store-btn-txt"><small>Laden im</small><strong>App Store</strong></span></a>
  <a class="store-btn" href="${esc(playLink(campaign))}" rel="noopener">${ICON_PLAY}<span class="store-btn-txt"><small>Jetzt bei</small><strong>Google Play</strong></span></a>
</div>`;
}

function chipNav(label: string, hubs: Hub[], current: string): string {
  if (hubs.length < 2) return "";
  return `<nav class="chips" aria-label="${esc(label)}">${hubs.map((h) =>
    `<a class="chip" href="${h.path}"${h.path === current ? " aria-current=\"page\"" : ""}>${esc(h.chip)}</a>`
  ).join("")}</nav>`;
}

export function eventCard(ev: CardEvent, o: { past?: boolean } = {}): string {
  const p = parts(ev.startDay);
  const k = kategorie(ev.typ);
  const loc = [ev.gemeinde, ev.bezirk].filter(Boolean).join(" · ") || "Kärnten";
  const zeit = !o.past && ev.uhrzeit ? ` · ${ev.uhrzeit} Uhr` : "";
  return `<a class="ev-card${o.past ? " ev-past" : ""}" href="/event/${esc(ev.slug)}">
  <img class="ev-img" src="/assets/og/${k.img}-640.jpg" alt="" width="640" height="336" loading="lazy" decoding="async">
  <div class="ev-top"><div class="ev-cal"><strong>${p.d}</strong><span>${MON_KURZ[p.m - 1]}</span></div><span class="ev-typ ${o.past ? "typ-past" : typCls(ev.typ)}">${o.past ? "vorbei" : esc(k.label)}</span></div>
  <h3 class="ev-name">${esc(ev.name)}</h3>
  <div class="ev-loc">${ICON_PIN}${esc(loc)}</div>
  <div class="ev-go"><span>${esc(datumKurz(ev, o.past))}${esc(zeit)}</span>${ICON_ARROW}</div>
</a>`;
}

function cardSection(
  title: string, events: CardEvent[], o: { past?: boolean; more?: Hub } = {}
): string {
  if (events.length === 0) return "";
  const more = o.more ? `<a class="more" href="${o.more.path}">Alle ${esc(o.more.crumb)}${ICON_ARROW}</a>` : "";
  return `<section class="related"><h2>${esc(title)}</h2><div class="ev-grid">${events.map((e) => eventCard(e, o)).join("")}</div>${more}</section>`;
}

const CTA_TEXT = "Kein Auto, keine Lust zu fahren oder noch Plätze frei? Mit EventRide findest du Leute aus deiner Gegend, die zum selben Event fahren. Kostenlos für iOS und Android.";

// ── Event-Seite ──────────────────────────────────────────────────────────────

export interface RelatedSection {
  titel: string;
  events: LiveEvent[];
  more?: Hub;
}

export interface EventPageInput {
  slug: string;
  ev: PageEvent;
  vorbei: boolean;
  entfernt: boolean;
  fahrten: number;
  related: RelatedSection[];
  hubs: Set<string>;
}

export function renderEventPage(i: EventPageInput): string {
  const {ev, slug} = i;
  const k = kategorie(ev.typ);
  const typHub = hubForTyp(ev.typ);
  const bezirkHub = hubForBezirk(ev.bezirk);
  const path = `/event/${slug}`;
  const nameMitJahr = ev.name.includes(jahr(ev.startDay)) ? ev.name : `${ev.name} ${jahr(ev.startDay)}`;
  const title = `${nameMitJahr} – Termin, Ort & Mitfahrgelegenheit | EventRide`;
  const zeit = ev.uhrzeit ? ` ab ${ev.uhrzeit} Uhr` : "";
  const ort = ev.gemeinde ? ` in ${ev.gemeinde}` : "";
  const description = kurz(
    `${ev.name}: ${datumBereich(ev)}${zeit}${ort}${ev.bezirk && ev.bezirk !== ev.gemeinde ? ` (Bezirk ${ev.bezirk})` : ""}. ` +
    "Infos, Eintritt & Mitfahrgelegenheit mit EventRide.", 160);

  const typVerlinkt = typHub.kind === "typ" && i.hubs.has(typHub.path);
  const crumbItems = [{name: "Startseite", path: "/"}];
  if (typVerlinkt) crumbItems.push({name: typHub.crumb, path: typHub.path});
  crumbItems.push({name: ev.name, path});
  const crumbs = breadcrumbs(crumbItems);

  const image = imageUrl(k.img);
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

  // Ort: Adresse, darunter Gemeinde und (verlinkter) Bezirk sowie Maps-Link.
  const bezirkText = ev.bezirk && ev.bezirk !== ev.gemeinde ?
    (bezirkHub && i.hubs.has(bezirkHub.path) ?
      `<a href="${bezirkHub.path}">Bezirk ${esc(ev.bezirk)}</a>` :
      `Bezirk ${esc(ev.bezirk)}`) :
    "";
  const ortNeben = [adresseZeile ? esc(ev.gemeinde) : "", bezirkText].filter(Boolean).join(" · ");
  const maps = i.entfernt ? null : mapsLink(ev);

  const fakt = (p: string, cls: string, label: string, wert: string) =>
    `<li>${icon(p, cls)}<div><span class="lbl">${label}</span>${wert}</div></li>`;
  const fakten = [
    fakt(P_DATE, "i-amber", "Datum", esc(datumBereich(ev))),
    ev.uhrzeit ? fakt(P_TIME, "i-amber", "Uhrzeit", `ab ${esc(ev.uhrzeit)} Uhr`) : "",
    fakt(P_PIN, "i-red", "Ort",
      esc(adresseZeile || ev.gemeinde || "Kärnten") +
      (ortNeben ? `<small>${ortNeben}</small>` : "") +
      (maps ? `<a class="maps" href="${esc(maps)}" target="_blank" rel="noopener">In Google Maps öffnen</a>` : "")),
    ev.eintritt ? fakt(P_TICKET, "i-amber", "Eintritt", linkify(esc(ev.eintritt)).replace(/\n/g, "<br>")) : "",
    ev.veranstalter ? fakt(P_PERSON, "i-soft", "Veranstalter", esc(ev.veranstalter)) : "",
    fakt(P_LABEL, "i-soft", "Kategorie", typVerlinkt ? `<a href="${typHub.path}">${esc(k.label)}</a>` : esc(k.label)),
  ].join("");

  const fahrtenZeile = !i.vorbei && !i.entfernt && i.fahrten >= 1 ?
    `<p class="fahrten"><strong>${i.fahrten} ${i.fahrten === 1 ? "Fahrt" : "Fahrten"}</strong> zu diesem Event in der App angeboten</p>` :
    "";

  const body = `<article class="page">
  ${crumbs.html}
  ${head(k.img, `<span class="ev-typ ${typCls(ev.typ)}">${esc(k.label)}</span>
  <h1>${esc(ev.name)}</h1>
  <p class="ev-sub">${ICON_PIN}${esc(datumBereich(ev))}${esc(zeit)}${ev.gemeinde ? ` · ${esc(ev.gemeinde)}` : ""}</p>`)}
  ${hinweis}
  <ul class="facts">${fakten}</ul>
  <section class="cta">
    <h2>Mitfahren oder Plätze anbieten – in der App</h2>
    ${fahrtenZeile}
    <p>${CTA_TEXT}</p>
    ${storeButtons(`seo-${slug}`)}
  </section>
  ${beschreibung ? `<section class="desc"><h2>Infos zu ${esc(ev.name)}</h2>${absatz(beschreibung)}</section>` : ""}
  ${i.related.map((r) => cardSection(r.titel, r.events, {more: r.more})).join("\n")}
</article>`;

  return layout({
    title,
    description,
    path,
    image,
    headImg: k.img,
    body,
    hubs: i.hubs,
    ogType: "article",
    noindex: i.entfernt,
    jsonLd: i.entfernt ? [crumbs.ld] : [eventLd, crumbs.ld],
  });
}

// ── Übersichtsseiten ─────────────────────────────────────────────────────────

export interface HubPageInput {
  hub: Hub;
  upcoming: LiveEvent[];
  past: CardEvent[];
  hubs: Set<string>;       // Übersichtsseiten mit Inhalt
  themen: Hub[];           // Themen mit Inhalt (Chips)
  bezirke: Hub[];          // Bezirke mit Inhalt (Chips)
  wochenende?: { von: string; bis: string };
}

function jahrLabel(events: LiveEvent[], fallback: string): string {
  if (events.length === 0) return fallback;
  const a = jahr(events[0].startDay);
  const b = jahr(events[events.length - 1].startDay);
  return a === b ? a : `${a}/${b.slice(2)}`;
}

function gruppen(i: HubPageInput): { titel: string; events: LiveEvent[] }[] {
  const out = new Map<string, LiveEvent[]>();
  for (const ev of i.upcoming) {
    const key = i.wochenende ?
      (ev.startDay < i.wochenende.von ? i.wochenende.von : ev.startDay) :
      ev.startDay.slice(0, 7);
    out.set(key, [...(out.get(key) ?? []), ev]);
  }
  return [...out.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, events]) => {
    if (i.wochenende) {
      const p = parts(key);
      return {titel: `${WOCHENTAGE[p.wd]}, ${p.d}. ${MONATE[p.m - 1]}`, events};
    }
    const [y, m] = key.split("-").map(Number);
    return {titel: `${MONATE[m - 1]} ${y}`, events};
  });
}

export function renderHubPage(i: HubPageInput, heute: string): string {
  const {hub} = i;
  const j = jahrLabel(i.upcoming, jahr(heute));
  const n = i.upcoming.length;
  const noindex = n + i.past.length === 0;
  const crumbs = breadcrumbs([
    {name: "Startseite", path: "/"},
    {name: hub.crumb, path: hub.path},
  ]);

  const unterzeile = i.wochenende ?
    `${datumKurz({startDay: i.wochenende.von, endDay: i.wochenende.bis})} · ${n === 1 ? "1 Event" : `${n} Events`}` :
    n === 0 ? "Aktuell keine kommenden Termine" : n === 1 ? "1 kommender Termin" : `${n} kommende Termine`;

  const kategorieChips = [ALLE, WOCHENENDE, ...KATEGORIE_HUBS, ...i.themen]
    .filter((h) => h === hub || i.hubs.has(h.path));
  const bezirkChips = hub.kind === "alle" || hub.kind === "bezirk" ?
    chipNav("Events nach Bezirk", i.bezirke, hub.path) :
    "";

  const leer = n === 0 ?
    `<p class="notice">${i.wochenende ?
      "Für dieses Wochenende ist noch nichts eingetragen. Schau bald wieder vorbei – neue Termine kommen laufend dazu." :
      "Aktuell sind hier keine kommenden Termine eingetragen. Schau bald wieder vorbei – neue Termine kommen laufend dazu."}</p>` :
    "";

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": hub.h1(j),
    "itemListElement": i.upcoming.map((ev, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `${SITE}/event/${ev.slug}`,
      "name": ev.name,
    })),
  };

  const body = `<article class="page">
  ${crumbs.html}
  ${head(hub.img, `<h1>${esc(hub.h1(j))}</h1>
  <p class="ev-sub">${icon(P_DATE)}${esc(unterzeile)}</p>`)}
  <p class="lead">${esc(hub.lead)}</p>
  ${chipNav("Events nach Kategorie", kategorieChips, hub.path)}
  ${bezirkChips}
  ${leer}
  ${gruppen(i).map((g) => cardSection(g.titel, g.events)).join("\n")}
  ${cardSection("Bisherige Termine", i.past, {past: true})}
  <section class="cta">
    <h2>Gemeinsam hin, gemeinsam heim</h2>
    <p>${CTA_TEXT}</p>
    ${storeButtons(`seo-${hub.path.slice(1)}`)}
  </section>
</article>`;

  return layout({
    title: hub.title(j),
    description: kurz(hub.description(j, n), 160),
    path: hub.path,
    image: imageUrl(hub.img),
    headImg: hub.img,
    body,
    hubs: i.hubs,
    noindex,
    jsonLd: n > 0 ? [itemList, crumbs.ld] : [crumbs.ld],
  });
}

// ── 404 ──────────────────────────────────────────────────────────────────────

export function renderNotFound(path: string, upcoming: LiveEvent[], hubs: Set<string>): string {
  const body = `<article class="page">
  <header class="ev-head ev-head-plain">
    <h1>Seite nicht gefunden</h1>
    <p class="lead">Unter dieser Adresse gibt es (noch) kein Event. Vielleicht wurde es umbenannt oder ist schon lange vorbei.</p>
  </header>
  <p><a class="btn-p" href="${ALLE.path}">Alle Events in Kärnten</a> <a class="btn-s" href="/">Zur Startseite</a></p>
  ${cardSection("Demnächst in Kärnten", upcoming)}
</article>`;
  return layout({
    title: "Seite nicht gefunden | EventRide",
    description: "Diese Seite gibt es nicht. Alle Events in Kärnten findest du in der EventRide App.",
    path,
    image: imageUrl("kirchtag"),
    body,
    hubs,
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
