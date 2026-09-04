import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Server-side/local GET-only export. Never import into the browser application.
const base = 'https://api.moysklad.ru/api/remap/1.2/';
const directory = 'private/moysklad';
const tokenPath = process.argv[2];
if (!tokenPath) throw new Error('Pass a local token file path.');
const token = (await readFile(tokenPath, 'utf8')).trim().replace(/^Bearer\s+/i, '');
if (!token || /\s/.test(token)) throw new Error('Expected a single token in the file.');
const selection = JSON.parse(await readFile(`${directory}/catalog-frequency.json`, 'utf8'));
const policy = JSON.parse(await readFile(`${directory}/catalog-policy.json`, 'utf8'));
const scope = JSON.parse(await readFile(`${directory}/scope.json`, 'utf8'));
if (scope.stores.length !== policy.stores.length || scope.stores.some(s => !policy.stores.includes(s.name))) throw new Error('Store scope mismatch.');
const startedAt = new Date().toISOString();
const moment = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 19).replace('T', ' ');

async function get(resource, params = {}) {
  const url = new URL(resource, base);
  if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/api/remap/1.2/')) throw new Error('Unexpected API origin.');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(45000), headers: { Authorization: `Bearer ${token}`, Accept: 'application/json;charset=utf-8', 'Accept-Encoding': 'gzip' } });
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await response.body?.cancel();
      await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      continue;
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`MoySklad HTTP ${response.status}; codes: ${(error.errors || []).map(e => e.code).join(',')}`);
    }
    return response.json();
  }
}

const units = new Map();
const currencies = new Map();
const products = [];
for (const selected of selection.products) {
  if (selected.saleCount < policy.minimumDistinctSaleDocuments || /поликарбонат/i.test(`${selected.name} ${selected.categoryPath}`)) throw new Error('Invalid selection.');
  const current = await get(selected.href);
  if (current.id !== selected.id || current.code !== selected.code) throw new Error('Product identity changed.');
  const unitHref = current.uom?.meta?.href;
  if (unitHref && !units.has(unitHref)) {
    const unit = await get(unitHref);
    units.set(unitHref, { name: unit.name, description: unit.description || '' });
  }
  const prices = (current.salePrices || []).filter(p => p.priceType?.name === policy.retailPriceType);
  if (prices.length > 1) throw new Error('Ambiguous retail price.');
  const retail = prices[0];
  const currencyHref = retail?.currency?.meta?.href;
  if (currencyHref && !currencies.has(currencyHref)) {
    const currency = await get(currencyHref);
    currencies.set(currencyHref, { code: currency.code, isoCode: currency.isoCode, name: currency.name });
  }
  const currency = currencies.get(currencyHref);
  const isRub = currency && (currency.isoCode === 'RUB' || String(currency.code) === '643');
  products.push({
    id: current.id, code: current.code, rawName: current.name, archived: !!current.archived,
    categoryPath: current.pathName || '', unit: units.get(unitHref) || null,
    retailPriceMinor: isRub && Number.isFinite(retail?.value) && retail.value > 0 ? retail.value : null,
    retailCurrency: currency || null, priceType: policy.retailPriceType,
    stock: null, reserve: null, available: null,
  });
  if (products.length % 40 === 0) console.log(`Refreshed ${products.length}/${selection.products.length} product prices and units`);
}

const byId = new Map(products.map(p => [p.id, p]));
for (let start = 0; start < products.length; start += 30) {
  const batch = products.slice(start, start + 30);
  const filter = [
    ...scope.stores.map(s => `store=${base}entity/store/${s.id}`),
    ...batch.map(p => `product=${base}entity/product/${p.id}`),
    'stockMode=all', 'quantityMode=all', `moment=${moment}`,
  ].join(';');
  const report = await get('report/stock/all', { filter, groupBy: 'product', limit: 1000 });
  if (!Array.isArray(report.rows) || report.rows.length !== report.meta.size) throw new Error('Unexpected stock report pagination.');
  for (const row of report.rows) {
    const id = row.meta?.href ? new URL(row.meta.href).pathname.split('/').pop() : null;
    const product = byId.get(id);
    if (!product || !batch.some(p => p.id === id)) throw new Error(`Unrequested product in stock report: ${JSON.stringify({ code: row.code, meta: row.meta })}`);
    if (!Number.isFinite(row.stock) || !Number.isFinite(row.reserve)) throw new Error('Missing stock/reserve fields.');
    product.stock = row.stock;
    product.reserve = row.reserve;
    // "quantity" also includes inbound stock. Only physical, unreserved stock is sellable now.
    product.available = Math.max(0, Math.round((row.stock - row.reserve) * 1000000) / 1000000);
  }
  console.log(`Stock checked ${Math.min(start + 30, products.length)}/${products.length}`);
}
await mkdir(directory, { recursive: true });
const snapshot = { startedAt, completedAt: new Date().toISOString(), stockMoment: moment, stores: scope.stores, stockDefinition: 'max(0, stock - reserve); incoming stock excluded', products };
await writeFile(`${directory}/catalog-snapshot.json`, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ products: products.length, missingPrices: products.filter(p => p.retailPriceMinor === null).length, unknownStock: products.filter(p => p.stock === null).length, available: products.filter(p => p.available > 0).length, units: [...units.values()] }));
