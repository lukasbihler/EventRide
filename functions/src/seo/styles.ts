// Stylesheet der SEO-Seiten (/event/…, Übersichtsseiten).
// Wird inline ausgeliefert, damit kein render-blockierender CSS-Request das
// LCP verzögert (Ziel: Lighthouse Mobile ≥ 90). Mobil zuerst.
//
// Optik wie die App: Verlauf #B79B78 → #52A1EF → #406CFB mit 40 % Schwarz
// (detail_page.dart), Glas-Karten (Weiß 15 %), Eventkarten mit Bild und
// Abdunklung wie eventcard_widget.dart, Akzent #F5A04A wie die Filter-Chips.
// Navigation, Store-Buttons und CTA-Flächen wie die Website (public/style.css).

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
  --glass:    rgba(255,255,255,.15);
  --line:     rgba(255,255,255,.24);
  --line-2:   rgba(255,255,255,.14);
  --text:     #fff;
  --muted:    rgba(255,255,255,.86);
  --faint:    rgba(255,255,255,.78);
  --maxw:     880px;
}

html { background: #2E3A55; } /* liegt unter dem Verlauf; dunkel, damit Kontrastprüfungen realistisch rechnen */
body {
  position: relative;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
/* Fester Hintergrund als eigene Ebene — background-attachment: fixed
   funktioniert in iOS Safari nicht. */
body::before {
  content: ""; position: fixed; inset: 0; z-index: -1;
  background:
    linear-gradient(rgba(0,0,0,.4), rgba(0,0,0,.4)),
    linear-gradient(to bottom right, #B79B78 0%, #52A1EF 55%, #406CFB 100%);
}
h1, h2, h3 { letter-spacing: -.02em; line-height: 1.2; }
a { color: inherit; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
img, svg { max-width: 100%; }
svg { fill: currentColor; }
.i-amber { color: var(--amber); }
.i-red   { color: var(--red); }
.i-soft  { color: rgba(255,255,255,.7); }

/* ─── NAV ─── */
.nav {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  height: 60px; padding: 0 16px;
  background: rgba(20,24,36,.38);
  backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--line-2);
}
.nav-logo {
  display: flex; align-items: center; gap: 9px; text-decoration: none;
  font-weight: 800; font-size: 1.05rem;
}
.nav-logo img { border-radius: 8px; }
.r { color: var(--accent); }
.nav-links { display: flex; align-items: center; gap: 16px; }
.nav-links a { color: var(--muted); text-decoration: none; font-size: .86rem; font-weight: 600; }
.nav-links a:hover { color: var(--text); }
.nav-links .nav-we { display: none; }
.nav-links .nav-cta {
  background: var(--accent); color: var(--ink);
  padding: 8px 16px; border-radius: 100px; font-weight: 800;
}
.nav-links .nav-cta:hover { background: var(--accent-2); color: var(--ink); }

/* ─── SEITE ─── */
.page { max-width: var(--maxw); margin: 0 auto; padding: 16px 16px 56px; }
.crumbs { font-size: .78rem; color: var(--faint); margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 6px; }
.crumbs a { color: var(--muted); text-decoration: none; }
.crumbs a:hover { color: var(--text); text-decoration: underline; }

.d35 { --dim: .35; }
.d50 { --dim: .5; }
.d69 { --dim: .69; }

/* Hero: Kategoriebild wie die App-Eventkarte, nur groß */
.hero {
  position: relative; isolation: isolate; overflow: hidden;
  min-height: 220px; border-radius: 24px; margin-bottom: 18px;
  display: flex; align-items: flex-end; padding: 20px;
  box-shadow: 0 10px 28px rgba(0,0,0,.3);
  background: #3a3f4f;
}
.hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 55% 52%; z-index: -2; }
.hero::before {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(180deg, rgba(0,0,0,calc(var(--dim) * .6)) 0%, rgba(0,0,0,var(--dim)) 50%, rgba(0,0,0,.78) 100%);
}
.hero-in { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.hero h1 {
  font-size: clamp(1.6rem, 6.6vw, 2.6rem); font-weight: 800; line-height: 1.12;
  text-wrap: balance; text-shadow: 0 2px 12px rgba(0,0,0,.45);
}
.hero-sub { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: .95rem; }
.hero-sub svg { width: 18px; height: 18px; flex-shrink: 0; }
.lead { color: var(--muted); font-size: 1rem; margin-bottom: 18px; max-width: 700px; }

.ec-tag {
  display: inline-block; align-self: flex-start;
  font-size: .66rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  padding: 3px 10px; border-radius: 20px;
  background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.28);
}

.notice {
  background: rgba(245,160,74,.2); border: 1px solid rgba(245,160,74,.55);
  border-radius: 16px; padding: 14px 16px; margin-bottom: 18px;
}

/* ─── INFOKARTE (wie detail_page.dart) ─── */
.glass {
  background: var(--glass); border-radius: 24px; padding: 22px 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,.22); margin-bottom: 28px;
}
.rows { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; gap: 10px; align-items: flex-start; font-size: 1.02rem; line-height: 1.45; overflow-wrap: anywhere; }
.row > span { min-width: 0; }
.row > svg { width: 23px; height: 23px; flex-shrink: 0; }
.row small { display: block; color: var(--faint); font-size: .86rem; margin-top: 2px; }
.row small.lbl { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 1px; }
.row a, .desc a { text-decoration: underline; text-decoration-color: rgba(255,255,255,.45); text-underline-offset: 3px; }
.row a:hover, .desc a:hover { text-decoration-color: var(--accent); }

.navlink {
  display: flex; align-items: center; gap: 8px; margin-top: 14px;
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.15); background: rgba(0,0,0,.28);
  color: var(--green); font-size: .84rem; font-weight: 600; text-decoration: none;
}
.navlink svg { width: 15px; height: 15px; flex-shrink: 0; }
.navlink .chev { margin-left: auto; width: 18px; height: 18px; color: rgba(255,255,255,.4); }
.navlink:hover { background: rgba(0,0,0,.38); }

.people { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: .9rem; color: var(--muted); }
.people svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--accent); }
.people strong { color: var(--text); }

.info hr { border: 0; border-top: 1px solid var(--line); margin: 18px 0; }
.info-h { font-size: .74rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin-bottom: 10px; }
.desc p { font-size: 1.02rem; line-height: 1.6; margin-bottom: 12px; overflow-wrap: anywhere; }
.desc p:last-child { margin-bottom: 0; }

/* App-Buttons wie unten auf der Detailseite */
.app-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
.btn-find, .btn-offer {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 14px; text-decoration: none; font-weight: 600;
  transition: background .15s, transform .15s, box-shadow .15s;
}
.btn-find svg, .btn-offer svg { width: 19px; height: 19px; flex-shrink: 0; }
.btn-find {
  background: var(--accent); color: var(--ink); padding: 15px 20px; font-size: 1rem; font-weight: 800;
  box-shadow: 0 8px 24px -8px rgba(245,160,74,.7);
}
.btn-find:hover { background: var(--accent-2); transform: translateY(-1px); }
.btn-offer { color: var(--sky); border: 1.5px solid rgba(128,216,255,.6); padding: 12px 20px; font-size: .94rem; }
.btn-offer:hover { background: rgba(128,216,255,.1); }
.app-hint { text-align: center; color: var(--faint); font-size: .8rem; margin-top: 10px; }

.nf h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 8px; }
.nf p { color: var(--muted); }

/* ─── CHIPS (wie die Filter-Chips der App) ─── */
.chips {
  display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
  margin: 0 -16px 14px; padding: 2px 16px 6px;
}
.chips::-webkit-scrollbar { display: none; }
.chip {
  flex-shrink: 0; display: inline-flex; align-items: center;
  padding: 7px 15px; border-radius: 20px; white-space: nowrap;
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.24);
  font-size: .84rem; font-weight: 600; text-decoration: none;
}
.chip:hover { background: rgba(255,255,255,.24); }
.chip[aria-current] { background: var(--accent); border-color: var(--accent); color: var(--ink); }

/* ─── EVENTKARTEN (wie eventcard_widget.dart) ─── */
.group { margin-top: 26px; content-visibility: auto; contain-intrinsic-size: auto 560px; }
.group h2 { font-size: 1.12rem; font-weight: 600; margin-bottom: 12px; }
.ec-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
.ec {
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; align-items: center; gap: 10px;
  min-height: 116px; padding: 14px 14px 14px 18px; border-radius: 16px;
  text-decoration: none; background: #3a3f4f;
  box-shadow: 0 6px 16px rgba(0,0,0,.3);
  transition: transform .15s, box-shadow .15s;
}
.ec:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,.35); }
.ec-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 55% 52%; z-index: -2; }
.ec::before { content: ""; position: absolute; inset: 0; z-index: -1; background: rgba(0,0,0,var(--dim)); }
.ec-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.ec-name {
  font-size: 1.15rem; font-weight: 800; line-height: 1.25; letter-spacing: -.01em;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  text-shadow: 0 1px 6px rgba(0,0,0,.45);
}
.ec-row { display: flex; align-items: center; gap: 6px; font-size: .94rem; color: rgba(255,255,255,.92); text-shadow: 0 1px 4px rgba(0,0,0,.5); min-width: 0; }
.ec-row svg { width: 16px; height: 16px; flex-shrink: 0; }
.ec-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ec-chev { width: 16px; height: 16px; flex-shrink: 0; color: rgba(255,255,255,.7); transition: transform .2s; }
.ec:hover .ec-chev { transform: translateX(3px); }
.ec-past .ec-bg { filter: grayscale(.7); }
.more {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 12px;
  font-size: .9rem; font-weight: 600; text-decoration: none; color: var(--text);
}
.more svg { width: 20px; height: 20px; }
.more:hover { text-decoration: underline; }

/* ─── CTA + STORE (wie die Website) ─── */
.cta {
  background: radial-gradient(ellipse 80% 100% at 50% -30%, rgba(245,160,74,.22) 0%, transparent 60%), rgba(20,24,36,.32);
  border: 1px solid var(--line-2); border-radius: 24px; padding: 26px 18px; margin: 8px 0 8px; text-align: center;
}
.cta h2 { font-size: 1.3rem; font-weight: 800; margin-bottom: 10px; text-wrap: balance; }
.cta p { color: var(--muted); max-width: 520px; margin: 0 auto; }
.page > .cta:not(:last-child) { margin-bottom: 20px; }

.store-row { display: flex; flex-direction: column; align-items: stretch; gap: 12px; margin-top: 20px; }
.store-btn {
  display: flex; align-items: center; justify-content: center; gap: 13px;
  background: rgba(0,0,0,.28); border: 1px solid var(--line);
  border-radius: 14px; padding: 12px 24px; text-decoration: none;
}
.store-btn:hover { border-color: rgba(245,160,74,.6); background: rgba(245,160,74,.1); }
.store-btn svg { width: 25px; height: 25px; flex-shrink: 0; }
.store-btn-txt { text-align: left; line-height: 1.2; }
.store-btn-txt small { display: block; color: var(--muted); font-size: .7rem; }
.store-btn-txt strong { font-size: .98rem; font-weight: 600; }

/* ─── FOOTER ─── */
.footer { background: rgba(10,14,24,.4); border-top: 1px solid var(--line-2); padding: 30px 16px; }
.footer-inner { max-width: var(--maxw); margin: 0 auto; display: flex; flex-direction: column; gap: 22px; }
.footer-l { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.footer-l .fw { font-weight: 800; }
.footer-l small { color: var(--faint); font-size: .8rem; }
.footer-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 16px; }
.footer-cols nav { display: flex; flex-direction: column; gap: 2px; }
.footer-cols strong { font-size: .74rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin-bottom: 6px; }
.footer-cols a { color: var(--muted); text-decoration: none; font-size: .86rem; padding: 4px 0; }
.footer-cols a:hover { color: var(--text); text-decoration: underline; }

/* ─── TABLET/DESKTOP ─── */
@media (min-width: 640px) {
  .nav { padding: 0 max(24px, calc((100vw - var(--maxw)) / 2)); }
  .nav-links .nav-we { display: inline; }
  .page { padding: 24px 24px 72px; }
  .hero { min-height: 300px; padding: 28px; }
  .glass { padding: 28px 30px; }
  .chips { flex-wrap: wrap; overflow: visible; margin: 0 0 14px; padding: 0; }
  .ec-grid { grid-template-columns: repeat(2, 1fr); }
  .app-btns { flex-direction: row; }
  .app-btns > a { flex: 1; }
  .store-row { flex-direction: row; justify-content: center; }
  .cta { padding: 32px 28px; }
  .footer-cols { grid-template-columns: repeat(3, 1fr); }
}
`;
