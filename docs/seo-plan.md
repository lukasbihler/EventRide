# SEO-Plan eventride.at

Stand: 30.10.2026 · Branch `feature/seo-event-pages`

## Auftrag (Original)

ZIEL
eventride.at soll bei Google für Event-Namen und Kategorien in Kärnten gefunden werden
(z. B. „Paternioner Teiflstreibn", „Krampusläufe Kärnten"). Dafür brauchen wir öffentliche,
serverseitig gerenderte HTML-Seiten aus den Firestore-Events. Die Flutter-App bleibt unverändert.
Termin: Schritt 1 live bis ca. 4.11.2026 – der erste Kärntner Krampuslauf ist am 6.11.

KONTEXT
- Landingpage eventride.at = statisches HTML auf Firebase Hosting. Der Abschnitt
  „Live aus der App" lädt die nächsten 3 Events per JavaScript – Google sieht davon nichts.
- Der Admin-Manager (eventride-cd0e9.web.app) schreibt Events nach Firestore. Bekannte Felder:
  name, datum, uhrzeit, standort, adresse, gemeinde, bezirk, typ, veranstalter, eintritt,
  beschreibung, Flyer-Bild. Typen laut Admin: e1 Kirchtag, e2 Feuerwehr, e3 Disco/Party,
  e4 Ball, e5 Krampus. Es gibt mehrtägige Events. Prüfe die echten Feldnamen im Code.
- Eintritt kann Zeilenumbrüche enthalten („VVK: 5 €" / „AK: 10 €"). Links in der
  Beschreibung sollen klickbar sein.
- Blaze-Plan, bestehende Cloud Functions. Firebase CLI immer über npx firebase-tools.

SCHRITT 0 – ANALYSE (nichts ändern)
Lies Repo-Struktur, firebase.json, Hosting-Setup der Landingpage, Event-Model,
Firestore-Rules und Cloud Functions. Liefere:
- ob Landingpage und Events im selben Firebase-Projekt bzw. derselben Hosting-Site liegen
- die echten Event-Felder und woran man freigegebene Events erkennt (Review-Gate)
- Architektur-Vorschlag: SSR per Cloud Function hinter Hosting-Rewrite mit CDN-Cache
  vs. statische Generierung per Build – mit Begründung, Kosten, Risiken
- Plan für Schritt 1 mit den betroffenen Dateien

SCHRITT 1 – KERN-VERSION (Ziel 4.11.)
a) Event-Seiten /event/{slug}
   - Slug aus Name + Gemeinde, ohne Jahreszahl. Einmal erzeugen und im Event speichern,
     damit er bei Namensänderungen gleich bleibt. Duplikate mit -2.
   - Mehrere Events mit gleichem Slug (z. B. Vorjahr): Seite zeigt den nächsten kommenden
     Termin, sonst den letzten mit Hinweis „vorbei".
   - Nur freigegebene Events. Öffentliche Felder als Whitelist: Name, Datum, Uhrzeit,
     Gemeinde, Bezirk, Kategorie, Beschreibung, Eintritt, Flyer-Vorschau, Anzahl
     angebotener Fahrten (nur anzeigen ab 1). Keine Nutzerdaten.
   - CTA: „Mitfahren oder Plätze anbieten – in der App" + Store-Links mit UTM-Parametern;
     iOS Smart App Banner (App-ID 6770869875).
   - SEO: Title „{Name} {Jahr} – Termin, Ort & Mitfahrgelegenheit | EventRide",
     Meta-Description mit Datum, Uhrzeit, Gemeinde; H1; canonical; OG/Twitter mit Flyer;
     JSON-LD Event (name, startDate, endDate, location mit address, image, description,
     organizer) + BreadcrumbList.
   - Interne Links: weitere Events im selben Bezirk, am selben Wochenende, gleiche Kategorie.
b) Übersicht /krampuslaeufe-kaernten: alle kommenden Krampus-Events nach Datum, kurzer
   Einleitungstext, gleiche SEO-Grundlagen, Links auf die Event-Seiten.
c) Dynamische sitemap.xml (Event- und Übersichtsseiten mit lastmod) + robots.txt,
   sauberer 404 für unbekannte Slugs.
d) Startseite: gut sichtbarer Link auf /krampuslaeufe-kaernten.

SCHRITT 2 – AUSBAU (danach)
/kirchtage-kaernten, /partys-kaernten, /baelle-kaernten, /feuerwehrfeste-kaernten,
/bezirk/{bezirk}, /wochenende; Event-Liste der Startseite serverseitig statt per JS.

SCHRITT 3 – SPÄTER
/eintragen-Formular ins bestehende Review-Gate; Universal/App Links für /event/…

DESIGN
Farben, Schriften und Stil wie die bestehende index.html, mobil zuerst.

ARBEITSWEISE
- Branch feature/seo-event-pages. Nach jedem Schritt stoppen, zusammenfassen,
  auf mein OK warten.
- Zuerst auf einem Hosting-Vorschaukanal testen (npx firebase-tools hosting:channel:deploy),
  live erst nach meinem OK.

ABNAHME
- Event-Text steht im Seitenquelltext (View-Source), nicht erst nach JavaScript.
- Google Rich Results Test ohne Fehler.
- sitemap.xml erreichbar, robots.txt verweist darauf.
- Keine privaten Felder im HTML oder in der Function-Antwort.
- Lighthouse Mobile ≥ 90.

## Entscheidungen nach Schritt 0

- **Hosting:** Die Domain eventride.at zieht von World4You zu Firebase Hosting. SSR läuft per Cloud Function hinter einem Hosting-Rewrite.
- **Slugs:** Serien-Slug plus Archiv. Ordnungszahlen („19.“) und Jahreszahlen werden aus dem Slug entfernt, damit Serien nicht jedes Jahr abreißen.
- **Felder:** Die Adresse des Veranstaltungsorts kommt auf die Whitelist. Ohne Flyer wird ein Kategoriebild verwendet. Den Flyer-Upload bauen wir später ein, dann aber nur mit Flyern, die Veranstalter liefern oder freigeben (Urheberrecht, keine Instagram-Übernahmen).
- **Ergänzungen:**
  1. Vor der DNS-Umstellung die World4You-Dateien mit `public/` abgleichen (`.htaccess`, `.well-known/`, Verifizierungsdateien) und die Redirects in `firebase.json` nachbauen.
  2. Trigger-Sicherheit: Der Slug wird nur geschrieben, wenn er fehlt. Beim Löschen eines Events bleiben die `event_pages` erhalten. Vorher wird geprüft, dass bei Bearbeitungen kein Overwrite passiert.
  3. Manager und `/auth/` werden nicht in `robots.txt` genannt, sondern per `X-Robots-Tag: noindex` ausgeschlossen. Eine eigene Hosting-Site für den Manager folgt in Schritt 2.
  4. Firestore-Standort prüfen. Ergebnis: nam5, deshalb bleibt die Function in us-central1.
  5. iOS-Links haben das Format `?pt={PROVIDER_TOKEN}&ct=seo-{slug}&mt=8`. Der Token kommt später, bis dahin steht dort eine TODO-Konstante.
  6. `index.html`: `og:url` und canonical auf `https://www.eventride.at/` setzen.
  7. Nach der Umstellung eine Testmail an Gmail schicken und prüfen, dass SPF = PASS ist.

## Schritt 0 – Analyse-Ergebnisse

### Hosting / Projekt
- **Landingpage liegt NICHT auf Firebase Hosting**, sondern auf World4You (Apache, IP 81.19.159.34). Deploy über `.github/workflows/deploy-website.yml` per FTP. Apex leitet per 301 auf `https://www.eventride.at/` um, d. h. Google kennt aktuell **www** als Hauptadresse.
- Firebase-Projekt `eventride-cd0e9` (`.firebaserc`). `firebase.json` hat bereits `hosting.public = "public"` und liefert denselben Ordner unter eventride-cd0e9.web.app aus (Manager). Events und Hosting liegen also im **selben Projekt**, nur die Domain zeigt woanders hin.
- DNS bei World4You (ns1/ns2.world4you.at). Geprüft: MX → `mail.eventride.at` mit eigenem A-Record 81.19.149.74, d. h. **Mail ist vom Umzug nicht betroffen**. **Keine AAAA-Records** vorhanden. Der TXT `firebase=eventride-cd0e9` existiert schon, SPF bleibt unverändert.
- Mit umziehen müssen (alle liegen in `public/`): `datenschutz.html` (in den Stores verlinkt), `impressum.html`, `agb.html`, `auth/email-action.html` und `auth/password-reset.html` (verlinkt aus `functions/src/index.ts:1086,1180`).
- **Entscheidung (mit dir abgestimmt):** Die Domain zieht zu Firebase Hosting, dazu eine SSR-Function hinter einem Hosting-Rewrite.

### Echte Event-Felder (`events`-Collection)
Geschrieben von `public/eventride_manager.html` (z. B. `:3392`, `:2823`, `:4294`) und `createEventContainer` (`functions/src/index.ts:1350`):
`id, name, datum (ISO-String), uhrzeit ("HH:MM"|null), standort, gemeinde, adresse, bezirk, typ (e0–e7), eintritt (mehrzeilig), beschreibung, latitude, longitude, pinned, adminOnly, isContainer, containerId, interessentenCount, createdAt` sowie die **privaten** Felder `mgrSrcQuelleTyp`, `mgrSrcQuelleLink` und `mgrSrcIgAccount`.
- Typen (`eventride_manager.html:508`): e1 Kirchtage/Feste, e2 Feuerwehr, e3 Disco/Party, e4 Ball, **e5 Krampus**, e6 Festival/Open-Air, e7 Sommer/Strand.
- **Kein Flyer-Feld** auf Events (`flyerPath` gibt es nur in `eventRequests`). **Veranstalter** wird nur in `pending_events` gespeichert, bei Direkt-Uploads fehlt er. Einige ältere Events haben nur `standort`, kein `gemeinde`. Fallback: `gemeinde || standort`.
- **Datum-Falle:** Der Manager speichert `${datum}T${uhr}:00.000Z`, also Wiener Ortszeit mit „Z“ dahinter. Freigaben über die App speichern Mitternacht UTC. → Datum aus den UTC-Komponenten lesen, Zeit aus `uhrzeit`, Offset über das vorhandene `getViennaOffsetHours()` (`functions/src/index.ts:17`).
- **Mehrtägig:** Ein Container (`isContainer:true`) plus eigenständige Kind-Events pro Tag (`containerId`). Die Seite gehört zum Container, die Kinder bekommen keinen eigenen Slug. Fahrten hängen an den Kind-IDs.

### Review-Gate
Es gibt kein Status-Feld auf `events`. **Freigegeben = Dokument liegt in `events` und `adminOnly != true`.** Entwürfe liegen in `pending_events` bzw. `eventRequests` (status pending). Rules: `firestore.rules:162` (`events` lesbar, wenn adminOnly false).

### Wichtiger Fund: Cleanup löscht Events
`cleanupAbgelaufeneEvents` (`functions/src/index.ts:1008`) löscht Events 30 Tage nach dem Datum. Ohne Archiv würde eine Event-URL danach bis zum nächsten Jahr 404 liefern. → Archiv-Collection `event_pages` (siehe unten).

### Architektur-Bewertung
| | SSR-Function + Firebase Hosting (**gewählt**) | Statisch generieren + FTP |
|---|---|---|
| Aktualität | sofort (CDN-Cache 10 min) | erst nach Cron-Lauf |
| Infrastruktur | einmalige DNS-Umstellung | kein Umzug |
| Wartung | keine wachsenden Dateien, Schritt 2/3 (Kategorien, Bezirk, App Links) einfach | FTP-Sync eines wachsenden Dateibaums, Secret in GitHub |
| Kosten | Blaze: Invocations + ein paar tausend Firestore-Reads pro Tag ≈ Cent-Bereich, Hosting-CDN 10 GB/Monat frei | GitHub-Minuten |
| Risiken | SSL-Provisionierung nach DNS-Wechsel (Minuten bis Stunden), Cold Start (vom CDN abgefedert) | veraltete Daten, FTP-Fehler |

---

## Plan für Schritt 1 (erst nach deinem OK)

### Slug-Logik (Serien-Slug + Archiv, abgestimmt)
- `seriesKey` = normalisierter Name (+ Gemeinde): Kleinschreibung, ä→ae, ö→oe, ü→ue, ß→ss, sonstige Zeichen → `-`. **Entfernt werden Ordnungszahlen und Jahreszahlen** (Tokens `^\d+\.?$`, `(19|20)\d\d`), z. B. „19. Ebentahler Krampuslauf“ → `ebentahler-krampuslauf`.
- Die Gemeinde wird nur angehängt, wenn kein Namens-Token mit ihrem ersten Wort beginnt. Beispiele: „Paternioner Teiflstreibn“ + Paternion → `paternioner-teiflstreibn`. „Krampuslauf“ + Ferlach → `krampuslauf-ferlach`.
- Gleicher `seriesKey` = gleiche Serie = gleicher Slug über Jahre. `-2` gibt es nur bei einer echten Kollision: In der Serie steht bereits ein *kommender* Termin, der weder derselbe Container ist noch innerhalb von 7 Tagen liegt.
- Der Slug wird einmal ins Event geschrieben (`slug`). Namensänderungen ändern ihn nicht.
- **Neue Collection `event_pages/{slug}`** mit `seriesKey`, `eventIds` und einem öffentlichen Snapshot des letzten Termins (nur Whitelist-Felder) sowie `updatedAt` (für die lastmod in der Sitemap). Sie bleibt nach dem Cleanup bestehen, dann erscheint der Hinweis „vorbei“.

### Trigger-Sicherheit (Ergänzung 2)
- `onEventWrittenSeo` schreibt `slug` **nur, wenn er fehlt** und das Event weder Container-Kind noch adminOnly ist. Der eigene Write findet beim zweiten Durchlauf den Slug bereits vor, es entsteht keine Schleife. Der `event_pages`-Snapshot wird nur geschrieben, wenn sich die Whitelist-Felder tatsächlich geändert haben.
- Beim Löschen (Cleanup oder manuell) bleibt `event_pages/{slug}`, es wird nur die ID per `arrayRemove` aus `eventIds` entfernt.
- Geprüft: Manager (`eventride_manager.html:1925`), App (`firestore_event_repository.dart:74`) und `updateEventContainer` (`index.ts:1435`) bearbeiten nur per `update()`. Der `slug` bleibt bei Namensänderungen erhalten, dort ist keine Änderung nötig. `set()` kommt nur bei Neuanlage vor.

### Öffentliche Whitelist
Name, Datum, Uhrzeit, Gemeinde, Bezirk, **Adresse (Veranstaltungsort)**, Kategorie, Beschreibung (Links klickbar, Zeilenumbrüche erhalten), Eintritt (Zeilenumbrüche erhalten), Anzahl Fahrten (nur ab 1), Veranstalter (nur falls gesetzt). Kein Flyer in Schritt 1: Als OG- und JSON-LD-Bild dient ein Kategoriebild aus `public/assets/image/`. Die `mgrSrc*`-Felder, Koordinaten-Rohdaten und Nutzerdaten gelangen nie ins HTML.

### Neue/geänderte Dateien
- `functions/src/seo/slug.ts`: `toSeriesKey()`, Normalisierung
- `functions/src/seo/data.ts`: lädt öffentliche Events (Memo pro Instanz, 5 min), mappt die Whitelist (`toPublicEvent()`), parst Datum und Wiener Zeit, fasst Container zusammen, zählt Fahrten per `count()`-Aggregation
- `functions/src/seo/render.ts`: HTML-Templates (Escape, Linkify, Layout), JSON-LD `Event` + `BreadcrumbList`, Meta/OG/Twitter, canonical, Smart App Banner (`apple-itunes-app` app-id=6770869875), Store-Links (Play: `&referrer=utm_source%3Deventride.at%26utm_medium%3Dseo%26utm_campaign%3D{slug}`, iOS: `?pt={PROVIDER_TOKEN}&ct=seo-{slug}&mt=8`, Token als Konstante `IOS_PROVIDER_TOKEN` mit TODO, bis du ihn lieferst)
- `functions/src/seo/ssr.ts`: `export const seo = onRequest(...)`, Routing für `/event/:slug`, `/krampuslaeufe-kaernten` und `/sitemap.xml`, sauberer 404 (Status 404 + Links). `Cache-Control: public, max-age=300, s-maxage=600`.
- `functions/src/seo/slugTrigger.ts`: `onEventWrittenSeo` (onDocumentWritten `events/{id}`) vergibt den Slug per Transaktion auf `event_pages` und aktualisiert den Snapshot. Dazu `seoSlugBackfill` (onSchedule täglich, einmal manuell in der Cloud Console anstoßen), der bestehende Events nachzieht und verpasste Trigger heilt. `onEventUpdated` (`index.ts:916`) ignoriert reine Slug-Änderungen bereits.
- `functions/src/index.ts`: Exporte ergänzen
- `firebase.json`: Rewrites `/event/**`, `/krampuslaeufe-kaernten` und `/sitemap.xml` → `{function:{functionId:"seo", region:"us-central1"}}`. Firestore liegt in **nam5** (US), deshalb bleibt die Function in us-central1, Europa würde die Latenz nur verschlechtern. Header-Caching für statische Assets. **`X-Robots-Tag: noindex`** für `/eventride_manager.html` und `/auth/**`. Weiterleitungen aus der Server-`.htaccess` (falls vorhanden) als `redirects` nachbauen. **Kein `cleanUrls`**, damit `/datenschutz.html` und `/auth/*.html` unverändert bleiben.
- `firestore.rules`: `event_pages` → `allow read, write: if false` (nur Admin SDK)
- `public/robots.txt`: `Allow: /` + `Sitemap: https://www.eventride.at/sitemap.xml`. Manager und `/auth/` werden dort **nicht** genannt. Eine getrennte Hosting-Site für den Manager kommt in Schritt 2.
- Fehlende Server-Dateien (s. Ergänzung 1) nach `public/` übernehmen
- `public/seo.css`: Tokens, Fonts und Karten aus `public/style.css`, mobil zuerst, kein JS
- `public/index.html`: gut sichtbarer Link „Krampusläufe in Kärnten“ im Events-Abschnitt + Nav, `og:url` → `https://www.eventride.at/`, `<link rel="canonical" href="https://www.eventride.at/">`
- `.github/workflows/ftp-inventory.yml` (temporär, nur lesend): Trigger per Push auf `feature/seo-event-pages`, `lftp` listet das Server-Verzeichnis rekursiv inkl. Dotfiles und lädt `.htaccess`, `.well-known/` und Verifizierungsdateien als Actions-Artefakt hoch. Danach Abgleich mit `public/` und Workflow wieder löschen. Das GitHub-Secret `FTP_PASS` landet dabei nicht im Log.
- `.github/workflows/deploy-website.yml`: erst nach der DNS-Umstellung von FTP auf `FirebaseExtended/action-hosting-deploy` umstellen (Secret `FIREBASE_SERVICE_ACCOUNT`). Bis dahin bleibt FTP als Rollback.
- Danach: `CLAUDE.md` (Hosting-Abschnitt) und Memory `project_website_deploy` aktualisieren

### Seiten-Inhalte
- **/event/{slug}:** Title „{Name} {Jahr} – Termin, Ort & Mitfahrgelegenheit | EventRide“, die Meta-Description nennt Datum, Uhrzeit und Gemeinde. Dazu H1, Detailblock, CTA „Mitfahren oder Plätze anbieten – in der App“. Angezeigt wird der nächste kommende Termin, sonst der letzte mit Hinweis „vorbei“ (gleiche Regel wie `eventHideAfter`: 6:00 am Folgetag). Interne Links: gleicher Bezirk, gleiches Wochenende (Fr–So) und gleiche Kategorie, je max. 4.
- **/krampuslaeufe-kaernten:** alle kommenden `typ == e5`, nach Datum, mit Einleitungstext, `ItemList`-JSON-LD und Breadcrumb
- **sitemap.xml:** Startseite, Übersicht und alle `event_pages` (auch die „vorbei“-Seiten, sie ranken fürs nächste Jahr) mit lastmod
- Canonical-Domain: **https://www.eventride.at** (behält den aktuellen Index, Apex → 301 auf www in Firebase)

### Ablauf und Termine
1. **30./31.10.:** Code schreiben, `npm run build` in `functions/`, Function deployen (`npx firebase-tools deploy --only functions:seo,functions:onEventWrittenSeo,functions:seoSlugBackfill,firestore:rules`). **Hinweis:** Der Trigger schreibt danach `slug` in Produktions-Events. Die App ignoriert unbekannte Felder. Backfill einmal ausführen.
2. FTP-Inventur (Ergänzung 1): Dateien, die nur auf dem Server liegen, übernehmen und `.htaccess`-Regeln nachbauen
3. Vorschau: `npx firebase-tools hosting:channel:deploy seo-preview` → Prüfung (s. u.) → **Stopp, dein OK**
4. **1.11. (nach OK):** Domain verbinden: Firebase Console → Hosting → Custom Domain `www.eventride.at` + `eventride.at` (Redirect auf www) → bei World4You **nur** die A-Records von `@` und `www` ändern. MX und `mail` bleiben unangetastet, keine AAAA anlegen. Warten bis SSL aktiv. Rollback: A-Records zurück auf 81.19.159.34.
5. Danach prüfen: Datenschutz-URL, `auth/*.html` (Passwort-Reset testen), Mail-Versand und -Empfang. GitHub-Workflow umstellen, Sitemap in der Search Console einreichen.
6. **Ab 2.11.:** Puffer, live spätestens am 4.11.

## Verifikation (Abnahme)
- `curl -s https://<preview>/event/<slug> | grep "<Eventname>"`: Der Event-Text steht im Quelltext, kein JS nötig.
- Den gesamten HTML-Output und die Antworten nach `mgrSrc`, `QuelleLink`, `igAccount` und `userId` durchsuchen → 0 Treffer.
- Google Rich Results Test (Event + Breadcrumb) für 2–3 Event-Seiten ohne Fehler, darunter eine mehrtägige.
- `/sitemap.xml` gültig, `robots.txt` verweist darauf, ein unbekannter Slug liefert HTTP 404.
- Lighthouse Mobile ≥ 90 (Event-Seite + Übersicht).
- Nach der DNS-Umstellung: `Resolve-DnsName` (A, MX), HTTPS ok, `/datenschutz.html` 200, Passwort-Reset-Link funktioniert, `X-Robots-Tag` am Manager gesetzt.
- Testmail von `@eventride.at` an Gmail senden und im Original-Header **SPF = PASS** prüfen (dazu auch eine Mail über `_spf.firebasemail.com`, z. B. Passwort-Reset).

---

## Stand Schritt 1 (30.10.2026), bereit für die DNS-Umstellung

**Deployt (Produktion, unsichtbar bis zur DNS-Umstellung):** Functions `seo`, `onEventWrittenSeo` und `seoSlugBackfill` (Node 22, us-central1). Der Backfill ist gelaufen: 57 Events geprüft, 49 Event-Seiten in `event_pages`.
**Vorschau:** https://eventride-cd0e9--seo-preview-eukxkzyl.web.app (bis 6.11.)

**Abnahme auf der Vorschau**
- Der Event-Text steht im Quelltext (H1, Fakten, Beschreibung, JSON-LD), es ist kein JS nötig.
- Leak-Test über alle 51 URLs gegen 45 echte private Werte (`mgrSrcQuelleLink`/`mgrSrcIgAccount`): 0 Lecks. Der einzige Treffer war ein Ticket-Link, der ohnehin in der öffentlichen Beschreibung steht.
- JSON-LD auf allen Seiten gültig. Den Rich Results Test von Google noch manuell durchführen.
- Lighthouse Mobile: Performance 100, Barrierefreiheit 100, Best Practices 100. SEO 69 nur wegen `X-Robots-Tag: noindex`, das Firebase auf Vorschaukanälen erzwingt.
- Sitemap 200, `robots.txt` 200, unbekannter Slug liefert 404, Großschreibung und abschließender Slash liefern 301.

**Abweichungen vom Plan**
- `firestore.rules` wurde nicht deployt. `event_pages` ist ohne Catch-all-Regel ohnehin für Clients gesperrt, die Regel geht mit dem nächsten regulären Rules-Deploy mit.
- CSS wird inline ausgeliefert (`functions/src/seo/styles.ts`) statt über `public/seo.css`, wegen des LCP.
- Node 20 wurde am 30.10.2026 abgeschaltet, deshalb wurde `functions/package.json` auf Node 22 umgestellt. **Die übrigen Functions laufen noch auf Node 20 und lassen sich erst nach einem Deploy auf Node 22 wieder ändern.**
- FTP-Inventur: Auf dem Server liegen nur Hoster-Dateien (`error/`, `stats/`), keine `.htaccess`, kein `.well-known/`. `index.html` und `style.css` auf dem Server sind identisch mit `main`.

**Offen**
- `IOS_PROVIDER_TOKEN` in `functions/src/seo/render.ts` (TODO)
- Bildrechte der OG-Bilder prüfen: `krampus.jpg` ist ein Instagram-Screenshot, das Feuerwehrfoto zeigt ein Kennzeichen.
- DNS-Umstellung, danach Workflow auf Firebase Hosting umstellen, CLAUDE.md anpassen, Sitemap in der Search Console einreichen, SPF-Test.
- **Merge-Reihenfolge:** `main` erst nach der DNS-Umstellung mergen. Sonst deployt der FTP-Workflow die neue `index.html` mit Links auf `/krampuslaeufe-kaernten`, und die liefern bei World4You 404.

## Erweiterung Schritt 1b (30.10.2026): alle Kategorien, App-Optik

Auf Wunsch vor der DNS-Umstellung ergänzt (zieht Teile von Schritt 2 vor):

- **Übersichtsseiten** (`functions/src/seo/hubs.ts`, eine Vorlage `renderHubPage`):
  - `/events-kaernten` (alle), `/wochenende-kaernten` (Fr–So, nach Tag gruppiert)
  - Kategorien = App-Typen: `/kirchtage-kaernten` (e1), `/feuerwehrfeste-kaernten` (e2), `/partys-kaernten` (e3), `/baelle-kaernten` (e4), `/krampuslaeufe-kaernten` (e5), `/festivals-kaernten` (e6), `/sommerfeste-kaernten` (e7)
  - Themen über den Eventnamen: `/halloween-kaernten`, `/silvester-kaernten`, `/fasching-kaernten`, `/maturabaelle-kaernten`, `/zeltfeste-kaernten`, `/oktoberfeste-kaernten`
  - Bezirke: `/events-klagenfurt`, `-klagenfurt-land`, `-villach`, `-villach-land`, `-spittal`, `-st-veit`, `-wolfsberg`, `-voelkermarkt`, `-feldkirchen`, `-hermagor`
  - Jede Seite zeigt kommende Termine und „Bisherige Termine“ aus `event_pages` (bis 400 Tage zurück). Ohne beides: `noindex`, nicht in Sitemap, Chips und Footer.
- **Optik wie die App:** Verlauf + 40 % Schwarz (detail_page), Eventkarten mit Kategoriebild und Abdunklung (eventcard_widget), Infokarte mit Material-Icons, „Zum Event navigieren“ (Google-Maps-Suche nach Adresse + Gemeinde), Buttons „Fahrten finden“ / „Fahrt anbieten“ (mit JS direkt in den passenden Store). Navigation, Store-Buttons und CTA wie die Website.
- **Bilder:** App-Kategoriebilder aus `assets/image/` (Lizenz laut Nutzer ok) als `public/assets/og/{kirchtag,feuerwehr,disco,ball,krampus,festival,beach}.jpg` (1200×630) und `-640.jpg` (Karten, mobiler Hero). Krampus-Bild so zugeschnitten, dass die „1/2“-Einblendung wegfällt.
- **Startseite:** Chip-Leiste aller Kategorien statt des Krampus-Buttons, Nav-Link „Eventkalender“ → `/events-kaernten`.
- **Hosting:** Rewrite per Regex `^/(events-[a-z-]+|[a-z-]+-kaernten)/?$` → `seo`.
- **Performance:** HTML wird in der Function mit Brotli/Gzip gepackt (52 KB → 7 KB), Hero mobil immer 640 px (`<picture>`), Logo 64 px, `content-visibility` für Kartengruppen.
- **Abnahme Vorschau:** Lighthouse Mobile Event-Seite 94/100/100, `/events-kaernten` 94/100/100, `/krampuslaeufe-kaernten` 98/100/100 (SEO 69 nur wegen Vorschau-noindex). Leak-Test 81 URLs gegen 47 private Werte: nur der bekannte, öffentlich beschriebene Ticket-Link.
