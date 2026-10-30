// SSR für die öffentlichen SEO-Seiten, erreichbar über Firebase-Hosting-Rewrites
// (firebase.json): /event/{slug}, /krampuslaeufe-kaernten, /sitemap.xml.
// Das Hosting-CDN cacht die Antworten (s-maxage), die Function läuft also
// nur selten.

import {onRequest} from "firebase-functions/v2/https";
import type {Response} from "express";
import {
  LiveEvent, addDays, countFahrten, getEventPage, isPast, isRemovedPage,
  kategorie, listEventPages, loadLiveEvents, todayVienna,
} from "./data";
import {
  KRAMPUS_PATH, renderEventPage, renderKrampusPage, renderNotFound, renderSitemap,
} from "./render";
import {isValidSlug} from "./slug";

const CACHE_PAGE = "public, max-age=300, s-maxage=600";
const CACHE_404 = "public, max-age=60, s-maxage=120";
const CACHE_SITEMAP = "public, max-age=1800, s-maxage=3600";

function sendHtml(res: Response, status: number, html: string, cache: string): void {
  res.status(status)
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Cache-Control", cache)
    .send(html);
}

async function notFound(res: Response, path: string): Promise<void> {
  const upcoming = (await loadLiveEvents()).filter((e) => e.slug && !isPast(e.endDay)).slice(0, 6);
  sendHtml(res, 404, renderNotFound(path, upcoming), CACHE_404);
}

// Freitag–Sonntag des Wochenendes, in dem das Event liegt (bzw. des
// folgenden Wochenendes bei Events unter der Woche).
function wochenende(day: string): { von: string; bis: string; gleiches: boolean } {
  const [y, m, d] = day.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const gleiches = wd === 5 || wd === 6 || wd === 0;
  const zumFreitag = gleiches ? -((wd + 2) % 7) : 5 - wd;
  const von = addDays(day, zumFreitag);
  return {von, bis: addDays(von, 2), gleiches};
}

function relatedSections(
  all: LiveEvent[],
  slug: string,
  ev: { startDay: string; bezirk: string; typ: string }
): { titel: string; events: LiveEvent[] }[] {
  const others = all.filter((e) => e.slug && e.slug !== slug && !isPast(e.endDay));
  const gezeigt = new Set<string>();
  const nimm = (list: LiveEvent[]) => {
    const out = list.filter((e) => !gezeigt.has(e.eventId)).slice(0, 4);
    out.forEach((e) => gezeigt.add(e.eventId));
    return out;
  };

  const sections: { titel: string; events: LiveEvent[] }[] = [];
  if (ev.bezirk) {
    sections.push({
      titel: `Weitere Events im Bezirk ${ev.bezirk}`,
      events: nimm(others.filter((e) => e.bezirk === ev.bezirk)),
    });
  }
  const we = wochenende(ev.startDay);
  sections.push({
    titel: we.gleiches ? "Am selben Wochenende" : "Am Wochenende darauf",
    events: nimm(others.filter((e) => e.endDay >= we.von && e.startDay <= we.bis)),
  });
  sections.push({
    titel: ev.typ === "e5" ? "Weitere Krampusläufe in Kärnten" : `Mehr aus der Kategorie ${kategorie(ev.typ).label}`,
    events: nimm(others.filter((e) => e.typ === ev.typ)),
  });
  return sections;
}

async function eventPage(res: Response, slug: string): Promise<void> {
  const all = await loadLiveEvents();
  const series = all.filter((e) => e.slug === slug); // nach Datum sortiert
  const next = series.find((e) => !isPast(e.endDay));

  if (next || series.length) {
    const ev = next ?? series[series.length - 1];
    const fahrten = next ? await countFahrten(next.fahrtEventIds) : 0;
    sendHtml(res, 200, renderEventPage({
      slug, ev, vorbei: !next, entfernt: false, fahrten,
      related: relatedSections(all, slug, ev),
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
    related: relatedSections(all, slug, page.snapshot),
  }), CACHE_PAGE);
}

async function krampusPage(res: Response): Promise<void> {
  const events = (await loadLiveEvents()).filter((e) => e.typ === "e5" && e.slug && !isPast(e.endDay));
  sendHtml(res, 200, renderKrampusPage(events), CACHE_PAGE);
}

async function sitemap(res: Response): Promise<void> {
  const pages = (await listEventPages()).filter((p) => isValidSlug(p.slug) && p.snapshot && !isRemovedPage(p));
  const lastmod = (p: { updatedAt?: { toDate(): Date } }) => p.updatedAt?.toDate().toISOString().slice(0, 10);
  const krampusMod = pages
    .filter((p) => p.snapshot.typ === "e5")
    .map((p) => lastmod(p) ?? "")
    .reduce((max, d) => (d > max ? d : max), "");
  const urls = [
    {path: "/"},
    {path: KRAMPUS_PATH, lastmod: krampusMod || todayVienna()},
    ...pages
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((p) => ({path: `/event/${p.slug}`, lastmod: lastmod(p)})),
  ];
  res.status(200)
    .set("Content-Type", "application/xml; charset=utf-8")
    .set("Cache-Control", CACHE_SITEMAP)
    .send(renderSitemap(urls));
}

export const seo = onRequest({memory: "512MiB", maxInstances: 10}, async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).set("Allow", "GET, HEAD").send("");
    return;
  }

  const path = req.path;
  try {
    if (path === "/sitemap.xml") {
      await sitemap(res);
      return;
    }
    if (path === KRAMPUS_PATH) {
      await krampusPage(res);
      return;
    }
    if (path === `${KRAMPUS_PATH}/`) {
      res.redirect(301, KRAMPUS_PATH);
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
});
