# PITFALLS — Lehren aus EventRide für den Hof-Manager

**Stand:** 07.10.2026 · **Quelle:** EventRide-Repo (`main` @ `e55c9e6`): `lib/`, `functions/src/`, Rules, Skripte, `CLAUDE.md`, Projekt-Notizen und die Git-Historie (366 Commits, davon **181 mit fix/bug/workaround/revert**, also knapp die Hälfte).
**Zweck:** Jedes Problem, das in EventRide spürbar Zeit gekostet hat, mit Beleg und einer **Regel**, die im Hof-Manager von Tag 1 gilt. Die verbindliche Umsetzung der Regeln steht in `CONVENTIONS.md`.

**Format pro Eintrag:**
- **Problem** — was schiefging
- **Kosten/Beleg** — warum es teuer war; Commit-Hashes und Dateipfade beziehen sich auf das EventRide-Repo
- **Regel** — was im Hof-Manager gilt

**Wo die Zeit hinging (Commit-Zählung nach Thema):**

| Thema | Commits | Bemerkung |
|---|---:|---|
| Build-Loop-Commits | 45 | 17 davon ändern nur die Versionsnummer |
| iOS-Build/Signing/Xcode | 42 | Allein 53 Commits vom 19.–21.05. |
| Push/Notifications | 18 | Duplikate, falsche Empfänger, falsche Namen |
| Datum/Uhrzeit/Zeitzone | 11 | Format-Mix, UTC vs. Wien, „Tag N" |
| Rules/Berechtigungen | 9 | PERMISSION_DENIED in Produktion, Sichtbarkeits-Leck |
| Blur/Transitions/Swipe-Back | 8 | 6 Anläufe in 11 Tagen |
| Offline/Timeout/Hänger | 7 | Offline-Banner in 3 Anläufen über 3 Wochen |
| SHA-1/API-Keys | 7 | Login nur in der Store-Version kaputt |

---

## 1. Plattform iOS/Android

### P1.1 Eigene Seitentransitions brechen die iOS-Zurück-Geste
- **Problem:** Ein eigener `PageTransitionsBuilder` (Slide ohne Secondary-Animation) hat auf iOS die native Wisch-Zurück-Geste deaktiviert bzw. ruckeln lassen.
- **Kosten/Beleg:** 6 Commits in 11 Tagen:
  - `6a0f35a` und `e79a64c` (21.05., Slide + `ClipRect`)
  - `f5bdf5f` (`reverseCurve` linear)
  - `5f75ba8` (30.05., Cupertino-Builder explizit)
  - `fc1b513` (Cupertino-Builder wieder entfernt)
  - `c0ccd2d` (01.06., Blur-Folgefehler)

  Reste davon sind `_SlideTransitionsBuilder` in `lib/main.dart` und `lib/utils/app_route.dart`.
- **Regel:** **Plattform-Standardtransitions, keine Overrides** im `PageTransitionsTheme`. go_router-Seiten mit Standard-`MaterialPage`. Wer eine Transition ändert, testet die Wisch-Zurück-Geste auf einem echten iPhone, bevor der Commit gemacht wird.

### P1.2 `Listener(onPointerDown)` statt Buttons → Tap-Konflikte auf iOS
- **Problem:** Ein roher `Listener` hat sich auf iOS mit dem Hit-Testing anderer Gesten gestritten. Der Tap auf „Fahrt erstellen" hat die Fahrt zwar gespeichert, aber ohne jedes Feedback.
- **Kosten/Beleg:** `c76e6de` — `fahrt_anbieten_page.dart` musste mit 242 Zeilen Diff umgebaut werden. Die Ursache wurde erst beim Zwei-Nutzer-Test auf iOS gefunden (Punkt B in `CLAUDE.md`). Heute gibt es noch 24 `Listener(`-Vorkommen in `lib/`.
- **Regel:** Taps nur über Material-Buttons/`InkWell`. Jede asynchrone Aktion läuft über einen `HofAsyncButton` mit Lade- und Sperrzustand (verhindert Doppel-Taps). `Navigator`/`ScaffoldMessenger` werden **vor** dem `await` gesichert.

### P1.3 Schwebende Navbar im `Stack` → magische Abstände überall
- **Problem:** Die Navbar liegt als `Positioned` über dem Inhalt (`widget_tree.dart`). Jede Seite musste unten selbst Platz freihalten.
- **Kosten/Beleg:** Feste Abstände wie `SizedBox(height: 130)` (`fahrten_page.dart:708`, `:1281`), `150` (`profile_page.dart:725`), FAB auf `bottom: 110`. Die Scrim-Höhe wird aus `SizeHelper` + `padding.bottom` gerechnet. Jede neue Seite und jedes neue Gerät riskiert verdeckte Inhalte.
- **Regel:** Standard-`Scaffold` mit `bottomNavigationBar`/`NavigationBar` bzw. `NavigationRail`, **keine Overlays**. `SafeArea` nur in der Shell und in Sheets, nie verstreut auf Seiten.

### P1.4 Tastatur-Handling ad hoc pro Seite
- **Problem:** Jede Seite und jedes Sheet rechnet `viewInsets` selbst.
- **Kosten/Beleg:** 19 `viewInsets`-Stellen; eine Heuristik `viewInsets.bottom > 100` als „Tastatur offen" (`fahrt_anbieten_page.dart:89`); `chat_page.dart` nutzt `View.of(context).viewInsets`. Uneinheitliches Verhalten, jede Stelle einzeln zu testen.
- **Regel:** Formulare im Standard-`Scaffold` (`resizeToAvoidBottomInset` aktiv) + `SingleChildScrollView` mit `keyboardDismissBehavior: onDrag`. Sheets nur über **eine** Hilfsfunktion `showHofSheet`, die die Insets behandelt. Betragsfelder mit `TextInputType.numberWithOptions(decimal: true)` + Formatter für Dezimalkomma.

### P1.5 Datum/Uhrzeit als Freitext
- **Problem:** Die Uhrzeit war ein `TextField` mit Zahlentastatur — auf iOS gibt es dort keinen Doppelpunkt.
- **Kosten/Beleg:** `d1ab7fd` musste dieselbe Umstellung in 3 Dateien parallel machen. `platform_pickers.dart` ist versteckt in einem „auto-fix"-Commit entstanden (`5cf88ac`).
- **Regel:** Datum/Uhrzeit **nur** über die zentralen Picker in `core/ui/pickers.dart` (Cupertino auf iOS, Material sonst, Web-tauglich), von Anfang an. Gespeichert wird ein `Timestamp`, kein `"HH:MM"`-String (siehe P4.2, P6.8).

### P1.6 Zwei Typografien (iOS ≠ Android), Fonts zur Laufzeit geladen
- **Problem:**
  - Android nutzt Poppins über `google_fonts` (Laden zur Laufzeit ist nicht deaktiviert), iOS die Systemschrift mit eigenen Gewichten (`_buildTextTheme` in `main.dart`).
  - In Widgets steht `Platform.isIOS ? FontWeight.w600 : FontWeight.bold` (`appbar_widget.dart`).
- **Kosten/Beleg:** Zwei Erscheinungsbilder zu pflegen; eine ganze Session „E2 iOS-Design-Polishing". `google_fonts` musste wegen der Dart-SDK-Kompatibilität am Release-Tag upgegradet werden (`a0c1879`, `7efd4c1`). Beim ersten Start ohne Netz fehlt die Schrift.
- **Regel:** **Eine** Schrift als Asset gebündelt, einmal im `TextTheme` definiert. Kein Laden zur Laufzeit (`GoogleFonts.config.allowRuntimeFetching = false` oder ganz ohne `google_fonts`). **Keine Plattform-Verzweigungen für Typografie in Widgets.**

### P1.7 `dart:io`/`Platform.isX` im UI-Code
- **Problem:** `Platform.isIOS` steht in 11 Dateien (5× direkt in Views). Im Web wirft das zur Laufzeit.
- **Kosten/Beleg:** Für Flutter-Web müsste jede Stelle angefasst werden (siehe `HOEFLER_REUSE_ANALYSE.md`).
- **Regel:** `dart:io` ist in `lib/` verboten, außer in `core/platform/`. Plattformabfragen nur über `core/platform/platform.dart` (`kIsWeb`-sicher). Uploads über `XFile`/Bytes, nie über `File`.

### P1.8 Store-Pflichten zu spät entschieden
- **Problem:** Geräte-Familie, Orientierung, Icon und Splash wurden erst im Upload-Prozess geklärt.
- **Kosten/Beleg:**
  - iPad entfernt und wieder hinzugefügt (`b146f6d` → `7fbf080`)
  - iPad-Multitasking verlangt alle Orientierungen (`2b13ffa`), steht aber im Konflikt mit dem Portrait-Lock in `main.dart`
  - Icon mit Alpha-Kanal von Apple abgelehnt (`c32ff0e`)
  - Android-12-Splash mit weißem Rand: 3 Commits am 07.06.
  - Export-Compliance-Flag (`65fc14a`)
- **Regel:** In Woche 1 eine **Release-Checkliste** abarbeiten: Device-Family, Orientierungen, Icon ohne Alpha (`flutter_launcher_icons`), Splash (`flutter_native_splash`), `ITSAppUsesNonExemptEncryption`, Bundle-/Package-IDs final. Danach nicht mehr ändern.

---

## 2. Layout & Responsive

### P2.1 Prozent-Sizing über `SizeHelper`
- **Problem:** Größen und Schriften sind Prozent der Bildschirmbreite/-höhe (`SizeHelper.w(context, 0.045)`).
- **Kosten/Beleg:** 29 Aufrufe, gehäuft in `email_verification_page.dart`. Auf kleinen Handys zu klein, auf Tablets/Laptops riesig (Titel ≈ 86 px bei 1920 px Breite). Ein Layout ist nicht über Geräte hinweg vorhersagbar.
- **Regel:** **Keine Größe aus `MediaQuery.size × Faktor`.** Feste Tokens (Spacing-Skala, Schriftgrößen aus `TextTheme`) + **Breakpoints** (compact < 600, medium 600–1024, expanded > 1024) + maximale Inhaltsbreite.

### P2.2 Feste Höhen und Text in Rows → Overflows
- **Problem:** Texte und Badges in festen Containern laufen über.
- **Kosten/Beleg:** Wiederholte Einzelfixes, jeweils erst nach Sichtung auf einem bestimmten Gerät:
  - `4123b61` Badge zweizeilig gegen Overflow
  - `7d10b58` Route-Text mit Ellipsis
  - `5bddb84` FahrtenCard dynamische Höhe
  - `1d451f1` Titel-Overflow auf der Website
- **Regel:** Keine festen Höhen für Container mit Text. In `Row`s steht Text immer in `Flexible`/`Expanded` mit `maxLines` + `overflow`. **Jede Seite wird bei 360 dp Breite und Textskalierung 1,3 / 2,0 geprüft** (Checkliste im PR).

### P2.3 Keine Tablet-/Desktop-Sicht
- **Problem:** Gebaut und getestet wurde nur fürs Handy im Hochformat.
- **Kosten/Beleg:** Portrait-Lock in `main.dart` kollidiert mit der iPad-Pflicht (P1.8). Eine Laptop-Ansicht wäre ein Neubau.
- **Regel:** Die responsive Shell (BottomNav ↔ Rail ↔ Rail + Master-Detail) steht in Woche 1. **Jedes Feature wird in allen drei Breiten** abgenommen.

---

## 3. Visuelle Effekte & Performance

### P3.1 Transparente Seiten über separat gemaltem Hintergrund → Durchscheinen
- **Problem:** Die Seiten sind ein transparentes `Scaffold` über `AppBackground`. Während der Transition schien die vorherige Seite durch.
- **Kosten/Beleg:** Kommentar in `background_widget.dart` („voll deckende Farben … um das Durchscheinen der vorherigen Seite … zu verhindern"), `ClipRect`-Fix `e79a64c`. Der Hintergrund-Stapel (Gradient + Abdunklung + Blur + transparentes Scaffold) ist **in 9 Seiten einzeln kopiert**.
- **Regel:** Seiten sind **opak** (`scaffoldBackgroundColor` aus dem Theme). Kein `Stack`-Hintergrund pro Seite. Wenn es einen Seitenrahmen braucht, gibt es **ein** `HofPage`-Widget.

### P3.2 Vollflächiger `BackdropFilter`
- **Problem:** Ein Blur über der ganzen Seite hat bei der iOS-Zurück-Geste die Zielseite mit weichgezeichnet.
- **Kosten/Beleg:** `c0ccd2d` führte den Workaround `FadingBackdropFilter` ein (Blur-Stärke an die Routen-Animation gekoppelt). `BackdropFilter` steckt in 17 Dateien. Glas-Effekte sind im Web zusätzlich teuer.
- **Regel:** **Kein vollflächiger Blur.** Das helle Hof-Design kommt ohne `BackdropFilter` aus. Falls doch nötig: genau eine Token-Komponente, auf iOS mit Zurück-Geste und im Web getestet.

### P3.3 Schwere Dekoration in Listenelementen
- **Problem:** Große Schatten, unskalierte Bilder und `setState` für Mikro-Interaktionen haben das Scrollen ruckeln lassen.
- **Kosten/Beleg:** `27e337d`: Schatten-Blur 30→12, zweiten Schatten entfernt, `RepaintBoundary`, `cacheWidth: 800`, `ValueNotifier` statt `setState` für den Pressed-Zustand.
- **Regel:** Schatten nur aus **Elevation-Tokens** (Blur ≤ 12). Bilder mit `cacheWidth`/Thumbnails. Listenelemente sind `const`-fähig und ohne Logik. Vor jedem Release ein Durchlauf im **Profile-Mode auf einem günstigen Android-Gerät**.

---

## 4. State & Daten

### P4.1 Ein fehlerhaftes Dokument bricht den ganzen Stream
- **Problem:** `snap.docs.map(Event.fromMap)` ohne Absicherung pro Dokument: Eine Exception beendet den Stream, der Service leert die Liste → **alle Events weg**.
- **Kosten/Beleg:** Projekt-Notiz „Event-Datum-Format": Ein vom Manager als `"15.07.2026"` gespeichertes Datum hat die App leer gemacht. Die Fundstelle `firestore_event_repository.dart:32` mappt bis heute ohne `try` pro Dokument.
- **Regel:** **Jedes Mapping von Snapshots läuft pro Dokument abgesichert** (`safeParse` → Dokument überspringen + Fehler melden), typisiert über `withConverter`. Ein `fromMap` darf nie in einen Stream werfen.

### P4.2 Ein Feld, viele Formate, stille Ersatzwerte
- **Problem:** `Event.fromMap` akzeptiert `datum` als int, `DD.MM.YYYY`, ISO-String oder `DateTime`. Bei Unlesbarem nimmt es **still `DateTime.now()`**.
- **Kosten/Beleg:** `event_daten.dart:115–140`, `3713e76`. Kaputte Daten werden zu „heute" und fallen niemandem auf. Die Uhrzeit liegt separat als String und führte zum Zeitzonen-Bug P6.8.
- **Regel:** **Ein Feld = ein Typ.** Zeitpunkte sind `Timestamp`, Beträge `int` Cent, Enums `String`. Die Rules prüfen Typen (`is timestamp`, `is int`). Ein Parse-Fehler ist ein **Fehler**, nie ein Ersatzwert.

### P4.3 Zwei Schreiber mit eigener Feldlogik (Web-Manager in JS vs. App in Dart)
- **Problem:** Manager-HTML und App haben dieselben Dokumente unterschiedlich geschrieben.
- **Kosten/Beleg:**
  - fehlendes `id`-Feld → stilles Update ins Leere (`4b9852f`)
  - Typ-Codes vs. Klartext (`04c57bb` `normalizeTyp`, `b884692` „full consistency audit")
  - Koordinaten-Feldname (`cacb553`)
  - Datumsformat (`3713e76`)
  - neue Kategorie `e7` im App-Filter vergessen (`5f290b7`)

  Allein der 10.06. hatte 17 Commits. Erst spät wurde eine gemeinsame Function eingeführt (Event-Container: „App und Manager-Website rufen dieselben drei Functions auf").
- **Regel:** **Ein Schreibweg pro Entität.** Entweder das App-Repository oder eine Callable mit Schema-Validierung (zod); weitere Clients (Web, Skripte) nutzen denselben Weg. Schema steht in `docs/SCHEMA.md`, Kategorien/Enums **einmal** definiert (Konfig-Dokument oder gemeinsame Konstanten). Die Dokument-ID ist immer `doc.id`, nie ein gespeichertes `id`-Feld.

### P4.4 Enums als Int-Index gespeichert
- **Problem:** `'status': status.index` beim Schreiben, `AnfrageStatus.values[statusIndex]` beim Lesen. Die Rules prüfen `status in [2, 3]`.
- **Kosten/Beleg:** `anfrage_daten.dart:99/125`. Ein neuer Status (`fahrtGeloescht`) durfte nur hinten angehängt werden. Fehlende `switch`-Zweige mussten nachgezogen werden (`465882f`). Magische Zahlen in den Rules sind unlesbar, ein Index außerhalb des Bereichs crasht.
- **Regel:** Enums werden als **String** gespeichert (`'offen'`, `'bestaetigt'`). Unbekannter Wert → definierter Fallback + Fehlermeldung. `switch` erschöpfend, ohne `default`.

### P4.5 Hängende Futures bei aktivierter Offline-Persistenz
- **Problem:** Ein `await` auf einen Firestore-Write kann ewig hängen, obwohl der Write lokal schon geklappt hat → Endlos-Spinner.
- **Kosten/Beleg:** `a7a8376` (3 Hänger gemeldet), danach `36d5e20` („auf alle übrigen Absenden/Bestätigen-Screens ausgeweitet") und `5a31204`. Das Nachrüsten über die ganze App war teurer, als es von Anfang an zu machen.
- **Regel:** **Jeder Schreibvorgang** läuft über das Repository mit `guarded`-Timeout und **clientseitig erzeugter ID** (Retry legt nichts doppelt an). Die UI unterscheidet „gespeichert", „wird synchronisiert" und „Fehler".

### P4.6 Verschluckte Fehler
- **Problem:** Leere Fehler-Handler machen Fehler unsichtbar.
- **Kosten/Beleg:** 13× `onError: (_) {}`, 20× leeres `catch (_) {}`, insgesamt 56 `catch (_)`. Ein fehlender Composite-Index hat eine Liste **lautlos leer** gelassen (`3821e28`). `EventService` leert bei Stream-Fehlern die Liste ohne Hinweis. An ~15 Stellen bekommt der Nutzer stattdessen den rohen Exception-Text (`'Fehler: $e'`).
- **Regel:** **Kein leeres `catch`/`onError`** (Lint `empty_catches` + Review). Jeder Stream hat einen Fehlerzustand in der UI. Fehler gehen an den zentralen `ErrorReporter`. Nutzer sehen verständliche deutsche Texte, nie `$e`. Indexe liegen in `firestore.indexes.json` und werden mit dem Code deployt.

### P4.7 Kein Crash-/Fehler-Reporting
- **Problem:** Es gibt kein Crashlytics und keinen anderen Reporter. Bugs kamen nur über Nutzerberichte.
- **Kosten/Beleg:** Der Offline-Banner wurde in 3 Anläufen über 3 Wochen gefixt (`f6f378d` 11.07., `05c67ed` 15.07., `99ba57a` 02.08.); laut Projekt-Notiz war er „nicht reproduzierbar außer schnell raus und rein". Die Diagnose lief rein über Code-Analyse.
- **Regel:** **Crashlytics (Android/iOS) + ein Web-Reporter ab Tag 1.** Wichtige Zustandswechsel werden geloggt (z. B. Connectivity, Auth, Sync). Vor einem Fix wird die Ursache **belegt**, nicht geraten.

### P4.8 Zustand beim Logout/Nutzerwechsel nicht aufgeräumt
- **Problem:** Gerätebezogene Daten überleben den Nutzerwechsel.
- **Kosten/Beleg:**
  - Das FCM-Token wurde beim Logout „fire-and-forget" entfernt → Gerät bekam die Pushes des vorherigen Accounts (`d1463bd`).
  - Admin-Test-Events waren für normale Nutzer sichtbar (`6461a5f`). Der Fix filtert nur clientseitig, siehe auch P6.7.
- **Regel:** Logout ist eine **awaitete Sequenz**: Token entfernen → Listener abbauen → `signOut`. Auf geteilten Geräten (Stempel-Tablet!) zusätzlich `terminate()` + `clearPersistence()`.

### P4.9 Abgeleitete Werte aus UI-Zustand berechnet
- **Problem:** Die Fachlogik hing an dem, was die UI gerade zeigt, statt an den Quelldaten.
- **Kosten/Beleg:**
  - „Tag N" wurde aus der Position in der (schrumpfenden) Liste berechnet (`28329e1`)
  - „Vergangene Fahrt" war anders definiert als die Event-Sichtbarkeit (`abacac6`)
  - die 6-Uhr-Folgetag-Regel steckte in der Query-Logik (`cdfda5d`)
- **Regel:** Fachregeln sind **reine Funktionen** in `features/<x>/domain/`, einmal definiert, mit Unit-Tests, berechnet aus unveränderlichen Quelldaten. Widgets rechnen nichts Fachliches.

### P4.10 Prüfen und Schreiben getrennt → Race Condition
- **Problem:** Die Kapazitätsprüfung lag vor der Transaktion; zwei gleichzeitige Annahmen konnten überbuchen.
- **Kosten/Beleg:** `7c5d43e` (Prüfung in die Transaktion verlagert), dokumentiertes Restrisiko in `CLAUDE.md`.
- **Regel:** Lesen–Prüfen–Schreiben **immer in einer Transaktion** (oder Callable). Wo möglich, mit deterministischen IDs Eindeutigkeit erzwingen (z. B. `activeShifts/{uid}`).

### P4.11 Controller-Leaks in Dialogen
- **Problem:** `TextEditingController` in `showDialog`-Lambdas wurden nie freigegeben.
- **Kosten/Beleg:** `25c1048` musste Login, Settings, Admin und Home-Suchleiste kurz vor dem Release nachrüsten.
- **Regel:** Controller gibt es nur in einem `State` mit `dispose()`. Dialoge mit Eingaben sind eigene `StatefulWidget`s.

---

## 5. Architektur & Wartbarkeit

### P5.1 Riesige Dateien
- **Problem:** 26 Dateien > 350 Zeilen, **10 Dateien > 1.000 Zeilen**. Spitzenreiter: `fahrten_page.dart` (4.437), `profile_page.dart` (2.311), `public_profile_page.dart` (1.838), `detail_page.dart` (1.711).
- **Kosten/Beleg:** Änderungen erzeugen riesige Diffs (z. B. `178d5a3`: 893 Zeilen in `fahrt_anfragen_page.dart`). Reviews sind praktisch unmöglich, und KI-Edits werden riskant, weil der Kontext nicht passt.
- **Regel:** Ziel **< 350 Zeilen**, harte Grenze **600** (CI warnt). **Eine öffentliche Klasse pro Datei.** Seitenabschnitte als eigene Widgets in `ui/widgets/`.

### P5.2 `FirebaseX.instance` direkt in der UI
- **Problem:** Views umgehen die Repository-Schicht.
- **Kosten/Beleg:** 29 Zugriffe in 13 View-Dateien (10× Auth, 10× Firestore, 7× Functions, 2× Storage). Diese Stellen haben keinen Timeout (P4.5), keine einheitliche Fehlerbehandlung (P4.6) und sind nicht testbar. Beispiele: `verification_guard.dart`, Chat-Tap in `main.dart`.
- **Regel:** In `features/*/ui/` sind Imports von `firebase_*`/`cloud_*` **verboten** (CI-Check). Die Kette ist immer UI → Service → Repository.

### P5.3 Keine Tests
- **Problem:** Es gibt keinen `test/`-Ordner und keine Function-/Rules-Tests. Der Build-Loop prüft nur `flutter analyze`.
- **Kosten/Beleg:** Regressionen wurden erst auf dem Gerät oder von Nutzern entdeckt (Offline-Banner 3×, „Tag N", Zeitzone, PERMISSION_DENIED in Produktion).
- **Regel:** Ab Woche 1 gibt es:
  - **Unit-Tests** für jede Fachregel (Pause, Summen, CSV, Parsing)
  - **Rules-Tests** im Emulator für die Rollen-/Aktions-Matrix
  - **Function-Tests** für Callables
  - einen Smoke-Widget-Test pro Kern-Flow

  Die CI blockiert bei Rot.

### P5.4 Layer-first-Ordner, Experimente im Produktcode
- **Problem:** `data/` mischt Models, Services und Repositories; `data/local/` ist leer. Story-Creator-Modus, Übungsprojekt und Website-Assets liegen im App-Repo.
- **Kosten/Beleg:** `1_uebungen/` hat `flutter analyze` gestört; Workaround `flutter analyze lib/` (`039521f`). Der Story-Creator schleust einen globalen Notifier in die App-UI (`storyRecordingActiveNotifier`).
- **Regel:** **Feature-first** (`features/<feature>/{data,domain,application,ui}`). Experimente, Übungen und Marketing-Tools in eigene Repos oder Branches. Demo-/Admin-Werkzeuge nur hinter Feature-Flag in einem eigenen Feature-Ordner.

### P5.5 Eine 1.477-Zeilen-Datei für alle Functions
- **Problem:** Alle 23 Functions und Helfer stehen in `functions/src/index.ts`.
- **Kosten/Beleg:** Änderungen an einem Trigger riskieren Nebenwirkungen; Wiederverwendung ist nur per Copy-&-Paste möglich.
- **Regel:** **Eine Datei pro Function**, Helfer in `functions/src/lib/`, `index.ts` enthält nur Re-Exports.

### P5.6 Doku driftet vom Code weg
- **Problem:** Die Collection-Liste in `CLAUDE.md` ist unvollständig (z. B. fehlen `processedTriggerEvents`, `user_reports`, `pending_events`). Lint-Warnungen werden als „offen" geführt statt behoben.
- **Kosten/Beleg:** Falsche Annahmen in neuen Sessions; Wissen steckt nur in Projekt-Notizen.
- **Regel:** Wer ein Schema ändert, aktualisiert `docs/SCHEMA.md` im **selben Commit**. Es gilt eine Null-Warnungen-Politik (`--fatal-infos`) statt Warnungslisten.

### P5.7 Namensdrift: Dateiname ≠ Klasse, Deutsch und Englisch gemischt
- **Problem:** Dateien heißen anders als die Klasse, die sie enthalten, und derselbe Begriff kommt in zwei Sprachen vor:
  - `fahrt_anfrage_service.dart` enthält `RideRequestService`
  - `fahrten_page.dart` enthält `MeineFahrtenPage`
  - `firebase_fahrt_repository.dart` enthält `FirestoreFahrtRepository`
  - `event_daten.dart` enthält `Event`
- **Kosten/Beleg:** Klassen sind schwer zu finden; derselbe Begriff steht in Code und Gesprächen unter mehreren Namen (Fahrt/Ride, Anfrage/Request).
- **Regel:** **Dateiname = Klassenname in snake_case.** Jeder Fachbegriff hat genau einen Code-Namen, festgelegt in `docs/GLOSSAR.md` (z. B. Hof ↔ `Farm`, Schicht ↔ `Shift`).

---

## 6. Firebase & Cloud Functions

### P6.1 Keine Region gesetzt
- **Problem:** Ohne `setGlobalOptions` laufen alle Functions in `us-central1`.
- **Kosten/Beleg:** Für EventRide nur Latenz; für Hof-Manager (Steuerbelege, Mitarbeiterdaten) ein DSGVO-Problem. Firestore- und Storage-Standorte lassen sich **nachträglich nicht ändern**.
- **Regel:** Beim Anlegen des Projekts Firestore/Storage in der **EU**. `setGlobalOptions({ region: "europe-west3" })` als erste Zeile in `index.ts`. Die Region steht auch in `firebase.json`/CI fest.

### P6.2 Idempotenz erst nach Duplikaten nachgerüstet
- **Problem:** Firestore-Trigger werden mindestens einmal zugestellt, unter Umständen also mehrfach. Ohne Schutz gab es doppelte Pushes (~15 s Abstand) und doppelte Zähler-Änderungen.
- **Kosten/Beleg:** `eb5b0f9` (09.07., `claimEventOnce` eingeführt), vorher `1226fbf` und `56a8706` (Duplikate, falsche „abgelehnt"-Meldung).
- **Regel:** **Jeder Trigger mit Seiteneffekt** (Push, LLM-Aufruf, Zähler, Mail) beginnt mit `claimEventOnce(event.id)`. Beim LLM-Trigger heißt Doppelausführung auch doppelte Kosten.

### P6.3 Secrets und API-Keys verstreut
- **Problem:** Zugangsdaten liegen an verschiedenen Orten und Keys wurden mehrfach getauscht.
- **Kosten/Beleg:**
  - `EMAIL_PASS` aus `functions/.env` über `process.env`
  - Places-API-Key im Dart-Code (`places_autocomplete_field.dart`)
  - Maps-Keys mehrfach getauscht (`950b95f` ungültiger Key, `41e0df3` eigener iOS-Key)
  - `serviceAccountKey.json` in `scripts/` (immerhin ignoriert)
- **Regel:** Secrets nur per `defineSecret` (Secret Manager). Im Client steht außer der Firebase-Konfiguration **kein** Key. Jeder API-Key ist pro Plattform restringiert und in `docs/KEYS.md` dokumentiert (Zweck, Restriktion, Ablageort — **nicht der Key selbst**).

### P6.4 SHA-1 und API-Key-Restriktionen (Android)
- **Problem:** Login funktionierte nur in der Store-Version nicht: Der SHA-1 des Play-App-Signing-Schlüssels fehlte **sowohl** in Firebase **als auch** in der Google-Cloud-Key-Restriktion.
- **Kosten/Beleg:** `ce1093f` (Fix in zwei Schritten, der erste allein reichte nicht), dazu Debug-Keystore-SHA-1 (`4b970af`) und mehrfach neue `google-services.json` (`fdbf3d7`, `25c1048`). Fehlerbild: `code=unknown … Requests from this Android client application … are blocked`.
- **Regel:** Beim Android-Setup (Woche 1) **alle drei SHA-1** (Debug, Upload, Play App Signing) in Firebase **und** in der GCP-Key-Restriktion eintragen. Vor dem ersten Release über den **internen Play-Track** installieren und den Login testen.

### P6.5 `get()`-Reads und hartkodierte E-Mails in Rules
- **Problem:** `isAdmin()` liest pro Regelprüfung `users/{uid}`, und `messages` liest pro Zugriff das Eltern-Dokument. Manager-Rechte hängen an einer E-Mail-Whitelist, die doppelt gepflegt wird (Rules + Function).
- **Kosten/Beleg:** Zusätzliche Reads (Kosten, Latenz, Limit von 10 `get()` pro Anfrage). Rollenänderungen erfordern einen Deploy.
- **Regel:** Rollen über **Custom Claims** (`farmId`, `role`), gesetzt nur von einer Function. Keine E-Mails und kein `get()` für Rollen in den Rules.

### P6.6 Rules und Code nicht synchron
- **Problem:** Code schrieb an Stellen, die die Rules nicht erlaubten.
- **Kosten/Beleg:** Der Admin konnte die Führerschein-Ablehnung nicht speichern (PERMISSION_DENIED auf `private/data`, `a3bc048`). Rules-/Stream-Fehler bei den Interessenten (`d330764`). Beides wurde erst in Produktion entdeckt.
- **Regel:** Eine **Rollen × Aktion-Matrix** wird als Emulator-Test mit `@firebase/rules-unit-testing` gepflegt. Jede Rules-Änderung kommt mit Test; die CI führt die Tests aus.

### P6.7 „Rules als Filter" missverstanden
- **Problem:** Admin-Test-Events wurden normalen Nutzern angezeigt. Der Fix filtert clientseitig (`6461a5f`).
- **Kosten/Beleg:** Rules filtern keine Queries: Eine Query, die verbotene Dokumente liefern *könnte*, wird komplett abgelehnt. Sichtbarkeit nur im Client zu filtern ist **keine** Sicherheit, und gecachte Dokumente aus einer Admin-Session überleben den Nutzerwechsel (P4.8).
- **Regel:** Jede Query enthält die `where`-Bedingungen, die die Rule verlangt. Sicherheitsrelevante Filter gehören in die Rules, nie nur in den Client.

### P6.8 Zeitzonen: UTC vs. Wiener Lokalzeit
- **Problem:** Die Function hat eine Uhrzeit, die in Wiener Lokalzeit gespeichert war, als UTC behandelt → 2 h zu frühe Sperre. Zur Korrektur entstand eine selbstgeschriebene Sommerzeit-Funktion (`getViennaOffsetHours`).
- **Kosten/Beleg:** `40258b1`; dazu „nach 6 Uhr am Folgetag ausblenden" (`cdfda5d`) und „Tag N" (`28329e1`). Datum und Uhrzeit liegen getrennt (UTC-Mitternacht + `"20:00"`).
- **Regel:**
  - Zeitpunkte als `Timestamp` speichern.
  - Die Hof-Zeitzone `Europe/Vienna` steht einmal in den Einstellungen.
  - Tag-/Wochen-/Monats-Keys berechnet **eine** Hilfsfunktion (Function und App identisch, mit `Intl`/tz-Bibliothek).
  - Unit-Tests decken **die Sommerzeit-Umstellungstage** ab.

### P6.9 Auth-E-Mails im Spam
- **Problem:** Die Verifikationsmails von Firebase landeten im Spam. Erst die eigene SMTP-Function hat das gelöst.
- **Kosten/Beleg:** 3 Anläufe an einem Tag (`98daaa4`, `96eba43`, `5c5f7c4` am 23.06.), vorher `2fde27a`; eigene Action-Seiten unter `public/auth/`.
- **Regel:** Von Anfang an eigene Absender-Domain mit SPF/DKIM und eigene Mail-Function (aus EventRide übernehmen). Zustellung testen bei Gmail, GMX und Outlook.

### P6.10 Firestore-Batch-Limit
- **Problem:** `cleanupAbgelaufeneAnfragen` schreibt einen einzigen Batch; ab 500 Dokumenten scheitert er (in `CLAUDE.md` als Risiko dokumentiert).
- **Kosten/Beleg:** Wurde in anderen Funktionen per Chunking gelöst, hier nicht — die Lösung ist uneinheitlich.
- **Regel:** Massen-Writes nur über die Helfer-Funktion `commitInChunks()` (≤ 500 pro Batch).

### P6.11 Anzeigename aus unterschiedlichen Quellen
- **Problem:** Die Function las `firstName`/`lastName`, der Client nahm zusätzlich `displayName` aus Auth. Für Google-Login-Nutzer zeigte der Push deshalb „Neue Nachricht" statt eines Namens.
- **Kosten/Beleg:** `eb5b0f9`, `f64be59`, `83f74a4` — drei Commits für dasselbe Thema.
- **Regel:** Der Anzeigename wird beim Anlegen **einmal** ins User-/Member-Dokument geschrieben, und alle lesen genau dieses Feld.

### P6.12 Firebase-CLI-Formatwechsel
- **Problem:** `firebase.json` musste für CLI v15 umgestellt werden (`storage` als Array mit Bucket, `9c48609`).
- **Kosten/Beleg:** Der Deploy brach ohne Code-Änderung.
- **Regel:** `firebase-tools` als **devDependency mit fester Version**, in der CI über `npx`. Upgrades bewusst und mit Changelog.

---

## 7. Build, Deploy & Git

### P7.1 `git add -A` im Build-Skript
- **Problem:** `scripts/build_loop.sh` committet mit `git add -A` **alles**, was im Arbeitsverzeichnis liegt.
- **Kosten/Beleg:**
  - Feature-Arbeit verschwand unter „fix: auto-fix Iteration N": `1baf2b6` (neue Admin-Seite + 229 Zeilen Settings + Rules + Functions), `178d5a3` (893 Zeilen), `ef429ff` (747 Zeilen Manager-HTML), `5cf88ac` (`platform_pickers.dart`).
  - Mitcommittet wurden `.claude/scheduled_tasks.lock`, `.firebase/*.cache` und **projektfremde CSV-Dateien mit personenbezogenen Daten** (~770 Datensätze mit E-Mail, Geburtsdatum, Social-Handles). Weil das Repo öffentlich ist, mussten sie per Umschreiben der Historie und Force-Push wieder entfernt werden (07.10.2026). Kopien in GitHub-Caches lassen sich nur über den GitHub-Support löschen.
  - Die Historie ist dadurch für `git blame`/`bisect` wertlos.
- **Regel:** **Skripte committen niemals Code.** Ein Build-Skript darf höchstens die Versionsdatei committen, mit explizitem Pfad. Im ganzen Projekt gibt es kein `git add -A`/`git add .`; gestaget wird nur mit expliziten Pfaden.

### P7.2 Build-Nummern verbrannt und asynchron
- **Problem:** Jeder Build-Versuch zählte die Nummer hoch.
- **Kosten/Beleg:**
  - 17 von 44 Build-Loop-Commits ändern nur `pubspec.yaml`; die Build-Nummer steht bei +98.
  - iOS und Android liefen auseinander (Projekt-Notiz Build-Nummern).
  - Ein geschlossener TestFlight-Train verlangte einen Marketing-Versions-Bump (`code 90186`).
- **Regel:** Die **Build-Nummer kommt aus der CI** (Run-Nummer) und wird nicht committet. Die Marketing-Version wird manuell erhöht und mit Git-Tag versehen. Beide Plattformen tragen dieselbe Nummer.

### P7.3 iOS-Signing/Xcode-Marathon in der Release-Woche
- **Problem:** Die iOS-Pipeline wurde erst unmittelbar vor dem Release aufgebaut.
- **Kosten/Beleg:** **53 Commits vom 19.–21.05.**:
  - Xcode gepinnt und wieder entpinnt (15.4 → latest → 16 → latest/26)
  - SPM deaktiviert, statisches Linking, `CLANG_ALLOW_NON_MODULAR…`, `DEFINES_MODULE`
  - Zertifikatslimit (`DIST_CERT_KEY`), ExportOptions dynamisch erzeugt

  Die funktionierende Konfiguration ist in der Projekt-Notiz `ios_build_setup` festgehalten.
- **Regel:** In **Woche 1** läuft ein Hello-World-Build bis TestFlight bzw. zum internen Play-Track, mit der EventRide-Konfiguration als Startpunkt. Pro Versuch wird **nur eine Variable** geändert, jede funktionierende Einstellung wird sofort dokumentiert.

### P7.4 Abhängigkeits-Upgrades unter Zeitdruck
- **Problem:** Upgrades und Pins passierten erzwungen am Build-Tag:
  - `google_fonts` (`a0c1879`)
  - `shared_preferences '>=2.3.0 <2.5.4'` (`e489e8c`)
  - `google_maps_flutter_ios <2.7.0` (`5ced47d`)
  - Flutter gepinnt und wieder entpinnt (`7efd4c1`)
- **Kosten/Beleg:** FlutterFire hängt heute eine Major-Generation zurück. Der Pin-Bereich in `pubspec.yaml` ist ein Fossil.
- **Regel:** **Monatlich** `flutter pub outdated` + Upgrade in einem eigenen Branch mit voller CI. Keine Upgrades in der Release-Woche. Lockfile committen. Jeder Pin bekommt einen Kommentar mit Grund und Ablaufdatum.

### P7.5 Werkzeuge, die still versagen
- **Problem:** Hilfsskripte haben Fehler verschluckt statt abzubrechen:
  - `cm_logs.sh` braucht `python3` (fehlt), der Fallback `|| echo` verschluckt den Fehler → Fehlerdetails gingen verloren.
  - `validate.ps1` hat den Exit-Code von `analyze` ignoriert (`0ed6234`).
  - Push-Race im Build-Loop: gebaut wurde der alte Commit.
- **Kosten/Beleg:** Mehrere unnötige Build-Runden, manuelle `curl`/`node`-Workarounds (Projekt-Notizen).
- **Regel:** Skripte laufen mit `set -euo pipefail`, ohne `|| echo` für Fehler, und prüfen ihre Voraussetzungen am Start. Builds werden per **Commit-SHA** getriggert, nicht per Branch-Name.

### P7.6 Generierte Dateien im Repo
- **Problem:** `functions/node_modules` und `functions/lib` waren eingecheckt (`7185e08`). `.firebase/`, `.claude/`-Locks und CSV-Exporte landeten über P7.1 im Repo; `.git` ist 154 MB groß.
- **Kosten/Beleg:** Aufräum-Commits, aufgeblähte Historie, Datenschutzrisiko.
- **Regel:** Die `.gitignore` steht **vor dem ersten Commit** (Vorlage in `CONVENTIONS.md`). Exporte und Testdaten liegen außerhalb des Repos.

### P7.7 Sammel-Commits ohne Thema
- **Problem:** Commits wie „fix: diverse Verbesserungen aus vorherigen Sessions" (`05fe3ce`) und „fix+feat: …" mit mehreren Themen.
- **Kosten/Beleg:** Nicht revertierbar, nicht nachvollziehbar.
- **Regel:** **Ein Thema pro Commit**, Conventional Commits mit Scope (`feat(belege): …`). Größere Arbeit auf Feature-Branches.

---

## Top 10 — Diese Fehler NICHT wiederholen

1. **Kein `git add -A` — nirgends, schon gar nicht in Skripten.** Build-Skripte committen keinen Code; die Build-Nummer kommt aus der CI. *(P7.1, P7.2)*
2. **Keine eigenen Seitentransitions, kein vollflächiger Blur, keine transparenten Seiten.** Plattform-Standards und opake Hintergründe aus dem Theme. *(P1.1, P3.1, P3.2)*
3. **Keine hartkodierten Farben/Größen, kein Prozent-Sizing.** Nur Theme-Tokens + Breakpoints; jede Seite bei 360 dp, Textskalierung 2,0 und Laptop-Breite prüfen. *(P2.1, P2.2)*
4. **Ein Feld = ein Typ.** Zeitpunkte als `Timestamp` + Zeitzone `Europe/Vienna` zentral, Beträge in Cent, Enums als String. Nie still auf `now()` oder einen anderen Ersatzwert zurückfallen. *(P4.2, P4.4, P6.8)*
5. **Ein Schreibweg pro Entität**, mit Schema-Validierung. Nie zwei Clients mit eigener Feldlogik; die ID ist immer `doc.id`. *(P4.3)*
6. **Ein kaputtes Dokument darf keinen Stream töten**, kein leeres `catch`/`onError`, kein `'Fehler: $e'` für Nutzer. Crash-Reporting ab Tag 1. *(P4.1, P4.6, P4.7)*
7. **Jeder Write mit Timeout + clientseitiger ID, jeder Button mit Lade-/Sperrzustand**, Lesen–Prüfen–Schreiben nur in Transaktionen. *(P4.5, P1.2, P4.10)*
8. **Functions: EU-Region, Idempotenz bei jedem Trigger, Secrets im Secret Manager, Rollen über Custom Claims, Rules mit Emulator-Tests.** *(P6.1, P6.2, P6.3, P6.5, P6.6)*
9. **Release-Pipeline in Woche 1** (Hello-World bis TestFlight/Play intern, alle drei SHA-1, Icons ohne Alpha, Geräte/Orientierung final), nicht in der Release-Woche. *(P7.3, P6.4, P1.8)*
10. **Keine Riesen-Dateien, keine Fachlogik in Widgets, kein `FirebaseX.instance` in der UI.** < 350 Zeilen, Fachregeln als getestete reine Funktionen, Kette UI → Service → Repository. *(P5.1, P5.2, P4.9, P5.3)*
