# Hof-Manager

Flutter-App (Web + Android + iOS) für einen Buschenschank: **Belege** (Foto → Cloud Function → Vision-LLM → Bestätigung → Archiv → CSV/BMD-Export) und **Stunden** (QR-Onboarding, Kommen/Gehen, Wochen-/Monatssummen, Lohn-Export). Rollen: **Chef** / **Mitarbeiter**.
Stack: Flutter + Provider + go_router · Firebase (Auth, Firestore, Storage, Functions in TypeScript) · alles in **EU-Regionen** (`europe-west3`).

## Arbeitsweise
- Sprache: **Deutsch** (Antworten, UI-Texte, Commit-Messages).
- Edits immer manuell bestätigen lassen. Eine Aufgabe pro Session. Unklare Änderungen erklären.
- Nach jeder Aufgabe committen — **nur mit expliziten Pfaden**, Conventional Commit mit Scope (`feat(belege): …`).

## Harte Regeln (Details: `docs/CONVENTIONS.md`, Begründungen: `docs/PITFALLS.md`)
1. **Nie `git add -A` / `git add .`** — auch nicht in Skripten. Skripte committen keinen Code; die Build-Nummer kommt aus der CI.
2. **Feature-first:** `lib/features/<x>/{data,domain,application,ui}`. Dateiname = Klasse, eine öffentliche Klasse pro Datei, **< 350 Zeilen** (CI blockiert ab 600).
3. **Schichten:** UI → Service → Repository. In `ui/` **kein** `firebase_*`-Import und kein `FirebaseX.instance`.
4. **Fachlogik nur in `domain/`** als reine, unit-getestete Funktionen (Pause, Summen, Keys, Plausibilität) — nie in Widgets.
5. **Theme-Pflicht:** Farben, Abstände, Radien, Schatten und Schriften nur aus `context.hof` / `textTheme`. Kein `Color(0x…)`, kein `EdgeInsets.all(16)`, kein `BackdropFilter`, kein Prozent-Sizing.
6. **Responsive über Breakpoints** (< 600 / 600–1024 / > 1024) mit `ResponsiveShell`; Navigation im `Scaffold`, nie als Overlay.
7. **Plattform:** keine eigenen Seitentransitions; `dart:io` nur in `core/platform/`; Uploads per Bytes; Datum/Uhrzeit nur über `core/ui/pickers.dart`.
8. **Daten:** Zeitpunkte `Timestamp`, Beträge `int` Cent, Enums `String`, ID = `doc.id`. **Nie** still auf `now()`/`0`/`''` zurückfallen.
9. **Streams überleben kaputte Dokumente** (`safeParse` pro Dokument). Writes über `guarded()` + clientseitige ID. Lesen–Prüfen–Schreiben nur in Transaktion oder Callable.
10. **Jeder async-Bereich** zeigt Loading/Empty/Failure/Data über `ViewStateBuilder`; jede async-Aktion ist ein `HofAsyncButton`. Kein leeres `catch`, nie `'Fehler: $e'` für Nutzer; Fehler an `ErrorReporter`.
11. **`de_AT` zentral** über `core/l10n/formatters.dart`; Zeitzone `Europe/Vienna` nur über `vienna_time.dart` (App und Function identisch, Sommerzeit getestet). CSV: BOM, `;`, Dezimalkomma.
12. **Functions:** `setGlobalOptions` mit EU-Region, eine Datei pro Function, `claimEventOnce` in jedem Trigger mit Seiteneffekt, zod + `assertRole` in Callables, Secrets nur per `defineSecret`.
13. **Rollen nur über Custom Claims** (`farmId`, `role`). Rules ohne `get()`/E-Mail-Listen. Jede Rules-Änderung kommt mit Emulator-Test; Queries enthalten die `where`-Bedingungen der Rules.
14. **Belege und Zeiteinträge nie löschen** — Status `storniert` bzw. Korrektur mit Audit (Aufbewahrungspflicht).
15. Schema-Änderung ⇒ `docs/SCHEMA.md` + Rules + Test im **selben Commit**. Begriffe nur laut `docs/GLOSSAR.md`.

## Befehle
```bash
flutter analyze --fatal-infos && tool/check_conventions.sh && flutter test
npm --prefix functions run lint && npm --prefix functions test
firebase emulators:exec "npm --prefix functions run test:rules"
flutter build web --release
```

## Wo steht was
| Datei | Inhalt |
|---|---|
| `docs/CONVENTIONS.md` | verbindliche Regeln inkl. Lint-Konfig, `.gitignore`, Definition of Done |
| `docs/PITFALLS.md` | Fehlerkatalog aus EventRide (P1.1 … P7.7) + Top 10 |
| `docs/SCHEMA.md` · `docs/GLOSSAR.md` · `docs/KEYS.md` · `docs/RELEASE.md` | Datenmodell · Begriffe · API-Keys (ohne Werte) · Store-/Release-Setup |
| EventRide-Repo: `HOEFLER_REUSE_ANALYSE.md` | welche EventRide-Module übernommen werden, Zielarchitektur, Baureihenfolge |

Vor Änderungen an Build/Signing, Zeitlogik, Rules oder Streams: den passenden Abschnitt in `docs/PITFALLS.md` lesen.
