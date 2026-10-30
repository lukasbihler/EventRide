// SSR für die öffentlichen SEO-Seiten, erreichbar über Firebase-Hosting-Rewrites
// (firebase.json): Startseite (/), /event/{slug}, Übersichtsseiten
// (/kirchtage-kaernten, /events-villach, …) und /sitemap.xml. Das Hosting-CDN
// cacht die Antworten (s-maxage), die Function läuft also nur selten.
//
// Zwei Exporte mit demselben Code: `seo` (live) und `seoNext` (Vorschaukanal).
// Neue Versionen gehen zuerst nur als seoNext raus (firebase.preview.json),
// `seo` wird erst nach Freigabe deployt.

import {onRequest} from "firebase-functions/v2/https";
import type {Request, Response} from "express";
import {brotliCompressSync, gzipSync} from "zlib";
import {
  EventPageDoc, LiveEvent, addDays, countFahrten, getEventPage, isPast, isRemovedPage,
  kategorie, loadEventPages, loadLiveEvents, todayVienna,
} from "./data";
import {
  ALL_HUBS, BEZIRK_HUBS, Hub, THEMEN_HUBS, hubByPath, hubForBezirk, hubForTyp, wochenende,
} from "./hubs";
import {
  CardEvent, FilterCtx, RelatedSection, renderEventPage, renderHomeParts, renderHubPage,
  renderNotFound, renderSitemap,
} from "./render";
import {isValidSlug} from "./slug";

const CACHE_PAGE = "public, max-age=300, s-maxage=600";
const CACHE_404 = "public, max-age=60, s-maxage=120";
const CACHE_SITEMAP = "public, max-age=1800, s-maxage=3600";

const HOME_EVENTS = 6;
const MAX_PAST = 8;
const PAST_DAYS = 400; // "Bisherige Termine": gut ein Jahr zurück (Serien kommen jährlich wieder)

// Cloud Run komprimiert nicht selbst — HTML ist durch das inline-CSS ~50 KB,
// gepackt ~10 KB. Das Hosting-CDN cacht je Encoding (Vary).
function send(res: Response, status: number, body: string, type: string, cache: string): void {
  const accept = String((res.req as Request).headers["accept-encoding"] ?? "");
  res.status(status).set("Content-Type", type).set("Cache-Control", cache).set("Vary", "Accept-Encoding");
  if (accept.split(",").some((e) => e.trim().split(";")[0] === "br")) {
    res.set("Content-Encoding", "br").send(brotliCompressSync(body));
  } else if (accept.split(",").some((e) => e.trim().split(";")[0] === "gzip")) {
    res.set("Content-Encoding", "gzip").send(gzipSync(body));
  } else {
    res.send(body);
  }
}

function sendHtml(res: Response, status: number, html: string, cache: string): void {
  send(res, status, html, "text/html; charset=utf-8", cache);
}

// ── Daten pro Anfrage ────────────────────────────────────────────────────────

interface HubStats {
  upcoming: LiveEvent[];
  past: CardEvent[];
  pages: EventPageDoc[]; // passende Archivseiten (für lastmod in der Sitemap)
}

interface Site {
  heute: string;
  all: LiveEvent[];
  stats: Map<string, HubStats>;
  aktiv: Set<string>; // Übersichtsseiten mit Inhalt → indexierbar und verlinkt
}

function statsFor(hub: Hub, all: LiveEvent[], pages: EventPageDoc[], heute: string): HubStats {
  let upcoming = all.filter((e) => e.slug && !isPast(e.endDay) && hub.match(e));
  if (hub.kind === "wochenende") {
    const we = wochenende(heute);
    upcoming = upcoming.filter((e) => e.endDay >= we.von && e.startDay <= we.bis);
    return {upcoming, past: [], pages: []};
  }
  const kommend = new Set(upcoming.map((e) => e.slug));
  const grenze = addDays(heute, -PAST_DAYS);
  const passend = pages.filter((p) => hub.match(p.snapshot) && !isRemovedPage(p));
  const past = passend
    .filter((p) => !kommend.has(p.slug) && isPast(p.snapshot.endDay) && p.snapshot.endDay >= grenze)
    .sort((a, b) => b.snapshot.endDay.localeCompare(a.snapshot.endDay))
    .slice(0, MAX_PAST)
    .map((p) => ({...p.snapshot, slug: p.slug}));
  return {upcoming, past, pages: passend};
}

async function loadSite(): Promise<Site> {
  const [all, pages] = await Promise.all([loadLiveEvents(), loadEventPages()]);
  const heute = todayVienna();
  const stats = new Map<string, HubStats>();
  const aktiv = new Set<string>();
  for (const hub of ALL_HUBS) {
    const s = statsFor(hub, all, pages, heute);
    stats.set(hub.path, s);
    if (s.upcoming.length + s.past.length > 0) aktiv.add(hub.path);
  }
  return {heute, all, stats, aktiv};
}

// ── Seiten ───────────────────────────────────────────────────────────────────

async function notFound(res: Response, path: string): Promise<void> {
  const site = await loadSite();
  const upcoming = site.all.filter((e) => e.slug && !isPast(e.endDay)).slice(0, 6);
  sendHtml(res, 404, renderNotFound(path, upcoming, site.aktiv), CACHE_404);
}

function relatedSections(
  site: Site,
  slug: string,
  ev: { startDay: string; bezirk: string; typ: string }
): RelatedSection[] {
  const others = site.all.filter((e) => e.slug && e.slug !== slug && !isPast(e.endDay));
  const gezeigt = new Set<string>();
  const nimm = (list: LiveEvent[]) => {
    const out = list.filter((e) => !gezeigt.has(e.eventId)).slice(0, 4);
    out.forEach((e) => gezeigt.add(e.eventId));
    return out;
  };
  const verlinkt = (hub: Hub | undefined) => (hub && site.aktiv.has(hub.path) ? hub : undefined);

  const sections: RelatedSection[] = [];
  if (ev.bezirk) {
    sections.push({
      titel: `Weitere Events im Bezirk ${ev.bezirk}`,
      events: nimm(others.filter((e) => e.bezirk === ev.bezirk)),
      more: verlinkt(hubForBezirk(ev.bezirk)),
    });
  }
  const we = wochenende(ev.startDay);
  sections.push({
    titel: we.gleiches ? "Am selben Wochenende" : "Am Wochenende darauf",
    events: nimm(others.filter((e) => e.endDay >= we.von && e.startDay <= we.bis)),
  });
  const typHub = hubForTyp(ev.typ);
  sections.push({
    titel: ev.typ === "e5" ? "Weitere Krampusläufe in Kärnten" : `Mehr aus der Kategorie ${kategorie(ev.typ).label}`,
    events: nimm(others.filter((e) => e.typ === ev.typ)),
    more: typHub.kind === "typ" ? verlinkt(typHub) : undefined,
  });
  return sections;
}

async function eventPage(res: Response, slug: string): Promise<void> {
  const site = await loadSite();
  const series = site.all.filter((e) => e.slug === slug); // nach Datum sortiert
  const next = series.find((e) => !isPast(e.endDay));

  if (next || series.length) {
    const ev = next ?? series[series.length - 1];
    const fahrten = next ? await countFahrten(next.fahrtEventIds) : 0;
    sendHtml(res, 200, renderEventPage({
      slug, ev, vorbei: !next, entfernt: false, fahrten,
      related: relatedSections(site, slug, ev), hubs: site.aktiv,
    }), CACHE_PAGE);
    return;
  }

  // Kein Live-Event mehr (z. B. nach dem 30-Tage-Cleanup) → Archiv.
  const page = await getEventPage(slug);
  if (!page?.snapshot) {
    await notFound(res, `/event/${slug}`);
    return;
  }
  const entfernt = isRemovedPage(page);
  sendHtml(res, 200, renderEventPage({
    slug, ev: page.snapshot, vorbei: !entfernt, entfernt, fahrten: 0,
    related: relatedSections(site, slug, page.snapshot), hubs: site.aktiv,
  }), CACHE_PAGE);
}

async function hubPage(res: Response, hub: Hub): Promise<void> {
  const site = await loadSite();
  const s = site.stats.get(hub.path) as HubStats;
  sendHtml(res, 200, renderHubPage({
    ...filterCtx(site),
    hub,
    upcoming: s.upcoming,
    past: s.past,
    wochenende: hub.kind === "wochenende" ? wochenende(site.heute) : undefined,
  }, site.heute), CACHE_PAGE);
}

function filterCtx(site: Site): FilterCtx {
  return {
    aktiv: site.aktiv,
    themen: THEMEN_HUBS.filter((h) => site.aktiv.has(h.path)),
    bezirke: BEZIRK_HUBS.filter((h) => site.aktiv.has(h.path)),
  };
}

// ── Startseite ───────────────────────────────────────────────────────────────
// public/home.html ist die statische Startseite mit Markern; die Function holt
// sie über das Hosting derselben Domain (Vorschau oder live) und setzt die
// Events serverseitig ein. So bleibt die Startseite per Hosting-Deploy pflegbar.

const HOME_HOSTS = /^((www\.)?eventride\.at|eventride-cd0e9(--[a-z0-9-]+)?\.(web\.app|firebaseapp\.com))$/;
const homeCache = new Map<string, { at: number; html: string }>();

function homeOrigin(req: Request): string {
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").split(",")[0].trim().toLowerCase();
  if (HOME_HOSTS.test(host)) return `https://${host}`;
  // Lokaler Testserver (scratchpad/devserver.js)
  if (process.env.SEO_DEV === "1" && /^localhost:\d+$/.test(host)) return `http://${host}`;
  return "https://www.eventride.at";
}

async function homeTemplate(origin: string): Promise<string> {
  const hit = homeCache.get(origin);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.html;
  const [r, rc] = await Promise.all([
    fetch(`${origin}/home.html`, {redirect: "error"}),
    fetch(`${origin}/style.css`, {redirect: "error"}),
  ]);
  if (!r.ok) throw new Error(`home.html: HTTP ${r.status}`);
  let html = await r.text();
  if (!html.includes("<!--seo:events-->")) throw new Error("home.html: Marker fehlt");
  // style.css inline: spart am Handy einen Roundtrip vor dem ersten Rendern.
  // Ohne CSS bleibt der <link> stehen (Seite funktioniert trotzdem).
  const css = rc.ok ? await rc.text() : "";
  if (css && !css.includes("</style")) {
    html = html.replace("<link rel=\"stylesheet\" href=\"style.css\">", () => `<style>${css}</style>`);
  }
  homeCache.set(origin, {at: Date.now(), html});
  return html;
}

async function homePage(req: Request, res: Response): Promise<void> {
  const [site, template] = await Promise.all([loadSite(), homeTemplate(homeOrigin(req))]);
  const upcoming = site.all.filter((e) => e.slug && !isPast(e.endDay)).slice(0, HOME_EVENTS);
  const teile = renderHomeParts(upcoming, filterCtx(site));
  const html = template
    .replace("<!--seo:filter-->", teile.filter)
    .replace("<!--seo:events-->", teile.events);
  sendHtml(res, 200, html, CACHE_PAGE);
}

async function sitemap(res: Response): Promise<void> {
  const site = await loadSite();
  const pages = (await loadEventPages()).filter((p) => isValidSlug(p.slug) && !isRemovedPage(p));
  const lastmod = (p: EventPageDoc) => p.updatedAt?.toDate().toISOString().slice(0, 10) ?? "";
  const neuestes = (list: EventPageDoc[]) => list.map(lastmod).reduce((max, d) => (d > max ? d : max), "");

  const urls: { path: string; lastmod?: string }[] = [{path: "/"}];
  for (const hub of ALL_HUBS) {
    if (!site.aktiv.has(hub.path)) continue;
    const mod = hub.kind === "wochenende" ? site.heute : neuestes(site.stats.get(hub.path)?.pages ?? []);
    urls.push({path: hub.path, lastmod: mod || undefined});
  }
  pages
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .forEach((p) => urls.push({path: `/event/${p.slug}`, lastmod: lastmod(p) || undefined}));

  send(res, 200, renderSitemap(urls), "application/xml; charset=utf-8", CACHE_SITEMAP);
}

async function handle(req: Request, res: Response): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).set("Allow", "GET, HEAD").send("");
    return;
  }

  const path = req.path;
  try {
    if (path === "/" || path === "/index.html") {
      if (path !== "/") {
        res.redirect(301, "/");
        return;
      }
      await homePage(req, res);
      return;
    }
    if (path === "/sitemap.xml") {
      await sitemap(res);
      return;
    }

    const hub = hubByPath(path);
    if (hub) {
      await hubPage(res, hub);
      return;
    }
    if (path.endsWith("/") && hubByPath(path.slice(0, -1))) {
      res.redirect(301, path.slice(0, -1));
      return;
    }

    const m = path.match(/^\/event\/([^/]+)(\/?)$/);
    if (m) {
      let slug: string;
      try {
        slug = decodeURIComponent(m[1]);
      } catch {
        await notFound(res, path);
        return;
      }
      const canonical = slug.toLowerCase();
      if (canonical !== slug || m[2]) {
        res.redirect(301, `/event/${encodeURIComponent(canonical)}`);
        return;
      }
      if (!isValidSlug(slug)) {
        await notFound(res, path);
        return;
      }
      await eventPage(res, slug);
      return;
    }

    await notFound(res, path);
  } catch (e) {
    console.error(`[seo] ${path}`, e);
    res.status(500).set("Cache-Control", "no-store").send("Interner Fehler");
  }
}

const OPTS = {memory: "512MiB" as const, maxInstances: 10};
export const seo = onRequest(OPTS, handle);
export const seoNext = onRequest(OPTS, handle);
