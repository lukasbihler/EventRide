# Hof-Manager × EventRide — Reuse-Analyse

**Stand:** 06.10.2026 · **Analysierte Codebasis:** EventRide `main` @ `25741fe` (Version 1.1.6+98)
**Methode:** Vollständige Durchsicht von `lib/`, `functions/src/`, Rules, Build-/Deploy-Skripten und `public/`; Zählungen per Skript. LLM-Preise und Bildlimits am 06.10.2026 gegen die offizielle Anthropic-Doku geprüft.

**Annahmen**
- 1 Personentag (PT) = 8 h. „Teilzeit" = ca. 24 h/Woche → 4 Wochen ≈ 12 PT.
- Die erwähnten Hof-Manager-Mockups lagen nicht im Workspace. Die Design-Aussagen beruhen auf der Beschreibung („hell, warm, große Touch-Flächen").
- Es wird **kein Code geändert**. Dieses Dokument ist die einzige neue Datei.

> Eilige Leser: direkt zum [Management-Summary](#abschluss--management-summary) am Ende.

---

## Teil 1 — Bestandsaufnahme EventRide

### 1.1 Eckdaten

| Merkmal | Wert |
|---|---|
| Flutter / Dart (lokal) | Flutter 3.35.1 stable, Dart 3.9.0 (`environment.sdk: >=3.6.0 <4.0.0`) |
| Paketname / Bundle-ID | `my_app` / `at.eventride.app` |
| Umfang `lib/` | 99 Dart-Dateien, **33.318 Zeilen** (24 Pages, 27 Widgets) |
| Größte Dateien | `fahrten_page.dart` 4.437 Z., `profile_page.dart` 2.311, `public_profile_page.dart` 1.838, `detail_page.dart` 1.711 |
| Cloud Functions | TypeScript, `firebase-functions` v5 (v2-API), Node 20, **1 Datei** `functions/src/index.ts` (1.477 Z., 23 Exports) |
| Tests | **keine** (kein `test/`-Ordner, keine Function-Tests) |
| Plattformen produktiv | Android (Play Store, offener Test), iOS (TestFlight via Codemagic) |
| Web | Flutter-Web **nie gebaut** (`web/` ist das unveränderte Flutter-Template). Web-Admin ist separates Vanilla-JS (`public/eventride_manager.html`, 4.647 Z.) |

### 1.2 Dependencies (aufgelöste Versionen aus `pubspec.lock`)

| Paket | Version | Zweck in EventRide | Für Hof-Manager relevant? |
|---|---|---|---|
| `firebase_core` / `firebase_auth` / `cloud_firestore` / `firebase_storage` / `cloud_functions` | 2.32.0 / 4.20.0 / 4.17.5 / 11.7.7 / 4.7.6 | Backend komplett | Ja, aber **neue Major-Versionen** verwenden — EventRide hängt eine FlutterFire-Generation zurück |
| `firebase_messaging` + `flutter_local_notifications` | 14.9.4 / 18.0.1 | Push + lokale Notifications | Später (Phase 2). `flutter_local_notifications` gibt es nicht fürs Web |
| `provider` | 6.1.5+1 | State-Management | Ja (beibehalten) |
| `image_picker` / `image_cropper` | 1.2.1 / 8.1.0 | Profilfoto, Führerschein, Flyer | `image_picker` ja; Cropper optional |
| `google_fonts` | 8.1.0 | Poppins (Android) | Ja |
| `connectivity_plus` | 7.2.0 | Offline-Banner | Ja |
| `shared_preferences` | 2.5.3 | Favoriten, AGB-Flag | Ja |
| `intl` | 0.20.2 | `de_DE`-Formatierung | Ja (für Hof-Manager `de_AT`) |
| `google_maps_flutter`, `google_places_flutter`, `http` | 2.14.2 / 2.1.1 / – | Karten, Ortssuche | Nein |
| `uuid`, `url_launcher`, `cupertino_icons` | – | Hilfspakete | Ja |

### 1.3 Ordneraufbau

```
lib/
├─ main.dart                 Bootstrapping: Firebase-Init, alle Services instanziieren, MultiProvider, Auth-Lifecycle
├─ firebase_options.dart     FlutterFire-generiert (inkl. Web-Config, ungenutzt)
├─ config/                   feature_flags.dart, legal_texts.dart (AGB/Datenschutz als Strings), story_creator_config.dart
├─ data/                     Models + Services (ChangeNotifier) gemischt in einem Ordner
│  ├─ interfaces/            IAuthRepository, IEventRepository, IFahrtRepository, IChatRepository, …
│  ├─ firebase/              Firestore-/Auth-Implementierungen der Interfaces
│  └─ local/                 leer (Überbleibsel der Hive-Ära)
├─ utils/                    app_route.dart, async_guard.dart, geo_utils.dart, platform_pickers.dart
└─ views/
   ├─ auth/                  auth_gate.dart, auth_guard.dart, verification_guard.dart
   ├─ pages/                 24 Seiten (Fachseiten + Admin + Legal)
   ├─ widgets/               27 Widgets (z. T. EventRide-spezifisch, z. T. generisch)
   └─ widget_tree.dart       Haupt-Shell mit 3 Tabs
```

Ordnerprinzip ist **layer-first** (data/views), nicht feature-first. Models und Services liegen gemischt in `data/`.

### 1.4 Architektur & State-Management

```
Model ──▶ Repository (Interface in data/interfaces + Firebase-Impl. in data/firebase)
      ──▶ Service (ChangeNotifier, abonniert Firestore-Streams)
      ──▶ Provider (MultiProvider in main.dart, .value-Instanzen)
      ──▶ View (context.watch / context.read)
```

- **Services** werden in `main()` vor `runApp` erzeugt und per `ChangeNotifierProvider.value` gereicht. Muster-Beispiel: `firestore_event_repository.dart` + `event_service.dart`. Das ist sauber, kurz und direkt übertragbar.
- **UI-State** liegt in globalen `ValueNotifier`s in `data/notifiers.dart` (Tab-Index, Dark-Mode, Filter, aktive Chat-ID). Teilweise mit `SharedPreferences` persistiert.
- **Auth-Lifecycle** in `_MyAppState` (`main.dart`): Bei Login starten Heartbeat, Block-Service, FCM-Token und Chat-Monitoring; bei Logout wird zuerst das Token entfernt, dann aufgeräumt. Das ist ein gutes Vorbild für den Hof-Manager.
- **Schichtdisziplin nur teilweise eingehalten:** UI greift stellenweise direkt auf `FirebaseAuth.instance` (`verification_guard.dart`), `FirebaseFirestore.instance` (`main.dart`, Chat-Tap) und `FirebaseStorage.instance` (`admin_event_requests_page.dart`) zu.
- **Robustheits-Bausteine**, die sich bewährt haben: `utils/async_guard.dart` (15-s-Timeout für hängende Firestore-Futures bei aktivierter Offline-Persistenz), Idempotenz-Hinweise an Upload-Stellen, `ConnectivityService` mit Fehlalarm-Schutz.

### 1.5 Navigationskonzept

- Eine `MaterialApp` mit globalem `navigatorKey` (für Deep-Links aus Notifications).
- `AuthGate` prüft nur, ob die AGB akzeptiert sind (`SharedPreferences`) → `WidgetTree`.
- `WidgetTree` = `Stack` aus Scaffold + schwebender Glas-`NavBarWidget` + Admin-FAB + `OfflineBanner`. 3 Tabs werden über `selectedPageNotifier` umgeschaltet.
- Alle weiteren Seiten werden **imperativ** per `Navigator.push(AppRoute(...))` geöffnet. Es gibt **keine Named Routes, kein URL-Routing**, keinen Router.
- Die App ist **ohne Login nutzbar**. Login wird erst bei Aktionen über `requiresLogin(context)` (`auth_guard.dart`) erzwungen.

→ Für eine Laptop-/Web-Ansicht ungeeignet: Ohne URL-Routing funktionieren Browser-Zurück, Lesezeichen und Neuladen nicht.

### 1.6 Firebase-Nutzung

**Auth**
- E-Mail/Passwort. Die Verifikations-Mail und den Passwort-Reset verschickt eine **eigene Cloud Function** über SMTP (`smtp.world4you.com`, `nodemailer`), mit eigener Action-Seite `public/auth/email-action.html` bzw. `password-reset.html`. Der Reset ist rate-limitiert (`password_reset_attempts`).
- Telefon-Verifikation per Firebase Phone Auth (Feature-Flag `kPhoneVerifEnabled`).
- Google-Login nur im Web-Manager (`signInWithPopup`/`Redirect`).
- Manager-Tool und App teilen sich denselben Auth-User-Pool.

**Firestore — tatsächlich verwendete Collections** (mehr als in `CLAUDE.md` dokumentiert)

| Collection | Inhalt | Für Hof-Manager |
|---|---|---|
| `users/{uid}` + `users/{uid}/private/data` | Public-Profil + sensible Felder (Telefon, Kennzeichen, Koordinaten) | **Muster übernehmen** (Public/Private-Split → z. B. Stundenlohn privat) |
| `fahrten`, `anfragen`, `interessenten`, `chat_conversations/{id}/messages`, `reviews`, `review_reports`, `user_reports` | Fachdomäne Mitfahren | Nein |
| `events`, `eventRequests`, `pending_events` | Events + Einreichungen | `eventRequests` als **Vorlage** für Beleg-Status-Flow |
| `licenseRequests` | Führerschein-Prüfung durch Admin | Vorlage für Prüf-Queue |
| `processedTriggerEvents` | Idempotenz-Marker für Trigger-Redelivery | **Muster übernehmen** |
| `password_reset_attempts`, `ig_accounts`, `gemeinde_meta` | Interne Tools | Nein |

**Storage:** `users/{uid}/profile.jpg`, `users/{uid}/license.jpg`, `event_requests/{id}/flyer.jpg`. Die Rules prüfen Größe, Content-Type und `metadata.uploaderUid`. Das ist ein gutes Muster für Belege.

**Cloud Functions** (23 Exports, alle in `functions/src/index.ts`, **keine Region gesetzt** → Default `us-central1`)

| Typ | Anzahl | Beispiele |
|---|---|---|
| Firestore-Trigger | 11 | `onAnfrageUpdated`, `onMessageCreated`, `onLicenseRequestWritten`, `onEventRequestUpdated` |
| Callable | 8 | `acceptInvitation`, `submitReview`, `getLicensePlate`, `sendVerificationEmail`, `createEventContainer` |
| Scheduler (`Europe/Vienna`) | 3 | `cleanupAbgelaufeneAnfragen`, `cleanupAbgelaufeneEvents`, `cleanupProcessedTriggerEvents` |
| Auth (v1) | 1 | `cleanupDeletedUser` |

Wiederverwendbare Helfer darin: `sendNotification` (Multicast + Entfernen ungültiger Tokens), `getTokens`, `claimEventOnce` (Idempotenz), `getViennaOffsetHours`, Batch-Chunking mit `FIRESTORE_BATCH_LIMIT = 500`, `assertEventManager` (Rollenprüfung), Mailversand.

**Push/Messaging:** FCM-Token-Verwaltung pro User als Array (`fcmTokens`, mehrgerätefähig), Vordergrund-Anzeige über `flutter_local_notifications`, Deep-Link-Routing per Payload (`notification_service.dart`).

**Web/Hosting:** Die Website `eventride.at` läuft über World4You per FTP, Deploy über `.github/workflows/deploy-website.yml`. `firebase.json` enthält zwar einen Hosting-Block auf `public/`, laut `CLAUDE.md` läuft die Website aber nicht über Firebase Hosting. Flutter-Web wird nicht ausgeliefert.

### 1.7 Design-System

| Aspekt | Befund |
|---|---|
| Theme | `ThemeData(colorSchemeSeed: Colors.blueAccent)` + Poppins (Android) bzw. System-Font mit angepassten Gewichten (iOS). Dark-Mode-Notifier existiert, das Design ist faktisch aber immer dunkel |
| Farben | **Keine Design-Tokens.** 282 hartkodierte `Color(0x…)`/`fromARGB`-Literale in `lib/views`, Akzent `#F5A04A` 50× einzeln kopiert, **0×** `Theme.of(context).colorScheme` |
| Stil | Dunkles Blau-Glas (BackdropFilter-Blur), Hintergrund-Gradient `#B79B78 → #52A1EF → #406CFB`, orange Akzente |
| Sizing | `SizeHelper` (Prozent der Bildschirmbreite/-höhe, 29 Aufrufe) → skaliert auf Laptop-Breiten absurd (Titel = 4,5 % der Breite ≈ 86 px bei 1920 px) |
| Wiederverwendbare Bausteine | `app_bottom_sheet.dart` (Shell, Header, Primary/Danger/Ghost-Button, Input-Decoration, `showAppSheet`), `app_snackbar.dart` (Overlay-Snackbar), `app_card.dart`, `user_avatar_widget.dart`, `offline_banner_widget.dart`, `platform_pickers.dart` (Cupertino/Material-Date/Time-Picker) |
| Navigation-UI | `navbar_widget.dart`: Glas-Pill-Navbar mit gleitendem Indikator, fest auf 3 EventRide-Tabs + Badges verdrahtet |
| Kamera/Bild-Upload | `ImagePicker().pickImage(source, imageQuality: 85–90)` → optional `ImageCropper` (1:1 fürs Profil) → `File(picked.path)` → `ref.putFile(...)` mit `SettableMetadata`. Die Quellen-Auswahl (Galerie/Kamera) läuft als Bottom-Sheet (`event_submit_page.dart`, `profile_page.dart` `_LicenseSheet`) |

### 1.8 Auth-, User- und Rollenmodell, Onboarding

- **AppUser** (`data/app_user.dart`): `userId, name, email, photoUrl, emailVerified, phone, phoneVerified, licenseStatus, homeTown(+Lat/Lng), car, ratingAvg/Count, blockedUserIds`, Trust-Level 0–3 wird berechnet.
- **Rollen:**
  - *User* (Standard)
  - *Admin* über das Feld `users/{uid}.isAdmin == true`, manuell in der Console gesetzt. Die Rules lesen es per `get()`, das kostet einen Read pro Regelprüfung. Selbst-Beförderung wird durch eine Feld-Immutabilitätsprüfung verhindert.
  - *Manager* (Web-Tool) über eine **hartkodierte E-Mail-Whitelist** in `firestore.rules` und in der Function.
  - **Keine Custom Claims.**
- **Onboarding-Flow:** App-Start → AGB/Datenschutz akzeptieren (`TermsAcceptancePage`, lokal gespeichert) → App ohne Login nutzbar → bei Aktion Login-Sheet → Registrierung (Vor-/Nachname, E-Mail, Passwort, Datenschutz-Link) → `users/{uid}` anlegen → Verifikations-Mail (eigene Function) → `requireVerified()` sperrt bestimmte Aktionen → optional Telefon und Führerschein im Profil.
- **Account-Löschung** ist kaskadierend (Client + `cleanupDeletedUser`), Re-Auth-Flow ist vorhanden.

### 1.9 Flutter-Web-Tauglichkeit des bestehenden Codes

| Bereich | Web-tauglich? | Details |
|---|---|---|
| Firebase Auth/Firestore/Storage/Functions | ✅ | Läuft im Web; Offline-Persistenz im Web (IndexedDB, Mehr-Tab-Betrieb) gesondert testen |
| `dart:io` / `Platform.isIOS` | ❌ | In **11 Dateien**. `Platform.isX` wirft im Web zur Laufzeit → durch `kIsWeb`/`defaultTargetPlatform` ersetzen |
| Uploads mit `File` + `putFile` | ❌ | Im Web gibt es kein `File` → `XFile.readAsBytes()` + `putData(bytes)` |
| `image_picker` | ⚠️ | Web = `<input type=file>`; am Handy-Browser öffnet sich die Kamera, am Laptop der Dateidialog. Keine Live-Vorschau, kein Dokumentscanner |
| `image_cropper` | ⚠️ | Im Web zusätzliche JS-Einbindung nötig; für Belege verzichtbar |
| `firebase_messaging` | ⚠️ | Braucht Service-Worker + VAPID-Key; auf iOS nur als installierte PWA. `onBackgroundMessage` läuft im Web nicht |
| `flutter_local_notifications` | ❌ | Keine Web-Implementierung |
| `google_places_flutter` (eigene REST-Calls) | ❌ | CORS blockiert im Browser (für Hof-Manager irrelevant) |
| `connectivity_plus`, `shared_preferences`, `google_fonts`, `url_launcher` | ✅ | |
| `SizeHelper`-Prozent-Layout | ⚠️ | Funktioniert, sieht aber auf breiten Screens kaputt aus |
| Navigation ohne URLs | ⚠️ | Funktioniert, aber ohne Browser-Zurück, Lesezeichen und Neuladen auf Unterseiten |
| `BackdropFilter`-Glas-Effekte | ⚠️ | Kostet im Web Performance (entfällt im hellen Hof-Design ohnehin) |
| `SystemChrome.setPreferredOrientations` | ✅ | Wirkungslos, aber harmlos |

### 1.10 Altlasten & Qualitätsbefunde (relevant für die Fork-Frage)

- Riesige Seiten-Dateien mit eingebetteter Logik (bis 4.437 Zeilen), keine Tests.
- Design ohne Tokens (siehe 1.7); das Umfärben eines Forks hieße Hunderte Literale anfassen.
- FlutterFire-Pakete eine Generation zurück → Major-Upgrade nötig, egal ob Fork oder Neu.
- Repo-Ballast: `1_uebungen/` (Übungsprojekt, getrackt), `web_assets/` (veraltet), `eventride_admin.html` (Duplikat), Story-Creator-Modus, Festl-Export-CSVs im Root. Eine davon (`festl_tickets_vollstaendig.csv`, mit Käufer-E-Mails) ist über `git add -A` im Build-Loop eingecheckt worden. `.git` ist 154 MB groß.
- Functions ohne Region (US), alles in einer Datei, Secrets über `.env` statt Secret Manager.
- Rollen über Whitelist/Dokumentfeld statt Claims.

---

## Teil 2 — Zielapp „Hof-Manager" (Buschenschank)

### 2.1 Module

| Modul | Kernablauf |
|---|---|
| **Belege** | Foto/Datei → Upload → Cloud Function ruft Vision-LLM → Lieferant, Datum, Betrag (brutto/netto/USt), Kategorie + Vorschlag *betrieblich/privat* → Bestätigungs-Screen → speichern → durchsuchbares Archiv → Export (zuerst CSV, später BMD) |
| **Stunden** | Mitarbeiterkonto per QR-Einladung → Kommen/Gehen stempeln → automatische Wochen-/Monatssummen (inkl. Pausenregel) → Lohn-Export |
| **Rollen** | **Chef**: Überblick, Belege, Stunden aller, Mitarbeiterverwaltung, Export · **Mitarbeiter**: nur eigenes Stempeln + eigene Stundenübersicht |
| **Laptop/Web** | Flutter Web mit Firestore-Live-Sync: Foto am Handy → erscheint sofort am Laptop |
| **Design** | Hell und warm, große Touch-Flächen (Arbeitshände, draußen, schnell) |

### 2.2 Rollenmatrix

| Funktion | Chef | Mitarbeiter |
|---|:-:|:-:|
| Belege erfassen, bestätigen, Archiv, Export | ✅ | – |
| Mitarbeiter einladen (QR), deaktivieren | ✅ | – |
| Stunden aller sehen, korrigieren (mit Begründung), exportieren | ✅ | – |
| Selbst stempeln, eigene Stunden sehen | ✅ | ✅ |
| Einstellungen (Kategorien, Pausenregel, Betriebsdaten) | ✅ | – |

### 2.3 Fachliche Rahmenbedingungen Österreich (vor dem Bau mit Steuerberater klären — keine Rechtsberatung)

- **USt-Sätze** 10 / 13 / 20 %; ein Beleg kann mehrere Sätze enthalten → Extraktion als Liste.
- **Aufbewahrung** von Belegen und Lohnunterlagen grundsätzlich 7 Jahre (BAO) → kein Hard-Delete bestätigter Belege, Backups in der EU.
- **Arbeitszeitaufzeichnungen** sind Pflicht (AZG). Die Ruhepause bei > 6 h Arbeitszeit sollte als konfigurierbare Regel umgesetzt werden, nicht hartkodiert.
- **Pauschalierung:** Viele Buschenschanken nutzen eine land- und forstwirtschaftliche Pauschalierung. Das beeinflusst, welche Belege/Kategorien relevant sind und wie der Export aussehen muss → **Frage Nr. 1 an den Steuerberater**.
- **BMD** (in Österreich verbreitete Kanzlei-Software): Der Import erfolgt über ein CSV-basiertes Buchungsformat mit fixen Spalten (Konto/Gegenkonto, Belegdatum, Betrag, Steuercode …). Die **genaue Spezifikation muss vom Steuerberater bzw. aus der BMD-Doku kommen**. Bis dahin ein eigenes, sauberes CSV mit Kategorie→Konto-Mapping als Einstellung vorsehen.
- **Lohn:** Im MVP nur Stunden exportieren, keine Lohnberechnung. Zuschläge (Sonn-/Feiertag — im Buschenschank der Normalfall) zunächst nur als markierte Spalten.

---

## Teil 3 — Abgleich & Empfehlung

### 3.1 Reuse-Matrix

Einstufung: **1:1** = kopieren, höchstens Imports/Namen ändern · **anpassen** = Struktur übernehmen, Inhalt/Design/Abhängigkeiten ändern · **Referenz** = als Vorlage lesen, neu schreiben.

#### Infrastruktur & Utils

| Komponente | EventRide-Datei(en) | Einstufung | Ziel / Anpassung |
|---|---|---|---|
| Timeout-Guard für Futures | `lib/utils/async_guard.dart` | **1:1** | `core/utils/async_guard.dart` |
| Einheitliche Seitenroute | `lib/utils/app_route.dart` | **1:1** (nur nativ) | Mit go_router nur noch für Modals/Sheets nötig |
| Feature-Flags | `lib/config/feature_flags.dart` | **1:1** (Muster) | `core/config/feature_flags.dart` (z. B. `kBmdExportEnabled`) |
| Online/Offline-Erkennung | `lib/data/connectivity_service.dart` | **1:1** + 1 Zeile | Reachability-Check liest `events` → auf eine Hof-Collection umstellen. Enthält die mühsam gefundenen Fixes gegen falsche Offline-Meldungen |
| Offline-Banner | `lib/views/widgets/offline_banner_widget.dart` | **anpassen** | Farben/Text ins Hof-Theme |
| Date-/Time-Picker | `lib/utils/platform_pickers.dart` | **anpassen** | `Platform.isIOS` → `defaultTargetPlatform == TargetPlatform.iOS && !kIsWeb`; Dark-Farben entfernen |
| Firebase-Options | `lib/firebase_options.dart` | **Referenz** | Neu mit `flutterfire configure` fürs neue Projekt |

#### Daten- & Auth-Schicht

| Komponente | EventRide-Datei(en) | Einstufung | Ziel / Anpassung |
|---|---|---|---|
| Repository-Interface + Firestore-Impl. + ChangeNotifier-Service | `data/interfaces/i_event_repository.dart`, `data/firebase/firestore_event_repository.dart`, `data/event_service.dart` | **Referenz/Muster 1:1** | Schablone für `BelegRepository`, `TimeEntryRepository`, `MemberRepository` |
| Auth-Interface | `data/interfaces/i_auth_repository.dart` | **anpassen** | Behalten: signIn, register, resetPassword, signOut, reauthenticate, changePassword, deleteAccount, authStateChanges. Weg: Führerschein, Telefon, Auto, Kennzeichen, Event-Requests, `File`-Parameter |
| Auth-Implementierung | `data/firebase/firebase_auth_repository.dart` (825 Z.) | **anpassen** (~250 Z. bleiben) | Wertvoll: kombinierter Stream Auth + User-Doc + Private-Doc mit sauberem Abbau bei Logout, Re-Auth, Passwort-Änderung. Neu: Rolle/Hof aus **Custom Claims** statt `isAdmin`-Feld |
| User-Repository (Name, Foto, FCM-Tokens) | `data/interfaces/i_user_repository.dart`, `data/firebase/firestore_user_repository.dart` | **anpassen** | Token-Methoden 1:1, Trust-Level/LastSeen raus |
| AppUser-Model | `data/app_user.dart` | **Referenz** | Neues `HofUser`/`Member`-Model (Name, Rolle, aktiv, Wochensoll) |
| Status-Model mit Einreichung/Prüfung | `data/event_request.dart`, `data/license_request.dart` | **Referenz** | Vorlage für `Beleg` (status, submittedAt, Pfad, Ablehnungsgrund) |
| Lifecycle bei Login/Logout | `main.dart` `_MyAppState` (Auth-Listener, Token entfernen vor Cleanup) | **Referenz** | In `AuthService` überführen |
| Push-Service | `data/notification_service.dart` | **anpassen** (Phase 2) | Token-Handling, Payload-Routing 1:1; Chat-Monitoring raus; Web ohne `flutter_local_notifications` |

#### UI-Bausteine

| Komponente | EventRide-Datei(en) | Einstufung | Ziel / Anpassung |
|---|---|---|---|
| Bottom-Sheet-System | `views/widgets/app_bottom_sheet.dart` | **anpassen** | Struktur 1:1 (Shell, Header, Primary/Danger/Ghost, `sheetInputDecoration`, `showAppSheet`). Farben über ThemeExtension, Buttons auf ≥ 56 dp Höhe |
| Snackbar | `views/widgets/app_snackbar.dart` | **anpassen** | Overlay-Mechanik 1:1; Varianten Erfolg/Fehler/Info (aktuell immer Häkchen-Icon, auch bei Fehlern) |
| Karte | `views/widgets/app_card.dart` | **anpassen** | Dunkler Gradient → helle, warme Fläche mit sanftem Schatten |
| Avatar mit Initialen-Fallback | `views/widgets/user_avatar_widget.dart` | **1:1** + Farbe | Mitarbeiterliste, Stempel-Übersicht |
| AppBar | `views/widgets/appbar_widget.dart` | **Referenz** | `dart:io`, `SizeHelper`, Kalender-Button → neu als responsive Header |
| Navbar | `views/widgets/navbar_widget.dart` | **Referenz** | Animations-Idee (gleitende Pill) übernehmen; neu als `ResponsiveShell` (BottomNav ↔ NavigationRail) |
| Hintergrund-Gradient | `views/widgets/background_widget.dart` | Nein | Entfällt (helles Design) |
| `SizeHelper` | `views/widgets/sizehelper_widget.dart` | **nicht übernehmen** | Durch feste Größen + Breakpoints ersetzen |
| Kalender-Overlay | `views/widgets/calendar_widget.dart` | **Referenz** | Hängt an `Event`/`notifiers`; evtl. Idee für Monatsansicht Stunden |

#### Seiten-Vorlagen

| Komponente | EventRide-Datei(en) | Einstufung | Ziel / Anpassung |
|---|---|---|---|
| Login / Registrierung | `views/pages/login_page.dart`, `register_page.dart` | **anpassen** | Validierung, Fehlertexte, `guarded`-Aufrufe übernehmen; Branding/Design neu; Einladungscode-Variante ergänzen |
| E-Mail-Verifikation | `views/pages/email_verification_page.dart`, `views/auth/verification_guard.dart` | **anpassen** | Für Chef-Konto sinnvoll; `FirebaseAuth.instance` hinter Interface ziehen |
| Login-Pflicht-Gate | `views/auth/auth_guard.dart` | **Referenz** | Hof-Manager ist komplett login-pflichtig → Router-Redirect statt Sheet |
| AGB/Datenschutz-Zustimmung + Textseite | `views/pages/terms_acceptance_page.dart`, `legal_page.dart`, `config/legal_texts.dart` | **anpassen** | Flow 1:1, Texte neu (Mitarbeiter-Datenschutzinfo!) |
| Upload-Flow mit Quellen-Sheet | `views/pages/event_submit_page.dart` (`_pickFlyer`, `_showPickerSheet`, Timeout-Hinweise) | **Referenz** | Vorlage für Beleg-Erfassung |
| Prüf-Sheet (Bild laden + vorbefülltes Formular + Freigeben/Verwerfen) | `views/pages/admin_event_requests_page.dart` (`_ReviewSheet`, `getData` aus Storage) | **Referenz** | **Engste Vorlage für den Beleg-Bestätigungs-Screen** |
| Prüf-Queue | `views/pages/admin_license_page.dart` | **Referenz** | „Offene Belege"-Liste |
| Einstellungen inkl. Konto löschen, Passwort ändern, Re-Auth | `views/pages/settings_page.dart` | **Referenz** | Dialog-Logik übernehmen, Seite neu |

#### Cloud Functions, Rules, Build & Deploy

| Komponente | EventRide-Datei(en) | Einstufung | Ziel / Anpassung |
|---|---|---|---|
| Push-Helfer mit Token-Bereinigung | `functions/src/index.ts` `sendNotification`, `getTokens` | **1:1** | `functions/src/lib/notify.ts` |
| Idempotenz bei Trigger-Redelivery | `claimEventOnce` + `cleanupProcessedTriggerEvents` | **1:1** | Pflicht für den LLM-Trigger (sonst doppelte Kosten) |
| Batch-Chunking | `FIRESTORE_BATCH_LIMIT` + Schleifen | **1:1** | Export, Bereinigung |
| Wiener Zeitzone | `getViennaOffsetHours` | **anpassen** | Besser `Intl.DateTimeFormat` mit `timeZone: 'Europe/Vienna'` — wichtig für Tages-/Wochengrenzen der Stunden |
| Rollenprüfung in Callables | `assertEventManager` | **anpassen** | → `assertRole(request, farmId, 'chef')` auf Basis von Claims |
| Eigener Mailversand (SMTP World4You) | `sendVerificationEmail`, `sendPasswordResetEmailCustom` | **anpassen** | Branding neu; zusätzlich „Export an Steuerberater senden". `EMAIL_PASS` → `defineSecret` |
| Auth-Lösch-Cleanup | `cleanupDeletedUser` | **Referenz** | Bei Mitarbeiter-Austritt: deaktivieren statt löschen (Aufbewahrung!) |
| Scheduler mit `timeZone: "Europe/Vienna"` | `onSchedule`-Exports | **Muster 1:1** | Erinnerung „noch eingestempelt", Backups |
| Firestore-Rules-Helfer | `firestore.rules` (`isSignedIn`, `isOwner`, Feld-Immutabilität, Private-Subcollection) | **Referenz** | Neue Rules auf Claims-Basis |
| Storage-Rules | `storage.rules` (Größe, Content-Type, `uploaderUid`-Metadata) | **anpassen** | Pfade `farms/{farmId}/belege/...` |
| Seed-/Testdaten-Skripte | `scripts/seed_events.js`, `seed_screenshot_data.js`, `delete_test_events.js` | **anpassen** | Demo-Hof mit Belegen und Stunden für die Präsentation |
| iOS-Pipeline | `codemagic.yaml`, `scripts/build_loop.sh`, `cm_*.sh` | **anpassen** (nach MVP) | Bundle-ID/Profile tauschen. Das gesammelte Signing-Wissen spart beim Store-Release viel Zeit. Im Build-Loop `git add -A` durch gezieltes Hinzufügen ersetzen |
| Android-Testverteilung | `deploy_apk.ps1` | **anpassen** (nach MVP) | App Distribution für Testgeräte |
| Website-FTP-Deploy | `.github/workflows/deploy-website.yml` | **Referenz** | Für Flutter-Web eher Firebase Hosting (SPA-Rewrites, Preview-Channels) |
| CSV-Export im Browser | `public/eventride_manager.html` (~Z. 3887: UTF-8-BOM, `Blob`; ~Z. 3206: `;`-Trenner) | **Referenz** | Wissen übernehmen: **BOM + Semikolon + Dezimalkomma**, sonst zeigt österreichisches Excel Umlaute und Beträge falsch |
| Auth-Action-Seiten | `public/auth/email-action.html`, `password-reset.html` | **anpassen** | Neues Branding/Domain |

#### Ebenfalls brauchbar (außerhalb dieses Repos)

| Komponente | Ort | Einstufung | Hinweis |
|---|---|---|---|
| Pausenregel + Wochen-Zeitausgleich | `C:\Users\lucky\arbeitszeitplaner\index.html` (`brk()`, `closeWeek()`) | **Referenz** | Persönliches Tool, aber genau die Rechenlogik (Pause ab 6 h, Wochensoll) fürs Stunden-Modul; nach Dart portieren und mit Tests absichern |

### 3.2 Bewusst nicht übernehmen

Fahrten/Anfragen/Interessenten, Chat-System, Bewertungen/Trust-Level, Führerschein/Kennzeichen, Events/Event-Container, Story-Creator, Google Maps/Places, Block-/Report-System, `notifiers.dart` als globales Sammelbecken, `widget_tree.dart` (Stack-Shell mit Glas-Effekten), `background_widget.dart`, `SizeHelper`, `1_uebungen/`, `web_assets/`, Festl-CSVs.

### 3.3 Komplett neu zu bauen

| Modul | Kern-Herausforderung |
|---|---|
| **Design-System „Hof"** | ThemeData + ThemeExtension (Tokens), XL-Buttons, Kacheln, Status-Chips, Betragsfeld (de_AT), responsive Shell |
| **Router** | `go_router` mit Auth-/Rollen-Redirects und URLs (`/belege/:id`, `/stunden/2026-10`) |
| **Mandanten-/Rollenmodell** | `farms/{farmId}` + Custom Claims `{farmId, role}` + Rules |
| **QR-Einladung** | Einladung mit Ablauf und Einmal-Token, QR-Anzeige, Beitritts-Seite, Claims setzen |
| **Beleg-Erfassung** | Kamera/Datei/Drag-&-Drop (Web), Verkleinern + JPEG-Normalisierung, Upload mit Bytes, Live-Status |
| **LLM-Function** | Storage-Trigger, Vision-Aufruf mit Structured Output, Plausibilitätsprüfung, Retry, Kostenbremse |
| **Bestätigungs-Screen** | Zoombares Bild + Formular, unsichere Felder markiert, großer Betrieblich/Privat-Schalter |
| **Archiv** | Monats-Gruppierung, Filter (Kategorie, Art, Zeitraum), Lieferanten-Suche, Detail, Korrektur |
| **Stempeln** | Ein großer Button, Doppel-Einstempeln verhindern, offline-fähig mit Zeitstempel-Plausibilität |
| **Stunden-Summen** | Pausenregel, Tages-/Wochen-/Monatsaggregate (Function), Chef-Korrektur mit Audit-Trail |
| **Export** | CSV Belege + CSV Stunden serverseitig, Download-Link, Export-Protokoll; später BMD, ZIP mit Bildern |
| **Chef-Dashboard** | Offene Belege, wer ist gerade eingestempelt, Monatssummen |
| **Tests** | Unit-Tests für Pausen-/Summenlogik, CSV-Format, Extraktions-Validierung |

### 3.4 Empfehlung: neues Flutter-Projekt mit kopierten Modulen (kein Fork)

| Kriterium | Fork von EventRide | Neues Projekt + Copy-in |
|---|---|---|
| Tempo in Woche 1 | Schneller Start, aber ~80 % Code löschen, Rules/Functions entkernen | 0,75 PT Setup, danach sauber |
| FlutterFire-Versionen | Major-Upgrade im laufenden Projekt nötig | Aktuelle Versionen ab Tag 1 |
| Design | 282 Farb-Literale umbauen, Glas-Layouts entfernen | Theme-Tokens von Anfang an |
| Web-Tauglichkeit | `dart:io` in 11 Dateien, Navigation ohne URLs, Prozent-Sizing | Web-first gebaut |
| Firebase-Projekt | Gefahr, in `eventride-cd0e9` weiterzubauen (US-Functions, gemeinsamer User-Pool, EventRide-Rules) | Eigenes Projekt in EU-Region, getrennte Daten/Abrechnung |
| Git-Historie | 154 MB, 365 Commits fremde Domäne, eingecheckte Export-CSV | Sauberer Start |
| Paket-/Bundle-IDs | `my_app` / `at.eventride.app` umbenennen (fehleranfällig, v. a. iOS) | Richtig ab Start |
| Was echten Wert bringt | Wissen + Muster + ~2.000–3.000 Zeilen Infrastruktur | **Genau das wird kopiert** |

**Begründung:** Der Fork spart nur am allerersten Tag Zeit. Danach kostet er mehr, als er bringt: Das Upgrade, der Design-Umbau und die Web-Bereinigung wären ohnehin nötig. Dazu kommt ständiges Aufräumen fremder Domänenlogik, und es bleibt das Risiko, Rules oder Trigger von EventRide versehentlich mitzunehmen. Der eigentliche Hebel von EventRide sind die erprobten **Infrastruktur-Bausteine und Lösungsmuster** — die lassen sich gezielt in ein frisches Projekt kopieren.

**Copy-in-Vorgehen**
1. `flutter create --org at.<betrieb> hof_manager --platforms=web,android,ios` mit aktuellem Flutter stable.
2. Neues Firebase-Projekt, Standort **EU** (Firestore z. B. `eur3` oder `europe-west3`, Storage-Bucket EU, Functions `europe-west3`), dann `flutterfire configure`.
3. Dateien aus der Matrix (Spalte 1:1/anpassen) einzeln kopieren → sofort `dart:io` entfernen, Farben auf Theme umstellen, Imports `package:hof_manager/...`.
4. Functions-Helfer in `functions/src/lib/` aufteilen, `setGlobalOptions({ region: "europe-west3" })`.
5. Herkunft in Kopfkommentaren vermerken („übernommen aus EventRide `lib/utils/async_guard.dart`"), damit Bugfixes in beide Richtungen nachvollziehbar bleiben.

### 3.5 Zielarchitektur

#### Ordnerstruktur (feature-first)

```
hof_manager/
├─ lib/
│  ├─ main.dart                      Init (Firebase, de_AT), Services, Provider, App
│  ├─ app/
│  │  ├─ app.dart                    MaterialApp.router
│  │  ├─ router.dart                 go_router + Redirects (Login, Rolle, Einladung)
│  │  └─ theme/                      hof_theme.dart, hof_tokens.dart (ThemeExtension), typography.dart
│  ├─ core/
│  │  ├─ auth/                       auth_repository.dart (+firebase impl.), auth_service.dart, role.dart
│  │  ├─ firebase/                   firebase_options.dart
│  │  ├─ services/                   connectivity_service.dart, notification_service.dart (Phase 2)
│  │  ├─ utils/                      async_guard.dart, formatters.dart (€, Datum), platform.dart (kIsWeb-sicher)
│  │  └─ widgets/                    responsive_shell, hof_button, hof_card, hof_sheet, hof_snackbar,
│  │                                 status_chip, amount_field, offline_banner, empty_state, user_avatar
│  └─ features/
│     ├─ onboarding/                 login, register, join_page (QR-Link), terms, email_verification
│     ├─ dashboard/                  chef_dashboard_page
│     ├─ belege/                     data/ (beleg.dart, beleg_repository.dart) · beleg_service.dart ·
│     │                              ui/ (capture_page, review_page, archive_page, detail_page)
│     ├─ stunden/                    data/ (time_entry.dart, active_shift.dart, summary.dart) · stunden_service.dart ·
│     │                              ui/ (stempel_page, meine_stunden_page, team_stunden_page, korrektur_sheet)
│     ├─ team/                       member_list_page, invite_qr_page
│     ├─ export/                     export_page
│     └─ settings/                   settings_page (Kategorien, Pausenregel, Betriebsdaten, Konto)
├─ functions/src/
│  ├─ index.ts                       nur Re-Exports
│  ├─ lib/                           admin.ts, auth.ts (assertRole), time.ts (Europe/Vienna), notify.ts, idempotency.ts
│  ├─ team/                          createFarm.ts, createInvite.ts, acceptInvite.ts, setMemberActive.ts
│  ├─ belege/                        onBelegUploaded.ts, reprocessBeleg.ts, extractor.ts (Interface),
│  │                                 claudeVertexExtractor.ts, schema.ts, prompt.ts, validate.ts
│  ├─ stunden/                       onShiftClosed.ts, recalcSummary.ts, remindOpenShifts.ts
│  ├─ export/                        exportBelegeCsv.ts, exportStundenCsv.ts, csv.ts, (bmd/ später)
│  └─ ops/                           backupFirestore.ts (geplanter Export in EU-Bucket)
├─ test/                             pause_rule_test, summary_test, csv_format_test, beleg_model_test
├─ firestore.rules · storage.rules · firestore.indexes.json · firebase.json (Hosting: SPA-Rewrite)
└─ .github/workflows/                deploy-web.yml (build web → Firebase Hosting), functions-ci.yml
```

**State:** Provider + ChangeNotifier wie in EventRide (bekannt, für den Umfang ausreichend). Neu ist nur `go_router`.

#### Firestore-Datenmodell

```
users/{uid}                              displayName, email, activeFarmId, fcmTokens[]
farms/{farmId}                           name, adresse, uid_chef, createdAt,
                                         settings { kategorien[], kategorieKonten{}, pausenregel{abMin:360, pauseMin:30},
                                                    wochenstartMontag, waehrung:'EUR' }
farms/{farmId}/members/{uid}             role:'chef'|'mitarbeiter', displayName, active, wochensollMin, joinedAt
farms/{farmId}/members/{uid}/private/data  stundenlohnCent?, svNr?   ← nur Chef (Public/Private-Split wie EventRide)
farms/{farmId}/invites/{inviteId}        role, displayName, tokenHash, expiresAt, createdBy, usedBy?, usedAt?
farms/{farmId}/belege/{belegId}          status: 'uploading'|'processing'|'extracted'|'confirmed'|'failed'|'storniert'
                                         storagePath, mimeType, uploadedBy, uploadedAt
                                         extraction { lieferant, datum, bruttoCent, nettoCent?, ust[{satz, betragCent}],
                                                      kategorie, artVorschlag:'betrieblich'|'privat', begruendung,
                                                      confidence{feld: 0..1}, warnungen[], model, extractedAt, fehler? }
                                         final { lieferant, datum, bruttoCent, ust[], kategorie, art, notiz }
                                         confirmedBy, confirmedAt, exportIds[]
                                         idx { lieferantLower, monatKey:'2026-10', jahr }
farms/{farmId}/activeShifts/{uid}        clockInClient, clockInServer, quelle   ← deterministische ID = max. 1 offene Schicht
farms/{farmId}/timeEntries/{entryId}     uid, clockIn, clockOut, clientAbweichungMin, pauseMin, nettoMin,
                                         tagKey, wocheKey, monatKey, korrektur? {by, at, grund, vorher{}}
farms/{farmId}/timeSummaries/{uid}_{monatKey}  nettoMin, tage{dd: min}, wochen{Www: min}, updatedAt  ← nur Function schreibt
farms/{farmId}/exports/{exportId}        typ:'belege-csv'|'stunden-csv'|'bmd', von, bis, createdBy, createdAt,
                                         storagePath, zeilen, sha256
```

Lehren aus EventRide, die hier eingebaut sind:
- **Beträge als ganze Cent** (keine Floats).
- **Datum immer als `Timestamp`**: In EventRide hat ein Event mit Datum im Format DD.MM.YYYY den kompletten Stream lahmgelegt; `fromMap` deshalb pro Dokument mit try/catch.
- **Deterministische Doc-ID** gegen Doppel-Einstempeln, nach dem Prinzip von `buildConversationId`.
- **Idempotente Trigger** (`claimEventOnce`).
- **Kapazitäts-/Zustandsprüfungen in Transaktionen**: Das Overbooking-Problem in `acceptInvitation` entstand, weil die Prüfung vor der Transaktion lag.

#### Rollen & Security Rules (Skizze)

- Claims `{ farmId, role }` setzt ausschließlich eine Function (`createFarm`, `acceptInvite`, `setMemberActive`). Danach erzwingt der Client `getIdToken(true)`.
- Die Rules prüfen Claims ohne `get()`-Reads:
  - `belege/**`, `members/**/private/**`, `exports/**`, `invites/**` → nur `role == 'chef'` des eigenen `farmId`.
  - `activeShifts/{uid}` → eigener `uid`, `clockInServer == request.time`, `clockInClient` in plausiblem Fenster.
  - `timeEntries`, `timeSummaries` → Lesen eigener (Mitarbeiter) bzw. aller (Chef), Schreiben nur Function.
  - Korrekturen ausschließlich über die Callable `correctTimeEntry` mit Pflicht-Begründung.
- Storage: `farms/{farmId}/belege/{belegId}/original.jpg` → nur Chef des Hofs, ≤ 10 MB, `image/jpeg|png|webp` oder `application/pdf`.
- Zusätzlich **Firebase App Check** (Web: reCAPTCHA Enterprise), damit niemand die LLM-Kette mit fremden Uploads füttert.

#### Function-Design

| Function | Typ | Aufgabe |
|---|---|---|
| `createFarm` | Callable | Erster Chef legt Hof an → `farms`, `members`, Claims |
| `createInvite` / `acceptInvite` | Callable | Einmal-Token (48 h), Hash speichern; Beitritt setzt Member + Claims |
| `setMemberActive` | Callable (Chef) | Deaktivieren entzieht Claims, Daten bleiben (Aufbewahrung) |
| `onBelegUploaded` | Storage `onObjectFinalized` (europe-west3, 512 MiB, 120 s, Retry) | Idempotenz → `processing` → Extractor → Validierung → `extracted`/`failed` |
| `reprocessBeleg` | Callable (Chef) | „Erneut auslesen" bei `failed` |
| `onShiftClosed` | Firestore-Trigger | Schicht → `timeEntries` (Pause, Netto, Keys) + Transaktion auf `timeSummaries` |
| `correctTimeEntry` | Callable (Chef) | Korrektur mit Audit-Trail, Summen neu berechnen |
| `remindOpenShifts` | Scheduler 23:00 Europe/Vienna | „X ist noch eingestempelt" an Chef (Push oder Mail) |
| `exportBelegeCsv` / `exportStundenCsv` | Callable (Chef) | Zeitraum → CSV (UTF-8-BOM, `;`, Dezimalkomma, TT.MM.JJJJ) → Storage → Download-URL, Export-Protokoll. **Eine Implementierung für Web, Android und iOS** |
| `backupFirestore` | Scheduler wöchentlich | Firestore-Export in EU-Bucket (Aufbewahrung) |

#### Beleg-Pipeline (Ablauf)

```
Handy / Laptop            Storage (EU)        onBelegUploaded (europe-west3)      Claude (Vertex AI, EU)    Firestore
 1 Beleg-Doc anlegen, status=uploading ─────────────────────────────────────────────────────────────────────▶
 2 JPEG (≤ 2576 px, q≈85) hochladen ──▶
                                       3 Trigger ──▶  claimEventOnce, status=processing ───────────────────▶
                                                      4 Bild (base64) + Prompt + JSON-Schema ──▶
                                                      ◀── 5 strukturierte Antwort
                                                      6 Validierung: Netto+USt=Brutto? Datum ≤ heute?
                                                        Betrag > 0? → extraction + status=extracted ─────▶
 7 Snapshot-Listener: Formular füllt sich live (auch am Laptop) ◀──────────────────────────────────────────
 8 Chef prüft/korrigiert, wählt betrieblich/privat → final + status=confirmed ────────────────────────────▶
```

Der Extractor bekommt ein **Interface** (`ReceiptExtractor`). Modell-ID und Anbieter sind per Konfiguration austauschbar, und Rohantwort plus Modellversion werden für Nachvollziehbarkeit gespeichert.

#### Stempel-Design

- **Ein Button** (≥ 120 dp, ganze Breite) mit großem Status („Eingestempelt seit 07:42").
- Einstempeln legt `activeShifts/{uid}` an. Weil es pro User nur dieses eine Dokument gibt, ist doppeltes Einstempeln technisch ausgeschlossen. Ausstempeln setzt `clockOut*`, danach überführt `onShiftClosed` die Schicht in einen `timeEntry`.
- **Offline-fähig:** Firestore puffert den Schreibvorgang. Gespeichert werden Gerätezeit (`clockInClient`) **und** Serverzeit (`clockInServer`). Weichen beide > 10 min ab, wird der Eintrag für den Chef als „offline gestempelt – prüfen" markiert. Hintergrund: Ein reiner Server-Timestamp würde nach zwei Stunden Funkloch zwei Stunden zu spät stempeln.
- QR-Beitritt per URL (`https://<app-domain>/join?i=…&t=…`): Mitarbeiter scannt mit der normalen Handykamera → Web-App/PWA öffnet sich → Konto anlegen → fertig. **Kein App-Store-Download nötig** fürs MVP.

#### Design-System „Hof" (Vorschlag; Werte aus den Mockups übernehmen)

| Token | Platzhalter | Verwendung |
|---|---|---|
| `surfaceBg` | warmes Creme (z. B. `#FAF6EF`) | Seitenhintergrund |
| `surface` | Weiß | Karten, Sheets |
| `textPrimary` | Dunkelbraun (z. B. `#3A2E25`) | Text |
| `primary` | aus Mockup (z. B. Weinrot/Bordeaux) | Primär-Buttons, Navigation |
| `accent` | Warm-Orange `#F5A04A` (Kontinuität zu EventRide) | Hervorhebungen, „unsicher"-Markierung |
| `betrieblich` / `privat` | Grün / Grau-Blau | Beleg-Art-Chips |
| Mindest-Touch-Fläche | 56 dp (Stempel-Button ≥ 120 dp) | Alle Aktionen |
| Basis-Schrift | 16–18 sp | Lesbarkeit draußen |

Responsive: < 600 px BottomNav + einspaltig · 600–1024 px NavigationRail · > 1024 px Rail + Master-Detail (Archiv links, Beleg rechts).

### 3.6 Vision-LLM: Wahl, Kosten, DSGVO

**Empfehlung:** Claude über **Google Vertex AI in einer EU-Region** aus der Cloud Function heraus, mit dem Anthropic-SDK für Vertex (`@anthropic-ai/vertex-sdk`).
- Gleiches GCP-Projekt wie Firebase.
- Authentifizierung über das Service-Konto der Function: **kein API-Key** zu verwalten.
- Abrechnung über dieselbe Google-Rechnung.
- Antworten über **Structured Outputs** (`output_config.format` mit JSON-Schema) — garantiert parsebares JSON.

Bekannte Rahmenbedingungen (Doku-Stand 06.10.2026):
- **Bildformate:** JPEG, PNG, GIF, WebP — **kein HEIC** → clientseitig in JPEG umwandeln, die Function lehnt andere Formate mit klarer Meldung ab.
- **Auflösung/Kosten:** Ein Bild kostet `⌈Breite/28⌉ × ⌈Höhe/28⌉` Tokens. Claude-Modelle ab 4.7 lesen hochauflösend bis 2576 px Langkante bzw. max. 4.784 Tokens. Kleingedrucktes auf Kassenbons profitiert davon.
- **Vertex-Einschränkungen:** nur base64-Bilder, max. **5 MB pro Bild** → clientseitiges Verkleinern ist ohnehin Pflicht.
- **Vertex-Endpunkte:** global, Multi-Region (z. B. `eu`) oder regional; Multi-Region/regional kosten **+10 %**. Die Verfügbarkeit des gewählten Modells in der EU-Region vor Umsetzung im Vertex Model Garden prüfen.
- **Direkte Anthropic-API** als Alternative: einfacher einzurichten. Bei `inference_geo` gibt es dort aber nur „global" oder „us" (×1,1), **keine EU-Option**. Für Steuerbelege eines Betriebs mit AVV/SCC vertretbar, aber erklärungsbedürftig.
- **PDF-Belege** (E-Mail-Rechnungen) werden ebenfalls unterstützt → im selben Pipeline-Schritt verarbeitbar.

**Kostenschätzung pro Beleg** (Anthropic-Listenpreise vom 06.10.2026; Vertex hat eine eigene Preisliste, Größenordnung vergleichbar, regional +10 %)

| Posten | Tokens | Claude Opus 5.5 ($4 / $20 pro Mio. Ein-/Ausgabe) |
|---|---|---|
| Bild, z. B. 1500 × 2000 px | 3.888 | 1,6 US-Cent |
| Prompt + Schema + Kategorienliste | ~1.500 | 0,6 Cent |
| Ausgabe (JSON + Denkanteil bei niedriger Effort-Stufe) | ~500–1.500 | 1,0–3,0 Cent |
| **Summe** | | **≈ 3–5 Cent**, mit EU-Aufschlag ≈ 3,5–6 Cent |

→ 300 Belege/Monat ≈ **10–18 USD/Monat**. Günstigere Modelle (Sonnet 5.5 ≈ halber Preis; Haiku 4.5 ≈ 1 Cent, aber nur Standardauflösung) erst nach Messung am Testset in Betracht ziehen. Entscheidend ist die Feldgenauigkeit, nicht der Cent.

**Kostenbremsen:** Idempotenz (keine Doppel-Abrechnung bei Trigger-Wiederholung), Tageslimit pro Hof in der Function (z. B. 100 Auslesungen), App Check, GCP-Budget-Alarm.

**DSGVO-Checkliste**
- Alle Ressourcen in der EU: Firestore, Storage, Functions, Vertex-Endpunkt. Firebase Hosting liefert nur statische App-Dateien aus.
- AVV: Google Cloud Data Processing Addendum. Für Partnermodelle im Vertex Model Garden die zusätzlichen Bedingungen prüfen. Laut Anthropic werden über die API hochgeladene Bilder nicht zum Training verwendet.
- Mitarbeiterdaten: Rechtsgrundlage gesetzliche Aufzeichnungspflicht. Datenschutzinfo für Mitarbeiter beim Beitritt (Terms-Flow aus EventRide), kein GPS-Tracking im MVP, Verarbeitungsverzeichnis.
- Aufbewahrung: Soft-Delete/Storno statt Löschen, wöchentlicher Firestore-Export in einen EU-Bucket. Mit dem Steuerberater klären, ob das Foto die Papierablage ersetzen darf oder die App „nur" Vorerfassung ist.

### 3.7 Aufwand & Baureihenfolge

#### Aufwand pro Modul (Personentage)

| # | Modul | ohne EventRide | **mit Reuse** | Hauptquelle der Ersparnis |
|---|---|:-:|:-:|---|
| 0 | Projekt-Setup (Flutter, Firebase EU, Hosting, Web-Deploy-Action) | 1,25 | **0,75** | Bekannte Firebase/FlutterFire/CF-Routine, Workflows |
| 1 | Design-System + Responsive Shell | 1,75 | **1,25** | Sheet/Snackbar/Card-Struktur |
| 2 | Auth, Rollen (Claims), Rules, Router-Guards | 2,75 | **1,25** | Login/Register/Reset/Verify/Re-Auth komplett vorhanden, eigene Mail-Function |
| 3 | Mitarbeiter-Onboarding per QR | 0,75 | **0,75** | (neu) |
| 4 | Belege: Erfassung + Upload (Web + Mobil) | 0,75 | **0,5** | Picker-Sheet, Upload- und Timeout-Muster |
| 5 | Belege: Function + Vision-LLM | 1,75 | **1,5** | Idempotenz, Function-Gerüst |
| 6 | Belege: Bestätigungs-Screen | 1,0 | **0,75** | `_ReviewSheet` als Vorlage |
| 7 | Belege: Archiv + Suche/Filter | 0,75 | **0,75** | (neu) |
| 8 | Stunden: Stempeln + Modell + Rules | 1,25 | **1,0** | Deterministische-ID-/Transaktionsmuster |
| 9 | Stunden: Summen-Function + Wochen/Monat + Chef-Sicht | 1,25 | **1,0** | Scheduler/Zeitzone, Pausenlogik aus arbeitszeitplaner |
| 10 | Export CSV (Belege + Stunden) | 1,0 | **0,75** | CSV-Wissen (BOM, `;`) aus Manager-HTML |
| 11 | Chef-Dashboard | 0,5 | **0,5** | (neu) |
| 12 | Tests, Demo-Daten, Polish | 1,25 | **1,0** | Seed-Skripte |
| | **Summe demofähiger MVP** | **16,0** | **≈ 11,75** | **≈ 4 PT / ~27 % gespart** |

#### Nach dem MVP

| Erweiterung | Aufwand | Reuse |
|---|:-:|---|
| BMD-Export (nach Spezifikation Steuerberater) | 2–3 PT | – |
| Native Builds iOS/Android + Store | 1,5–2 PT | Codemagic-/Signing-Wissen, `deploy_apk.ps1` → spart ca. 2–3 PT |
| Push-Benachrichtigungen | 1 PT | `notification_service.dart`, `sendNotification` → spart ca. 1 PT |
| Kiosk-/Tablet-Stempelmodus mit PIN | 2 PT | – |
| ZIP-Export inkl. Belegbilder | 0,5 PT | – |
| Lohn-Zuschläge (KV-Regeln) | 2–4 PT | – |
| Nativer Dokumentscanner (Kantenerkennung) | 1 PT | – |
| DSGVO-Paket (Texte, Verzeichnis, Mitarbeiterinfo) | 1 PT | Legal-Flow |
| Backup/Audit-Log/Aufbewahrung härten | 1 PT | Scheduler-Muster |

→ Produktionsreife inkl. BMD und Store ≈ **+2–3 Wochen** Teilzeit.

#### Baureihenfolge (4 Wochen à ~24 h) — größtes Risiko zuerst

| Woche | Inhalt | Meilenstein |
|---|---|---|
| **1** | Setup (0) · Design-System + Shell (1) · Auth/Chef-Konto/`createFarm` (2) · tägliches Web-Deploy | Chef loggt sich am Laptop **und** am Handy ein; leere Screens im Hof-Design unter fester URL |
| **2** | Belege-Durchstich: Erfassung (4) → Function + LLM (5) → Bestätigung (6). Parallel: **Testset aus 30–50 echten Belegen** auswerten | Foto am Handy → Felder füllen sich live am Laptop → speichern. Feldgenauigkeit gemessen |
| **3** | Archiv (7) · Export Belege (10a) · QR-Onboarding (3) · Stempeln (8) | Mitarbeiter tritt per QR bei und stempelt; Chef exportiert Beleg-CSV |
| **4** | Summen + Chef-Stundenansicht (9) · Export Stunden (10b) · Dashboard (11) · Demo-Daten + Polish (12) · Puffer | **Demo:** kompletter Tagesablauf Beleg → Archiv → Export, Kommen/Gehen → Monatssumme → Export |

Warum diese Reihenfolge: Die LLM-Auslesequalität und die Kamera-Erfahrung im Web sind die zwei Unbekannten, die das Produkt tragen oder kippen. Sie kommen in Woche 2, solange noch Zeit zum Gegensteuern ist. Stempeln ist technisch einfacher und kommt danach.

### 3.8 Risiken & Fallstricke

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| **Flutter-Web-Ladezeit** (mehrere MB beim ersten Aufruf) bei schwachem Mobilnetz am Land | Erster Start dauert lange, Mitarbeiter geben auf | PWA mit Caching, Lade-Splash in `index.html`, Erststart im WLAN; Web-Renderer/WASM-Build messen |
| **Kamera im Web**: nur Datei-Input, kein Sucher, kein Zuschnitt, keine Kantenerkennung | Schiefe/unscharfe Fotos → schlechtere Extraktion | Klare Foto-Hinweise im UI, Vorschau vor Upload, später nativer Dokumentscanner |
| **HEIC (iPhone), EXIF-Drehung, 12-MP-Fotos** | API lehnt ab, Bild liegt seitlich, > 5-MB-Limit auf Vertex | Clientseitig drehen, auf ≤ 2576 px verkleinern, als JPEG q≈85 speichern; Function prüft Format und Größe |
| **LLM-Fehler** (Zahlendreher, US-/EU-Datum, USt-Aufteilung) | Falsche Buchungen | Immer Bestätigung durch Menschen, Konfidenz-Markierung, Plausibilitätsregeln, Testset als Regressionstest |
| **LLM-Kosten/Missbrauch** | Unerwartete Rechnung | Idempotenz, Tageslimit, App Check, Budget-Alarm (Kosten im Normalbetrieb ≈ 10–20 USD/Monat) |
| **DSGVO** | Rechtsrisiko | Alles in EU-Regionen, AVV, Mitarbeiterinfo, Aufbewahrungskonzept (siehe 3.6) |
| **Offline-Stempeln** | Falsche Zeiten bei Funkloch | Geräte- + Serverzeit speichern, Abweichungen markieren |
| **Manipulation der Zeiten** | Streit, rechtlich unbrauchbar | Mitarbeiter darf nur eigene offene Schicht schreiben, Korrekturen nur Chef mit Begründung + Audit-Trail |
| **Custom Claims verzögert** | Nach Beitritt „keine Berechtigung" | Nach `acceptInvite` `getIdToken(true)`; Router wartet auf Claims |
| **Firestore hat keine Volltextsuche** | Archivsuche begrenzt | Präfix-Suche auf `lieferantLower` + Filter nach Monat/Kategorie; bei < 1.000 Belegen/Jahr clientseitig filtern |
| **Fachliche Unklarheit** (Pauschalierung, BMD-Format, Kategorien) | Export unbrauchbar, Nacharbeit | Steuerberater-Termin **vor** Woche 3; Kategorie→Konto-Mapping als Einstellung |
| **Scope Creep** (Lohn, BMD, Kiosk) | MVP verzögert sich | Klare MVP-Grenze (Tabelle 3.7), Rest als Phase 2 |
| **Ein-Personen-Projekt ohne Tests** (wie EventRide) | Regressionen bei Geld und Stunden | Unit-Tests für Pausen-/Summenlogik und CSV ab Woche 1 |

---

## Abschluss — Management-Summary

- **Was EventRide spart:** rund **4 Personentage (~27 %) beim MVP**, später nochmals ~3–4 PT beim Store-Release und bei Push. Übernommen werden fertige Login-/Registrierungs-/Passwort-/Verifikations-Abläufe inkl. eigenem Mailversand, die Dialog- und Meldungsbausteine, die erprobte Offline-Erkennung, das Cloud-Function-Gerüst (Doppelverarbeitungsschutz, Wiener Zeitzone, Push-Versand) und ein Upload-mit-Prüfung-Ablauf als direkte Vorlage für die Belege. Dazu kommt das erarbeitete iOS-/Android-Build-Wissen.
- **Was nicht passt:** das dunkle Design ohne Theme-System (282 fest verdrahtete Farben), die Fahrgemeinschafts-Fachlogik und die reinen Handy-Annahmen. Der Code ist nicht web-fähig und hat keine Web-Adressen pro Seite.
- **Empfehlung:** **neues Flutter-Projekt + neues Firebase-Projekt in der EU**, bewährte Module gezielt hineinkopieren. **Kein Fork** — der würde nur am ersten Tag Zeit sparen und danach Altlasten mitschleppen.
- **Zeitrahmen:** demofähiger MVP ≈ **12 PT ≈ 4 Wochen** bei ~24 h/Woche. Produktionsreif (BMD-Export, App-Stores, DSGVO-Paket) **+2–3 Wochen**.
- **KI-Kosten:** ca. **3–6 Cent pro Beleg** (≈ 10–20 USD/Monat bei 300 Belegen). Verarbeitung DSGVO-freundlich über Google Vertex AI in einer EU-Region.
- **Die 3 ersten Schritte:**
  1. **Steuerberater-Termin:** Pauschalierung ja/nein, Kategorien/Kontenplan, BMD-Importspezifikation, Aufbewahrung digital vs. Papier. Dabei **30–50 echte Belege** als Testset sammeln.
  2. **Projekt anlegen:** Firebase-Projekt (EU-Region) + `flutter create` mit Web, Kernmodule aus der Reuse-Matrix kopieren, Hof-Theme aus den Mockups, automatisches Web-Deploy.
  3. **Belege-Durchstich bauen:** Foto → Cloud Function → Claude → Bestätigungs-Screen mit Live-Sync zum Laptop, und die Auslesegenauigkeit am Testset messen, bevor Archiv, Stunden und Export folgen.
