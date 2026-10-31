// Übersichtsseiten ("Hubs") für Suchanfragen nach Kategorie, Thema, Bezirk
// und Zeitraum: /kirchtage-kaernten, /halloween-kaernten, /events-villach, …
//
// Kategorien entsprechen 1:1 den Event-Typen der App (e1–e7). Themen werden
// über den Eventnamen erkannt (es gibt kein eigenes Feld dafür) und tauchen
// nur auf, wenn es dazu Termine gibt — leere Seiten sind noindex.

import {addDays, bildPfad, kategorie} from "./data";
import {BILDER} from "./bilder";

export type HubKind = "alle" | "typ" | "thema" | "bezirk" | "wochenende";

export interface HubEvent {
  typ: string;
  name: string;
  bezirk: string;
}

export interface Hub {
  path: string;
  kind: HubKind;
  chip: string;   // Beschriftung im Chip-Filter (wie in der App)
  crumb: string;  // Breadcrumb und Linktext
  img: string;    // Bild-Key (Kategoriebild, siehe bildPfad)
  image?: string; // Themenbild: Ordner unter /assets/image/ (optional, siehe pickImage)
  dimTyp: string; // Abdunklung wie in der App (hintergrundHelligkeit)
  h1: (jahr: string) => string;
  title: (jahr: string) => string;
  description: (jahr: string, n: number) => string;
  lead: string;
  typ?: string;
  match: (ev: HubEvent) => boolean;
}

const MITFAHREN = "Mitfahrgelegenheit hin und zurück findest du in der EventRide App.";

function typHub(
  typ: string, path: string, chip: string, crumb: string, img: string,
  h1: string, titel: string, beschreibung: string, lead: string
): Hub {
  return {
    path, kind: "typ", chip, crumb, img, dimTyp: typ, typ,
    h1: (j) => `${h1} ${j}`,
    title: (j) => `${titel.replace("{J}", j)} | EventRide`,
    description: (j, n) => `${beschreibung.replace("{J}", j).replace("{N}", String(n))} Mit Ort, Uhrzeit und Mitfahrgelegenheit über die EventRide App.`,
    lead,
    match: (ev) => ev.typ === typ,
  };
}

function themaHub(
  path: string, chip: string, img: string, dimTyp: string, re: RegExp,
  h1: string, titel: string, beschreibung: string, lead: string, image?: string
): Hub {
  return {
    path, kind: "thema", chip, crumb: `${chip} in Kärnten`, img, image, dimTyp,
    h1: (j) => `${h1} ${j}`,
    title: (j) => `${titel.replace("{J}", j)} | EventRide`,
    description: (j, n) => `${beschreibung.replace("{J}", j).replace("{N}", String(n))} Mit Ort, Uhrzeit und Mitfahrgelegenheit über die EventRide App.`,
    lead,
    match: (ev) => re.test(ev.name),
  };
}

export const ALLE: Hub = {
  path: "/events-kaernten", kind: "alle", chip: "Alle", crumb: "Events in Kärnten",
  img: "kirchtag", dimTyp: "e0",
  h1: (j) => `Events in Kärnten ${j}`,
  title: (j) => `Events & Veranstaltungen in Kärnten ${j} – alle Termine | EventRide`,
  description: (_j, n) => `Was ist los in Kärnten? ${n} kommende Events – Kirchtage, Partys, Bälle, Krampusläufe & mehr – mit Ort, Uhrzeit und Mitfahrgelegenheit.`,
  lead: "Was ist los in Kärnten? Hier findest du alle Veranstaltungen, die in der EventRide App eingetragen sind – vom Dorfkirchtag über Feuerwehrfeste und Bälle bis zur Party am Wochenende. Zu jedem Event siehst du in der App, wer aus deiner Gegend hinfährt, damit du sicher hin und wieder heim kommst.",
  match: () => true,
};

export const WOCHENENDE: Hub = {
  path: "/wochenende-kaernten", kind: "wochenende", chip: "Dieses Wochenende", crumb: "Wochenende in Kärnten",
  img: "disco", dimTyp: "e3",
  h1: () => "Was ist los am Wochenende in Kärnten?",
  title: () => "Was ist los in Kärnten am Wochenende? Events & Partys | EventRide",
  description: (_j, n) => `${n} Events am Wochenende in Kärnten: Partys, Kirchtage, Bälle, Krampusläufe & mehr – mit Ort, Uhrzeit und Mitfahrgelegenheit über die EventRide App.`,
  lead: "Noch keinen Plan fürs Wochenende? Hier siehst du alle Events von Freitag bis Sonntag, die in der EventRide App eingetragen sind – nach Tag sortiert. Und wenn du nicht selbst fahren willst: In der App findest du Leute aus deiner Gegend, die zum selben Event fahren.",
  match: () => true,
};

export const KATEGORIE_HUBS: Hub[] = [
  typHub("e1", "/kirchtage-kaernten", "Kirchtage & Feste", "Kirchtage in Kärnten", "kirchtag",
    "Kirchtage & Feste in Kärnten", "Kirchtage in Kärnten {J} – alle Termine & Mitfahrgelegenheit",
    "Kirchtage, Nachkirchtage und Dorffeste in Kärnten {J}: {N} kommende Termine nach Datum.",
    "Kirchtag ist in Kärnten mehr als ein Fest: Kirchtagssuppe, Musik, Tanz bis spät in die Nacht und das ganze Dorf auf den Beinen. Hier findest du Kirchtage, Nachkirchtage und Dorffeste in ganz Kärnten nach Datum sortiert. Und weil am Kirchtag selten jemand fahren will: " + MITFAHREN),
  typHub("e2", "/feuerwehrfeste-kaernten", "Feuerwehrfeste", "Feuerwehrfeste in Kärnten", "feuerwehr",
    "Feuerwehrfeste in Kärnten", "Feuerwehrfeste in Kärnten {J} – Termine & Mitfahrgelegenheit",
    "Feuerwehrfeste in Kärnten {J}: {N} kommende Termine nach Datum.",
    "Zeltfest, Grillhendl und Live-Musik: Die Feste der Freiwilligen Feuerwehren gehören zu den beliebtesten Veranstaltungen in Kärnten – und mit jedem Besuch unterstützt du die Wehr vor Ort. Hier findest du die Feuerwehrfeste in Kärnten nach Datum, mit Ort und Uhrzeit. " + MITFAHREN),
  typHub("e3", "/partys-kaernten", "Disco & Party", "Partys in Kärnten", "disco",
    "Partys & Disco in Kärnten", "Partys in Kärnten {J} – Disco, Clubbing & Events",
    "Partys, Discos und Clubnächte in Kärnten: {N} kommende Termine nach Datum.",
    "Clubnächte in Klagenfurt und Villach, Zeltdiscos am Land, Themenpartys am Wochenende: Hier findest du die Partys und Discos in Kärnten nach Datum. Nach der Party sicher heimkommen? In der EventRide App findest du Leute, die zur selben Party fahren – oder du bietest selbst freie Plätze an."),
  typHub("e4", "/baelle-kaernten", "Bälle", "Bälle in Kärnten", "ball",
    "Bälle in Kärnten", "Bälle in Kärnten {J} – Ballkalender mit allen Terminen",
    "Ballkalender Kärnten {J}: {N} kommende Bälle nach Datum – Maturabälle, Feuerwehrbälle, Landjugendbälle.",
    "Maturaball, Feuerwehrball, Landjugendball oder Gschnas: Die Ballsaison ist in Kärnten ein Fixpunkt im Kalender. Hier findest du die Bälle in ganz Kärnten nach Datum – mit Ort, Einlass und Eintritt. Im Ballkleid will niemand selbst fahren: " + MITFAHREN),
  typHub("e5", "/krampuslaeufe-kaernten", "Krampus & Perchten", "Krampusläufe in Kärnten", "krampus",
    "Krampusläufe in Kärnten", "Krampusläufe Kärnten {J} – alle Termine & Mitfahrgelegenheit",
    "Alle Krampusläufe und Perchtenläufe in Kärnten {J}: {N} Termine nach Datum.",
    "Wenn es früh dunkel wird, ziehen in ganz Kärnten wieder Krampusse und Perchten durch die Orte – mit Glocken, Fackeln und kunstvoll geschnitzten Larven. Hier findest du alle Krampusläufe, die in der EventRide App eingetragen sind, nach Datum sortiert. Zu jedem Lauf siehst du in der App, wer aus deiner Gegend hinfährt, damit du sicher hin und wieder heim kommst."),
  typHub("e6", "/festivals-kaernten", "Festivals & Open Air", "Festivals in Kärnten", "festival",
    "Festivals & Open Airs in Kärnten", "Festivals in Kärnten {J} – Open Airs & Konzerte",
    "Festivals und Open Airs in Kärnten {J}: {N} kommende Termine nach Datum.",
    "Vom kleinen Open Air am Badesee bis zum großen Festivalwochenende: Hier findest du die Festivals und Open-Air-Veranstaltungen in Kärnten nach Datum. Gemeinsam anreisen spart Sprit und Parkplatzsuche – Mitfahrgelegenheiten gibt's in der EventRide App."),
  typHub("e7", "/sommerfeste-kaernten", "Beach & Sommer", "Sommerfeste in Kärnten", "beach",
    "Beach-Partys & Sommerfeste in Kärnten", "Sommerfeste & Beach-Partys in Kärnten {J}",
    "Beach-Partys, Seefeste und Sommer-Events in Kärnten {J}: {N} kommende Termine nach Datum.",
    "Seefeste, Beach-Partys am Wörthersee und laue Sommernächte im Freien: Hier findest du die Sommer-Events in Kärnten nach Datum. " + MITFAHREN),
];

export const THEMEN_HUBS: Hub[] = [
  themaHub("/halloween-kaernten", "Halloween", "disco", "e3", /halloween/i,
    "Halloween-Partys in Kärnten", "Halloween in Kärnten {J} – Partys & Events",
    "Halloween-Partys in Kärnten {J}: {N} Termine in Clubs, Discos und Lokalen.",
    "Kostüm an, Schminke drauf: Zu Halloween steigen in ganz Kärnten Partys in Clubs, Discos und Weinkellern. Hier findest du alle Halloween-Events, die in der EventRide App eingetragen sind, nach Datum. Verkleidet fährt es sich schlecht – Mitfahrgelegenheit gibt's in der App."),
  themaHub("/silvester-kaernten", "Silvester", "disco", "e3", /silvester|new ?year|\bnye\b/i,
    "Silvester in Kärnten", "Silvester in Kärnten {J} – Partys & Feiern",
    "Silvesterpartys in Kärnten {J}: {N} Termine nach Datum.",
    "Wo feierst du ins neue Jahr? Hier findest du die Silvesterpartys und -feiern in Kärnten. Gerade zu Silvester ist eine Mitfahrgelegenheit Gold wert – in der EventRide App findest du Leute, die zur selben Feier fahren."),
  themaHub("/fasching-kaernten", "Fasching", "ball", "e4", /fasching|gschnas|karneval|maskenball/i,
    "Fasching in Kärnten", "Fasching in Kärnten {J} – Gschnas, Umzüge & Partys",
    "Fasching in Kärnten {J}: {N} Gschnas, Umzüge und Faschingspartys nach Datum.",
    "Gschnas, Faschingsumzüge und Maskenbälle: Kärnten feiert die fünfte Jahreszeit ausgiebig. Hier findest du die Faschingsveranstaltungen in ganz Kärnten nach Datum. " + MITFAHREN),
  themaHub("/maturabaelle-kaernten", "Maturabälle", "ball", "e4", /matura/i,
    "Maturabälle in Kärnten", "Maturabälle in Kärnten {J} – alle Termine",
    "Maturabälle in Kärnten {J}: {N} Termine nach Datum.",
    "Der Maturaball ist für viele der Höhepunkt des Schuljahres. Hier findest du die Maturabälle in Kärnten nach Datum – mit Ort, Einlass und Eintritt. " + MITFAHREN),
  themaHub("/zeltfeste-kaernten", "Zeltfeste", "feuerwehr", "e2", /zelt(fest|disco|party|gaudi)/i,
    "Zeltfeste in Kärnten", "Zeltfeste in Kärnten {J} – Termine & Mitfahrgelegenheit",
    "Zeltfeste und Zeltdiscos in Kärnten {J}: {N} Termine nach Datum.",
    "Bierbänke, Blasmusik und später die Zeltdisco: Hier findest du die Zeltfeste in Kärnten nach Datum. " + MITFAHREN),
  themaHub("/oktoberfeste-kaernten", "Oktoberfest", "kirchtag", "e1", /oktoberfest|wiesn/i,
    "Oktoberfeste in Kärnten", "Oktoberfeste in Kärnten {J} – Termine",
    "Oktoberfeste und Wiesn-Partys in Kärnten {J}: {N} Termine nach Datum.",
    "Dirndl, Lederhose und Maß: Auch in Kärnten wird im Herbst Oktoberfest gefeiert. Hier findest du die Oktoberfeste und Wiesn-Partys nach Datum. " + MITFAHREN),
];

// Die zehn Kärntner Bezirke. `keys` sind die normalisierten Schreibweisen,
// die im Feld `bezirk` vorkommen (Manager/App schreiben nicht einheitlich).
const BEZIRKE: { slug: string; name: string; bezirk: string; stadt: boolean; img: string; keys: string[] }[] = [
  {slug: "klagenfurt", name: "Klagenfurt", bezirk: "Klagenfurt-Stadt", stadt: true, img: "disco", keys: ["klagenfurtstadt", "klagenfurt", "klagenfurtamwoerthersee"]},
  {slug: "klagenfurt-land", name: "Klagenfurt-Land", bezirk: "Klagenfurt-Land", stadt: false, img: "kirchtag", keys: ["klagenfurtland"]},
  {slug: "villach", name: "Villach", bezirk: "Villach-Stadt", stadt: true, img: "disco", keys: ["villachstadt", "villach"]},
  {slug: "villach-land", name: "Villach-Land", bezirk: "Villach-Land", stadt: false, img: "kirchtag", keys: ["villachland"]},
  {slug: "spittal", name: "Spittal an der Drau", bezirk: "Spittal", stadt: false, img: "kirchtag", keys: ["spittal"]},
  {slug: "st-veit", name: "St. Veit an der Glan", bezirk: "St. Veit", stadt: false, img: "kirchtag", keys: ["sanktveit"]},
  {slug: "wolfsberg", name: "Wolfsberg", bezirk: "Wolfsberg", stadt: false, img: "kirchtag", keys: ["wolfsberg"]},
  {slug: "voelkermarkt", name: "Völkermarkt", bezirk: "Völkermarkt", stadt: false, img: "kirchtag", keys: ["voelkermarkt"]},
  {slug: "feldkirchen", name: "Feldkirchen", bezirk: "Feldkirchen", stadt: false, img: "kirchtag", keys: ["feldkirchen"]},
  {slug: "hermagor", name: "Hermagor", bezirk: "Hermagor", stadt: false, img: "kirchtag", keys: ["hermagor", "hermagorpresseggersee"]},
];

export function bezirkKey(b: string): string {
  return b.toLowerCase()
    .replace(/[äöüß]/g, (c) => ({"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"}[c] as string))
    .replace(/\bst(\.\s*|\s+)/g, "sankt ") // "St. Veit", nicht "Klagenfurt-Stadt"
    .replace(/\ban der (glan|drau)\b/g, "")
    .replace(/[^a-z]/g, "");
}

export const BEZIRK_HUBS: Hub[] = BEZIRKE.map((b) => {
  const inOrt = b.stadt ? `in ${b.name}` : `im Bezirk ${b.name}`;
  return {
    path: `/events-${b.slug}`, kind: "bezirk", chip: b.name, crumb: `Events ${inOrt}`,
    img: b.img, dimTyp: b.img === "disco" ? "e3" : "e1",
    h1: (j: string) => `Events ${inOrt} ${j}`,
    title: (j: string) => `Events ${inOrt} ${j} – Partys, Feste & Termine | EventRide`,
    description: (j: string, n: number) => `Was ist los ${inOrt}? ${n} kommende Events ${j} – Kirchtage, Partys, Bälle & mehr – mit Ort, Uhrzeit und Mitfahrgelegenheit.`,
    lead: `Was ist los ${inOrt}? Hier findest du die Events ${inOrt}, die in der EventRide App eingetragen sind – von Kirchtagen und Feuerwehrfesten über Bälle bis zu Partys, nach Datum sortiert. Zu jedem Event findest du in der App eine Mitfahrgelegenheit aus deiner Gegend.`,
    match: (ev: HubEvent) => b.keys.includes(bezirkKey(ev.bezirk)),
  };
});

export const ALL_HUBS: Hub[] = [ALLE, WOCHENENDE, ...KATEGORIE_HUBS, ...THEMEN_HUBS, ...BEZIRK_HUBS];

const BY_PATH = new Map(ALL_HUBS.map((h) => [h.path, h]));

export function hubByPath(path: string): Hub | undefined {
  return BY_PATH.get(path);
}

export function hubForTyp(typ: string): Hub {
  return KATEGORIE_HUBS.find((h) => h.typ === typ) ?? ALLE;
}

export function hubForBezirk(bezirk: string): Hub | undefined {
  return bezirk ? BEZIRK_HUBS.find((h) => h.match({typ: "", name: "", bezirk})) : undefined;
}

// Themenbild nur, wenn es in der Config steht und Varianten dafür existieren
// (scripts/seo_bilder.ps1 legt sie an und zählt sie in bilder.ts).
function themenBild(hub: Hub | undefined): string | undefined {
  return hub?.image && (BILDER[hub.image] ?? 0) > 0 ? hub.image : undefined;
}

// Bild eines Events: zuerst das Themenbild (erstes passendes Thema mit Bild),
// sonst das Kategoriebild. Pfad ohne Endung, wie bildPfad().
export function pickImage(ev: { typ: string; name: string; slug: string | null | undefined }): string {
  const thema = THEMEN_HUBS.find((h) => themenBild(h) && h.match({typ: ev.typ, name: ev.name, bezirk: ""}));
  return bildPfad(themenBild(thema) ?? kategorie(ev.typ).img, ev.slug);
}

// Kopf- und Vorschaubild einer Übersichtsseite.
export function hubBild(hub: Hub): string {
  return bildPfad(themenBild(hub) ?? hub.img, null);
}

// Freitag–Sonntag des Wochenendes, in dem `day` liegt (bzw. des folgenden
// Wochenendes, wenn `day` ein Montag–Donnerstag ist).
export function wochenende(day: string): { von: string; bis: string; gleiches: boolean } {
  const [y, m, d] = day.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const gleiches = wd === 5 || wd === 6 || wd === 0;
  const zumFreitag = gleiches ? -((wd + 2) % 7) : 5 - wd;
  const von = addDays(day, zumFreitag);
  return {von, bis: addDays(von, 2), gleiches};
}
