// Öffentliche Sicht auf die events-Collection für die SEO-Seiten.
//
// WHITELIST: Nur die Felder in PublicEvent verlassen jemals die Function.
// Interne Felder (mgrSrc*, Koordinaten, Zähler, adminOnly, …) werden hier
// nicht einmal gelesen — neue Felder müssen bewusst ergänzt werden.

import * as admin from "firebase-admin";
import {getViennaOffsetHours} from "../time";
import {BILDER} from "./bilder";

export const EVENT_PAGES = "event_pages";
const CACHE_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface PublicEvent {
  eventId: string;
  slug: string | null;
  name: string;
  startDay: string; // YYYY-MM-DD (Wiener Datum)
  endDay: string;   // == startDay bei eintägigen Events
  uhrzeit: string | null; // "HH:MM"
  gemeinde: string;
  ort: string;      // Veranstaltungsort (standort), leer wenn gleich der Gemeinde
  bezirk: string;
  adresse: string;
  typ: string;
  beschreibung: string;
  eintritt: string;
  veranstalter: string | null;
}

// Snapshot-Felder in event_pages/{slug}.snapshot — gleiche Whitelist ohne slug.
export const SNAPSHOT_KEYS = [
  "eventId", "name", "startDay", "endDay", "uhrzeit", "gemeinde", "ort", "bezirk",
  "adresse", "typ", "beschreibung", "eintritt", "veranstalter",
] as const;
export type Snapshot = Omit<PublicEvent, "slug">;

export interface LiveEvent extends PublicEvent {
  // eigene ID + IDs der Tages-Events (Fahrten hängen bei mehrtägigen Events an den Tagen)
  fahrtEventIds: string[];
  // "Ich will hin" (interessentenCount). Nicht im Archiv-Snapshot, weil es sich
  // ständig ändert. Bei mehrtägigen Events das Maximum über die Tage.
  interessenten: number;
  // Angebotene Fahrten über alle Tage des Events.
  fahrten: number;
}

export interface EventPageDoc {
  slug: string;
  seriesKey: string;
  eventIds: string[];
  snapshot: Snapshot;
  updatedAt?: admin.firestore.Timestamp;
}

export const db = () => admin.firestore();

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function zahl(v: unknown): number {
  return typeof v === "number" && isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

function normUhrzeit(v: unknown): string | null {
  const m = str(v).match(/^(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function viennaDay(d: Date): string {
  return new Date(d.getTime() + getViennaOffsetHours(d) * 3600 * 1000).toISOString().slice(0, 10);
}

// Datum → Wiener Kalendertag.
// Der Manager speichert Ortszeit mit "Z" (`${datum}T${uhr}:00.000Z`) — stimmt die
// UTC-Uhrzeit mit `uhrzeit` überein, ist der UTC-Tag bereits der lokale Tag.
// Alles andere (App: echte UTC-Zeit) wird nach Wiener Zeit umgerechnet.
export function parseDay(raw: unknown, uhrzeit: string | null): string | null {
  if (raw instanceof admin.firestore.Timestamp) return viennaDay(raw.toDate());
  if (typeof raw === "number") return viennaDay(new Date(raw));
  const s = str(raw);
  const dmy = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const utcTime = d.toISOString().slice(11, 16);
  if (uhrzeit && utcTime === uhrzeit) return d.toISOString().slice(0, 10);
  return viennaDay(d);
}

export function dayToUtcMs(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  return new Date(dayToUtcMs(day) + n * DAY_MS).toISOString().slice(0, 10);
}

export function todayVienna(now = new Date()): string {
  return viennaDay(now);
}

// Gleiche Regel wie eventHideAfter() in der App: vorbei ab 6:00 Uhr am Folgetag.
export function isPast(endDay: string, now = new Date()): boolean {
  const next = dayToUtcMs(addDays(endDay, 1));
  const sixLocal = next + 6 * 3600 * 1000;
  const offset = getViennaOffsetHours(new Date(sixLocal));
  return now.getTime() >= sixLocal - offset * 3600 * 1000;
}

// ISO-8601 mit Wiener Offset für JSON-LD, z. B. "2026-11-06T18:00:00+01:00".
export function isoStart(ev: Pick<PublicEvent, "startDay" | "uhrzeit">): string {
  if (!ev.uhrzeit) return ev.startDay;
  const [h, m] = ev.uhrzeit.split(":").map(Number);
  const [y, mo, d] = ev.startDay.split("-").map(Number);
  const offset = getViennaOffsetHours(new Date(Date.UTC(y, mo - 1, d, h - 1, m)));
  return `${ev.startDay}T${ev.uhrzeit}:00+0${offset}:00`;
}

export function toPublicEvent(
  id: string,
  data: admin.firestore.DocumentData,
  childDays: string[] = []
): PublicEvent | null {
  const name = str(data["name"]);
  const uhrzeit = normUhrzeit(data["uhrzeit"]);
  const startDay = parseDay(data["datum"], uhrzeit);
  if (!name || !startDay) return null;
  const endDay = childDays.reduce((max, d) => (d > max ? d : max), startDay);
  const veranstalter = str(data["veranstalter"]);
  const standort = str(data["standort"]);
  const gemeinde = str(data["gemeinde"]) || standort;
  const adresse = str(data["adresse"]);
  return {
    eventId: id,
    slug: str(data["slug"]) || null,
    name,
    startDay,
    endDay,
    uhrzeit,
    gemeinde,
    ort: standort && standort !== gemeinde ? standort : "",
    bezirk: str(data["bezirk"]),
    adresse: adresse === "Adresse nicht angegeben" ? "" : adresse,
    typ: str(data["typ"]) || "e1",
    beschreibung: str(data["beschreibung"]),
    eintritt: str(data["eintritt"]) === "k.A." ? "" : str(data["eintritt"]),
    veranstalter: veranstalter && veranstalter.toLowerCase() !== "örtlich" ? veranstalter : null,
  };
}

export function toSnapshot(ev: PublicEvent): Snapshot {
  const snap = {} as Record<string, unknown>;
  for (const k of SNAPSHOT_KEYS) snap[k] = ev[k];
  return snap as unknown as Snapshot;
}

export function sameSnapshot(a: Snapshot | undefined, b: Snapshot): boolean {
  if (!a) return false;
  return SNAPSHOT_KEYS.every((k) => (a[k] ?? null) === (b[k] ?? null));
}

// ── Live-Events (Memo pro Function-Instanz) ──────────────────────────────────

let cache: { at: number; events: LiveEvent[] } | null = null;

export async function loadLiveEvents(): Promise<LiveEvent[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.events;

  const [snap, fahrten] = await Promise.all([
    db().collection("events").get(),
    db().collection("fahrten").select("eventId").get(),
  ]);
  const fahrtenProEvent = new Map<string, number>();
  for (const f of fahrten.docs) {
    const id = str(f.get("eventId"));
    if (id) fahrtenProEvent.set(id, (fahrtenProEvent.get(id) ?? 0) + 1);
  }

  const children = new Map<string, { id: string; day: string; interessenten: number }[]>();
  const docs: admin.firestore.QueryDocumentSnapshot[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data["adminOnly"] === true) continue;
    const containerId = str(data["containerId"]);
    if (containerId) {
      const day = parseDay(data["datum"], normUhrzeit(data["uhrzeit"]));
      if (!day) continue;
      const list = children.get(containerId) ?? [];
      list.push({id: doc.id, day, interessenten: zahl(data["interessentenCount"])});
      children.set(containerId, list);
    } else {
      docs.push(doc);
    }
  }

  const events: LiveEvent[] = [];
  for (const doc of docs) {
    const kids = children.get(doc.id) ?? [];
    const ev = toPublicEvent(doc.id, doc.data(), kids.map((k) => k.day));
    if (!ev) continue;
    const fahrtEventIds = [doc.id, ...kids.map((k) => k.id)];
    events.push({
      ...ev,
      fahrtEventIds,
      fahrten: fahrtEventIds.reduce((sum, id) => sum + (fahrtenProEvent.get(id) ?? 0), 0),
      interessenten: Math.max(zahl(doc.data()["interessentenCount"]), ...kids.map((k) => k.interessenten)),
    });
  }
  events.sort((a, b) => a.startDay.localeCompare(b.startDay) || a.name.localeCompare(b.name, "de"));

  cache = {at: Date.now(), events};
  return events;
}

export async function getEventPage(slug: string): Promise<EventPageDoc | null> {
  const doc = await db().collection(EVENT_PAGES).doc(slug).get();
  return doc.exists ? (doc.data() as EventPageDoc) : null;
}

export async function listEventPages(): Promise<EventPageDoc[]> {
  const snap = await db().collection(EVENT_PAGES).get();
  return snap.docs.map((d) => d.data() as EventPageDoc);
}

let pagesCache: { at: number; pages: EventPageDoc[] } | null = null;

// Wie listEventPages(), aber mit 5-Minuten-Memo — für die Übersichtsseiten,
// die bei jedem Aufruf die bisherigen Termine aus dem Archiv brauchen.
export async function loadEventPages(): Promise<EventPageDoc[]> {
  if (pagesCache && Date.now() - pagesCache.at < CACHE_MS) return pagesCache.pages;
  const pages = (await listEventPages()).filter((p) => p.slug && p.snapshot);
  pagesCache = {at: Date.now(), pages};
  return pages;
}

// Ohne verbliebene Events, aber Datum noch nicht vorbei → Event wurde entfernt
// (abgesagt/verschoben/versteckt), nicht regulär abgelaufen.
export function isRemovedPage(page: EventPageDoc): boolean {
  return (page.eventIds ?? []).length === 0 && !isPast(page.snapshot.endDay);
}

// ── Kategorien ───────────────────────────────────────────────────────────────

export interface Kategorie {
  label: string;
  img: string; // Bild-Key unter /assets/og/ (gleiche Motive wie die App-Eventkarten)
}

const KATEGORIEN: Record<string, Kategorie> = {
  e0: {label: "Event", img: "kirchtag"},
  e1: {label: "Kirchtag & Fest", img: "kirchtag"},
  e2: {label: "Feuerwehrfest", img: "feuerwehr"},
  e3: {label: "Disco & Party", img: "disco"},
  e4: {label: "Ball", img: "ball"},
  e5: {label: "Krampus & Perchten", img: "krampus"},
  e6: {label: "Festival & Open Air", img: "festival"},
  e7: {label: "Beach & Sommer", img: "beach"},
};

export function kategorie(typ: string): Kategorie {
  return KATEGORIEN[typ] ?? KATEGORIEN["e0"];
}

// Bildvariante einer Kategorie, stabil pro Slug (FNV-1a-Hash): gleiches Event
// = gleiches Bild, verschiedene Events derselben Kategorie wirken nicht gleich.
// Liefert den Pfad ohne Endung: + ".jpg" (1200x630) bzw. + "-640.jpg" (640x360).
export function bildPfad(img: string, slug: string | null | undefined): string {
  const n = BILDER[img] ?? 0;
  if (n <= 0) return `/assets/og/${img}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < (slug ?? "").length; i++) {
    h ^= (slug as string).charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `/assets/image/${img}/${(h % n) + 1}`;
}
