// filters.js — which trophies the tracker shows, and what the spoiler
// setting hides. Pure functions over the trophy list and a filter object:
// { query, kind, grade, state } where state is all | earned | unearned and
// kind may also be the pseudo-kinds "missable" or "hidden".

export const KIND_LABELS = {
  all: 'All 55',
  story: 'Story',
  side: 'Side stories',
  collectibles: 'Collectibles',
  activities: 'Activities',
  robbery: 'Robbery & crime',
  partner: 'Partner',
  world: 'World & one-offs',
  completion: 'Completion',
  missable: 'Missable only',
  hidden: 'Hidden only',
};

export const KIND_ORDER = [
  'all', 'story', 'side', 'collectibles', 'activities',
  'robbery', 'partner', 'world', 'completion', 'missable', 'hidden',
];

export function kindOf(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return !!trophy.missable;
  if (kind === 'hidden') return !!trophy.hidden;
  return trophy.kind === kind;
}

export function matchesQuery(trophy, query) {
  if (!query) return true;
  const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind} ${trophy.grade}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((word) => hay.includes(word));
}

export function applyFilters(trophies, filters, state) {
  return trophies.filter((trophy) => {
    if (!kindOf(trophy, filters.kind)) return false;
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.state === 'earned' && !state.earned.includes(trophy.id)) return false;
    if (filters.state === 'unearned' && state.earned.includes(trophy.id)) return false;
    return matchesQuery(trophy, filters.query);
  });
}

// The spoiler rule, from the bounty rules: with spoiler protection on, the
// name and description of a story trophy stay hidden until it is earned.
// The row still shows its grade and its place in the list, so the shape of
// the campaign stays visible without giving its beats away.
export function isMasked(trophy, state) {
  return state.spoilers && trophy.kind === 'story' && !state.earned.includes(trophy.id);
}

export function displayName(trophy, state) {
  return isMasked(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  if (isMasked(trophy, state)) return 'Spoiler protection is on: this story trophy reveals itself when you earn it.';
  return trophy.description;
}

export function nextUnearned(trophies, state) {
  return trophies.find((t) => !state.earned.includes(t.id) && t.grade !== 'platinum') || null;
}

export function stageTrophies(trophies, stageNumber) {
  return trophies.filter((t) => t.stage === stageNumber);
}

export function kindCounts(trophies) {
  const counts = { all: trophies.length, missable: 0, hidden: 0 };
  for (const trophy of trophies) {
    counts[trophy.kind] = (counts[trophy.kind] || 0) + 1;
    if (trophy.missable) counts.missable += 1;
    if (trophy.hidden) counts.hidden += 1;
  }
  return counts;
}
