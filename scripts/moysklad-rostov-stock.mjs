import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Local, GET-only export of every sellable product physically available at
// «СтроякоV Склад Ростовское шоссе». The token never leaves this process.
const base = 'https://api.moysklad.ru/api/remap/1.2/';
const directory = 'private/moysklad';
const tokenPath = process.argv[2];
if (!tokenPath) throw new Error('Pass a local token file path.');
const token = (await readFile(tokenPath, 'utf8')).trim().replace(/^Bearer\s+/i, '');
if (!token || /\s/.test(token)) throw new Error('Expected a single token in the file.');

const scope = JSON.parse(await readFile(`${directory}/scope.json`, 'utf8'));
const salesSelection = JSON.parse(await readFile(`${directory}/catalog-frequency.json`, 'utf8'));
const store = scope.stores.find(item => item.name === 'СтроякоV Склад Ростовское шоссе');
if (!store) throw new Error('Rostovskoye Shosse store is missing from scope.');
const retailPriceType = 'Розница ЛАБ.';
const startedAt = new Date().toISOString();
const moment = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 19).replace('T', ' ');

async function get(resource, params = {}) {
  const url = new URL(resource, base);
  if (url.origin !== 'https://api.moysklad.ru' || !url.pathname.startsWith('/api/remap/1.2/')) throw new Error('Unexpected API origin.');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json;charset=utf-8', 'Accept-Encoding': 'gzip' },
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await response.body?.cancel();
      await new Promise(resolve => setTimeout(resolve, 1800 * (attempt + 1)));
      continue;
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`MoySklad HTTP ${response.status}; codes: ${(error.errors || []).map(item => item.code).join(',')}`);
    }
    return response.json();
  }
}

const stockRows = [];
for (let offset = 0, total = 1; offset < total;) {
  const filter = [`store=${base}entity/store/${store.id}`, 'stockMode=all', 'quantityMode=all', `moment=${moment}`].join(';');
  const page = await get('report/stock/all', { filter, groupBy: 'product', limit: 1000, offset });
  if (!Array.isArray(page.rows) || !Number.isInteger(page.meta?.size)) throw new Error('Unexpected stock report.');
  total = page.meta.size;
  stockRows.push(...page.rows);
  if (!page.rows.length && offset < total) throw new Error('Incomplete stock pagination.');
  offset += page.rows.length;
  console.log(`Stock report ${Math.min(offset, total)}/${total}`);
}

const selectedBySales = new Set(salesSelection.products.map(product => product.id));
const rowId = row => row.meta?.href ? new URL(row.meta.href).pathname.split('/').pop() : null;
const sellableRows = stockRows.filter(row => Number.isFinite(row.stock) && Number.isFinite(row.reserve) && row.stock - row.reserve > 0);
const catalogRows = stockRows.filter(row => row.stock - row.reserve > 0 || selectedBySales.has(rowId(row)));
const units = new Map();
const currencies = new Map();

async function mapLimit(items, limit, mapper) {
  const result = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      result[index] = await mapper(items[index], index);
      if ((index + 1) % 50 === 0) console.log(`Products refreshed ${index + 1}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return result;
}

const products = await mapLimit(catalogRows, 5, async row => {
  if (!row.meta?.href || !['product', 'variant'].includes(row.meta.type)) return null;
  const assortment = await get(row.meta.href);
  let current = assortment;
  let rawName = assortment.name;
  let code = assortment.code;
  let id = assortment.id;
  let entityType = assortment.meta?.type || row.meta.type;
  if (entityType === 'variant') {
    const parent = await get(assortment.product?.meta?.href);
    current = parent;
    rawName = [parent.name, assortment.name].filter(Boolean).join(' — ');
    code = assortment.code || parent.code;
    id = assortment.id;
  }
  const categoryPath = current.pathName || '';
  if (current.archived || /поликарбонат/i.test(`${rawName} ${categoryPath}`) || /(?:^|\/)ЛАБИНСК(?:\/|$)/i.test(categoryPath)) return null;

  const unitHref = current.uom?.meta?.href;
  if (unitHref && !units.has(unitHref)) {
    const unit = await get(unitHref);
    units.set(unitHref, { name: unit.name, description: unit.description || '' });
  }
  const prices = (current.salePrices || []).filter(price => price.priceType?.name === retailPriceType);
  if (prices.length > 1) throw new Error(`Ambiguous retail price for ${code}.`);
  const retail = prices[0];
  const currencyHref = retail?.currency?.meta?.href;
  if (currencyHref && !currencies.has(currencyHref)) {
    const currency = await get(currencyHref);
    currencies.set(currencyHref, { code: currency.code, isoCode: currency.isoCode, name: currency.name });
  }
  const currency = currencies.get(currencyHref);
  const isRub = currency && (currency.isoCode === 'RUB' || String(currency.code) === '643');
  return {
    id, code, entityType, rawName, archived: false, categoryPath,
    unit: units.get(unitHref) || null,
    retailPriceMinor: isRub && Number.isFinite(retail?.value) && retail.value > 0 ? retail.value : null,
    retailCurrency: currency || null, priceType: retailPriceType,
    stock: row.stock, reserve: row.reserve, selectedBySales: selectedBySales.has(rowId(row)),
    available: Math.max(0, Math.round((row.stock - row.reserve) * 1000000) / 1000000),
  };
});

const selected = products.filter(Boolean).sort((a, b) => b.available - a.available || a.rawName.localeCompare(b.rawName, 'ru'));
if (selected.some(product => !(product.available > 0 || product.selectedBySales))) throw new Error('Product outside stock and sales selection.');
await mkdir(directory, { recursive: true });
const snapshot = {
  startedAt, completedAt: new Date().toISOString(), stockMoment: moment,
  stores: [store], stockDefinition: 'single store; max(0, stock - reserve); incoming stock excluded',
  selectionDefinition: 'union of every positive available stock at Rostovskoye Shosse and products sold in at least five posted documents at Rostovskoye Shosse or TRANSIT; Labinsk excluded',
  products: selected,
};
await writeFile(`${directory}/catalog-snapshot.json`, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({
  reportRows: stockRows.length,
  positiveRows: sellableRows.length,
  salesRows: salesSelection.products.length,
  unionRows: catalogRows.length,
  selectedProducts: selected.length,
  excluded: catalogRows.length - selected.length,
  missingPrices: selected.filter(product => product.retailPriceMinor === null).length,
  dyybels: selected.filter(product => /дюбел/i.test(`${product.rawName} ${product.categoryPath}`)).length,
  spatulas: selected.filter(product => /шпател/i.test(`${product.rawName} ${product.categoryPath}`)).length,
  rollers: selected.filter(product => /валик/i.test(`${product.rawName} ${product.categoryPath}`)).length,
}, null, 2));
