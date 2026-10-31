# Telefon-Verifikation (Trust-Shield 2)

**Ziel:** Firebase Phone Auth aktivieren, damit Nutzer das zweite Trust-Shield (Telefon) bekommen.
**Deadline:** keine
**Stand:** 2026-06-04, wartet auf die Google-Branding-Überprüfung (aktuellen Stand in der Google Cloud Console prüfen).

## Erledigt
- [x] `kPhoneVerifEnabled = true` in `lib/config/feature_flags.dart`
- [x] Android: Release-SHA-1 + SHA-256 in der Firebase Console
- [x] iOS: URL-Schema (REVERSED_CLIENT_ID) in `ios/Runner/Info.plist`
- [x] Phone-Auth-Provider in Firebase konfiguriert (noch nicht aktiviert)
- [x] Branding-Formular in der Google Cloud Console ausgefüllt
- [x] Search-Console-Verifizierung (Meta-Tag) und `public/agb.html` deployt

## Offen
- [ ] Domain-Bestätigung in der Google Search Console abgeschlossen
- [ ] Google Cloud Console → Überprüfungscenter → Branding → „Zur Überprüfung einreichen“
- [ ] Firebase Console → Authentication → Phone → Aktivieren
- [ ] Neuen Android- und iOS-Build verteilen und Phone Auth testen
