# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/joker1987-gift/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/joker1987-gift/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Platinum** — an offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5. It covers all 55 official trophies (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; no online trophies), each with its official name, description and grade as PlayStation publishes them, and a guide written for this app that cites its sources — Exophase and PSNProfiles for the official list and PSN's progress targets, Output Lag and GTA Vibes for launch-day method and missable reporting. Where a trigger is not yet confirmed by a source we trust, the guide says so instead of inventing steps.

Features: a checklist whose progress (earned ticks and per-trophy counters) is saved in the browser's localStorage and can be exported to a JSON file and imported back; search and filters by kind (story, side stories, collectibles, activities, robbery & crime, partner, world & one-offs, completion), by missable and hidden flags, by grade and by earned state; a spoiler setting that hides the names and descriptions of story trophies until they are earned; a seven-stage roadmap to the platinum built from the official descriptions (chapter saves, the one reported missable — a Chapter 1 meditation spot for Positive Mental Attitude — the robbery unlock order, and the 100% checklist's higher targets); and a missables view. The app is plain static files under `app/` with no build step and makes no network request at run time; `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `vendor/makefun-frontend.ts`. The look is original — no Rockstar Games logo, artwork or screenshots.

## Run it

```sh
node serve.ts   # serves app/ at http://localhost:8080 — open it in a desktop browser
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hand the entry in: writes out/app, out/screenshots, out/dossier.json
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ptzed4c2&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
