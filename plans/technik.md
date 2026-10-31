# Technische Schulden & bekannte Risiken

**Ziel:** Bekannte Lücken und Lint-Warnings schrittweise abbauen. Kein Release-Blocker.
**Deadline:** keine
**Hintergrund:** Beschreibung der Risiken in `CLAUDE.md` → „Bekannte Risiken / Noch nicht ausgiebig getestet“.

## Bekannte Risiken
- [ ] Overbooking im Einladungs-Flow: Kapazitätsprüfung in `acceptInvitation` in die Firestore-Transaktion ziehen
- [ ] `cleanupAbgelaufeneAnfragen`: Batches in 500er-Blöcke teilen (Firestore-Limit)
- [ ] `submitReview`: Durchschnitt innerhalb der Transaktion lesen (parallele Reviews)
- [ ] Chat-Notification im Vordergrund nicht doppelt (FCM-Push + lokaler Stream-Listener)
- [ ] `_pendingToggles` in `interessenten_service.dart` bei Timeout zuverlässig zurücksetzen
- [ ] Firestore Rules: `status`-Wert von Anfragen validieren
- [ ] Firestore Rules: `events` nicht ohne Auth lesbar (prüfen, ob die SEO-Seiten das noch brauchen – sie lesen per Admin SDK)

## Lint-Warnings
- [ ] `withOpacity` → `.withValues(alpha: x)` (12× in fahrt_anbieten_page, login_page, app_snackbar, chat_system_widget, eventcard_widget, suchleiste_widget)
- [ ] `unused_field: andereFahrtLupeFarbe` in `lib/views/pages/fahrten_page.dart`
- [ ] `avoid_types_as_parameter_names` (sum) in `lib/views/pages/fahrten_page.dart`
- [ ] Radio `groupValue`/`onChanged` → RadioGroup in `lib/views/pages/fahrt_anbieten_page.dart`

Warnings in `1_uebungen/` ignorieren (separates Übungsprojekt).
