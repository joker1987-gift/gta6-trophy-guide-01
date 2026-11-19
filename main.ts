// Leonida Platinum — the GTA VI trophy guide & tracker entry for
// gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is the static web app in app/: index.html plus its CSS,
// ES modules and JSON data (app/data/trophies.json carries all 55 official
// PS5 trophies with a cited guide for each; app/data/roadmap.json carries
// the platinum roadmap and the missable notes). It runs fully offline and
// loads nothing over the network.
//
// This program hands the entry in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there
// with buildDossier from vendor/makefun-frontend.ts — the kit's library,
// left byte for byte unchanged, because the scorer rebuilds the dossier
// with its own copy and compares the two exactly.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Try the guide locally with:  node serve.ts   (http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the app and the maker's screenshots, then write the dossier the
// judge reads. The limits passed to buildDossier are the gate's own caps:
// at most 4 screenshots of 256 KiB each, app/ within 993 entries and
// 48 MiB in all, and the dossier's source text capped at 160 KiB.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Leonida Platinum handed in: app/ + screenshots/ + dossier.json -> ${out}`);
