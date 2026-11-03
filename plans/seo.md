# SEO-Seiten eventride.at

**Ziel:** eventride.at wird bei Google für Event-Namen und Kategorien in Kärnten gefunden (serverseitig gerenderte Seiten aus Firestore).
**Deadline:** Schritt 1 live auf eventride.at bis **2026-11-04** (erster Krampuslauf am 2026-11-06).
> Jarvis 31.10.: Frist weich – Lukas will bis 04.11. live, aber Höfler und Lithophanie haben Vorrang; EventRide nachrangig.
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
- [x] Bildrechte der OG-Bilder geprüft, passen laut Lukas (2026-11-03)
- [ ] `firestore.rules` mit Regel für `event_pages` beim nächsten Rules-Deploy mitnehmen

## Schritt 1b/2 – Ausbau + Design
- [x] Übersichtsseiten Kategorien, Themen, Bezirke, Wochenende (2026-10-30)
- [x] Startseite serverseitig (`public/home.html`) (2026-10-30)
- [x] Design 2b/2c/2d: Karten, Glas-Boxen, Kopfbilder, Filter, View Transitions (2026-10-31)
  > Jarvis 31.10.: Abnahme begonnen, Lukas hat noch einige Designänderungen.
- [x] CLS-Fix Poppins-Ersatzschrift (2026-10-31)
- [x] Design 2d-Feinschliff: Poster-Text, Detailseite mit Fakten-Leiste + Beschreibung, Schärfe DPR 1, Download-Bereich, Footer (2026-11-01, nur Vorschau)
- [x] Glas-Boxen hell übernommen (Karten + Boxen), nur die Tageszeile bleibt dunkel; Test-Schalter entfernt (2026-11-02)
- [x] Boxen auf den Typ-/Themenseiten aufgewertet: Uhrzeit-Plakette mit orangem Rand, Ort + Bezirk, Chips für Fahrten / „wollen hin“ (2026-11-02, live auf web.app inkl. 2d-Feinschliff)
- [x] Boxen neu als „Abfahrtstafel“-Zeilen: eine Spalte, Desktop Zeit | Event | Mitfahren | Button, Handy kompakt mit Button neben der Uhrzeit (2026-11-03, nur Vorschau); Timeline verworfen (man wählt ein Event, klappert nicht mehrere ab)
- [x] Abfahrtstafel-Zeilen abgenommen (2026-11-03)
- [x] Abfahrtstafel live auf web.app (2026-11-03)
- [x] Design für den Livegang abgenommen („so lassen wir es fürs erste“) (2026-11-03)
- [ ] Themenbilder liefern und mit `scripts/seo_bilder.ps1` einbauen
- [ ] Startseiten-Performance: Hero-Screenshot als LCP (Lighthouse 81–88)
- [ ] Eigene Hosting-Site für den Manager

## Livegang (DNS-Umzug)
- [x] Domain verbunden: `@` A 199.36.158.100, `www` CNAME eventride-cd0e9.web.app, TXT `hosting-site=eventride-cd0e9`; `ftp` + Mail unverändert. Rollback: `@` + `www` A 81.19.159.34 (2026-11-03)
- [x] SSL aktiv (Google Trust Services, bis 2027-02-01), `eventride.at` → 301 www, `/datenschutz.html` 200, Sitemap 83 URLs, 404 ok, `X-Robots-Tag` an Manager und `/auth/` (2026-11-03)
- [ ] Passwort-Reset einmal echt aus der App testen (Seiten unter `/auth/` liefern 200)
- [x] SPF-Test: SPF, DKIM, DMARC = PASS (2026-11-03)
  > Testmail landete trotzdem im Gmail-Spam – keine DNS-Ursache, siehe Antwort im Chat
- [ ] `.github/workflows/deploy-website.yml` von FTP auf Firebase Hosting umstellen
- [ ] Erst danach `feature/seo-event-pages` → `main` mergen
- [ ] CLAUDE.md (Hosting, `index.html` → `home.html`) und Memory `project_website_deploy` anpassen
- [ ] Sitemap in der Google Search Console einreichen

## Schritt 3 – später
- [ ] Nach dem Livegang: Schutz gegen automatisches Abgreifen der Event-Daten (Scraping durch andere Apps/Seiten) prüfen und ggf. umsetzen
- [ ] `/eintragen`-Formular ins bestehende Review-Gate
- [ ] Universal Links / App Links für `/event/…`
- [ ] Flyer-Upload (nur von Veranstaltern gelieferte oder freigegebene Flyer)

## Technik nebenbei
- [ ] Übrige Cloud Functions auf Node 22 deployen (Node 20 seit 2026-10-30 abgeschaltet, sonst nicht mehr änderbar)
