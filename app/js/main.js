// main.js — boot for Leonida Platinum, the GTA VI trophy guide & tracker.
// Loads the app's own data files, restores progress from localStorage,
// wires the filters, the spoiler setting, the counters and export/import,
// and routes between the tracker, roadmap and missables views by hash.

import {
  loadState, saveState, toggleEarned, setCounter,
  exportProgress, importProgress, progressSummary, demoState,
} from './store.js';
import { KIND_LABELS, KIND_ORDER, applyFilters, kindCounts } from './filters.js';
import {
  el, renderMastheadStats, renderProgressBand, renderList,
  renderDetail, renderRoadmap, renderMissables,
} from './views.js';

const state = loadState();
let trophies = [];
let roadmap = null;
let filters = { query: '', kind: 'all', grade: 'all', state: 'all' };
let view = 'tracker';

const $ = (id) => document.getElementById(id);
const els = {
  stats: $('masthead-stats'),
  band: $('progress-band'),
  list: $('trophy-list'),
  detail: $('detail-pane'),
  resultCount: $('result-count'),
  search: $('search'),
  chips: $('kind-chips'),
  grade: $('grade-filter'),
  stateFilter: $('state-filter'),
  spoiler: $('spoiler-toggle'),
  saveNote: $('save-note'),
  views: { tracker: $('view-tracker'), roadmap: $('view-roadmap'), missables: $('view-missables') },
  tabs: [...document.querySelectorAll('.viewtab')],
};

function selectedTrophy() {
  return trophies.find((t) => t.id === state.selectedId) || trophies[0] || null;
}

function refresh() {
  const summary = progressSummary(state, trophies);
  renderMastheadStats(els.stats, summary);
  renderProgressBand(els.band, summary, trophies, state);
  const visible = applyFilters(trophies, filters, state);
  els.resultCount.textContent = `Showing ${visible.length} of ${trophies.length} trophies`;
  renderList(els.list, visible, state, state.selectedId, handlers);
  renderDetail(els.detail, selectedTrophy(), state, trophies, handlers);
  if (view === 'roadmap' && roadmap) renderRoadmap(els.views.roadmap, roadmap, trophies, state);
  if (view === 'missables' && roadmap) renderMissables(els.views.missables, roadmap, trophies, state);
}

const handlers = {
  onToggle(id) {
    toggleEarned(state, id);
    note('Progress saved in this browser.');
    refresh();
  },
  onSelect(id) {
    state.selectedId = id;
    saveState(state);
    refresh();
  },
  onCounter(trophy, value) {
    if (!Number.isFinite(value)) return;
    setCounter(state, trophy, value);
    note('Counter saved.');
    refresh();
  },
};

function note(text) {
  els.saveNote.textContent = text;
}

function buildChips() {
  const counts = kindCounts(trophies);
  for (const kind of KIND_ORDER) {
    const label = `${KIND_LABELS[kind]}${counts[kind] ? ` (${counts[kind]})` : ''}`;
    const chip = el('button', `chip${filters.kind === kind ? ' is-active' : ''}`, label);
    chip.type = 'button';
    chip.dataset.kind = kind;
    chip.addEventListener('click', () => {
      filters.kind = kind;
      for (const c of els.chips.children) c.classList.toggle('is-active', c.dataset.kind === kind);
      refresh();
    });
    els.chips.append(chip);
  }
}

function setView(name) {
  view = name;
  for (const [key, section] of Object.entries(els.views)) section.hidden = key !== name;
  for (const tab of els.tabs) tab.classList.toggle('is-active', tab.dataset.view === name);
  if (location.hash !== `#/${name}`) history.replaceState(null, '', `#/${name}`);
  refresh();
  window.scrollTo({ top: 0 });
}

function wireControls() {
  els.search.addEventListener('input', () => { filters.query = els.search.value; refresh(); });
  els.grade.addEventListener('change', () => { filters.grade = els.grade.value; refresh(); });
  els.stateFilter.addEventListener('change', () => { filters.state = els.stateFilter.value; refresh(); });
  els.spoiler.checked = state.spoilers;
  els.spoiler.addEventListener('change', () => {
    state.spoilers = els.spoiler.checked;
    saveState(state);
    note(state.spoilers ? 'Spoiler protection on: unearned story trophies are hidden.' : 'Spoiler protection off: story trophies are revealed.');
    refresh();
  });
  for (const tab of els.tabs) tab.addEventListener('click', () => setView(tab.dataset.view));

  $('export-btn').addEventListener('click', () => {
    const blob = new Blob([exportProgress(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', '');
    a.href = url;
    a.download = 'leonida-platinum-progress.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    note('Progress exported as JSON.');
  });

  $('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const validIds = new Set(trophies.map((t) => t.id));
      const restored = importProgress(await file.text(), validIds);
      state.earned = restored.earned;
      state.counters = restored.counters;
      state.spoilers = restored.spoilers;
      els.spoiler.checked = state.spoilers;
      saveState(state);
      note(`Imported progress: ${state.earned.length} trophies earned.`);
      refresh();
    } catch (err) {
      note(`Import failed: ${err.message}`);
    }
    event.target.value = '';
  });

  $('reset-btn').addEventListener('click', () => {
    const fresh = demoState();
    state.earned = fresh.earned;
    state.counters = fresh.counters;
    state.spoilers = fresh.spoilers;
    state.selectedId = fresh.selectedId;
    els.spoiler.checked = state.spoilers;
    saveState(state);
    note('Demo progress restored.');
    refresh();
  });
}

async function boot() {
  const [trophyData, roadmapData] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/roadmap.json').then((r) => r.json()),
  ]);
  trophies = trophyData.trophies;
  roadmap = roadmapData;
  if (!trophies.some((t) => t.id === state.selectedId)) state.selectedId = trophies[0].id;

  const sourceLine = $('colophon-sources');
  sourceLine.textContent = `Principal sources: ${trophyData.sources.map((s) => s.label).join(' · ')}.`;

  buildChips();
  wireControls();
  const fromHash = location.hash.replace('#/', '');
  setView(['roadmap', 'missables'].includes(fromHash) ? fromHash : 'tracker');
}

boot().catch((err) => {
  els.resultCount.textContent = `Could not load the trophy data: ${err.message}`;
});
