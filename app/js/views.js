// views.js — every render in the app: the masthead stats, the progress band,
// the trophy rows, the guide pane, and the roadmap and missables views.
// Rendering is plain DOM built from the trophy data; nothing is fetched at
// run time beyond the app's own data files, and no markup comes from the
// network.

import { isEarned, counterOf, GRADE_POINTS } from './store.js';
import { displayName, displayDescription, isMasked, stageTrophies } from './filters.js';

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const GRADE_GLYPH = { platinum: '✦', gold: '●', silver: '●', bronze: '●' };

export function gradeBadge(trophy) {
  const badge = el('span', `grade grade-${trophy.grade}`);
  badge.append(el('span', 'grade-dot', GRADE_GLYPH[trophy.grade]));
  badge.append(el('span', '', trophy.grade));
  return badge;
}

export function flagRow(trophy) {
  const row = el('span', 'flags');
  if (trophy.missable) row.append(el('span', 'flag flag-missable', 'MISSABLE'));
  if (trophy.hidden) row.append(el('span', 'flag flag-hidden', 'HIDDEN'));
  if (trophy.target) row.append(el('span', 'flag flag-count', `PSN counts to ${trophy.target.toLocaleString('en-US')}`));
  return row;
}

export function renderMastheadStats(container, summary) {
  container.replaceChildren();
  const big = el('div', 'masthead-big', `${summary.earned} / ${summary.total}`);
  const small = el('div', 'masthead-small', `trophies earned · ${summary.percent}% · ${summary.points} of ${summary.pointsTotal} PSN points`);
  container.append(big, small);
}

export function renderProgressBand(container, summary, trophies, state) {
  container.replaceChildren();
  const bar = el('div', 'progress-track');
  const fill = el('div', 'progress-fill');
  fill.style.width = `${summary.percent}%`;
  bar.append(fill);
  container.append(bar);

  const line = el('p', 'progress-line');
  const parts = [
    `${summary.earned} of ${summary.total} earned (${summary.percent}%)`,
    `${summary.points} / ${summary.pointsTotal} PSN points (${summary.pointsPercent}%)`,
  ];
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const g = summary.byGrade[grade];
    parts.push(`${grade} ${g.earned}/${g.total}`);
  }
  parts.push(`${summary.hiddenTotal} hidden on PSN`);
  parts.push(`${summary.missableTotal} missable`);
  line.textContent = parts.join('  ·  ');
  container.append(line);

  const remaining = trophies.filter((t) => !isEarned(state, t.id) && t.grade !== 'platinum');
  if (remaining.length && summary.earned > 0) {
    const next = el('p', 'progress-next');
    next.append(el('strong', '', 'Next up: '));
    next.append(document.createTextNode(`${remaining[0].name} — ${remaining[0].description}`));
    container.append(next);
  }
}

export function renderTrophyRow(trophy, state, selectedId, handlers) {
  const row = el('li', `trophy-row${isEarned(state, trophy.id) ? ' is-earned' : ''}${trophy.id === selectedId ? ' is-selected' : ''}`);
  row.dataset.id = String(trophy.id);

  const check = el('input', 'trophy-check');
  check.type = 'checkbox';
  check.checked = isEarned(state, trophy.id);
  check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  check.addEventListener('change', () => handlers.onToggle(trophy.id));
  row.append(check);

  const main = el('button', 'trophy-main');
  main.type = 'button';
  main.addEventListener('click', () => handlers.onSelect(trophy.id));
  const title = el('span', 'trophy-name', displayName(trophy, state));
  const desc = el('span', 'trophy-desc', displayDescription(trophy, state));
  main.append(title, desc);
  row.append(main);

  const meta = el('span', 'trophy-meta');
  meta.append(gradeBadge(trophy), flagRow(trophy));
  if (trophy.target && !isMasked(trophy, state)) {
    const count = counterOf(state, trophy);
    meta.append(el('span', 'trophy-count', `${count.toLocaleString('en-US')} / ${trophy.target.toLocaleString('en-US')}`));
  }
  row.append(meta);
  return row;
}

export function renderList(container, trophies, state, selectedId, handlers) {
  container.replaceChildren();
  for (const trophy of trophies) container.append(renderTrophyRow(trophy, state, selectedId, handlers));
  if (!trophies.length) {
    container.append(el('li', 'empty-note', 'No trophy matches those filters. Loosen the search or pick another kind.'));
  }
}

// views.js (continued) — the guide pane, the roadmap and the missables view.

import { progressSummary } from './store.js';

const SOURCE_URLS = {
  'Exophase — GTA VI (PSN) trophy list': 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  'PSNProfiles — GTA VI trophies': 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
  'Output Lag — GTA 6 trophy list': 'https://outputlag.com/guides/gta-6-trophy-list/',
  'GTA Vibes — GTA 6 trophy list (missable report)': 'https://www.gtavibes.com/guides/gta-6-trophy-list-achievements',
};

function sourceLink(label) {
  const base = label.replace(/ \(PSN target.*\)$/, '').replace(/ \(unconfirmed trigger\)$/, '');
  const url = SOURCE_URLS[base];
  if (!url) return el('span', 'source-name', label);
  const a = el('a', 'source-name', label);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

export function renderDetail(container, trophy, state, allTrophies, handlers) {
  container.replaceChildren();
  if (!trophy) {
    container.append(el('p', 'detail-empty', 'Pick a trophy to read its guide.'));
    return;
  }
  const masked = isMasked(trophy, state);
  const card = el('article', 'detail-card');

  const head = el('div', 'detail-head');
  head.append(gradeBadge(trophy), flagRow(trophy));
  card.append(head);

  card.append(el('h2', 'detail-name', displayName(trophy, state)));
  const desc = el('p', 'detail-desc');
  desc.append(el('span', 'detail-desc-label', 'Official description: '));
  desc.append(document.createTextNode(`“${displayDescription(trophy, state)}”`));
  card.append(desc);

  const metaLine = el('p', 'detail-meta');
  const kindText = trophy.kind === 'side' ? 'side stories' : trophy.kind;
  metaLine.textContent = `${kindText} · roadmap stage ${trophy.stage} · worth ${GRADE_POINTS[trophy.grade]} PSN points${trophy.hidden ? ' · hidden on PlayStation until earned' : ''}`;
  card.append(metaLine);

  if (trophy.missable) {
    card.append(el('p', 'detail-missable', 'Missable: one of this trophy\'s meditation spots exists only in Chapter 1. See the Missables view before you finish that chapter.'));
  }

  card.append(el('h3', 'detail-h', 'Guide — in our words, sources cited'));
  card.append(el('p', 'detail-guide', masked ? 'Spoiler protection is hiding this story trophy\'s guide too. Earn it, or switch spoiler protection off above, to read the guide.' : trophy.guide));

  if (trophy.target && !masked) {
    const counterBox = el('div', 'counter-box');
    counterBox.append(el('label', 'counter-label', `Your count (PSN target ${trophy.target.toLocaleString('en-US')})`));
    const input = el('input', 'counter-input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.target);
    input.value = String(counterOf(state, trophy));
    input.addEventListener('change', () => handlers.onCounter(trophy, Number(input.value)));
    counterBox.append(input);
    const pct = Math.min(100, Math.round((counterOf(state, trophy) / trophy.target) * 100));
    counterBox.append(el('span', 'counter-pct', `${pct}% there`));
    card.append(counterBox);
  }

  const done = el('label', 'detail-done');
  const box = el('input', '');
  box.type = 'checkbox';
  box.checked = isEarned(state, trophy.id);
  box.addEventListener('change', () => handlers.onToggle(trophy.id));
  done.append(box, el('span', '', ' I have earned this trophy'));
  card.append(done);

  const sources = el('div', 'detail-sources');
  sources.append(el('h3', 'detail-h', 'Sources'));
  const list = el('ul', 'source-list');
  for (const label of trophy.sources) {
    const item = el('li', '');
    item.append(sourceLink(label));
    list.append(item);
  }
  sources.append(list);
  sources.append(el('p', 'source-note', 'Names, descriptions and grades are the official list as PlayStation publishes it; the guide text is ours, written for this app — sources are cited, never copied. Links open only when you follow them; the app itself loads nothing from the network.'));
  card.append(sources);
  container.append(card);
}

export function renderRoadmap(container, roadmap, trophies, state) {
  container.replaceChildren();
  container.append(el('h2', 'view-title', roadmap.title));
  container.append(el('p', 'view-intro', roadmap.intro));
  const summary = progressSummary(state, trophies);
  container.append(el('p', 'roadmap-progress', `Your progress: ${summary.earned} of ${summary.total} earned (${summary.percent}%). Stages below light up as you clear them.`));

  for (const stage of roadmap.stages) {
    const inStage = stageTrophies(trophies, stage.n);
    const doneCount = inStage.filter((t) => isEarned(state, t.id)).length;
    const block = el('section', `stage${doneCount === inStage.length && inStage.length ? ' is-complete' : ''}`);
    const head = el('div', 'stage-head');
    head.append(el('span', 'stage-n', `Stage ${stage.n}`));
    head.append(el('h3', 'stage-name', stage.name));
    head.append(el('span', 'stage-count', `${doneCount}/${inStage.length} earned`));
    block.append(head);
    block.append(el('p', 'stage-text', stage.text));
    const chips = el('p', 'stage-chips');
    for (const t of inStage) {
      const chip = el('span', `stage-chip grade-chip-${t.grade}${isEarned(state, t.id) ? ' is-earned' : ''}`, `${isEarned(state, t.id) ? '✓ ' : ''}${displayName(t, state)}`);
      chips.append(chip);
    }
    block.append(chips);
    container.append(block);
  }
}

export function renderMissables(container, roadmap, trophies, state) {
  container.replaceChildren();
  container.append(el('h2', 'view-title', 'Missable trophies — read this before Chapter 2'));
  container.append(el('p', 'view-intro', 'Built from the official descriptions and launch coverage: exactly one trophy in the 55 is reported missable, plus one time-sensitive step inside another. Everything else can be cleaned up after the credits.'));
  for (const entry of roadmap.missables) {
    const block = el('section', 'missable-block');
    block.append(el('h3', 'missable-name', entry.name));
    block.append(el('p', 'missable-why', entry.why));
    container.append(block);
  }
  const flagged = trophies.filter((t) => t.missable);
  const list = el('div', 'missable-list');
  for (const t of flagged) {
    const card = el('article', 'missable-card');
    card.append(el('h3', '', displayName(t, state)));
    card.append(el('p', 'missable-card-desc', `“${displayDescription(t, state)}”`));
    card.append(el('p', 'missable-card-guide', t.guide));
    list.append(card);
  }
  container.append(list);
  container.append(el('p', 'view-intro', 'The insurance policy for everything else: a manual save at the start of every chapter (15 slots are provided), and no cheats on the trophy save — launch coverage reports cheats disable trophies and saving.'));
}
