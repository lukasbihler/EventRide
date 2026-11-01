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
// Schrift der Eventkarten: Poppins, Titel 18 px / 700, Uhrzeit und Ort 15 px /
// 500 in 96 % Weiß. Abgestuft wird über Größe und Stärke, nicht über die Farbe.
//
// Schärfe auf Monitoren mit Gerätepixelverhältnis 1: nur ganze Pixel bei
// Schrift, Abständen und Icons, Text unter 15 px mit mindestens 500, kein
// transform im Ruhezustand. Chrome glättet Text nur dann mit Subpixeln, wenn
// er auf deckendem Grund liegt — über dem festen Verlauf ist alles
// durchsichtig. Karten und Glas-Boxen bekommen deshalb bei DPR < 2 einen
// deckenden Hintergrund in der Mischfarbe, auf Retina bleibt das Glas.
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
.d35 { --l: .76; }
.d50 { --l: .8; }
.d69 { --l: .86; }
.pc-past .pc-img { filter: grayscale(.8); }
.pc-date, .pc-chip { display: none; }
.pc-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 14px 40px 14px 18px; }
/* .pc .pc-name schlägt ".site h3 { Poppins }" der Startseite */
.pc .pc-name {
  font-family: inherit; font-size: 18px; font-weight: 700; line-height: 24px; letter-spacing: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  text-shadow: 0 1px 6px rgba(0,0,0,.5);
}
.pc-row {
  display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 500; line-height: 22px; min-width: 0;
  color: rgba(255,255,255,.96); text-shadow: 0 1px 4px rgba(0,0,0,.6);
}
.pc-row svg { width: 16px; height: 16px; flex-shrink: 0; fill: currentColor; }
.pc-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc .i-amber { color: #FFC107; }
.pc .i-red { color: #FF5252; }
.pc .d-only { display: none; }
.pc-foot > span { display: none; }
.pc-arrow { position: absolute; right: 14px; top: 0; bottom: 0; margin: auto 0; width: 16px; height: 16px; fill: rgba(255,255,255,.8); }

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
  /* Textbereich dunkles Glas: Weiß 96 % darauf über der hellsten Verlaufsstelle 12:1 */
  .pc {
    flex-direction: column; min-height: 0; border-radius: 18px;
    background: rgba(16,20,32,.58); border: 1px solid rgba(255,255,255,.2);
  }
  .pc-media { position: relative; inset: auto; z-index: 0; aspect-ratio: 16 / 9; margin: 8px 8px 0; border-radius: 13px; }
  .pc-media::after { display: none; }
  .pc-date {
    display: flex; flex-direction: column; align-items: center;
    position: absolute; top: 10px; left: 10px; z-index: 1; min-width: 50px; padding: 5px 8px 6px;
    border-radius: 12px; line-height: 1.1; text-align: center;
    background: rgba(20,24,34,.72); border: 1px solid rgba(255,255,255,.28);
  }
  .pc-date small { font-size: 10px; font-weight: 600; letter-spacing: 1px; }
  .pc-date b { font-size: 22px; line-height: 24px; font-weight: 600; }
  .pc-chip {
    display: inline-block; position: absolute; top: 10px; right: 10px; z-index: 1;
    font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    padding: 3px 10px; border-radius: 20px;
    background: rgba(20,24,34,.72); border: 1px solid rgba(255,255,255,.3);
  }
  .pc-body { justify-content: flex-start; padding: 16px 16px 12px; }
  .pc .pc-name { min-height: 48px; margin-bottom: 2px; text-shadow: none; }
  .pc-row { text-shadow: none; }
  .pc-foot {
    margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.18);
    display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 34px;
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,.94);
  }
  .pc-foot > span { display: inline; }
  .pc-arrow { position: static; transform: none; fill: #F5A04A; flex-shrink: 0; }
}
@media (min-width: 1024px) {
  .pc-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
/* DPR < 2: deckend statt Glas (Mischfarbe über der Verlaufsmitte), s. oben */
@media (min-width: 640px) and (max-resolution: 1.99dppx) {
  .pc { background: #1D2536; }
}

/* ─── TAGESGRUPPEN ─── */
.day { margin-top: 22px; }
.day-h { display: flex; align-items: baseline; gap: 10px; font-size: 18px; font-weight: 800; margin-bottom: 12px; color: #fff; }
.day-h span { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.88); }
/* Am Desktop sticky, fast deckend statt backdrop-filter */
@media (min-width: 1024px) {
  .day-h {
    position: sticky; top: 66px; z-index: 3;
    margin: 0 -14px 12px; padding: 10px 14px; border-radius: 14px;
    background: rgba(28,32,46,.94);
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
  position: absolute; z-index: -1; top: 0; left: 0; right: 0; margin: 0 auto;
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

/* Kompakte Glas-Boxen (Kategorie-/Themenseiten, gleichartige Blöcke auf der
   Event-Seite). Fast deckendes dunkles Glas ohne backdrop-filter, Rand 1 px.
   Bei DPR < 2 ganz deckend (Schärfe, s. CARD_CSS). */
.eb-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.eb {
  display: flex; align-items: center; gap: 14px; min-height: 84px; padding: 12px 14px 12px 12px;
  border-radius: 16px; color: #fff; text-decoration: none;
  background: rgba(20,26,42,.8); border: 1px solid rgba(255,255,255,.24);
  box-shadow: 0 4px 14px rgba(0,0,0,.16);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.eb-plak {
  flex-shrink: 0; width: 60px; min-height: 60px; padding: 6px 4px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  border-radius: 12px; line-height: 1.1; text-align: center;
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.22);
}
.eb-plak svg { width: 16px; height: 16px; }
.eb-plak b { font-size: 16px; line-height: 20px; font-weight: 600; }
.eb-plak small { font-size: 11px; line-height: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
.eb-past .eb-plak b, .eb-dat .eb-plak b { font-size: 20px; line-height: 24px; }
.eb-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.eb-name {
  font-size: 17px; font-weight: 600; line-height: 22px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.eb-row { display: flex; align-items: center; gap: 6px; font-size: 15px; line-height: 22px; font-weight: 500; min-width: 0; color: rgba(255,255,255,.94); }
.eb-row svg { width: 16px; height: 16px; flex-shrink: 0; }
.eb-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eb-zahlen { font-size: 13px; line-height: 18px; font-weight: 500; color: rgba(255,255,255,.94); }
.eb-arrow { width: 18px; height: 18px; flex-shrink: 0; fill: var(--accent); }
@media (max-resolution: 1.99dppx) {
  .eb { background: #1A2234; }
}

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
.ev-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ev-chip {
  display: inline-block; font-size: 11px; line-height: 16px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
  padding: 4px 12px; border-radius: 20px; text-decoration: none;
  background: rgba(10,14,20,.4); border: 1px solid rgba(255,255,255,.3);
}
a.ev-chip:hover { border-color: var(--accent); }
.ev-age { border-color: rgba(245,160,74,.8); }
.ev-title h1 { font-size: clamp(1.5rem, 5.8vw, 2.3rem); font-weight: 800; line-height: 1.15; margin: 12px 0 8px; text-wrap: balance; }
/* Gemeinde · Bezirk · n wollen hin */
.ev-meta { font-size: 15px; line-height: 22px; font-weight: 500; color: rgba(255,255,255,.94); }
.ev-meta span:not(.sep), .ev-meta a { white-space: nowrap; }
.ev-meta .sep { white-space: normal; color: rgba(255,255,255,.7); }
.ev-meta a { text-decoration: underline; text-decoration-color: rgba(255,255,255,.45); text-underline-offset: 3px; }
.ev-meta a:hover { text-decoration-color: var(--accent); }

/* Fakten-Leiste: Handy untereinander, ab 640 px nebeneinander (fehlt
   "Eintritt", teilen sich die zwei übrigen die Breite). Höhe nach Inhalt. */
.facts { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; align-items: start; padding: 10px 0 0; }
.fact {
  min-width: 0; padding: 14px 16px; border-radius: 16px; overflow-wrap: anywhere;
  /* dunkles Glas: Weiß auf Weiß-Glas wäre zu hell für WCAG AA */
  background: rgba(10,14,22,.22); border: 1px solid rgba(255,255,255,.18);
}
.fact .lbl { display: block; margin-bottom: 8px; font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,.8); }
.fact p { font-size: 15px; line-height: 22px; font-weight: 500; }
.fact .f-val { font-size: 17px; line-height: 24px; font-weight: 600; }
.f-date { display: flex; align-items: center; gap: 12px; }
.f-plak {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: center; min-width: 52px; padding: 5px 8px 6px;
  border-radius: 12px; line-height: 1.1; text-align: center;
  background: rgba(20,24,34,.6); border: 1px solid rgba(255,255,255,.25);
}
.f-plak small { font-size: 10px; line-height: 13px; font-weight: 600; letter-spacing: 1px; }
.f-plak b { font-size: 22px; line-height: 26px; font-weight: 600; }
.f-dtxt { display: flex; flex-direction: column; min-width: 0; }
.f-dtxt span { font-size: 15px; line-height: 22px; font-weight: 500; }
.f-zeit { font-size: 16px; line-height: 24px; font-weight: 600; }
.preis { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 4px 0; font-size: 15px; line-height: 22px; font-weight: 500; }
.preis + .preis { border-top: 1px solid rgba(255,255,255,.14); }
.preis b { font-size: 17px; line-height: 24px; font-weight: 600; white-space: nowrap; }
.f-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.f-btn, .f-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; line-height: 20px; font-weight: 600; text-decoration: none; }
.f-btn svg, .f-link svg { width: 16px; height: 16px; flex-shrink: 0; }
.f-btn { padding: 6px 12px; border-radius: 10px; background: var(--accent); color: var(--ink); }
.f-btn:hover { background: var(--accent-2); }
.f-link { margin-top: 8px; color: var(--green); }
.f-link:hover { text-decoration: underline; text-underline-offset: 3px; }

/* Beschreibung: eigener Abschnitt, Lesetext ca. 65 Zeichen pro Zeile.
   Links in Akzentfarbe, aufgehellt: #F5A04A läge auf dem Glas über der
   hellsten Verlaufsstelle bei 3,2:1, #FFD09A bei 4,7:1 (WCAG AA). */
.ev-desc { padding: 22px 8px 10px; }
.ev-desc h2 { font-size: 18px; line-height: 24px; font-weight: 700; margin-bottom: 10px; }
.desc { max-width: 65ch; font-size: 17px; line-height: 1.6; overflow-wrap: anywhere; }
.desc p { margin-bottom: 14px; }
.desc p:last-child { margin-bottom: 0; }
.desc a { color: #FFD09A; text-decoration: underline; text-decoration-color: rgba(255,208,154,.5); text-underline-offset: 3px; }
.desc a:hover { text-decoration-color: currentColor; }
.ev-veranst { margin-top: 16px; font-size: 15px; line-height: 22px; font-weight: 500; color: rgba(255,255,255,.94); }

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
  .facts { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 12px; padding: 12px 0 0; }
  .ev-desc { padding: 26px 10px 12px; }
  .side { padding: 24px; }
  .nf-btns { flex-direction: row; }
  .nf-btns > a { flex: 1; }
  .footer-cols { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .ev-layout { grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; margin-top: 110px; }
  .ev-side { position: sticky; top: 86px; }
  .m-fahrten { display: none; }
}
${CARD_CSS}`;
