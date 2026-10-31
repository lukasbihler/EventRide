// Stylesheets der SEO-Seiten. Werden inline ausgeliefert, damit kein
// render-blockierender CSS-Request das LCP verzögert (Lighthouse Mobile ≥ 90).
// Mobil zuerst.
//
// CARD_CSS (Filter, Eventkarten, Tagesgruppen) nutzt nur feste Farben und wird
// zusätzlich in die Startseite eingesetzt (ssr.ts → homePage), damit Karten
// überall gleich aussehen. SEO_CSS = Seitenrahmen + CARD_CSS.
//
// Hintergrund: App-Verlauf (background_widget.dart, warm oben → blau unten)
// unter 45 % Schwarz. Hellste Stelle #B79B78 → #655542: Weiß darauf 6,6:1,
// auf Glas (Weiß 12 %) 5,3:1 (WCAG AA). Der html-Hintergrund ist dagegen das
// dunkle untere Verlaufsende: Er blitzt am Handy durch, wenn beim Scrollen noch
// nicht alles gezeichnet ist (hell sah das wie ein brauner Balken aus).
// Ungünstigsten Fall mit Lighthouse prüfen: html lokal auf #655542 setzen.
//
// Kopfbild (.head-bg): 35 % Deckkraft, brightness(.6). Ungünstigster Fall —
// rein weißes Bildpixel über #655542 — Weiß darauf 5,1:1. Glas über dem Bild
// (.glass-img, Pills) dunkelt per backdrop-filter auf 85 % ab: Weiß auf
// Weiß-10-%-Glas 5,1:1 (ohne die Abdunklung wären es nur 4,1:1). Die Glas-Boxen
// (.eb) liegen unterhalb des Kopfbilds und brauchen das nicht.
//
// Schrift der Eventkarten: Poppins mit klarer Abstufung — Titel 600 (800 war
// zu wuchtig), Uhrzeit 500, Ort 400, Zahlen klein. Gedimmt wird über Stärke und
// Größe, nicht über die Farbe: Text bleibt bei 91 % Weiß (auf Glas 4,7:1;
// 70 % wie in der App ergäbe nur 3,5:1). Die Startseite lädt dafür Poppins 400.
const CARD_FONT = "'Poppins', 'Poppins Fallback', 'Poppins Fallback Roboto', sans-serif";

export const CARD_CSS = `
/* Ersatzschrift mit den Maßen von Poppins (Werte aus @capsizecss/metrics,
   gleiche Rechnung wie next/font). Lädt Poppins nach, verschiebt sich
   dadurch nichts (CLS). Hier statt in SEO_CSS, damit die Startseite sie auch hat. */
@font-face {
  font-family: "Poppins Fallback"; src: local("Arial"), local("ArialMT");
  size-adjust: 112.16%; ascent-override: 93.62%; descent-override: 31.21%; line-gap-override: 8.92%;
}
@font-face {
  font-family: "Poppins Fallback Roboto"; src: local("Roboto"), local("Roboto-Regular");
  size-adjust: 112.4%; ascent-override: 93.41%; descent-override: 31.14%; line-gap-override: 8.9%;
}

/* ─── SEITENWECHSEL ───
   Filter und Karten führen auf eine neue Seite: Navigation bleibt stehen,
   der Inhalt blendet weich über (View Transitions, ohne JS). Die Filterleiste
   der Übersichtsseiten bleibt ebenfalls stehen (Name in SEO_CSS). Browser
   ohne Unterstützung laden normal. */
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
  .nav { view-transition-name: nav; }
  ::view-transition-old(root), ::view-transition-new(root) {
    animation-duration: .26s; animation-timing-function: cubic-bezier(.4, 0, .2, 1);
  }
}

/* ─── FILTER-PILLS (eine Zeile, am Handy scrollbar) ─── */
.filters { position: relative; z-index: 5; margin-bottom: 18px; }
.filters-row {
  display: flex; flex-wrap: nowrap; gap: 8px; overflow-x: auto; scrollbar-width: none;
  margin: 0 -16px; padding: 2px 16px 4px;
}
.filters-row::-webkit-scrollbar { display: none; }
.pill-dd { flex-shrink: 0; }
.pill {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 2px;
  padding: 8px 12px 8px 16px; border-radius: 20px; cursor: pointer; user-select: none;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); color: #fff;
  font-size: .86rem; font-weight: 600; text-decoration: none; list-style: none; white-space: nowrap;
}
a.pill { padding-right: 16px; }
summary.pill::-webkit-details-marker { display: none; }
.pill svg { width: 20px; height: 20px; fill: currentColor; transition: transform .15s; }
.pill:hover { background: rgba(255,255,255,.22); }
.pill.on { background: #F5A04A; border-color: #F5A04A; color: #1A2030; }
details[open] > .pill svg { transform: rotate(180deg); }
.dd {
  position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 6;
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 8px;
  background: #262B3A; border: 1px solid rgba(255,255,255,.18); border-radius: 16px;
  box-shadow: 0 14px 32px rgba(0,0,0,.4);
}
.dd a { padding: 10px 12px; border-radius: 10px; color: #fff; text-decoration: none; font-size: .9rem; }
.dd a:hover { background: rgba(255,255,255,.08); }
.dd a[aria-current] { background: #F5A04A; color: #1A2030; font-weight: 600; }

/* ─── EVENTKARTEN ───
   Handy: wie eventcard_widget.dart (Bild als Hintergrund, Verlauf links).
   Ab 640 px: Poster (Bild 16:9 oben, Datums-Plakette, Glas darunter). */
.pc-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.pc {
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; min-height: 124px; border-radius: 16px;
  font-family: ${CARD_FONT};
  color: #fff; text-decoration: none; background: #2C3242;
  box-shadow: 0 6px 16px rgba(0,0,0,.28);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.pc-media { position: absolute; inset: 0; z-index: -1; overflow: hidden; }
.pc-img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 55% 52%; }
.pc-media::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(0,0,0,var(--l)) 0%, rgba(0,0,0,calc(var(--l) * .7)) 45%, rgba(0,0,0,0) 85%);
}
.d35 { --l: .7; }
.d50 { --l: .76; }
.d69 { --l: .84; }
.pc-past .pc-img { filter: grayscale(.8); }
.pc-date, .pc-chip { display: none; }
.pc-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 5px; padding: 14px 40px 14px 18px; }
/* .pc .pc-name schlägt ".site h3 { Poppins }" der Startseite */
.pc .pc-name {
  font-family: inherit; font-size: 1.12rem; font-weight: 600; line-height: 1.3; letter-spacing: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  text-shadow: 0 1px 6px rgba(0,0,0,.5);
}
.pc-row {
  display: flex; align-items: center; gap: 6px; font-size: .92rem; font-weight: 400; min-width: 0;
  color: rgba(255,255,255,.91); text-shadow: 0 1px 4px rgba(0,0,0,.6);
}
.pc-when { font-weight: 500; }
.pc-row svg { width: 16px; height: 16px; flex-shrink: 0; fill: currentColor; }
.pc-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc .i-amber { color: #FFC107; }
.pc .i-red { color: #FF5252; }
.pc .d-only { display: none; }
.pc-foot > span { display: none; }
.pc-arrow { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; fill: rgba(255,255,255,.8); }

/* Hover (Poster-Karten und Glas-Boxen .eb): 2 px anheben, weicher orangener
   Schatten, Rand leicht orange. Bei reduzierter Bewegung nur der Schatten. */
@media (hover: hover) {
  .pc:hover, .eb:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,160,74,.25); border-color: rgba(245,160,74,.5); }
}
.pc:focus-visible, .eb:focus-visible {
  outline: 2px solid #F5A04A; outline-offset: 3px;
  transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,160,74,.25); border-color: rgba(245,160,74,.5);
}
@media (prefers-reduced-motion: reduce) {
  .pc, .eb { transition: box-shadow .2s ease, border-color .2s ease; }
  .pc:hover, .eb:hover, .pc:focus-visible, .eb:focus-visible { transform: none; }
}

@media (min-width: 640px) {
  .filters-row { margin: 0; padding: 0; overflow: visible; }
  .pill-dd { position: relative; }
  .dd { right: auto; min-width: 360px; }
  .pc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .pc .m-only { display: none; }
  .pc .d-only { display: block; }
  .pc {
    flex-direction: column; min-height: 0; border-radius: 18px;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.16);
  }
  .pc-media { position: relative; inset: auto; z-index: 0; aspect-ratio: 16 / 9; margin: 8px 8px 0; border-radius: 13px; }
  .pc-media::after { display: none; }
  .pc-date {
    display: flex; flex-direction: column; align-items: center;
    position: absolute; top: 10px; left: 10px; z-index: 1; min-width: 50px; padding: 5px 8px 6px;
    border-radius: 12px; line-height: 1.05; text-align: center;
    background: rgba(20,24,34,.6); border: 1px solid rgba(255,255,255,.25);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .pc-date small { font-size: .62rem; font-weight: 600; letter-spacing: .1em; }
  .pc-date b { font-size: 1.35rem; font-weight: 600; }
  .pc-chip {
    display: inline-block; position: absolute; top: 10px; right: 10px; z-index: 1;
    font-size: .64rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
    padding: 3px 10px; border-radius: 20px;
    background: rgba(20,24,34,.6); border: 1px solid rgba(255,255,255,.28);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  .pc-body { justify-content: flex-start; padding: 12px 16px 12px; }
  .pc .pc-name { font-size: 1.06rem; min-height: 2.6em; text-shadow: none; }
  .pc-row { font-size: .88rem; text-shadow: none; }
  .pc-foot {
    margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.16);
    display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 34px;
    font-size: .8rem; font-weight: 500; color: rgba(255,255,255,.91);
  }
  .pc-foot > span { display: inline; }
  .pc-arrow { position: static; transform: none; fill: #F5A04A; flex-shrink: 0; }
}
@media (min-width: 1024px) {
  .pc-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* ─── TAGESGRUPPEN ─── */
.day { margin-top: 22px; }
.day-h { display: flex; align-items: baseline; gap: 10px; font-size: 1.12rem; font-weight: 800; margin-bottom: 12px; color: #fff; }
.day-h span { font-size: .8rem; font-weight: 600; color: rgba(255,255,255,.88); }
@media (min-width: 1024px) {
  .day-h {
    position: sticky; top: 66px; z-index: 3;
    margin: 0 -14px 12px; padding: 10px 14px; border-radius: 14px;
    background: rgba(28,32,46,.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  }
}
`;

export const SEO_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --accent:   #F5A04A;
  --accent-2: #FFB662;
  --ink:      #1A2030;
  --amber:    #FFC107;
  --red:      #FF5252;
  --green:    #00E676;
  --sky:      #A6E4FF;
  --glass:    rgba(255,255,255,.12);
  --line:     rgba(255,255,255,.24);
  --line-2:   rgba(255,255,255,.16);
  --text:     #fff;
  --muted:    rgba(255,255,255,.92);
  --maxw:     1120px;
}

html { background: #233B8A; }
body {
  position: relative;
  font-family: ${CARD_FONT};
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
/* Fester Hintergrund als eigene Ebene — background-attachment: fixed
   funktioniert in iOS Safari nicht. Höhe = großer Viewport (100lvh), damit
   beim Ein-/Ausfahren der Adressleiste unten kein Streifen frei bleibt. */
body::before {
  content: ""; position: fixed; top: 0; left: 0; right: 0; z-index: -1;
  height: 100vh; height: 100lvh;
  background:
    linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)),
    linear-gradient(170deg, #B79B78 0%, #52A1EF 55%, #406CFB 100%);
}
h1, h2, h3 { letter-spacing: -.02em; line-height: 1.2; }
a { color: inherit; }
a:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 8px; }
img, svg { max-width: 100%; }
svg { fill: currentColor; }
.i-amber { color: var(--amber); }
.i-red   { color: var(--red); }
.i-soft  { color: rgba(255,255,255,.8); }

/* ─── NAV (wie public/style.css der Startseite) ─── */
.nav {
  position: sticky; top: 0; z-index: 30; height: 66px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 max(18px, calc((100vw - var(--maxw)) / 2 + 8px));
  background: color-mix(in srgb, #081422 78%, transparent);
  backdrop-filter: blur(18px) saturate(1.4); -webkit-backdrop-filter: blur(18px) saturate(1.4);
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 700; font-size: 1.12rem; letter-spacing: -.02em; }
.nav-logo img { width: 32px; height: 32px; border-radius: 8px; }
.r { color: var(--accent); }
.nav-links { display: flex; gap: 26px; list-style: none; align-items: center; }
.nav-links a { color: rgba(234,240,250,.8); text-decoration: none; font-size: .88rem; font-weight: 500; }
.nav-links a:hover { color: #fff; }
.nav-right { display: flex; align-items: center; gap: 12px; }
.nav-ig {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.14); color: rgba(234,240,250,.8);
}
.nav-ig:hover { color: var(--accent); border-color: rgba(255,154,60,.5); }
.nav-ig svg { width: 16px; height: 16px; fill: none; }
.nav-cta { display: inline-flex; align-items: center; background: var(--accent); color: var(--ink); padding: 9px 20px; border-radius: 100px; font-size: .84rem; font-weight: 700; text-decoration: none; }
.nav-cta:hover { background: var(--accent-2); }
.mnav { display: none; }
.burger {
  width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,.14); border-radius: 11px; cursor: pointer; list-style: none;
}
.burger::-webkit-details-marker { display: none; }
.burger svg { width: 20px; height: 20px; fill: none; }
.burger .x, .mnav[open] .burger .bars { display: none; }
.mnav[open] .burger .x { display: block; }
.mobile-menu {
  position: fixed; top: 66px; left: 0; right: 0; z-index: 29;
  background: color-mix(in srgb, #081422 97%, transparent);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,.08); padding: 8px 22px 22px;
}
.mobile-menu a { display: block; padding: 15px 4px; text-decoration: none; font-size: 1.02rem; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,.08); }
.mobile-menu .mm-cta { margin-top: 14px; text-align: center; background: var(--accent); color: var(--ink); border-radius: 12px; border: none; font-weight: 700; padding: 15px; }
@media (max-width: 720px) {
  .nav-links, .nav-ig, .nav-cta { display: none; }
  .mnav { display: block; }
}

/* ─── SEITE ─── */
main { position: relative; isolation: isolate; }
/* Filterleiste bleibt beim Wechsel zwischen Übersichtsseiten stehen */
@media (prefers-reduced-motion: no-preference) {
  .filters { view-transition-name: filters; }
}
.page { max-width: var(--maxw); margin: 0 auto; padding: 16px 16px 40px; }

/* Dezentes Kopfbild (Kategorie-/Themenseiten, Event-Seite): kein Bildbalken,
   läuft nach unten und zu den Seiten in den App-Verlauf aus. */
.head-bg {
  position: absolute; z-index: -1; top: 0; left: 50%; transform: translateX(-50%);
  width: min(100%, 1440px); height: 220px; overflow: hidden; pointer-events: none;
  --fade-x: 8%;
  -webkit-mask-image: linear-gradient(#000 35%, transparent), linear-gradient(90deg, transparent, #000 var(--fade-x), #000 calc(100% - var(--fade-x)), transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(#000 35%, transparent), linear-gradient(90deg, transparent, #000 var(--fade-x), #000 calc(100% - var(--fade-x)), transparent);
  mask-composite: intersect;
}
.head-bg img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 45%; opacity: .35; filter: brightness(.6); }

/* Glas über dem Kopfbild: dunkelt den Hintergrund ab (Kontrast, s. oben) */
.glass-img, .has-head .pill {
  backdrop-filter: blur(16px) brightness(.85); -webkit-backdrop-filter: blur(16px) brightness(.85);
}
.glass-img { background: rgba(255,255,255,.10); }

/* Kompakte Glas-Boxen (Listen auf Kategorie- und Themenseiten). Ohne
   backdrop-filter: über dem glatten Verlauf wäre die Unschärfe unsichtbar,
   kostet am Handy aber bei jedem Scroll-Frame Rechenzeit (Ruckeln). */
.eb-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.eb {
  display: flex; align-items: center; gap: 14px; min-height: 84px; padding: 12px 14px 12px 12px;
  border-radius: 16px; color: #fff; text-decoration: none;
  background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.22);
  box-shadow: 0 4px 14px rgba(0,0,0,.14);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.eb-plak {
  flex-shrink: 0; width: 60px; min-height: 60px; padding: 6px 4px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  border-radius: 12px; line-height: 1.1; text-align: center;
  /* dunkles Glas wie die Info-Kacheln: helles Glas auf der Box läge unter 4,5:1 */
  background: rgba(10,14,22,.22); border: 1px solid rgba(255,255,255,.22);
}
.eb-plak svg { width: 16px; height: 16px; }
.eb-plak b { font-size: 1rem; font-weight: 600; }
.eb-plak small { font-size: .62rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.eb-past .eb-plak b { font-size: 1.25rem; }
.eb-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.eb-name {
  font-size: 1.04rem; font-weight: 600; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.eb-row { display: flex; align-items: center; gap: 5px; font-size: .9rem; font-weight: 400; min-width: 0; color: rgba(255,255,255,.91); }
.eb-row svg { width: 15px; height: 15px; flex-shrink: 0; }
.eb-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eb-zahlen { font-size: .78rem; font-weight: 400; color: rgba(255,255,255,.91); }
.eb-arrow { width: 18px; height: 18px; flex-shrink: 0; fill: var(--accent); }

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-img, .has-head .pill { background: rgba(20,24,34,.35); }
}
.crumbs { font-size: .78rem; color: var(--muted); margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 6px; }
.crumbs a { text-decoration: none; }
.crumbs a:hover { text-decoration: underline; }

.hub-head { margin-bottom: 16px; }
.hub-head h1 { font-size: clamp(1.6rem, 6.4vw, 2.5rem); font-weight: 800; text-wrap: balance; margin-bottom: 6px; }
.hub-head p { color: var(--muted); }

.notice {
  background: rgba(20,22,30,.45); border: 1px solid rgba(245,160,74,.7);
  border-radius: 16px; padding: 14px 16px; margin-bottom: 18px;
}

.glass { background: var(--glass); border: 1px solid var(--line-2); border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,.2); }

.group { margin-top: 28px; }
.group h2 { font-size: 1.12rem; font-weight: 800; margin-bottom: 12px; }
.more { display: inline-flex; align-items: center; gap: 4px; margin-top: 12px; font-size: .9rem; font-weight: 600; text-decoration: none; }
.more svg { width: 16px; height: 16px; }
.more:hover { text-decoration: underline; }

/* ─── EVENT-SEITE ─── */
/* Glasfläche liegt über dem Kopfbild, oberhalb bleibt ein Streifen frei */
.ev-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: start; margin-top: 32px; }
.ev-main { padding: 10px; }
.ev-title { padding: 14px 8px 6px; }
.ev-chip {
  display: inline-block; font-size: .68rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  padding: 4px 12px; border-radius: 20px; text-decoration: none;
  background: rgba(10,14,20,.4); border: 1px solid rgba(255,255,255,.3);
}
a.ev-chip:hover { border-color: var(--accent); }
.ev-title h1 { font-size: clamp(1.5rem, 5.8vw, 2.3rem); font-weight: 800; line-height: 1.15; margin: 10px 0 6px; text-wrap: balance; }
.ev-gem { display: flex; align-items: center; gap: 6px; }
.ev-gem svg { width: 18px; height: 18px; flex-shrink: 0; }
.ev-zahlen { margin-top: 4px; font-size: .9rem; font-weight: 600; }

/* Info-Kacheln — Handy: Wann | Eintritt, darunter Wo, Veranstalter, Infos */
.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 8px 0 0; }
.tile {
  display: grid; grid-template-columns: auto 1fr; align-items: center; align-content: start; column-gap: 8px;
  min-width: 0; padding: 14px; border-radius: 16px;
  /* dunkles Glas: Weiß auf Weiß-Glas wäre zu hell für WCAG AA */
  background: rgba(10,14,22,.22); border: 1px solid rgba(255,255,255,.16);
}
.tile > svg { width: 20px; height: 20px; }
.tile .lbl { font-size: .7rem; font-weight: 600; letter-spacing: .09em; text-transform: uppercase; }
.tile .val { grid-column: 1 / -1; margin-top: 6px; line-height: 1.45; overflow-wrap: anywhere; }
.tile small { display: block; font-size: .85rem; margin-top: 2px; }
.tile a { text-decoration: underline; text-decoration-color: rgba(255,255,255,.5); text-underline-offset: 3px; }
.t-wann { order: 1; }
.t-eintritt { order: 2; }
.t-wo { order: 3; grid-column: 1 / -1; }
.t-veranst { order: 4; grid-column: 1 / -1; }
.t-infos { order: 5; grid-column: 1 / -1; }
.solo-m { grid-column: 1 / -1; }
.desc p { margin-bottom: 10px; }
.desc p:last-child { margin-bottom: 0; }
.tile .navlink {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
  padding: 8px 12px; border-radius: 10px; text-decoration: none;
  border: 1.5px solid rgba(0,230,118,.75); background: rgba(10,14,20,.45);
  color: var(--green); font-size: .86rem; font-weight: 600;
}
.tile .navlink svg { width: 15px; height: 15px; }

/* Mitfahren-Spalte */
.side { padding: 20px; }
.side h2 { font-size: 1.15rem; font-weight: 800; }
.side-zahlen { margin: 4px 0 14px; font-size: .92rem; }
.side-btns { display: flex; flex-direction: column; gap: 10px; }
.btn-find, .btn-offer {
  display: flex; align-items: center; justify-content: center; gap: 7px; white-space: nowrap;
  border-radius: 14px; text-decoration: none; font-weight: 600; padding: 13px 14px; font-size: .95rem;
  transition: background .15s;
}
.btn-find svg, .btn-offer svg { width: 19px; height: 19px; flex-shrink: 0; }
.btn-find { background: var(--accent); color: var(--ink); font-weight: 800; box-shadow: 0 8px 22px -8px rgba(245,160,74,.7); }
.btn-find:hover { background: var(--accent-2); }
.btn-offer { color: var(--sky); border: 1.5px solid rgba(166,228,255,.75); background: rgba(10,14,20,.3); }
.btn-offer:hover { background: rgba(10,14,20,.45); }
.qr { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding: 12px; border-radius: 14px; background: #fff; color: #1A2030; }
.qr svg { width: 92px; height: 92px; flex-shrink: 0; }
.qr p { font-size: .84rem; font-weight: 600; line-height: 1.35; }

/* Fixe App-Leiste am Handy (max. 64 px) */
.app-bar { display: none; }
.m-stores { margin-top: 28px; }

.store-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 14px; }
.store-btn {
  display: flex; align-items: center; gap: 10px;
  background: rgba(10,14,20,.45); border: 1px solid var(--line);
  border-radius: 12px; padding: 8px 16px; text-decoration: none;
}
.store-btn:hover { border-color: rgba(245,160,74,.7); }
.store-btn svg { width: 20px; height: 20px; flex-shrink: 0; }
.store-btn-txt { text-align: left; line-height: 1.15; }
.store-btn-txt small { display: block; color: var(--muted); font-size: .64rem; }
.store-btn-txt strong { font-size: .88rem; font-weight: 600; }

.stores { text-align: center; margin: 28px 0 8px; }
.stores h2 { font-size: 1.05rem; font-weight: 600; margin-bottom: 6px; text-wrap: balance; }
.stores p { color: var(--muted); font-size: .88rem; max-width: 520px; margin: 0 auto; }
.about { margin-top: 30px; padding: 20px; }
.about h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; }
.about p { font-size: .95rem; }
.nf { padding: 22px 20px; }
.nf h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 8px; }
.nf-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }

/* ─── FOOTER ─── */
.footer { background: rgba(10,14,24,.5); border-top: 1px solid var(--line-2); padding: 30px 16px; }
.footer-inner { max-width: var(--maxw); margin: 0 auto; display: flex; flex-direction: column; gap: 22px; }
.footer-l { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.footer-l .fw { font-weight: 800; }
.footer-l small { color: var(--muted); font-size: .8rem; }
.footer-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 16px; }
.footer-cols nav { display: flex; flex-direction: column; align-items: flex-start; }
.footer-cols strong { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
.footer-cols a { color: var(--muted); text-decoration: none; font-size: .85rem; padding: 8px 0; min-height: 36px; }
.footer-cols a:hover { color: var(--text); text-decoration: underline; }

@media (max-width: 639px) {
  .ev-side { display: none; }
  .app-bar {
    display: flex; gap: 10px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
    background: rgba(24,26,36,.9);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border-top: 1px solid var(--line-2);
  }
  .app-bar a { flex: 1; min-width: 0; padding: 11px 8px; font-size: 15px; }
  .app-bar svg { width: 17px; height: 17px; }
  body.has-bar { padding-bottom: calc(64px + env(safe-area-inset-bottom)); }
}

/* ─── TABLET/DESKTOP ─── */
@media (min-width: 640px) {
  .page { padding: 24px 24px 64px; }
  .m-stores { display: none; }
  .head-bg { height: 360px; --fade-x: 12%; }
  .eb-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .ev-layout { margin-top: 72px; }
  .ev-main { padding: 12px; }
  .ev-title { padding: 18px 10px 8px; }
  .tiles { padding: 10px 0 0; gap: 12px; }
  .t-wann, .t-wo, .t-eintritt, .t-veranst { grid-column: auto; }
  .t-wann { order: 1; }
  .t-wo { order: 2; }
  .t-eintritt { order: 3; }
  .t-veranst { order: 4; }
  .solo-d { grid-column: 1 / -1; }
  .side { padding: 24px; }
  .nf-btns { flex-direction: row; }
  .nf-btns > a { flex: 1; }
  .footer-cols { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .ev-layout { grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; margin-top: 110px; }
  .ev-side { position: sticky; top: 86px; }
  .ev-zahlen { display: none; }
}
${CARD_CSS}`;
