import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Read-only audit. Never import this module from the application.
const base = 'https://api.moysklad.ru/api/remap/1.2/';
const target = path.resolve('private/moysklad');
const tokenFile = process.argv[2];
if (!tokenFile) throw new Error('Pass the path to a local token file.');
const token = (await readFile(tokenFile, 'utf8')).trim().replace(/^Bearer\s+/i, '');
if (!token || /\s/.test(token)) throw new Error('The token file must contain a single token.');
const from = '2026-03-01 00:00:00';
const to = '2026-08-31 23:59:59';
const storeNames = ['СтроякоV Склад Ростовское шоссе', 'ТРАНЗИТ', 'Основной склад Лабинск Родина'];

async function get(resource, params = {}) {
  const url = new URL(resource, base);
  if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/api/remap/1.2/')) {
    throw new Error('Refusing an API URL outside MoySklad.');
  }
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${token}`, 'Accept-Encoding': 'gzip', Accept: 'application/json;charset=utf-8' },
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await response.body?.cancel();
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      continue;
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`MoySklad HTTP ${response.status}; API codes: ${(body.errors || []).map(e => e.code).join(',')}`);
    }
    return response.json();
  }
}

async function all(resource, params = {}) {
  const rows = [];
  for (let offset = 0; ; ) {
    const page = await get(resource, { ...params, limit: '1000', offset: String(offset) });
    if (!Array.isArray(page.rows)) throw new Error('Unexpected API collection.');
    rows.push(...page.rows);
    offset += page.rows.length;
    if (!page.rows.length || offset >= page.meta.size) return rows;
  }
}

async function save(name, data) {
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, name), JSON.stringify(data, null, 2) + '\n');
}

try {
  const stores = await all('entity/store');
  const chosen = storeNames.map(name => stores.find(s => s.name.trim().toLowerCase() === name.toLowerCase()));
  if (chosen.some(s => !s)) {
    console.log(JSON.stringify({ missingStores: storeNames.filter((_, i) => !chosen[i]), availableStoreNames: stores.map(s => s.name) }));
    throw new Error('Exact store selection needs review.');
  }
  await save('scope.json', { from, to, timezone: 'Europe/Moscow', stores: chosen.map(s => ({ id: s.id, name: s.name })), exclude: 'поликарбонат in name, category or parent category', source: 'report/profit/byproduct; sellQuantity > 0' });
  console.log(JSON.stringify({ connection: 'ok', selectedStores: chosen.map(s => s.name), otherStoresExcluded: stores.length - chosen.length }));
  if (process.argv.includes('--probe')) process.exit(0);

  const combined = new Map();
  for (const store of chosen) {
    const rows = await all('report/profit/byproduct', { momentFrom: from, momentTo: to, filter: `store=${store.meta.href}` });
    for (const row of rows) {
      if (!(row.sellQuantity > 0)) continue;
      const a = row.assortment;
      if (!['product', 'bundle'].includes(a?.meta?.type)) continue;
      const key = a.meta.href;
      const existing = combined.get(key) || { href: key, type: a.meta.type, name: a.name, code: a.code, soldQuantity: 0, returnedQuantity: 0, stores: [] };
      existing.soldQuantity += row.sellQuantity;
      existing.returnedQuantity += row.returnQuantity || 0;
      existing.stores.push(store.name);
      combined.set(key, existing);
    }
    console.log(JSON.stringify({ store: store.name, reportRows: rows.length }));
  }
  // Persist only needed quantities and catalogue identifiers, never profit/cost/customer data.
  await save('sold-candidates.json', [...combined.values()]);
  const accepted = [];
  const excluded = [];
  for (const row of combined.values()) {
    if (/поликарбонат/i.test(row.name)) { excluded.push({ name: row.name, reason: 'name' }); continue; }
    const p = await get(row.href);
    if (/поликарбонат/i.test(`${p.name} ${p.pathName || ''}`)) { excluded.push({ name: p.name, pathName: p.pathName, reason: 'name/category' }); continue; }
    accepted.push({ ...row, id: p.id, article: p.article || '', categoryPath: p.pathName || '', archived: !!p.archived, description: p.description || '', imagesCount: p.images?.meta?.size || 0, attributesCount: p.attributes?.length || 0, salePrices: (p.salePrices || []).filter(price => !/себестоим|закуп/i.test(price.priceType?.name || '')).map(price => ({ value: price.value, priceType: price.priceType?.name, currencyHref: price.currency?.meta?.href })), uomHref: p.uom?.meta?.href || null, variantsCount: p.variantsCount || 0 });
    if (accepted.length % 50 === 0) console.log(JSON.stringify({ productsRead: accepted.length }));
  }
  accepted.sort((a, b) => b.soldQuantity - a.soldQuantity);
  const categoryCounts = {};
  for (const p of accepted) categoryCounts[p.categoryPath || '(без группы)'] = (categoryCounts[p.categoryPath || '(без группы)'] || 0) + 1;
  const summary = { from, to, selectedStores: chosen.map(s => s.name), soldCandidates: combined.size, excludedPolycarbonate: excluded.length, selectedProducts: accepted.length, archived: accepted.filter(p => p.archived).length, withImages: accepted.filter(p => p.imagesCount > 0).length, withDescription: accepted.filter(p => p.description).length, withAttributes: accepted.filter(p => p.attributesCount > 0).length, priceTypes: [...new Set(accepted.flatMap(p => p.salePrices.map(price => price.priceType)))], categoryCounts };
  await save('catalog-audit.json', { summary, products: accepted, excluded });
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  // Do not print response bodies, request headers, credentials or full error objects.
  console.error(error.message.includes('MoySklad HTTP') || error.message.includes('selection') ? error.message : `Audit failed: ${error.name}`);
  process.exitCode = 1;
}
