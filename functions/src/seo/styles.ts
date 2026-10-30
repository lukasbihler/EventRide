// Stylesheet der SEO-Seiten (/event/…, Übersichtsseiten).
// Wird inline ausgeliefert, damit kein render-blockierender CSS-Request das
// LCP verzögert (Ziel: Lighthouse Mobile ≥ 90). Mobil zuerst.
//
// Optik wie die App: Verlauf aus background_widget.dart (#B79B78 → #52A1EF →
// #406CFB) mit dunklem Overlay wie detail_page.dart, Glas-Karten (Weiß 12 %),
// Eventkarten nach eventcard_widget.dart, Akzent #F5A04A der Filter-Pills.
//
// Kontrast (WCAG AA): Die hellste Stelle des Verlaufs ist #B79B78 unter 45 %
// Schwarz = #655542. Weiß darauf 6,6:1, auf Glas darüber 5,3:1. Diese Farbe
// steht auch als html-Hintergrund, damit Lighthouse den ungünstigsten Fall prüft.

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
  --maxw:     880px;
}

html { background: #655542; }
body {
  position: relative;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
/* Fester Hintergrund als eigene Ebene — background-attachment: fixed
   funktioniert in iOS Safari nicht. Warm oben, blau unten. */
body::before {
  content: ""; position: fixed; inset: 0; z-index: -1;
  background:
    linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)),
    linear-gradient(160deg, #B79B78 0%, #52A1EF 55%, #406CFB 100%);
}
h1, h2, h3 { letter-spacing: -.02em; line-height: 1.2; }
a { color: inherit; }
a:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 8px; }
img, svg { max-width: 100%; }
svg { fill: currentColor; }
.i-amber { color: var(--amber); }
.i-red   { color: var(--red); }
.i-soft  { color: rgba(255,255,255,.8); }

/* ─── NAV ─── */
.nav {
  position: sticky; top: 0; z-index: 30;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  height: 60px; padding: 0 16px;
  background: rgba(24,26,36,.42);
  backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--line-2);
}
.nav-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; font-weight: 800; font-size: 1.05rem; }
.nav-logo img { border-radius: 8px; }
.r { color: var(--accent); }
.nav-links { display: flex; align-items: center; gap: 16px; }
.nav-links a { color: var(--muted); text-decoration: none; font-size: .86rem; font-weight: 600; }
.nav-links a:hover { color: var(--text); }
.nav-links .nav-we { display: none; }
.nav-links .nav-cta { background: var(--accent); color: var(--ink); padding: 8px 16px; border-radius: 100px; font-weight: 800; }
.nav-links .nav-cta:hover { background: var(--accent-2); color: var(--ink); }

/* ─── SEITE ─── */
.page { max-width: var(--maxw); margin: 0 auto; padding: 16px 16px 48px; }
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

/* ─── FILTER-PILLS (wie home_page.dart) ─── */
.filters { position: relative; z-index: 5; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.pill {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 8px 12px 8px 16px; border-radius: 20px; cursor: pointer; user-select: none;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28);
  font-size: .86rem; font-weight: 600; text-decoration: none; list-style: none; white-space: nowrap;
}
a.pill { padding-right: 16px; }
summary.pill::-webkit-details-marker { display: none; }
.pill svg { width: 20px; height: 20px; transition: transform .15s; }
.pill:hover { background: rgba(255,255,255,.22); }
.pill.on { background: var(--accent); border-color: var(--accent); color: var(--ink); }
details[open] > .pill svg { transform: rotate(180deg); }
.dd {
  position: absolute; left: 0; right: 0; top: calc(100% + 8px);
  display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 8px;
  background: #262B3A; border: 1px solid rgba(255,255,255,.18); border-radius: 16px;
  box-shadow: 0 14px 32px rgba(0,0,0,.4);
}
.dd a { padding: 10px 12px; border-radius: 10px; text-decoration: none; font-size: .9rem; }
.dd a:hover { background: rgba(255,255,255,.08); }
.dd a[aria-current] { background: var(--accent); color: var(--ink); font-weight: 600; }

/* ─── EVENTKARTEN (wie eventcard_widget.dart) ─── */
.group { margin-top: 24px; }
.group h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; }
.ac-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.ac {
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; align-items: center; gap: 10px;
  height: 124px; padding: 0 14px 0 18px; border-radius: 16px;
  text-decoration: none; background: #3a3f4f;
  box-shadow: 0 6px 16px rgba(0,0,0,.28);
  transition: transform .15s, box-shadow .15s;
}
.ac:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,.35); }
.ac-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 55% 52%; z-index: -2; }
/* Verlauf nur links unter dem Text — rechts bleibt das Bild sichtbar */
.ac::before {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(90deg, rgba(0,0,0,var(--l)) 0%, rgba(0,0,0,calc(var(--l) * .7)) 45%, rgba(0,0,0,0) 85%);
}
.d35 { --l: .7; }
.d50 { --l: .76; }
.d69 { --l: .84; }
.ac-past .ac-bg { filter: grayscale(.8); }
.ac-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.ac-tag {
  align-self: flex-start; font-size: .64rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  padding: 2px 9px; border-radius: 20px; background: rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.3);
}
.ac-name {
  font-size: 1.12rem; font-weight: 800; line-height: 1.25; letter-spacing: -.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-shadow: 0 1px 6px rgba(0,0,0,.5);
}
.ac-row { display: flex; align-items: center; gap: 6px; font-size: .92rem; text-shadow: 0 1px 4px rgba(0,0,0,.6); min-width: 0; }
.ac-row svg { width: 16px; height: 16px; flex-shrink: 0; }
.ac-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ac-chev { width: 16px; height: 16px; flex-shrink: 0; color: rgba(255,255,255,.8); transition: transform .2s; }
.ac:hover .ac-chev { transform: translateX(3px); }
.more { display: inline-flex; align-items: center; gap: 2px; margin-top: 12px; font-size: .9rem; font-weight: 600; text-decoration: none; }
.more svg { width: 20px; height: 20px; }
.more:hover { text-decoration: underline; }

/* ─── GLAS-KARTEN (Infos-Seite der App) ─── */
.glass {
  background: var(--glass); border: 1px solid var(--line-2); border-radius: 24px;
  padding: 22px 20px; box-shadow: 0 8px 24px rgba(0,0,0,.2); margin-bottom: 18px;
}
.info h1 { font-size: clamp(1.5rem, 6vw, 2.2rem); font-weight: 800; line-height: 1.2; margin-bottom: 14px; text-wrap: balance; }
.rows { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.row { display: flex; gap: 10px; align-items: flex-start; font-size: 1.02rem; line-height: 1.45; }
.row > svg { width: 23px; height: 23px; flex-shrink: 0; }
.row > span { min-width: 0; overflow-wrap: anywhere; }
.row small { display: block; color: var(--muted); font-size: .86rem; margin-top: 2px; }
.info a:not(.navlink), .about a { text-decoration: underline; text-decoration-color: rgba(255,255,255,.5); text-underline-offset: 3px; }

.navlink {
  display: flex; align-items: center; gap: 8px; margin-top: 14px;
  padding: 11px 12px; border-radius: 10px; text-decoration: none;
  border: 1.5px solid rgba(0,230,118,.75); background: rgba(10,14,20,.45);
  color: var(--green); font-size: .88rem; font-weight: 600;
}
.navlink svg { width: 16px; height: 16px; flex-shrink: 0; }
.navlink .chev { margin-left: auto; width: 18px; height: 18px; color: rgba(255,255,255,.55); }
.navlink:hover { background: rgba(10,14,20,.6); }

.people { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: .92rem; }
.people svg { width: 18px; height: 18px; flex-shrink: 0; color: rgba(255,255,255,.8); }

.info hr { border: 0; border-top: 1px solid var(--line); margin: 18px 0; }
.info-h { font-size: .74rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 10px; }
.desc p { font-size: 1.02rem; line-height: 1.6; margin-bottom: 12px; overflow-wrap: anywhere; }
.extra { display: flex; gap: 10px; align-items: flex-start; margin-top: 14px; overflow-wrap: anywhere; }
.extra > svg { width: 22px; height: 22px; flex-shrink: 0; }
.extra > div { min-width: 0; }
.lbl { display: block; font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 1px; }

/* App-Buttons wie unten auf der Detailseite; am Handy fix am unteren Rand */
.app-bar { display: flex; gap: 10px; margin-bottom: 26px; }
.app-bar a, .nf-btns a { flex: 1; }
.btn-find, .btn-offer {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  border-radius: 14px; text-decoration: none; font-weight: 600; padding: 13px 14px; font-size: .95rem;
  transition: background .15s;
}
.btn-find svg, .btn-offer svg { width: 19px; height: 19px; flex-shrink: 0; }
.btn-find { background: var(--accent); color: var(--ink); font-weight: 800; box-shadow: 0 8px 22px -8px rgba(245,160,74,.7); }
.btn-find:hover { background: var(--accent-2); }
.btn-offer { color: var(--sky); border: 1.5px solid rgba(166,228,255,.75); background: rgba(10,14,20,.3); }
.btn-offer:hover { background: rgba(10,14,20,.45); }
.nf-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.nf h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 8px; }

/* Store-Badges klein */
.stores { text-align: center; margin: 4px 0 8px; }
.stores h2 { font-size: 1.05rem; font-weight: 600; margin-bottom: 6px; text-wrap: balance; }
.stores p { color: var(--muted); font-size: .88rem; max-width: 520px; margin: 0 auto; }
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

.about { margin-top: 30px; }
.about h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; }
.about p { font-size: .95rem; }

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
  .app-bar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; margin: 0;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    background: rgba(24,26,36,.88);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border-top: 1px solid var(--line-2);
  }
  body.has-bar { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
}

/* ─── TABLET/DESKTOP ─── */
@media (min-width: 640px) {
  .nav { padding: 0 max(24px, calc((100vw - var(--maxw)) / 2)); }
  .nav-links .nav-we { display: inline; }
  .page { padding: 24px 24px 64px; }
  .glass { padding: 28px 30px; }
  .ac-grid { grid-template-columns: repeat(2, 1fr); }
  .dd { right: auto; min-width: 380px; }
  .nf-btns { flex-direction: row; }
  .footer-cols { grid-template-columns: repeat(3, 1fr); }
}
`;
