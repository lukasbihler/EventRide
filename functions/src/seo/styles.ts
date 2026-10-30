// Stylesheet der SEO-Seiten (/event/…, /krampuslaeufe-kaernten).
// Wird inline ausgeliefert, damit kein render-blockierender CSS-Request das
// LCP verzögert (Ziel: Lighthouse Mobile ≥ 90). Tokens und Komponenten wie
// public/style.css (Navy-Theme), mobil zuerst.

export const SEO_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-deep:  #081422;
  --panel:    rgba(255,255,255,.055);
  --orange:   #F79B3D;
  --orange-2: #FFB662;
  --ink:      #1a0e02;
  --blue:     #4FA3FF;
  --text:     #EAF0FA;
  --muted:    rgba(234,240,250,.68);
  --faint:    rgba(234,240,250,.55);
  --border:   rgba(255,255,255,.08);
  --border-2: rgba(255,255,255,.14);
  --maxw:     880px;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background:
    radial-gradient(90% 40% at 70% -10%, rgba(120,150,190,.10), transparent 60%),
    linear-gradient(180deg, #0C1929 0%, #0A1523 55%, #081221 100%) fixed;
  background-color: #081221;
  color: var(--text);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
h1, h2, h3 { font-family: 'Poppins', sans-serif; letter-spacing: -.02em; line-height: 1.15; }
a { color: var(--orange); }
a:focus-visible { outline: 2px solid var(--orange); outline-offset: 3px; border-radius: 4px; }
img, svg { max-width: 100%; }

/* ─── NAV ─── */
.nav {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  height: 60px; padding: 0 16px;
  background: color-mix(in srgb, var(--bg-deep) 88%, transparent);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}
.nav-logo {
  display: flex; align-items: center; gap: 9px; text-decoration: none; color: var(--text);
  font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 1.05rem;
}
.nav-logo img { border-radius: 8px; }
.r { color: var(--orange); }
.nav-links { display: flex; align-items: center; gap: 16px; }
.nav-links a { color: var(--muted); text-decoration: none; font-size: .88rem; font-weight: 600; }
.nav-links a:hover { color: var(--text); }
.nav-links .nav-cta {
  background: var(--orange); color: var(--ink);
  padding: 8px 16px; border-radius: 100px; font-weight: 700;
}
.nav-links .nav-cta:hover { background: var(--orange-2); color: var(--ink); }

/* ─── PAGE ─── */
.page { max-width: var(--maxw); margin: 0 auto; padding: 20px 16px 56px; }
.crumbs { font-size: .8rem; color: var(--faint); margin-bottom: 22px; display: flex; flex-wrap: wrap; gap: 6px; }
.crumbs a { color: var(--muted); text-decoration: none; }
.crumbs a:hover { color: var(--text); }
.crumbs .sep { color: var(--faint); }

.ev-head { margin-bottom: 24px; }
.ev-head h1 { font-size: clamp(1.8rem, 6vw, 2.8rem); font-weight: 800; margin: 12px 0 10px; text-wrap: balance; }
.ev-sub { color: var(--muted); display: flex; gap: 8px; align-items: flex-start; font-size: .98rem; }
.ev-sub svg { width: 17px; height: 17px; flex-shrink: 0; margin-top: 4px; color: var(--orange); }
.lead { color: var(--muted); font-size: 1.02rem; max-width: 680px; }

.ev-typ { display: inline-block; font-size: .68rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; border-radius: 100px; padding: 4px 12px; }
.typ-e1 { background: rgba(255,154,60,.13); color: var(--orange); }
.typ-e2 { background: rgba(255,107,107,.13); color: #FF8A8A; }
.typ-e3 { background: rgba(93,169,255,.13); color: var(--blue); }
.typ-e4 { background: rgba(244,143,177,.13); color: #F48FB1; }
.typ-e5 { background: rgba(179,157,219,.15); color: #C7B5EA; }

.notice {
  background: rgba(247,155,61,.08); border: 1px solid rgba(247,155,61,.3);
  border-radius: 14px; padding: 14px 16px; margin-bottom: 22px; color: var(--text);
}

.facts {
  display: grid; grid-template-columns: 1fr; gap: 1px;
  background: var(--border); border: 1px solid var(--border-2); border-radius: 18px; overflow: hidden;
  margin-bottom: 26px;
}
.facts div { background: #0D1A2C; padding: 13px 16px; display: grid; grid-template-columns: 104px 1fr; gap: 12px; }
.facts dt { color: var(--faint); font-size: .8rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding-top: 2px; }
.facts dd { font-weight: 500; }

.cta {
  background: radial-gradient(ellipse 80% 100% at 50% -30%, rgba(255,154,60,.14) 0%, transparent 60%), var(--panel);
  border: 1px solid var(--border-2); border-radius: 22px; padding: 24px 18px; margin-bottom: 32px; text-align: center;
}
.cta h2 { font-size: 1.3rem; margin-bottom: 10px; text-wrap: balance; }
.cta p { color: var(--muted); max-width: 520px; margin: 0 auto; }
.cta .fahrten { color: var(--text); margin-bottom: 8px; }
.cta .fahrten strong { color: var(--orange); }

.store-row { display: flex; flex-direction: column; align-items: stretch; gap: 12px; margin-top: 20px; }
.store-btn {
  display: flex; align-items: center; justify-content: center; gap: 13px;
  background: rgba(255,255,255,.04); border: 1px solid var(--border-2);
  border-radius: 14px; padding: 12px 24px; text-decoration: none; color: var(--text);
}
.store-btn:hover { border-color: rgba(255,154,60,.4); background: rgba(255,154,60,.05); }
.store-btn svg { width: 25px; height: 25px; flex-shrink: 0; }
.store-btn-txt { text-align: left; line-height: 1.2; }
.store-btn-txt small { display: block; color: var(--muted); font-size: .7rem; }
.store-btn-txt strong { font-size: .98rem; font-weight: 600; font-family: 'Poppins', sans-serif; }

.desc { margin-bottom: 36px; }
.desc h2 { font-size: 1.3rem; margin-bottom: 12px; }
.desc p { color: var(--muted); margin-bottom: 12px; overflow-wrap: anywhere; }

/* ─── KARTEN ─── */
.related { margin-bottom: 32px; }
.related h2 { font-size: 1.15rem; margin-bottom: 14px; }
.ev-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.ev-card {
  background: var(--panel); border: 1px solid var(--border-2); border-radius: 18px;
  padding: 16px; text-decoration: none; color: var(--text);
  display: flex; flex-direction: column; gap: 10px;
}
.ev-card:hover { border-color: rgba(247,155,61,.4); }
.ev-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ev-cal { width: 52px; border-radius: 12px; overflow: hidden; text-align: center; border: 1px solid var(--border-2); background: rgba(255,255,255,.04); flex-shrink: 0; }
.ev-cal strong { display: block; font-family: 'Poppins', sans-serif; font-size: 1.35rem; font-weight: 700; line-height: 1.25; padding-top: 3px; }
.ev-cal span { display: block; font-size: .62rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; padding: 3px 0 5px; background: rgba(247,155,61,.16); color: var(--orange); }
.ev-name { font-size: 1rem; font-weight: 600; line-height: 1.35; }
.ev-loc { color: var(--faint); font-size: .84rem; display: flex; align-items: center; gap: 6px; }
.ev-loc svg { width: 13px; height: 13px; flex-shrink: 0; }
.ev-go { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; color: var(--orange); font-size: .84rem; font-weight: 700; }
.ev-go svg { width: 16px; height: 16px; }

.btn-p, .btn-s {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 22px; border-radius: 13px; font-weight: 700; font-size: .95rem; text-decoration: none; margin: 0 8px 10px 0;
}
.btn-p { background: var(--orange); color: var(--ink); }
.btn-s { border: 1px solid var(--border-2); color: var(--text); }

/* ─── FOOTER ─── */
.footer { background: rgba(5,10,18,.5); border-top: 1px solid var(--border); padding: 28px 16px; }
.footer-inner { max-width: var(--maxw); margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.footer-l { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.footer-l .fw { font-family: 'Poppins', sans-serif; font-weight: 700; }
.footer-l small { color: var(--faint); font-size: .8rem; }
.footer-links { display: flex; gap: 8px 20px; flex-wrap: wrap; }
.footer-links a { color: var(--muted); text-decoration: none; font-size: .85rem; padding: 4px 0; }
.footer-links a:hover { color: var(--text); }

/* ─── TABLET/DESKTOP ─── */
@media (min-width: 640px) {
  .nav { padding: 0 max(24px, calc((100vw - var(--maxw)) / 2)); }
  .page { padding: 32px 24px 72px; }
  .ev-grid { grid-template-columns: repeat(2, 1fr); }
  .store-row { flex-direction: row; justify-content: center; }
  .cta { padding: 32px 28px; }
  .facts div { grid-template-columns: 130px 1fr; }
  .footer-inner { flex-direction: row; justify-content: space-between; align-items: center; }
}
@media (min-width: 900px) {
  .ev-grid { grid-template-columns: repeat(3, 1fr); }
}
`;
