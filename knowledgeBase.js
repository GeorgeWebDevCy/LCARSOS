const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 1;
const STALE_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 100;
const SOURCE_NAME = 'STAPI';
const SOURCE_URL = 'https://stapi.co/';
const DATABASE_FILE = 'trek-knowledge-base.json';

const CATEGORY_CONFIG = [
  { type: 'character', endpoint: 'character', listKey: 'characters', label: 'Characters', maxRecords: 1000 },
  { type: 'episode', endpoint: 'episode', listKey: 'episodes', label: 'Episodes', maxRecords: 400 },
  { type: 'book', endpoint: 'book', listKey: 'books', label: 'Books', maxRecords: 300 },
  { type: 'series', endpoint: 'series', listKey: 'series', label: 'Series', maxRecords: 20 },
  { type: 'movie', endpoint: 'movie', listKey: 'movies', label: 'Movies', maxRecords: 20 },
  { type: 'species', endpoint: 'species', listKey: 'species', label: 'Species', maxRecords: 500 },
  { type: 'location', endpoint: 'location', listKey: 'locations', label: 'Locations', maxRecords: 300 },
  { type: 'spacecraft', endpoint: 'spacecraft', listKey: 'spacecraft', label: 'Spacecraft', maxRecords: 300 },
  { type: 'organization', endpoint: 'organization', listKey: 'organizations', label: 'Organizations', maxRecords: 150 },
  { type: 'weapon', endpoint: 'weapon', listKey: 'weapons', label: 'Weapons', maxRecords: 150 }
];

let databasePath = null;
let logger = () => {};
let syncPromise = null;

function initializeKnowledgeBase({ dataDir, log }) {
  databasePath = path.join(dataDir, DATABASE_FILE);
  logger = typeof log === 'function' ? log : () => {};
}

async function getKnowledgeSummary() {
  const db = readDatabase();
  maybeScheduleBackgroundSync(db);
  return buildSummary(db);
}

async function searchKnowledge({ query = '', category = 'all', limit = 16 } = {}) {
  const db = readDatabase();
  maybeScheduleBackgroundSync(db);

  const normalizedQuery = String(query).trim().toLowerCase();
  const normalizedCategory = String(category || 'all').toLowerCase();
  const maxResults = Math.max(1, Math.min(Number(limit) || 16, 50));

  const pool = db.entries.filter((entry) => normalizedCategory === 'all' || entry.type === normalizedCategory);
  if (!normalizedQuery) {
    return {
      meta: buildSummary(db),
      query: '',
      category: normalizedCategory,
      results: pool.slice(0, maxResults)
    };
  }

  const scored = pool
    .map((entry) => ({ entry, score: scoreEntry(entry, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, maxResults)
    .map((item) => item.entry);

  return {
    meta: buildSummary(db),
    query: normalizedQuery,
    category: normalizedCategory,
    results: scored
  };
}

async function getRandomKnowledge({ category = 'all' } = {}) {
  const db = readDatabase();
  maybeScheduleBackgroundSync(db);

  const normalizedCategory = String(category || 'all').toLowerCase();
  const pool = db.entries.filter((entry) => normalizedCategory === 'all' || entry.type === normalizedCategory);
  if (!pool.length) {
    return { meta: buildSummary(db), entry: null };
  }

  return {
    meta: buildSummary(db),
    entry: pool[Math.floor(Math.random() * pool.length)]
  };
}

async function syncKnowledgeBase({ force = false } = {}) {
  if (!databasePath) {
    throw new Error('Knowledge base not initialized.');
  }
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const currentDb = readDatabase();
    if (!force && !isStale(currentDb.meta.lastSyncedAt) && currentDb.entries.length) {
      return buildSummary(currentDb);
    }

    logger('INFO', 'Knowledge sync started');
    writeDatabase({
      ...currentDb,
      meta: {
        ...currentDb.meta,
        syncInProgress: true,
        lastAttemptedAt: new Date().toISOString(),
        lastError: null
      }
    });

    try {
      const categoryPayloads = await Promise.all(CATEGORY_CONFIG.map(async (category) => {
        const categoryEntries = await fetchCategoryEntries(category);
        logger('INFO', `Knowledge sync loaded ${categoryEntries.length} ${category.type} entries`);
        return { category, categoryEntries };
      }));

      const countsByType = {};
      const entries = [];
      categoryPayloads.forEach(({ category, categoryEntries }) => {
        countsByType[category.type] = categoryEntries.length;
        entries.push(...categoryEntries);
      });

      const nextDb = {
        meta: {
          schemaVersion: SCHEMA_VERSION,
          sourceName: SOURCE_NAME,
          sourceUrl: SOURCE_URL,
          syncInProgress: false,
          lastSyncedAt: new Date().toISOString(),
          lastAttemptedAt: new Date().toISOString(),
          lastError: null,
          itemCount: entries.length,
          countsByType
        },
        entries
      };

      writeDatabase(nextDb);
      logger('INFO', `Knowledge sync complete with ${entries.length} entries`);
      return buildSummary(nextDb);
    } catch (error) {
      const failedDb = readDatabase();
      writeDatabase({
        ...failedDb,
        meta: {
          ...failedDb.meta,
          syncInProgress: false,
          lastAttemptedAt: new Date().toISOString(),
          lastError: error.message
        }
      });
      logger('ERROR', `Knowledge sync failed: ${error.message}`);
      throw error;
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

function maybeScheduleBackgroundSync(db) {
  if (syncPromise) return;
  if (!db.entries.length || isStale(db.meta.lastSyncedAt)) {
    void syncKnowledgeBase({ force: false }).catch((error) => {
      logger('ERROR', `Background knowledge sync failed: ${error.message}`);
    });
  }
}

async function fetchCategoryEntries(category) {
  const results = [];
  const firstPage = await fetchCategoryPage(category, 0);
  const totalPages = Math.max(1, Number(firstPage.page?.totalPages) || 1);
  const targetPages = category.maxRecords ? Math.ceil(category.maxRecords / PAGE_SIZE) : totalPages;
  const pages = pickPageNumbers(totalPages, targetPages);

  for (const pageNumber of pages) {
    const json = pageNumber === 0 ? firstPage : await fetchCategoryPage(category, pageNumber);
    const list = Array.isArray(json[category.listKey]) ? json[category.listKey] : [];
    list.forEach((item) => {
      if (!category.maxRecords || results.length < category.maxRecords) {
        results.push(transformEntry(category, item));
      }
    });
    if (category.maxRecords && results.length >= category.maxRecords) break;
  }

  return results;
}

async function fetchCategoryPage(category, pageNumber) {
  const url = `https://stapi.co/api/v1/rest/${category.endpoint}/search?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Knowledge fetch failed for ${category.type} page ${pageNumber}: HTTP ${res.status}`);
  }
  return res.json();
}

function pickPageNumbers(totalPages, targetPages) {
  if (targetPages >= totalPages) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }
  if (targetPages <= 1) return [0];

  const pages = new Set();
  for (let index = 0; index < targetPages; index += 1) {
    const page = Math.round((index * (totalPages - 1)) / (targetPages - 1));
    pages.add(page);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function transformEntry(category, item) {
  const name = item.name || item.title || item.uid;
  const summary = buildEntrySummary(category.type, item);
  const detail = buildEntryDetail(category.type, item);
  const keywords = [
    name,
    item.title,
    item.series?.title,
    item.season?.title,
    item.gender,
    item.yearOfBirth,
    item.yearOfDeath,
    item.publishedYear,
    item.occupation?.name,
    item.body,
    item.header,
    item.type,
    item.warpCapable,
    item.operableSpacecraft
  ]
    .filter(Boolean)
    .map((value) => String(value));

  return {
    id: item.uid || `${category.type}-${name}`.toLowerCase().replace(/\s+/g, '-'),
    type: category.type,
    categoryLabel: category.label,
    name: String(name),
    subtitle: buildEntrySubtitle(category.type, item),
    summary,
    detail,
    keywords,
    updatedAt: new Date().toISOString()
  };
}

function buildEntrySubtitle(type, item) {
  if (type === 'episode') {
    const series = item.series?.title ? ` | ${item.series.title}` : '';
    return `Episode${series}`;
  }
  if (type === 'book') return item.referenceBook ? 'Reference Book' : 'Book';
  if (type === 'movie') return 'Feature Film';
  if (type === 'series') return 'Television Series';
  if (type === 'character') return item.gender ? `Character | ${item.gender}` : 'Character';
  if (type === 'spacecraft') return item.warpCapable ? 'Warp-Capable Spacecraft' : 'Spacecraft';
  return item.type ? String(item.type) : `${type[0].toUpperCase()}${type.slice(1)}`;
}

function buildEntrySummary(type, item) {
  if (type === 'character') {
    return compact([
      item.gender ? `${item.gender} character` : 'Character',
      item.yearOfBirth ? `born ${item.yearOfBirth}` : null,
      item.yearOfDeath ? `died ${item.yearOfDeath}` : null,
      item.placeOfBirth ? `from ${item.placeOfBirth}` : null
    ], '. ');
  }

  if (type === 'episode') {
    return compact([
      item.series?.title ? `${item.series.title}` : null,
      item.seasonNumber ? `Season ${item.seasonNumber}` : null,
      item.episodeNumber ? `Episode ${item.episodeNumber}` : null,
      item.productionSerialNumber ? `Production ${item.productionSerialNumber}` : null
    ], ' | ');
  }

  if (type === 'book') {
    return compact([
      item.publishedYear ? `Published ${item.publishedYear}` : null,
      item.numberOfPages ? `${item.numberOfPages} pages` : null,
      item.referenceBook ? 'Reference material' : null,
      item.novel ? 'Novel' : null
    ], ' | ');
  }

  if (type === 'series') {
    return compact([
      item.abbreviation ? `Abbreviation ${item.abbreviation}` : null,
      item.originalRunStartDate ? `Started ${item.originalRunStartDate}` : null,
      item.originalRunEndDate ? `Ended ${item.originalRunEndDate}` : null
    ], ' | ');
  }

  if (type === 'movie') {
    return compact([
      item.usReleaseDate ? `Released ${item.usReleaseDate}` : null,
      item.runtime ? `Runtime ${item.runtime} min` : null
    ], ' | ');
  }

  if (type === 'species') {
    return compact([
      item.name ? `${item.name}` : null,
      item.warpCapableSpecies ? 'warp-capable species' : 'species',
      item.extinctSpecies ? 'extinct' : null
    ], ' | ');
  }

  if (type === 'location') {
    return compact([
      item.earthLocation ? 'Earth location' : null,
      item.fictionalLocation ? 'fictional location' : null,
      item.mirror ? 'mirror universe' : null
    ], ' | ');
  }

  if (type === 'spacecraft') {
    return compact([
      item.spacecraftClass ? `Class ${item.spacecraftClass?.name || item.spacecraftClass}` : null,
      item.warpCapable ? 'warp capable' : null,
      item.registry ? `Registry ${item.registry}` : null
    ], ' | ');
  }

  if (type === 'organization') {
    return compact([
      item.government ? 'government organization' : null,
      item.militaryOrganization ? 'military' : null,
      item.medicalOrganization ? 'medical' : null
    ], ' | ');
  }

  if (type === 'weapon') {
    return compact([
      item.handHeldWeapon ? 'hand-held weapon' : null,
      item.energyWeapon ? 'energy weapon' : null,
      item.phaserWeapon ? 'phaser weapon' : null
    ], ' | ');
  }

  return compact(Object.values(item).slice(0, 4).map((value) => {
    if (value && typeof value === 'object') return value.name || value.title || null;
    return value;
  }), ' | ');
}

function buildEntryDetail(type, item) {
  const facts = [];

  if (type === 'character') {
    if (item.placeOfBirth) facts.push(`Birthplace: ${item.placeOfBirth}`);
    if (item.placeOfDeath) facts.push(`Place of death: ${item.placeOfDeath}`);
    if (item.maritalStatus) facts.push(`Status: ${item.maritalStatus}`);
  }

  if (type === 'episode') {
    if (item.season?.title) facts.push(`Season: ${item.season.title}`);
    if (item.productionSerialNumber) facts.push(`Production serial: ${item.productionSerialNumber}`);
  }

  if (type === 'book') {
    if (item.referenceBook) facts.push('Reference book');
    if (item.ebook) facts.push('Available as ebook');
  }

  if (type === 'location') {
    if (item.headquarters) facts.push('Contains headquarters activity');
    if (item.settlements?.length) facts.push(`Settlements tracked: ${item.settlements.length}`);
  }

  if (type === 'spacecraft') {
    if (item.registry) facts.push(`Registry: ${item.registry}`);
    if (item.operableSpacecraft === false) facts.push('Currently inoperable');
  }

  return facts.join(' | ');
}

function scoreEntry(entry, query) {
  const haystack = `${entry.name} ${entry.subtitle} ${entry.summary} ${entry.detail} ${entry.keywords.join(' ')}`.toLowerCase();
  if (!haystack.includes(query)) return 0;

  let score = 1;
  if (entry.name.toLowerCase() === query) score += 120;
  if (entry.name.toLowerCase().startsWith(query)) score += 80;
  if (entry.name.toLowerCase().includes(query)) score += 50;
  if (entry.summary.toLowerCase().includes(query)) score += 15;
  if (entry.keywords.some((word) => word.toLowerCase().includes(query))) score += 20;
  return score;
}

function isStale(lastSyncedAt) {
  if (!lastSyncedAt) return true;
  return Date.now() - new Date(lastSyncedAt).getTime() > STALE_MS;
}

function buildSummary(db) {
  return {
    schemaVersion: db.meta.schemaVersion,
    sourceName: db.meta.sourceName,
    sourceUrl: db.meta.sourceUrl,
    syncInProgress: Boolean(db.meta.syncInProgress),
    lastSyncedAt: db.meta.lastSyncedAt || null,
    lastAttemptedAt: db.meta.lastAttemptedAt || null,
    lastError: db.meta.lastError || null,
    itemCount: db.entries.length,
    countsByType: db.meta.countsByType || {},
    categories: CATEGORY_CONFIG.map((category) => ({
      type: category.type,
      label: category.label,
      count: db.meta.countsByType?.[category.type] || 0
    }))
  };
}

function readDatabase() {
  if (!databasePath || !fs.existsSync(databasePath)) {
    return emptyDatabase();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
    if (!parsed.meta || !Array.isArray(parsed.entries)) {
      return emptyDatabase();
    }
    return parsed;
  } catch (error) {
    logger('ERROR', `Failed reading knowledge database: ${error.message}`);
    return emptyDatabase();
  }
}

function writeDatabase(db) {
  const dir = path.dirname(databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(databasePath, JSON.stringify(db, null, 2), 'utf8');
}

function emptyDatabase() {
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      syncInProgress: false,
      lastSyncedAt: null,
      lastAttemptedAt: null,
      lastError: null,
      itemCount: 0,
      countsByType: {}
    },
    entries: []
  };
}

function compact(parts, joiner) {
  return parts.filter(Boolean).join(joiner);
}

module.exports = {
  initializeKnowledgeBase,
  getKnowledgeSummary,
  searchKnowledge,
  getRandomKnowledge,
  syncKnowledgeBase
};
