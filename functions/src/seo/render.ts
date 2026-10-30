// HTML-Templates der SEO-Seiten. Server-HTML, JavaScript nur für die
// Store-Weiche der App-Buttons (ohne JS führen sie zu den Store-Badges).
// Jeder Wert aus Firestore läuft durch esc() — auch in JSON-LD (jsonLd()).
//
// Optik wie die App: Eventkarten nach eventcard_widget.dart, Event-Seite nach
// der "Infos"-Seite (detail_page.dart), Filter-Pills wie auf home_page.dart.

import {LiveEvent, PublicEvent, Snapshot, isoStart, kategorie} from "./data";
import {ALLE, BEZIRK_HUBS, Hub, KATEGORIE_HUBS, WOCHENENDE, hubForBezirk, hubForTyp} from "./hubs";
import {SEO_CSS} from "./styles";

export const SITE = "https://www.eventride.at";

const IOS_APP_ID = "6770869875";
// TODO: Provider-Token aus App Store Connect (Analytics → Kampagnen) eintragen.
const IOS_PROVIDER_TOKEN = "";
const ANDROID_PACKAGE = "at.eventride.app";

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
  "September", "Oktober", "November", "Dezember"];

type PageEvent = (PublicEvent | Snapshot) & { slug?: string | null; interessenten?: number };

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

// Kartenformat wie in der App: "Sa. 31.10." (vergangene Termine mit Jahr).
// Bewusst ohne "Heute/Morgen" — das HTML wird gecacht und von Google gespeichert.
function tagKurz(day: string, mitJahr: boolean): string {
  const p = parts(day);
  const dd = String(p.d).padStart(2, "0");
  const mm = String(p.m).padStart(2, "0");
  return `${WT[p.wd]}. ${dd}.${mm}.${mitJahr ? p.y : ""}`;
}

function kartenDatum(ev: CardEvent, past: boolean): string {
  const tage = ev.startDay === ev.endDay ?
    tagKurz(ev.startDay, past) :
    `${tagKurz(ev.startDay, false)} – ${tagKurz(ev.endDay, past)}`;
  return !past && ev.uhrzeit ? `${tage} · ${ev.uhrzeit}` : tage;
}

function jahr(day: string): string {
  return day.slice(0, 4);
}

// Abdunklung des Kartenbilds wie hintergrundHelligkeit() in der App.
function dim(typ: string): string {
  return typ === "e5" ? "d69" : typ === "e1" ? "d35" : "d50";
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

// "Michael-Rebernig-Platz 1, 9065 Gradnitz, Österreich"
//   → Straße "Michael-Rebernig-Platz 1", PLZ "9065", Ort "Gradnitz".
function adressTeile(ev: PageEvent): { kurz: string; strasse: string; plz: string; ort: string } {
  const teile = (ev.adresse || "").split(",").map((t) => t.trim())
    .filter((t) => t && !/^(österreich|oesterreich|austria|at)$/i.test(t));
  const strasse: string[] = [];
  let plz = "";
  let ort = "";
  for (const t of teile) {
    const m = t.match(/^(?:A-)?(\d{4})\s+(.+)$/);
    if (m && !plz) {
      plz = m[1];
      ort = m[2];
    } else if (!plz) {
      strasse.push(t);
    }
  }
  return {kurz: teile.join(", "), strasse: strasse.join(", "), plz, ort: ort || ev.gemeinde};
}

function mapsLink(ev: PageEvent): string | null {
  const q = [ev.ort, adressTeile(ev).kurz || ev.gemeinde].filter(Boolean);
  if (q.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([...q, "Kärnten"].join(", "))}`;
}

// Beschreibung enthält beim Manager-Upload oft "Eintritt:\n…" und
// "Einlass ab HH:MM Uhr" als eigene Absätze — die stehen auf der Seite
// bereits an eigener Stelle, daher hier ausblenden.
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

// ── Icons (Material Icons wie in der App, Apache 2.0) ────────────────────────

function icon(path: string, cls = ""): string {
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
}
const P_DATE = "M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z";
const P_PIN = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";
const P_NAV = "M12 6.92l3.65 8.86-2.89-1.27-.76-.33-.76.33-2.89 1.27L12 6.92M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z";
const P_CHEV = "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z";
const P_FWD = "M6.23 20.23 8 22l10-10L8 2 6.23 3.77 14.46 12z";
const P_CAR = "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z";
const P_SEARCH = "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z";
const P_TICKET = "M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54zM11 15h2v2h-2zm0-4h2v2h-2zm0-4h2v2h-2z";
const P_PERSON = "M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z";
const P_PEOPLE = "M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z";
const P_DROP = "M7 10l5 5 5-5z";

const ICON_APPLE = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M17.05 12.54c-.02-2.2 1.8-3.25 1.88-3.3-1.02-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.79-3.32.79-.69 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.58 2.17-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.6 2.23 2.73 2.19 1.1-.04 1.52-.71 2.85-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.49zM14.88 5.96c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.97-.49 2.58-1.21z\"></path></svg>";
const ICON_PLAY = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\"><path fill=\"#5DA9FF\" d=\"M3.6 2.3c-.2.2-.32.53-.32.95v17.5c0 .42.12.75.33.95l.06.05L13.4 12v-.1L3.66 2.25l-.06.05z\"></path><path fill=\"#2FC69E\" d=\"M16.7 15.3 13.4 12v-.1l3.3-3.3.08.05 3.9 2.22c1.12.63 1.12 1.67 0 2.31l-3.9 2.21-.08.05z\"></path><path fill=\"#FF9A3C\" d=\"M16.78 15.25 13.4 11.9 3.6 21.7c.37.39.98.44 1.67.05l11.5-6.5z\"></path><path fill=\"#F5873A\" d=\"M16.78 8.6 5.27 2.1c-.69-.39-1.3-.34-1.67.05l9.8 9.75 3.38-3.3z\"></path></svg>";

// ── Bausteine ────────────────────────────────────────────────────────────────

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

function storeBadges(campaign: string): string {
  return `<div class="store-row">
  <a class="store-btn" href="${esc(iosLink(campaign))}" rel="noopener">${ICON_APPLE}<span class="store-btn-txt"><small>Laden im</small><strong>App Store</strong></span></a>
  <a class="store-btn" href="${esc(playLink(campaign))}" rel="noopener">${ICON_PLAY}<span class="store-btn-txt"><small>Jetzt bei</small><strong>Google Play</strong></span></a>
</div>`;
}

// Buttons wie unten auf der App-Detailseite. Ohne JS springen sie zu den
// Store-Badges (#app), mit JS direkt in den passenden Store.
function appBar(campaign: string): string {
  const data = `data-ios="${esc(iosLink(campaign))}" data-android="${esc(playLink(campaign))}"`;
  return `<div class="app-bar">
  <a class="btn-find" href="#app" ${data}>${icon(P_SEARCH)}Fahrten finden</a>
  <a class="btn-offer" href="#app" ${data}>${icon(P_CAR)}Fahrt anbieten</a>
</div>`;
}

const STORE_SCRIPT = "<script>(function(){var u=navigator.userAgent,k=/iPhone|iPad|iPod/.test(u)?'ios':/Android/.test(u)?'android':'';if(!k)return;" +
  "document.querySelectorAll('[data-'+k+']').forEach(function(a){a.href=a.getAttribute('data-'+k)})})()</script>";

// ── Filter (wie die Filter-Pills der App) ────────────────────────────────────

export interface FilterCtx {
  aktiv: Set<string>; // Übersichtsseiten mit Inhalt
  themen: Hub[];      // Themen mit Inhalt (im Datum-Filter)
  bezirke: Hub[];     // Bezirke mit Inhalt
}

function dropdown(label: string, hubs: Hub[], current: string): string {
  if (hubs.length === 0) return "";
  const aktiv = hubs.find((h) => h.path === current);
  return `<details class="pill-dd">
  <summary class="pill${aktiv ? " on" : ""}">${esc(aktiv ? aktiv.chip : label)}${icon(P_DROP)}</summary>
  <div class="dd">${hubs.map((h) =>
    `<a href="${h.path}#events"${h.path === current ? " aria-current=\"page\"" : ""}>${esc(h.chip)}</a>`
  ).join("")}</div>
</details>`;
}

// Links stehen immer im HTML (auch zugeklappt) — wichtig für Crawler.
export function filterBar(current: string, f: FilterCtx): string {
  const mitInhalt = (h: Hub) => f.aktiv.has(h.path) || h.path === current;
  return `<nav class="filters" aria-label="Events filtern">
  <a class="pill${current === ALLE.path ? " on" : ""}" href="${ALLE.path}#events">Alle</a>
  ${dropdown("Typ", KATEGORIE_HUBS.filter(mitInhalt), current)}
  ${dropdown("Datum", [WOCHENENDE, ...f.themen].filter(mitInhalt), current)}
  ${dropdown("Bezirk", f.bezirke.filter(mitInhalt), current)}
</nav>`;
}

// ── Eventkarten (wie eventcard_widget.dart) ──────────────────────────────────

export function eventCard(ev: CardEvent, o: { tag?: boolean; past?: boolean } = {}): string {
  const k = kategorie(ev.typ);
  const tag = o.past ? "<span class=\"ac-tag\">vorbei</span>" : o.tag ? `<span class="ac-tag">${esc(k.label)}</span>` : "";
  return `<a class="ac ${dim(ev.typ)}${o.past ? " ac-past" : ""}" href="/event/${esc(ev.slug)}">
  <img class="ac-bg" src="/assets/og/${k.img}-640.jpg" alt="" width="640" height="336" loading="lazy" decoding="async">
  <span class="ac-body">${tag}
    <h3 class="ac-name">${esc(ev.name)}</h3>
    <span class="ac-row">${icon(P_DATE, "i-amber")}<span>${esc(kartenDatum(ev, !!o.past))}</span></span>
    <span class="ac-row">${icon(P_PIN, "i-red")}<span>${esc(ev.gemeinde || "Kärnten")}</span></span>
  </span>
  ${icon(P_FWD, "ac-chev")}
</a>`;
}

export function cardGrid(events: CardEvent[], o: { tag?: boolean; past?: boolean } = {}): string {
  return `<div class="ac-grid">${events.map((e) => eventCard(e, o)).join("")}</div>`;
}

function cardSection(
  title: string, events: CardEvent[], o: { tag?: boolean; past?: boolean; more?: Hub } = {}
): string {
  if (events.length === 0) return "";
  const more = o.more ? `<a class="more" href="${o.more.path}">Alle ${esc(o.more.crumb)}${icon(P_CHEV)}</a>` : "";
  return `<section class="group"><h2>${esc(title)}</h2>${cardGrid(events, o)}${more}</section>`;
}

// ── Layout ───────────────────────────────────────────────────────────────────

interface LayoutOpts {
  title: string;
  description: string;
  path: string;
  image: string;
  body: string;
  hubs: Set<string>; // Pfade der Übersichtsseiten mit Inhalt (für Footer-Links)
  jsonLd?: unknown[];
  noindex?: boolean;
  ogType?: string;
  appBar?: boolean;  // fixe App-Buttons am Handy (Event-Seite)
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
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
${o.noindex ? "<meta name=\"robots\" content=\"noindex\">" : `<link rel="canonical" href="${esc(url)}">`}
<meta name="theme-color" content="#655542">
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
<link rel="icon" type="image/png" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/favicon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=optional" media="print" onload="this.media='all'">
<style>${SEO_CSS}</style>
${(o.jsonLd ?? []).map(jsonLd).join("\n")}
</head>
<body${o.appBar ? " class=\"has-bar\"" : ""}>
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
${o.appBar ? STORE_SCRIPT : ""}
</body>
</html>`;
}

const STORE_TEXT = "Kein Auto, keine Lust zu fahren oder noch Plätze frei? Mit EventRide findest du Leute aus deiner Gegend, die zum selben Event fahren. Kostenlos für iOS und Android.";

// ── Event-Seite (wie die "Infos"-Seite der App) ──────────────────────────────

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
  const venue = ev.ort || "";
  const adr = adressTeile(ev);
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
  const aktiv = !i.vorbei && !i.entfernt;

  // Strukturdaten: endDate nur, wenn ein Ende bekannt ist (mehrtägig → letzter Tag).
  const eventLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.name,
    "startDate": isoStart(ev),
    ...(ev.endDay !== ev.startDay ? {"endDate": ev.endDay} : {}),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": venue || ev.gemeinde || "Kärnten",
      "address": {
        "@type": "PostalAddress",
        ...(adr.strasse ? {"streetAddress": adr.strasse} : {}),
        ...(adr.plz ? {"postalCode": adr.plz} : {}),
        ...(adr.ort ? {"addressLocality": adr.ort} : {}),
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

  // Adress-Zeile: Veranstaltungsort bzw. Adresse, darunter Gemeinde und Bezirk.
  const ortHaupt = venue || adr.kurz || ev.gemeinde || "Kärnten";
  const bezirkText = ev.bezirk && ev.bezirk !== ev.gemeinde ?
    (bezirkHub && i.hubs.has(bezirkHub.path) ?
      `<a href="${bezirkHub.path}">Bezirk ${esc(ev.bezirk)}</a>` :
      `Bezirk ${esc(ev.bezirk)}`) :
    "";
  const gemeindeFehlt = ev.gemeinde && !`${ortHaupt} ${adr.kurz}`.includes(ev.gemeinde);
  const ortNeben = [
    venue && adr.kurz ? esc(adr.kurz) : "",
    gemeindeFehlt ? esc(ev.gemeinde) : "",
    bezirkText,
  ].filter(Boolean).join(" · ");

  const maps = i.entfernt ? null : mapsLink(ev);
  const interessenten = aktiv ? (ev.interessenten ?? 0) : 0;

  const leute = [
    interessenten >= 1 ? `<p class="people">${icon(P_PEOPLE)}<span><strong>${interessenten}</strong> ${interessenten === 1 ? "will" : "wollen"} hin</span></p>` : "",
    aktiv && i.fahrten >= 1 ? `<p class="people">${icon(P_CAR)}<span><strong>${i.fahrten}</strong> ${i.fahrten === 1 ? "Fahrt" : "Fahrten"} in der App angeboten</span></p>` : "",
  ].join("");

  const extras = [
    ev.eintritt ? `<div class="extra">${icon(P_TICKET, "i-amber")}<div><span class="lbl">Eintritt</span>${linkify(esc(ev.eintritt)).replace(/\n/g, "<br>")}</div></div>` : "",
    ev.veranstalter ? `<div class="extra">${icon(P_PERSON, "i-soft")}<div><span class="lbl">Veranstalter</span>${esc(ev.veranstalter)}</div></div>` : "",
  ].join("");

  const body = `<article class="page">
  ${crumbs.html}
  ${hinweis}
  <section class="glass info">
    <h1>${esc(ev.name)}</h1>
    <ul class="rows">
      <li class="row">${icon(P_DATE, "i-amber")}<span>${esc(datumBereich(ev))}${ev.uhrzeit ? ` · ${esc(ev.uhrzeit)} Uhr` : ""}</span></li>
      <li class="row">${icon(P_PIN, "i-red")}<span>${esc(ortHaupt)}${ortNeben ? `<small>${ortNeben}</small>` : ""}</span></li>
    </ul>
    ${maps ? `<a class="navlink" href="${esc(maps)}" target="_blank" rel="noopener">${icon(P_NAV)}<span>Zum Event navigieren</span>${icon(P_CHEV, "chev")}</a>` : ""}
    ${leute}
    ${beschreibung || extras ? "<hr>" : ""}
    ${beschreibung ? `<h2 class="info-h">Infos zu ${esc(ev.name)}</h2><div class="desc">${absatz(beschreibung)}</div>` : ""}
    ${extras}
  </section>
  ${aktiv ? appBar(`seo-${slug}`) : ""}
  <section class="stores" id="app">
    <h2>Mitfahren oder Plätze anbieten – in der App</h2>
    <p>${STORE_TEXT}</p>
    ${storeBadges(`seo-${slug}`)}
  </section>
  ${i.related.map((r) => cardSection(r.titel, r.events, {tag: r.more?.kind !== "typ", more: r.more})).join("\n")}
</article>`;

  return layout({
    title,
    description,
    path,
    image,
    body,
    hubs: i.hubs,
    ogType: "article",
    noindex: i.entfernt,
    jsonLd: i.entfernt ? [crumbs.ld] : [eventLd, crumbs.ld],
    appBar: aktiv,
  });
}

// ── Übersichtsseiten ─────────────────────────────────────────────────────────

export interface HubPageInput extends FilterCtx {
  hub: Hub;
  upcoming: LiveEvent[];
  past: CardEvent[];
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

// Gemischte Listen zeigen den Kategorie-Badge auf den Karten.
function gemischt(hub: Hub): boolean {
  return hub.kind === "alle" || hub.kind === "bezirk" || hub.kind === "wochenende";
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

  const anzahl = n === 1 ? "1 kommender Termin" : `${n} kommende Termine`;
  const satz = i.wochenende ?
    `${n === 1 ? "1 Event" : `${n} Events`} von ${tagKurz(i.wochenende.von, false)} bis ${tagKurz(i.wochenende.bis, false)} – mit Mitfahrgelegenheit in der EventRide App.` :
    n === 0 ? "Aktuell keine kommenden Termine – neue kommen laufend dazu." :
      `${anzahl}, nach Datum sortiert – mit Mitfahrgelegenheit in der EventRide App.`;

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
  <header class="hub-head">
    <h1>${esc(hub.h1(j))}</h1>
    <p>${esc(satz)}</p>
  </header>
  ${filterBar(hub.path, i)}
  <div id="events">
    ${leer}
    ${gruppen(i).map((g) => cardSection(g.titel, g.events, {tag: gemischt(hub)})).join("\n")}
    ${cardSection("Bisherige Termine", i.past, {past: true})}
  </div>
  <section class="glass about">
    <h2>Über ${esc(hub.crumb)}</h2>
    <p>${esc(hub.lead)}</p>
  </section>
  <section class="stores" id="app">
    <h2>Gemeinsam hin, gemeinsam heim</h2>
    <p>${STORE_TEXT}</p>
    ${storeBadges(`seo-${hub.path.slice(1)}`)}
  </section>
</article>`;

  return layout({
    title: hub.title(j),
    description: kurz(hub.description(j, n), 160),
    path: hub.path,
    image: imageUrl(hub.img),
    body,
    hubs: i.aktiv,
    noindex,
    jsonLd: n > 0 ? [itemList, crumbs.ld] : [crumbs.ld],
  });
}

// ── Startseite: "Was geht in Kärnten?" ───────────────────────────────────────

// Liefert die Bausteine, die in public/home.html an den Markern eingesetzt werden.
export function renderHomeParts(upcoming: LiveEvent[], f: FilterCtx): { filter: string; events: string } {
  return {
    filter: filterBar("/", f),
    events: upcoming.length ?
      cardGrid(upcoming, {tag: true}) :
      "<p class=\"notice\">Gerade sind keine kommenden Events eingetragen – schau bald wieder vorbei.</p>",
  };
}

// ── 404 ──────────────────────────────────────────────────────────────────────

export function renderNotFound(path: string, upcoming: LiveEvent[], hubs: Set<string>): string {
  const body = `<article class="page">
  <section class="glass nf">
    <h1>Seite nicht gefunden</h1>
    <p>Unter dieser Adresse gibt es (noch) kein Event. Vielleicht wurde es umbenannt oder ist schon lange vorbei.</p>
    <div class="nf-btns"><a class="btn-find" href="${ALLE.path}">${icon(P_SEARCH)}Alle Events in Kärnten</a><a class="btn-offer" href="/">Zur Startseite</a></div>
  </section>
  ${cardSection("Demnächst in Kärnten", upcoming, {tag: true})}
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
