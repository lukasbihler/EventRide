# SEO-Seiten eventride.at

**Ziel:** eventride.at wird bei Google für Event-Namen und Kategorien in Kärnten gefunden (serverseitig gerenderte Seiten aus Firestore).
**Deadline:** Schritt 1 live auf eventride.at bis **2026-11-04** (erster Krampuslauf am 2026-11-06).
**Branch:** `feature/seo-event-pages` · Details, Entscheidungen und Abnahmen: [docs/seo-plan.md](../docs/seo-plan.md)

## Schritt 0 – Analyse
- [x] Analyse Hosting, Event-Felder, Review-Gate, Architektur (2026-10-30)

## Schritt 1 – Kern-Version
- [x] Event-Seiten `/event/{slug}` mit Serien-Slug + Archiv `event_pages` (2026-10-30)
- [x] Übersicht `/krampuslaeufe-kaernten` (2026-10-30)
- [x] `sitemap.xml`, `robots.txt`, sauberer 404 (2026-10-30)
- [x] Functions `seo`, `onEventWrittenSeo`, `seoSlugBackfill` deployt, Backfill gelaufen (2026-10-30)
- [x] FTP-Inventur World4You (nur Hoster-Dateien, keine `.htaccess`) (2026-10-30)
- [x] Abnahme Vorschau: Quelltext, Leak-Test, JSON-LD, Lighthouse (2026-10-30)
- [ ] Google Rich Results Test manuell (Event + Breadcrumb, auch ein mehrtägiges Event)
- [ ] `IOS_PROVIDER_TOKEN` in `functions/src/seo/render.ts` eintragen (Token vom Nutzer)
- [ ] Bildrechte der OG-Bilder prüfen (`krampus.jpg` = Instagram-Screenshot, Feuerwehrfoto mit Kennzeichen)
- [ ] `firestore.rules` mit Regel für `event_pages` beim nächsten Rules-Deploy mitnehmen

## Schritt 1b/2 – Ausbau + Design
- [x] Übersichtsseiten Kategorien, Themen, Bezirke, Wochenende (2026-10-30)
- [x] Startseite serverseitig (`public/home.html`) (2026-10-30)
- [x] Design 2b/2c/2d: Karten, Glas-Boxen, Kopfbilder, Filter, View Transitions (2026-10-31)
- [x] CLS-Fix Poppins-Ersatzschrift (2026-10-31)
- [ ] Design final abnehmen (Nutzer: „wird immer besser, noch nicht final“)
- [ ] Themenbilder liefern und mit `scripts/seo_bilder.ps1` einbauen
- [ ] Startseiten-Performance: Hero-Screenshot als LCP (Lighthouse 81–88)
- [ ] Eigene Hosting-Site für den Manager

## Livegang (DNS-Umzug)
- [ ] Domain verbinden: Firebase Hosting Custom Domain `www.eventride.at` + `eventride.at` → bei World4You nur A-Records `@` und `www` ändern (MX bleibt)
- [ ] SSL aktiv, `/datenschutz.html` 200, Passwort-Reset-Link testen, `X-Robots-Tag` am Manager prüfen
- [ ] SPF-Test: Testmail von `@eventride.at` an Gmail → SPF = PASS
- [ ] `.github/workflows/deploy-website.yml` von FTP auf Firebase Hosting umstellen
- [ ] Erst danach `feature/seo-event-pages` → `main` mergen
- [ ] CLAUDE.md (Hosting, `index.html` → `home.html`) und Memory `project_website_deploy` anpassen
- [ ] Sitemap in der Google Search Console einreichen

## Schritt 3 – später
- [ ] `/eintragen`-Formular ins bestehende Review-Gate
- [ ] Universal Links / App Links für `/event/…`
- [ ] Flyer-Upload (nur von Veranstaltern gelieferte oder freigegebene Flyer)

## Technik nebenbei
- [ ] Übrige Cloud Functions auf Node 22 deployen (Node 20 seit 2026-10-30 abgeschaltet, sonst nicht mehr änderbar)
