# CONVENTIONS — verbindliche Regeln für den Hof-Manager

**Stand:** 07.10.2026 · **Gilt für:** App (`lib/`), Cloud Functions (`functions/`), Rules, Skripte, Git.

**Begriffe:**
- **MUSS** / **DARF NICHT** = harte Regel. Die CI oder das Review blockiert bei Verstoß.
- **SOLL** = Standard; eine Abweichung braucht eine Begründung im Commit.

Jede Regel hat einen Grund in `PITFALLS.md` (Verweis in Klammern, z. B. *P4.1*).

---

## 0. Durchsetzung

| Ebene | Was | Wann |
|---|---|---|
| Analyzer | `analysis_options.yaml` (§12), `flutter analyze --fatal-infos` | lokal + CI |
| Konventions-Check | `tool/check_conventions.sh` (§12.3): verbotene Muster per `grep` | CI |
| Tests | `flutter test`, Functions-Tests, Rules-Tests im Emulator (§13) | CI |
| Review | Definition of Done (§15) als PR-Checkliste | vor Merge |

Die CI **MUSS** grün sein, bevor auf `main` gemergt wird. Warnungslisten wie „offene Lint-Warnings, kein Release-Blocker" gibt es nicht. *(P5.6)*

---

## 1. Ordnerstruktur (feature-first)

```
lib/
├─ main.dart                       nur Bootstrapping → app/bootstrap.dart
├─ app/
│  ├─ app.dart                     MaterialApp.router
│  ├─ bootstrap.dart               Firebase-Init, Intl, ErrorReporter, Provider-Aufbau
│  ├─ providers.dart               alle Provider an EINER Stelle
│  ├─ router.dart                  go_router: Routen + Redirects (Auth, Rolle)
│  └─ theme/                       hof_tokens.dart, hof_theme.dart, hof_text_theme.dart
├─ core/
│  ├─ auth/                        AuthRepository (Interface + Firebase-Impl.), AuthService, Role
│  ├─ data/                        safe_parse.dart, converters.dart, guarded.dart, ids.dart
│  ├─ errors/                      app_error.dart, error_reporter.dart
│  ├─ l10n/                        formatters.dart (€/Datum/Dauer), vienna_time.dart
│  ├─ platform/                    platform.dart (EINZIGER Ort für dart:io / kIsWeb)
│  ├─ services/                    connectivity_service.dart
│  └─ ui/                          hof_page, hof_button, hof_async_button, hof_card, hof_sheet,
│                                  hof_snackbar, view_state_builder, empty_view, error_view,
│                                  loading_view, pickers, responsive_shell, offline_banner
└─ features/
   └─ <feature>/                   z. B. belege, stunden, team, export, dashboard, onboarding, settings
      ├─ data/                     Models (+ fromFirestore/toFirestore), <X>Repository (Interface),
      │                            firestore_<x>_repository.dart (Impl.)
      ├─ domain/                   REINE Dart-Funktionen: Fachregeln, Berechnungen (kein Flutter, kein Firebase)
      ├─ application/              <X>Service (ChangeNotifier), hält ViewState
      └─ ui/                       <X>Page + ui/widgets/
test/                              spiegelt lib/ (features/<x>/domain/*_test.dart …)
functions/src/
├─ index.ts                        NUR Re-Exports + setGlobalOptions
├─ lib/                            admin.ts, auth.ts (assertRole), idempotency.ts, batch.ts, time.ts, notify.ts, mail.ts
└─ <feature>/                      eine Datei pro Function (+ schema.ts mit zod)
docs/                              SCHEMA.md, GLOSSAR.md, KEYS.md, PITFALLS.md, CONVENTIONS.md
tool/                              check_conventions.sh, seed/…
```

Regeln:
- Ein Feature **DARF NICHT** aus einem anderen Feature `ui/` oder `application/` importieren. Gemeinsames gehört nach `core/`. Ein Import von fremden `data/`-Models ist erlaubt.
- `domain/` **DARF NICHT** Flutter oder Firebase importieren (nur `dart:core`, `package:meta`, `intl`). Fachregeln sind damit ohne Emulator testbar. *(P4.9)*
- Experimente, Übungen und Marketing-Tools gehören **nicht** in dieses Repo. *(P5.4)*

---

## 2. Datei- und Namensregeln

| Regel | Stufe |
|---|---|
| Dateiname = öffentliche Klasse in `snake_case` (`beleg_review_page.dart` → `BelegReviewPage`) *(P5.7)* | MUSS |
| **Eine öffentliche Klasse pro Datei.** Private Helfer (`_X`) im selben File nur, wenn das File unter dem Limit bleibt | MUSS |
| Dateilänge **Ziel < 350 Zeilen**, **> 600 Zeilen blockiert die CI** *(P5.1)* | SOLL / MUSS |
| Build-Methoden ≤ ~80 Zeilen; größere Abschnitte als eigene Widgets in `ui/widgets/` | SOLL |
| Suffixe: `…Page` (Route), `…Sheet`, `…Dialog`, `…Card`, `…Tile`, `…Service`, `…Repository` (Interface), `Firestore…Repository` (Impl.) | MUSS |
| Imports nur als `package:hof_manager/...` (keine relativen Imports über Feature-Grenzen) | MUSS |
| Kein Code ohne Verwendung (keine leeren Ordner, keine auskommentierten Altversuche) | MUSS |

**Sprache und Glossar** (`docs/GLOSSAR.md` ist die einzige Quelle):
- **UI-Texte:** Deutsch.
- **Code-Bezeichner und Firestore-Namen:** Englisch, camelCase, ohne Umlaute. Ausnahme: der Fachbegriff **Beleg** bleibt deutsch (`Beleg`, `belege`). „Receipt/Invoice/Voucher" deckt Rechnung, Kassenbon und Quittung nicht eindeutig ab.
- **Jeder Begriff hat genau einen Code-Namen.** Startbelegung:

| Fachbegriff | Code | Firestore |
|---|---|---|
| Hof / Betrieb | `Farm` | `farms` |
| Chef / Mitarbeiter (Rolle) | `Role.chef` / `Role.mitarbeiter` | `role: 'chef' \| 'mitarbeiter'` |
| Mitarbeiter (Person) | `Member` | `farms/{id}/members` |
| Einladung | `Invite` | `invites` |
| Beleg | `Beleg` | `belege` |
| Laufende Schicht | `ActiveShift` | `activeShifts/{uid}` |
| Zeiteintrag | `TimeEntry` | `timeEntries` |
| Monatssumme | `TimeSummary` | `timeSummaries` |
| Export | `ExportJob` | `exports` |

---

## 3. Design-Tokens & Theme-Pflicht

Alle Farben, Abstände, Radien, Schatten, Touch-Größen und Dauern kommen aus `HofTokens` (ThemeExtension in `app/theme/hof_tokens.dart`). Schriften kommen aus `Theme.of(context).textTheme`. *(P2.1, P3.1, P3.3, P1.6)*

| Token-Gruppe | Namen (semantisch, nie nach Farbe benannt) | Werte |
|---|---|---|
| `colors` | `background`, `surface`, `surfaceAlt`, `onSurface`, `onSurfaceMuted`, `primary`, `onPrimary`, `accent`, `border`, `success` (= betrieblich), `neutral` (= privat), `warning`, `danger`, `focus` | aus den Mockups |
| `space` | `xs 4`, `s 8`, `m 12`, `l 16`, `xl 24`, `xxl 32`, `xxxl 48` | fix |
| `radius` | `s 8`, `m 12`, `l 20`, `pill 999` | fix |
| `elevation` | `none`, `low` (Blur 6), `mid` (Blur 12) — **Blur ≤ 12** | fix |
| `touch` | `min 48`, `standard 56`, `hero 120` (Stempel-Button) | fix |
| `motion` | `fast 150 ms`, `normal 220 ms` | fix |
| Typografie | nur `textTheme.displaySmall … labelSmall`; eine gebündelte Schrift, kein Laden zur Laufzeit | `app/theme/hof_text_theme.dart` |

Zugriff über die Extension `context.hof` (z. B. `context.hof.space.l`, `context.hof.colors.surface`).

In `features/` und `core/ui/` gilt:

| Verboten (DARF NICHT) | Stattdessen |
|---|---|
| `Color(0x…)`, `Color.fromARGB`, `Colors.xyz` (außer `Colors.transparent`) | `context.hof.colors.*` |
| `TextStyle(fontSize: …)`, `fontWeight` direkt | `textTheme.titleMedium` (+ `copyWith(color: …)` mit Token) |
| `EdgeInsets.all(16)`, `SizedBox(height: 130)` mit Rohzahlen | `EdgeInsets.all(t.space.l)`, `Gap(t.space.xl)` |
| `BoxShadow(...)` von Hand | `t.elevation.mid` |
| `BackdropFilter` *(P3.2)* | — (nicht vorgesehen) |
| `Platform.isIOS ? FontWeight.w600 : …` *(P1.6)* | ein `TextTheme` für alle Plattformen |

Weitere Regeln:
- Seiten sind **opak**: `scaffoldBackgroundColor` aus dem Theme, kein transparentes `Scaffold` über einem separaten Hintergrund. *(P3.1)*
- Interaktive Elemente haben **mindestens `touch.min`**; Primäraktionen `touch.standard`. *(Hof-Design: große Touch-Flächen)*
- Neue Komponenten entstehen in `core/ui/`, nicht als Einmal-Styling in einer Seite.

---

## 4. Responsive

| Breakpoint | Breite | Navigation | Layout |
|---|---|---|---|
| `compact` | < 600 dp | `NavigationBar` unten (im `Scaffold`, **kein Overlay**) *(P1.3)* | einspaltig |
| `medium` | 600–1024 dp | `NavigationRail` | einspaltig, max. Inhaltsbreite 720 dp |
| `expanded` | > 1024 dp | `NavigationRail` (erweitert) | Master-Detail (Liste ↔ Detail) |

Regeln:
- Breakpoints werden **nur** über `core/ui/responsive_shell.dart` / `Breakpoint.of(context)` bestimmt. `MediaQuery.size.width * x` **DARF NICHT** verwendet werden. *(P2.1)*
- Text in `Row`s **MUSS** in `Flexible`/`Expanded` mit `maxLines` + `overflow` stehen. Container mit Text haben keine feste Höhe. *(P2.2)*
- Jede neue Seite wird geprüft bei **360×800**, **768×1024**, **1440×900** sowie **Textskalierung 1,3 und 2,0**. *(P2.2, P2.3)*
- Formulare: max. 720 dp breit, zentriert.

---

## 5. Plattform

- `dart:io` **DARF NICHT** außerhalb von `core/platform/` importiert werden. Plattformfragen beantwortet `core/platform/platform.dart` (`isWeb`, `isIOS`, `isAndroid`, alle `kIsWeb`-sicher). *(P1.7)*
- Dateien/Bilder werden als `XFile` bzw. Bytes verarbeitet und mit `putData` hochgeladen, nie mit `File`/`putFile`. *(P1.7)*
- **Keine eigenen Seitentransitions.** `PageTransitionsTheme` bleibt Standard. Eine Ausnahme braucht einen Test der iOS-Zurück-Geste auf einem echten Gerät. *(P1.1)*
- Taps nur über Buttons/`InkWell`, kein `Listener(onPointerDown)` für Aktionen. *(P1.2)*
- Datum/Uhrzeit nur über `core/ui/pickers.dart`, nie als Freitext. *(P1.5)*
- Tastatur: Standard-`Scaffold` + `SingleChildScrollView(keyboardDismissBehavior: onDrag)`. Sheets nur über `showHofSheet()`; `viewInsets` stehen nur dort. *(P1.4)*
- `SafeArea` nur in `ResponsiveShell`, `HofPage` und `HofSheet`. *(P1.3)*
- Store-Einstellungen (Geräte-Familie, Orientierungen, Icons, Splash, Export-Compliance) sind ab Woche 1 fixiert und stehen in `docs/RELEASE.md`. *(P1.8)*

---

## 6. State-Layer-Disziplin

```
UI (Page/Widget)  ──liest──▶  Service (ChangeNotifier, ViewState)  ──ruft──▶  Repository (Interface)
      ▲                              │                                           │
      └────── notifyListeners ───────┘                                 Firestore…Repository (Impl.)
                                                                                 │
                                                                        Firebase SDK / Callable
```

| Regel | Stufe |
|---|---|
| `features/*/ui/` und `core/ui/` **DÜRFEN NICHT** `firebase_*`, `cloud_firestore`, `cloud_functions` importieren *(P5.2)* | MUSS (CI) |
| `FirebaseAuth/Firestore/Storage/Functions.instance` gibt es **nur** in `Firestore…Repository`, `core/auth/` und `app/bootstrap.dart` | MUSS (CI) |
| Repositories geben **Domain-Models** zurück, nie `DocumentSnapshot`/`Map` | MUSS |
| Jedes Snapshot-Mapping läuft über `safeParse()`: ein kaputtes Dokument wird übersprungen + gemeldet, der Stream läuft weiter *(P4.1)* | MUSS |
| Jeder Write geht über `guarded()` (Timeout 15 s) und nutzt eine **clientseitig erzeugte ID** (`ids.newId()`) → Retry ist idempotent *(P4.5)* | MUSS |
| Lesen–Prüfen–Schreiben nur in `runTransaction` oder Callable *(P4.10)* | MUSS |
| Services halten den Zustand als `ViewState<T>` (§7) und exponieren nur unveränderliche Daten | MUSS |
| Globale `ValueNotifier` nur für App-weite UI-Zustände (Theme, Router); kein Sammelbecken wie `notifiers.dart` | MUSS |
| Abgeleitete Werte (Summen, „Tag N", Sichtbarkeit) kommen aus `domain/`-Funktionen, nie aus der UI-Liste *(P4.9)* | MUSS |
| Provider werden zentral in `app/providers.dart` aufgebaut; Services kennen Repositories nur über das Interface | MUSS |
| Logout ist eine awaitete Sequenz: Token entfernen → Subscriptions abbauen → `signOut` (auf geteilten Geräten zusätzlich `clearPersistence`) *(P4.8)* | MUSS |
| `TextEditingController`/`FocusNode`/`StreamSubscription` gibt es nur in einem `State` mit `dispose()`; Dialoge mit Eingaben sind eigene Widgets *(P4.11)* | MUSS |

---

## 7. Lade-, Fehler- und Leer-Zustände (Standard)

Jeder asynchron geladene Bereich hat **vier** Zustände. Sie werden **immer** über `ViewStateBuilder` gerendert, nie per `if (loading) … else …` von Hand:

```dart
sealed class ViewState<T> { const ViewState(); }
final class Loading<T> extends ViewState<T> { const Loading(); }
final class Data<T>    extends ViewState<T> { const Data(this.value); final T value; }
final class Empty<T>   extends ViewState<T> { const Empty(); }
final class Failure<T> extends ViewState<T> { const Failure(this.error); final AppError error; }
```

| Zustand | Standard-Widget | Inhalt |
|---|---|---|
| Loading | `LoadingView` | Skeleton/Spinner, nach 15 s automatisch → Failure mit „Erneut versuchen" *(P4.5)* |
| Empty | `EmptyView(icon, text, action?)` | erklärt, was hier erscheinen wird, + Primäraktion („Ersten Beleg fotografieren") |
| Failure | `ErrorView(error, onRetry)` | verständlicher deutscher Text aus `AppError`, **nie `'Fehler: $e'`** *(P4.6)* |
| Data | Feature-Widget | — |

Aktionen:
- Jeder Button mit asynchroner Aktion ist ein **`HofAsyncButton`** (Spinner + gesperrt während der Ausführung, Doppel-Tap unmöglich). *(P1.2)*
- Nach einem Write zeigt die UI einen von drei Zuständen: **gespeichert** · **wird synchronisiert** (offline/Timeout, ID ist idempotent) · **Fehler**. *(P4.5)*
- Rückmeldung immer über `HofSnackbar.success/info/error`, nie still. *(P1.2)*
- Der Offline-Status kommt aus dem übernommenen `ConnectivityService` + `OfflineBanner`.

---

## 8. Daten & Firestore

| Regel | Stufe |
|---|---|
| Zeitpunkte = `Timestamp` (UTC). Keine Datums-/Uhrzeit-Strings in Firestore *(P4.2, P6.8)* | MUSS |
| Beträge = `int` in **Cent** | MUSS |
| Enums = `String` (`'offen'`), unbekannter Wert → definierter Fallback + `ErrorReporter`. Kein `.index` *(P4.4)* | MUSS |
| Kein stiller Ersatzwert (`DateTime.now()`, `0`, `''`) bei Parse-Fehlern; das Dokument gilt als fehlerhaft *(P4.2)* | MUSS |
| Dokument-ID immer `doc.id`; **kein** redundantes `id`-Feld *(P4.3)* | MUSS |
| **Ein Schreibweg pro Entität** (Repository oder Callable). Weitere Clients (Web-Tools, Skripte) nutzen dieselbe Callable mit zod-Schema *(P4.3)* | MUSS |
| Kategorien/Status-Listen sind einmal definiert (`farms/{id}.settings` oder gemeinsame Konstante), nie doppelt in App und Function *(P4.3)* | MUSS |
| Jedes Dokument hat `createdAt`/`updatedAt` (`serverTimestamp`) und, wo relevant, `createdBy` | MUSS |
| Belege und Zeiteinträge werden nie gelöscht, sondern auf `status: 'storniert'` gesetzt bzw. mit Korrektur-Audit versehen (Aufbewahrungspflicht) | MUSS |
| Schema-Änderung = Update von `docs/SCHEMA.md` + Rules + Rules-Test **im selben Commit** *(P5.6, P6.6)* | MUSS |
| Queries enthalten die `where`-Bedingungen, die die Rules verlangen. Rules sind keine Filter *(P6.7)* | MUSS |
| Composite-Indexe stehen in `firestore.indexes.json` und werden mit deployt *(P4.6)* | MUSS |
| Rollen nur über Custom Claims (`farmId`, `role`), gesetzt nur von Functions; kein `get()` für Rollen in den Rules, keine E-Mail-Listen *(P6.5)* | MUSS |
| Sensible Felder (Stundenlohn, SV-Nummer) liegen in einer `private/`-Subcollection mit eigener Rule | MUSS |

---

## 9. Lokalisierung: `de_AT` zentral

- `app/bootstrap.dart` setzt `Intl.defaultLocale = 'de_AT'` und ruft `initializeDateFormatting('de_AT')` auf. `MaterialApp` hat `locale: Locale('de', 'AT')`.
- **Alle** Formatierungen laufen über `core/l10n/formatters.dart`. Direktes `DateFormat(...)`/`NumberFormat(...)` in Features **DARF NICHT** vorkommen:

| Funktion | Beispiel |
|---|---|
| `formatEuro(int cent)` | `1234567` → `12.345,67 €` |
| `parseEuroInput(String)` → `int` Cent | `12,5` → `1250` (Komma **und** Punkt akzeptieren, Ergebnis eindeutig) |
| `formatDate(DateTime)` | `07.10.2026` |
| `formatDateLong(DateTime)` | `Mittwoch, 7. Oktober 2026` |
| `formatTime(DateTime)` | `07:42` (24 h) |
| `formatDuration(int minutes)` | `7:30 h` |
| `formatMonth(String monatKey)` | `Oktober 2026` |

- Zeitzone: `core/l10n/vienna_time.dart` ist die **einzige** Stelle für `Europe/Vienna`-Umrechnung und für `tagKey`/`wocheKey`/`monatKey`. Die Function nutzt dieselbe Logik (gleiche Testfälle). Pflicht-Tests: die Sommerzeit-Umstellungstage. *(P6.8)*
- **CSV-Exporte:** UTF-8 **mit BOM**, Trenner `;`, Dezimalkomma, Datum `TT.MM.JJJJ` (Excel Österreich).
- UI-Texte SOLLEN in `lib/l10n/app_de.arb` (gen-l10n, nur Deutsch) stehen; mindestens Fehlertexte und wiederkehrende Labels.

---

## 10. Fehlerbehandlung & Logging

- **Kein leeres `catch`/`onError`.** Jeder `catch` meldet an `ErrorReporter` oder wirft weiter. *(P4.6)*
- Fehler werden in `AppError` übersetzt (`network`, `timeout`, `permission`, `notFound`, `validation`, `unknown`) mit deutschem Nutzertext. Rohes `$e` sieht der Nutzer **nie**. *(P4.6)*
- `ErrorReporter` = Crashlytics (Android/iOS) + Web-Reporter, **ab dem ersten Commit**. Debug-Ausgaben nur über `log()` mit `kDebugMode`-Guard, kein `print`. *(P4.7)*
- Wichtige Zustandswechsel (Auth, Connectivity, Sync, Export) werden als Breadcrumbs mitgeschrieben, damit nicht reproduzierbare Fehler diagnostizierbar sind. *(P4.7)*
- Vor einem Fix wird die Ursache belegt (Log, Test, Repro). Ein zweiter Fix-Versuch zum selben Thema braucht einen neuen Befund. *(P4.7)*

---

## 11. Cloud Functions

| Regel | Stufe |
|---|---|
| `setGlobalOptions({ region: "europe-west3", maxInstances: 10 })` steht als erstes in `index.ts` *(P6.1)* | MUSS |
| Eine Datei pro Function; `index.ts` enthält nur Re-Exports *(P5.5)* | MUSS |
| Jeder Trigger mit Seiteneffekt beginnt mit `claimEventOnce(event.id)` *(P6.2)* | MUSS |
| Callables validieren ihre Eingaben mit **zod** und prüfen die Rolle per `assertRole(request, farmId, role)` | MUSS |
| Secrets nur per `defineSecret`; keine `.env` mit Passwörtern, keine Keys im Code *(P6.3)* | MUSS |
| Massen-Writes nur über `commitInChunks()` (≤ 500) *(P6.10)* | MUSS |
| Zeitlogik nur über `lib/time.ts` (Europe/Vienna, identisch zur App) *(P6.8)* | MUSS |
| Anzeigenamen nur aus `members/{uid}.displayName` *(P6.11)* | MUSS |
| `tsconfig` mit `strict: true`; ESLint mit `@typescript-eslint/no-floating-promises` und `no-empty` | MUSS |
| Strukturierte Logs (`logger.info({ belegId, farmId, … })`) ohne personenbezogene Inhalte | SOLL |
| LLM-Aufrufe: Modell-ID aus der Konfiguration, Tageslimit pro Hof, Rohantwort + Modellversion gespeichert | MUSS |
| `firebase-tools` als devDependency mit fester Version *(P6.12)* | MUSS |

---

## 12. Lint-Regeln

### 12.1 `analysis_options.yaml` (App)

```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
  errors:
    unawaited_futures: error          # P4.8: Logout-Token "fire-and-forget"
    empty_catches: error              # P4.6
    use_build_context_synchronously: error
    cancel_subscriptions: error
    close_sinks: error
    deprecated_member_use: warning
  exclude:
    - "**/*.g.dart"
    - build/**

linter:
  rules:
    - always_use_package_imports
    - avoid_dynamic_calls
    - avoid_print
    - avoid_types_as_parameter_names
    - cancel_subscriptions
    - close_sinks
    - directives_ordering
    - discarded_futures
    - empty_catches
    - exhaustive_cases
    - no_default_cases                # neue Enum-Werte fallen auf
    - only_throw_errors
    - prefer_const_constructors
    - prefer_final_locals
    - prefer_single_quotes
    - sized_box_for_whitespace
    - unawaited_futures
    - use_build_context_synchronously
    - use_colored_box
    - use_decorated_box
```

CI-Aufruf: `flutter analyze --fatal-infos`. Es gilt **null Warnungen**.

### 12.2 Functions
`tsc --noEmit` (strict) + `eslint` mit `@typescript-eslint/recommended`, `no-floating-promises: error`, `no-empty: error`.

### 12.3 `tool/check_conventions.sh` (CI, bricht bei Treffer ab)

| Muster | Erlaubt nur in | Regel |
|---|---|---|
| `Color(0x`, `Color.fromARGB`, `Colors.` (außer `Colors.transparent`) | `lib/app/theme/` | §3 |
| `TextStyle(fontSize` | `lib/app/theme/` | §3 |
| `EdgeInsets\.[a-zA-Z]+\([0-9]`, `SizedBox\((height\|width): [0-9]` | — (0 erlaubt) | §3 |
| `BackdropFilter` | — | §3 |
| `MediaQuery.*size\.(width\|height) \*` | — | §4 |
| `import 'dart:io'` | `lib/core/platform/` | §5 |
| `package:(cloud_firestore\|firebase_\|cloud_functions)` | `lib/core/`, `lib/app/bootstrap.dart`, `features/*/data/` | §6 |
| `\.instance` (Firebase) | wie oben | §6 |
| `'Fehler: \$e'`, `\$e'` in UI-Strings | — | §7 |
| `\.index` in `toFirestore`/`toMap` | — | §8 |
| `git add -A`, `git add \.` | — | §14 |
| Datei > 600 Zeilen | — | §2 |

---

## 13. Tests & CI

| Ebene | Pflicht | Beispiele |
|---|---|---|
| Unit (`domain/`) | **jede** Fachregel | Pausenregel, Wochen-/Monatssumme, `tagKey` an Sommerzeit-Umstellungstagen, `parseEuroInput`, CSV-Zeile, Beleg-Plausibilität |
| Model-Parsing | jedes Model | `safeParse` mit fehlenden/falschen Feldern → Fehler statt Ersatzwert |
| Rules (Emulator) | Rollen × Aktion-Matrix | Mitarbeiter darf keine Belege lesen; Chef eines anderen Hofs darf nichts |
| Functions | jede Callable + Trigger | Idempotenz (doppelt zugestellt → einmal ausgeführt), zod-Ablehnung |
| Widget-Smoke | Kern-Flows | Login → Dashboard; Beleg-Review speichern; Stempeln |

CI-Pipeline (jeder Push/PR):
1. `flutter analyze --fatal-infos`
2. `tool/check_conventions.sh`
3. `flutter test`
4. `npm --prefix functions run lint && npm --prefix functions test`
5. `firebase emulators:exec "npm --prefix functions run test:rules"`
6. `flutter build web --release` (fängt Web-Inkompatibilitäten ab)

Die Build-Nummer kommt aus der CI-Run-Nummer und wird **nicht** committet. *(P7.2)*

---

## 14. Git-Regeln

| Regel | Stufe |
|---|---|
| **Kein `git add -A` / `git add .`** — nicht manuell, nicht in Skripten. Staging nur mit expliziten Pfaden *(P7.1)* | MUSS |
| Skripte committen **keinen Code**; Versions-Bumps nur in `pubspec.yaml`, mit explizitem Pfad *(P7.1)* | MUSS |
| Ein Thema pro Commit; Conventional Commits mit Scope: `feat(belege): …`, `fix(stunden): …`, `chore(ci): …`, `docs: …`, `test(…)`, `refactor(…)`. Commit-Texte auf Deutsch *(P7.7)* | MUSS |
| `main` ist immer deploybar; Arbeit über mehr als eine Sitzung auf Feature-Branch | SOLL |
| Releases taggen: `v<marketing>+<build>`; iOS und Android tragen dieselbe Nummer *(P7.2)* | MUSS |
| Abhängigkeits-Upgrades monatlich in eigenem Branch (`chore(deps): …`), nie in der Release-Woche; Pins mit Kommentar (Grund + Ablaufdatum) *(P7.4)* | MUSS |
| Skripte mit `set -euo pipefail`, keine Fehler-Verschluckung (`\|\| echo`), Voraussetzungen am Start prüfen; Builds per Commit-SHA triggern *(P7.5)* | MUSS |
| Keine Secrets, Exporte, Kundendaten oder generierten Dateien im Repo *(P7.6)* | MUSS |

`.gitignore` — **vor dem ersten Commit** anlegen *(P7.6)*:

```gitignore
# Flutter/Dart
.dart_tool/
build/
.flutter-plugins
.flutter-plugins-dependencies
*.iml
.idea/
# Functions
functions/node_modules/
functions/lib/
# Firebase / Tools
.firebase/
firebase-debug.log
*-debug.log
.claude/*.lock
# Secrets
.env
.env.*
!.env.example
**/serviceAccount*.json
*.pem
*.p8
*.p12
*.jks
*.keystore
key.properties
ios/Runner/GoogleService-Info.plist
android/app/google-services.json
# Daten / Exporte (Test-Fixtures ausgenommen)
*.csv
!test/fixtures/**/*.csv
exports/
tmp/
```

(`google-services.json`/`GoogleService-Info.plist` sind keine echten Geheimnisse, aber projektbezogen; sie werden in der CI aus Secrets erzeugt. Wer sie lieber eincheckt, entfernt die zwei Zeilen bewusst.)

---

## 15. Definition of Done (PR-Checkliste)

- [ ] CI grün (analyze `--fatal-infos`, Konventions-Check, Tests, Web-Build)
- [ ] Neue Fachregeln haben Unit-Tests in `domain/`; Rules-Änderungen haben Emulator-Tests
- [ ] Alle async-Bereiche zeigen Loading/Empty/Failure/Data über `ViewStateBuilder`
- [ ] Alle Writes laufen über Repository + `guarded` + clientseitige ID; Buttons sind `HofAsyncButton`
- [ ] Keine hartkodierten Farben/Größen; geprüft bei 360 dp, 768 dp, 1440 dp und Textskalierung 2,0
- [ ] Auf iOS (Zurück-Geste), Android und Web (Chrome + Safari) kurz angeklickt
- [ ] Datei < 350 Zeilen (Ausnahme begründet, nie > 600)
- [ ] `docs/SCHEMA.md` / `GLOSSAR.md` / `KEYS.md` aktualisiert, falls betroffen
- [ ] Commit(s): ein Thema, Conventional Commit, explizit gestaget
