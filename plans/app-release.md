# App: Release-Fixes & Release-Checkliste

**Ziel:** Alle offenen Punkte aus dem Zwei-Nutzer-Test (2026-05-21) und der Release-Checkliste abschließen.
**Deadline:** keine (App ist live: Play Store seit 2026-07-05 als offener Test 1.1.2+82, App Store 1.1.2+81).
**Herkunft:** früher `CLAUDE.md` („Offene Punkte / Release-Fixes“, „Firebase-Konfiguration“) und [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) (dort die Fix-Details).

## Fixes aus dem Zwei-Nutzer-Test (umgesetzt, Gerätetest offen)
- [x] A – E-Mail-Verifikations-Bypass im Chat (UI-Guard in `chat_page.dart` + Rule `email_verified` für `messages`)
- [ ] A – auf Gerät getestet: Notification-Tap öffnet Chat nicht für unverifizierte Nutzer
- [x] B – „Fahrt erstellen“ ohne Feedback auf iOS (`fahrt_anbieten_page.dart`, `Listener`/Snackbar)
- [ ] B – auf iOS-Gerät getestet
- [x] C + E1 – Akzeptierte Anfrage zurückziehen (Transaktion `storniert` + `freie_plaetze++`, Push an Fahrer, prominenter Button)
- [ ] C – auf Gerät getestet
- [x] D1 – Notification bei Stornierung geht an den Fahrer statt an den Mitfahrer
- [x] D2 – Push an Ersteller bei Event-Freigabe
- [ ] D1 + D2 – auf Gerät getestet
- [x] D3 – Chat-Notifications nach dem Lesen aus dem System-Tray entfernen
- [ ] D3 – auf Gerät getestet
- [x] F – alte Events aus Firestore löschen (`cleanupAbgelaufeneEvents`)
- [x] E2 – iOS Design-Polishing
- [ ] E2 – auf Gerät abgenommen

## Release-Checkliste (offene Punkte)
- [ ] Firestore-Index `anfragen` (requesterId + eventId + status) deployen: `firebase deploy --only firestore:indexes`
- [ ] Firestore-Index `chat_conversations` (participants array-contains + lastMessageAt desc) angelegt?
- [ ] Notification-Tap aus Background öffnet die richtige Seite (manuell testen)
- [ ] Cold-Start über Notification landet korrekt (manuell testen)
- [ ] Lokale Notification im Vordergrund → Tap öffnet richtige Seite (manuell testen)
- [ ] Telefon-Verifikation: siehe [phone-auth.md](phone-auth.md)
- [ ] E-Mail-Verifikation landet im Spam: eigene Absender-Domain in Firebase Auth → Templates
- [ ] Test-Mail der Verifikation landet im Posteingang
- [ ] Google-Maps-API-Key auf `at.eventride.app` + Release-SHA-1 einschränken (Google Cloud Console → Credentials)

## Post-Release
- [ ] `uploadLicense` atomar: verwaiste Storage-Bilder bei Batch-Fehler löschen
- [ ] Bilder vor dem Upload komprimieren (`flutter_image_compress`, max. 1 MB)
- [ ] FCM-Token-Cleanup per Scheduler (Tokens > 60 Tage ohne Login)
- [ ] G – Event absagen mit Kaskade: Cloud Function `cancelEvent(eventId)` (Mitfahrer + Fahrer benachrichtigen, Anfragen → `fahrtGeloescht`, Fahrten löschen, Event `status: 'abgesagt'`), Button in `admin_event_requests_page.dart` (~3–4 h)

## Erledigte Release-Vorbereitungen
- [x] Package auf `at.eventride.app` umgestellt (build.gradle, MainActivity, google-services.json)
- [x] `firebase_options.dart` Android: appId + apiKey auf `at.eventride.app`
- [x] iOS Info.plist: `CFBundleDisplayName` / `CFBundleName` = „EventRide“
- [x] Memory Leaks: TextEditingController in Dialogen + home_page disposed
- [x] Admin-Status reagiert in Echtzeit, Interessenten-Doppel-Tap-Schutz, Auth-Checks in Callables
- [x] Dev-Flags entfernt, `debugPrint` mit `kDebugMode`, stille `catch (_)` ersetzt
- [x] Storage-Größenlimits (Profilfoto 5 MB, Führerschein 10 MB)
- [x] Android im Play Store live (2026-07-05)
