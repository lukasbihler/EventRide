// Stylesheet der SEO-Seiten (/event/…, Übersichtsseiten).
// Wird inline ausgeliefert, damit kein render-blockierender CSS-Request das
// LCP verzögert (Ziel: Lighthouse Mobile ≥ 90). Tokens und Komponenten wie
// public/style.css (Navy-Theme), mobil zuerst. Die Kategoriebilder der App
// erscheinen nur gedämpft (Kopfbereich, Schimmer in den Eventkarten).

export const SEO_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-deep:  #081422;
  --panel:    rgba(255,255,255,.055);
  --orange:   #F79B3D;
  --orange-2: #FFB662;
  --ink:      #1a0e02;
  --blue:     #4FA3FF;
  --amber:    #FFC107;
  --red:      #FF6B6B;
  --text:     #EAF0FA;
  --muted:    rgba(234,240,250,.7);
  --faint:    rgba(234,240,250,.6);
  --border:   rgba(255,255,255,.08);
  --border-2: rgba(255,255,255,.14);
  --maxw:     880px;
}

html { background: #081221; }
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
.i-amber { color: var(--amber); }
.i-red   { color: var(--red); }
.i-soft  { color: var(--faint); }

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
.nav-links .nav-we { display: none; }
.nav-links .nav-cta {
  background: var(--orange); color: var(--ink);
  padding: 8px 16px; border-radius: 100px; font-weight: 700;
}
.nav-links .nav-cta:hover { background: var(--orange-2); color: var(--ink); }

/* ─── PAGE ─── */
.page { max-width: var(--maxw); margin: 0 auto; padding: 20px 16px 56px; }
.crumbs { font-size: .8rem; color: var(--faint); margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 6px; }
.crumbs a { color: var(--muted); text-decoration: none; }
.crumbs a:hover { color: var(--text); }
.crumbs .sep { color: var(--faint); }

/* Kopfbereich: Kategoriebild gedämpft, läuft nach unten in den Hintergrund aus */
.ev-head {
  position: relative; isolation: isolate; overflow: hidden;
  margin: 0 -16px 22px; padding: 64px 16px 6px;
}
.head-img {
  position: absolute; inset: 0; z-index: -1;
  width: 100%; height: 100%; object-fit: cover; object-position: 55% 45%;
  opacity: .32;
  -webkit-mask-image: linear-gradient(180deg, #000 0%, rgba(0,0,0,.6) 45%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, rgba(0,0,0,.6) 45%, transparent 100%);
}
.ev-head-plain { padding-top: 12px; }
.ev-head h1 { font-size: clamp(1.8rem, 6vw, 2.8rem); font-weight: 800; margin: 12px 0 10px; text-wrap: balance; }
.ev-head-plain h1 { margin-top: 0; }
.ev-sub { color: var(--muted); display: flex; gap: 8px; align-items: flex-start; font-size: .98rem; }
.ev-sub svg { width: 17px; height: 17px; flex-shrink: 0; margin-top: 4px; color: var(--orange); fill: currentColor; }
.ev-sub svg[stroke] { fill: none; }
.lead { color: var(--muted); font-size: 1.02rem; max-width: 680px; margin-bottom: 20px; }

.ev-typ { display: inline-block; font-size: .68rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; border-radius: 100px; padding: 4px 12px; }
.typ-e1 { background: rgba(255,154,60,.13); color: var(--orange); }
.typ-e2 { background: rgba(255,107,107,.13); color: #FF8A8A; }
.typ-e3 { background: rgba(93,169,255,.13); color: var(--blue); }
.typ-e4 { background: rgba(244,143,177,.13); color: #F48FB1; }
.typ-e5 { background: rgba(179,157,219,.15); color: #C7B5EA; }
.typ-past { background: rgba(255,255,255,.08); color: var(--muted); }

.notice {
  background: rgba(247,155,61,.08); border: 1px solid rgba(247,155,61,.3);
  border-radius: 14px; padding: 14px 16px; margin-bottom: 22px; color: var(--text);
}

/* ─── FAKTEN (Icons in den App-Farben) ─── */
.facts {
  list-style: none; display: grid; grid-template-columns: 1fr; gap: 1px;
  background: var(--border); border: 1px solid var(--border-2); border-radius: 18px; overflow: hidden;
  margin-bottom: 26px;
}
.facts li { background: #0D1A2C; padding: 13px 16px; display: flex; gap: 12px; align-items: flex-start; }
.facts li > svg { width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px; fill: currentColor; }
.facts li > div { min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.facts .lbl { display: block; color: var(--faint); font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 1px; }
.facts small { display: block; color: var(--muted); font-size: .86rem; margin-top: 2px; }
.facts small a, .facts li > div > a:not(.maps) { color: var(--text); text-decoration-color: rgba(234,240,250,.35); text-underline-offset: 3px; }
.facts .maps { display: inline-block; margin-top: 6px; font-size: .86rem; font-weight: 600; text-decoration: none; }
.facts .maps::after { content: " →"; }
.facts .maps:hover { text-decoration: underline; }

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

/* ─── CHIPS ─── */
.chips {
  display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
  margin: 0 -16px 12px; padding: 2px 16px 4px;
}
.chips::-webkit-scrollbar { display: none; }
.chip {
  flex-shrink: 0; display: inline-flex; align-items: center; white-space: nowrap;
  padding: 7px 15px; border-radius: 100px;
  background: rgba(255,255,255,.04); border: 1px solid var(--border-2);
  color: var(--text); font-size: .84rem; font-weight: 600; text-decoration: none;
}
.chip:hover { border-color: rgba(255,154,60,.45); background: rgba(255,154,60,.06); }
.chip[aria-current] { background: var(--orange); border-color: var(--orange); color: var(--ink); }

/* ─── KARTEN ─── */
.related { margin: 28px 0 32px; }
.related h2 { font-size: 1.15rem; margin-bottom: 14px; }
.ev-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.ev-card {
  position: relative; isolation: isolate; overflow: hidden;
  background: var(--panel); border: 1px solid var(--border-2); border-radius: 18px;
  padding: 16px; text-decoration: none; color: var(--text);
  display: flex; flex-direction: column; gap: 10px;
}
.ev-card:hover { border-color: rgba(247,155,61,.4); }
/* Kategoriebild als schwacher Schimmer rechts, nach links ausgeblendet */
.ev-img {
  position: absolute; top: 0; right: 0; z-index: -1;
  width: 62%; height: 100%; object-fit: cover; object-position: 60% 50%;
  opacity: .2; transition: opacity .2s;
  -webkit-mask-image: linear-gradient(270deg, #000 0%, rgba(0,0,0,.5) 45%, transparent 100%);
  mask-image: linear-gradient(270deg, #000 0%, rgba(0,0,0,.5) 45%, transparent 100%);
}
.ev-card:hover .ev-img { opacity: .3; }
.ev-past .ev-img { filter: grayscale(1); }
.ev-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ev-cal { width: 52px; border-radius: 12px; overflow: hidden; text-align: center; border: 1px solid var(--border-2); background: rgba(8,20,34,.6); flex-shrink: 0; }
.ev-cal strong { display: block; font-family: 'Poppins', sans-serif; font-size: 1.35rem; font-weight: 700; line-height: 1.25; padding-top: 3px; }
.ev-cal span { display: block; font-size: .62rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; padding: 3px 0 5px; background: rgba(247,155,61,.16); color: var(--orange); }
.ev-name { font-size: 1rem; font-weight: 600; line-height: 1.35; }
.ev-loc { color: var(--muted); font-size: .84rem; display: flex; align-items: center; gap: 6px; }
.ev-loc svg { width: 13px; height: 13px; flex-shrink: 0; }
.ev-go { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--orange); font-size: .84rem; font-weight: 700; }
.ev-go svg { width: 16px; height: 16px; flex-shrink: 0; transition: transform .2s; }
.ev-card:hover .ev-go svg { transform: translateX(3px); }
.ev-past .ev-go { color: var(--muted); }
.more { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: .9rem; font-weight: 700; text-decoration: none; }
.more svg { width: 16px; height: 16px; }
.more:hover { text-decoration: underline; }

.btn-p, .btn-s {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 22px; border-radius: 13px; font-weight: 700; font-size: .95rem; text-decoration: none; margin: 0 8px 10px 0;
}
.btn-p { background: var(--orange); color: var(--ink); }
.btn-s { border: 1px solid var(--border-2); color: var(--text); }

/* ─── FOOTER ─── */
.footer { background: rgba(5,10,18,.5); border-top: 1px solid var(--border); padding: 30px 16px; }
.footer-inner { max-width: var(--maxw); margin: 0 auto; display: flex; flex-direction: column; gap: 22px; }
.footer-l { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.footer-l .fw { font-family: 'Poppins', sans-serif; font-weight: 700; }
.footer-l small { color: var(--faint); font-size: .8rem; }
.footer-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 16px; }
.footer-cols nav { display: flex; flex-direction: column; align-items: flex-start; }
.footer-cols strong { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin-bottom: 6px; }
.footer-cols a { color: var(--muted); text-decoration: none; font-size: .85rem; padding: 8px 0; min-height: 36px; }
.footer-cols a:hover { color: var(--text); }

/* ─── TABLET/DESKTOP ─── */
@media (min-width: 640px) {
  .nav { padding: 0 max(24px, calc((100vw - var(--maxw)) / 2)); }
  .nav-links .nav-we { display: inline; }
  .page { padding: 32px 24px 72px; }
  .ev-head { margin: 0 0 24px; padding: 96px 28px 8px; border-radius: 22px 22px 0 0; }
  .ev-head-plain { padding: 12px 0 0; }
  .chips { flex-wrap: wrap; overflow: visible; margin: 0 0 12px; padding: 0; }
  .ev-grid { grid-template-columns: repeat(2, 1fr); }
  .store-row { flex-direction: row; justify-content: center; }
  .cta { padding: 32px 28px; }
  .footer-cols { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 900px) {
  .ev-grid { grid-template-columns: repeat(3, 1fr); }
}
`;
