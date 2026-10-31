---
description: Session abschließen – Pläne abhaken, STATUS.md aktualisieren, committen
---

Schließe die heutige Session ab. Sprache: Deutsch.

1. **Pläne abgleichen:** Was in dieser Session erledigt wurde, in `plans/` abhaken (`- [x] … (YYYY-MM-DD)`, heutiges Datum). Neu aufgetauchte Aufgaben als `- [ ]` in den passenden Plan eintragen.
2. **STATUS.md aktualisieren** (vor dem Commit, max. 15 Zeilen, heutiges Datum in der Überschrift):
   Stand · Nächster Schritt · Blocker · Zuletzt erledigt.
   Inhalt aus `plans/` und dieser Session ableiten, nichts erfinden.
3. **Commit:** Änderungen der Session plus `plans/` und `STATUS.md` committen.
   Nie committen: `.firebase/hosting.*.cache`, `festl_*`-Dateien, Secrets (`.env`, `serviceAccountKey.json`).
4. **Push:** Feature-Branch pushen. Auf `main` vorher fragen – ein Push auf `main` deployt die Website per FTP.
5. Kurz zusammenfassen: was erledigt ist, was als Nächstes kommt.
