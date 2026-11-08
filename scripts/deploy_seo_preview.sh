#!/bin/bash
# Vorschau der SEO-Seiten (inkl. Startseite) auf dem Hosting-Kanal "seo-preview".
#
# Deployt nur die Function seoNext — die Live-Function seo bleibt unverändert.
# Der Vorschaukanal bekommt eine temporäre firebase.preview.json, deren
# Rewrites auf seoNext statt seo zeigen. Live geht es erst nach Freigabe mit:
#   npx firebase-tools deploy --only functions:seo,hosting
set -euo pipefail
cd "$(dirname "$0")/.."

(cd functions && npm run build)
npx firebase-tools deploy --only functions:seoNext --force

trap 'rm -f firebase.preview.json' EXIT
node -e '
const c = require("./firebase.json");
for (const r of c.hosting.rewrites) if (r.function && r.function.functionId === "seo") r.function.functionId = "seoNext";
require("fs").writeFileSync("firebase.preview.json", JSON.stringify(c, null, 2));
'
npx firebase-tools hosting:channel:deploy seo-preview --expires 7d --config firebase.preview.json
