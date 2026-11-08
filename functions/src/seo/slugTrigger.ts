// Slug-Vergabe + Archiv (event_pages/{slug}) für die SEO-Seiten.
//
// - Slug wird NUR geschrieben, wenn er fehlt → der eigene Write löst den
//   Trigger erneut aus, findet dann den Slug vor und endet ohne Schreibvorgang.
// - event_pages bleibt beim Löschen eines Events bestehen (nur eventIds wird
//   bereinigt), damit die URL nach dem 30-Tage-Cleanup mit "vorbei" erreichbar
//   bleibt und fürs nächste Jahr Ranking sammelt.

import * as admin from "firebase-admin";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {
  EVENT_PAGES, EventPageDoc, PublicEvent, db, dayToUtcMs, isPast, parseDay,
  sameSnapshot, toPublicEvent, toSnapshot,
} from "./data";
import {toSeriesKey} from "./slug";

const FieldValue = admin.firestore.FieldValue;

// Zwei verschiedene Events mit gleichem Namen in derselben Gemeinde (z. B.
// zwei Kirchtage im selben Jahr) bekommen getrennte Slugs. Liegt der nächste
// Termin ~1 Jahr später (≥ 300 Tage), ist es dieselbe Serie.
function kollidiert(page: EventPageDoc, ev: PublicEvent): boolean {
  const ids = page.eventIds ?? [];
  if (ids.length === 0 || ids.includes(ev.eventId)) return false;
  const snap = page.snapshot;
  if (!snap || isPast(snap.endDay)) return false;
  const diffTage = Math.abs(dayToUtcMs(snap.startDay) - dayToUtcMs(ev.startDay)) / 86400000;
  return diffTage > 7 && diffTage < 300;
}

async function childDays(containerId: string): Promise<string[]> {
  const snap = await db().collection("events").where("containerId", "==", containerId).get();
  return snap.docs
    .filter((d) => d.data()["adminOnly"] !== true)
    .map((d) => parseDay(d.data()["datum"], null))
    .filter((d): d is string => !!d);
}

async function assignSlug(ev: PublicEvent): Promise<void> {
  const base = toSeriesKey(ev.name, ev.gemeinde);
  const eventRef = db().collection("events").doc(ev.eventId);

  await db().runTransaction(async (tx) => {
    const current = await tx.get(eventRef);
    if (!current.exists || current.data()?.["slug"]) return;

    for (let n = 1; n <= 50; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const pageRef = db().collection(EVENT_PAGES).doc(slug);
      const page = await tx.get(pageRef);
      const snapshot = toSnapshot(ev);

      if (!page.exists) {
        tx.set(pageRef, {
          slug,
          seriesKey: base,
          eventIds: [ev.eventId],
          snapshot,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.update(eventRef, {slug});
        return;
      }

      const data = page.data() as EventPageDoc;
      if (data.seriesKey !== base || kollidiert(data, ev)) continue;

      const neuer = !data.snapshot || ev.startDay >= data.snapshot.startDay;
      tx.update(pageRef, {
        eventIds: FieldValue.arrayUnion(ev.eventId),
        ...(neuer ? {snapshot} : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.update(eventRef, {slug});
      return;
    }
    throw new Error(`Kein freier Slug für ${base}`);
  });
}

async function upsertPage(slug: string, ev: PublicEvent): Promise<void> {
  const pageRef = db().collection(EVENT_PAGES).doc(slug);
  await db().runTransaction(async (tx) => {
    const page = await tx.get(pageRef);
    const snapshot = toSnapshot(ev);

    if (!page.exists) {
      // z. B. Slug von Hand gesetzt → Archiv nachziehen
      tx.set(pageRef, {
        slug,
        seriesKey: toSeriesKey(ev.name, ev.gemeinde),
        eventIds: [ev.eventId],
        snapshot,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const data = page.data() as EventPageDoc;
    const fehltId = !(data.eventIds ?? []).includes(ev.eventId);
    const cur = data.snapshot;
    const nimmNeuen = !cur || cur.eventId === ev.eventId || ev.startDay >= cur.startDay;
    const snapGeaendert = nimmNeuen && !sameSnapshot(cur, snapshot);
    if (!fehltId && !snapGeaendert) return;

    tx.update(pageRef, {
      eventIds: FieldValue.arrayUnion(ev.eventId),
      ...(snapGeaendert ? {snapshot} : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function removeFromPage(slug: string, eventId: string): Promise<void> {
  try {
    await db().collection(EVENT_PAGES).doc(slug).update({
      eventIds: FieldValue.arrayRemove(eventId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn(`[seo] event_pages/${slug} nicht aktualisiert`, e);
  }
}

// Gemeinsame Logik für Trigger und Backfill.
async function syncEvent(
  eventId: string,
  after: admin.firestore.DocumentData | undefined,
  before: admin.firestore.DocumentData | undefined
): Promise<void> {
  if (!after) {
    const slug = before?.["slug"];
    if (typeof slug === "string" && slug) await removeFromPage(slug, eventId);
    return;
  }
  // Tages-Events eines mehrtägigen Containers haben keine eigene Seite.
  if (after["containerId"]) return;

  const slug = typeof after["slug"] === "string" ? after["slug"] : "";
  if (after["adminOnly"] === true) {
    if (slug) await removeFromPage(slug, eventId);
    return;
  }

  const days = after["isContainer"] === true ? await childDays(eventId) : [];
  const ev = toPublicEvent(eventId, after, days);
  if (!ev) return;

  if (!slug) {
    await assignSlug(ev);
  } else {
    await upsertPage(slug, ev);
  }
}

export const onEventWrittenSeo = onDocumentWritten(
  "events/{eventId}",
  async (event) => {
    await syncEvent(
      event.params["eventId"],
      event.data?.after?.data(),
      event.data?.before?.data()
    );
  }
);

// Täglicher Abgleich: vergibt fehlende Slugs (Bestand + verpasste Trigger)
// und zieht Archiv-Snapshots nach (z. B. geänderte Tage eines Containers).
export const seoSlugBackfill = onSchedule(
  {schedule: "every day 03:30", timeZone: "Europe/Vienna"},
  async () => {
    const snap = await db().collection("events").get();
    let fehler = 0;
    for (const doc of snap.docs) {
      try {
        await syncEvent(doc.id, doc.data(), undefined);
      } catch (e) {
        fehler++;
        console.error(`[seoSlugBackfill] ${doc.id}`, e);
      }
    }
    console.log(`[seoSlugBackfill] ${snap.size} Events geprüft, ${fehler} Fehler`);
  }
);
