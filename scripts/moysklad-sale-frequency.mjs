import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Offline output only. One sale = one distinct posted demand/retaildemand document.
const base = 'https://api.moysklad.ru/api/remap/1.2/';
const root = path.resolve('private/moysklad');
const token = (await readFile(process.argv[2], 'utf8')).trim().replace(/^Bearer\s+/i, '');
if (!token || /\s/.test(token)) throw new Error('Invalid token file format');
const scope = JSON.parse(await readFile(path.join(root, 'scope.json'), 'utf8'));
const audit = JSON.parse(await readFile(path.join(root, 'catalog-audit.json'), 'utf8'));
const from = '2026-03-01 00:00:00';
const until = '2026-09-01 00:00:00';
const minSales = 5;
const cacheDir = path.join(root, 'sale-documents');
await mkdir(cacheDir, { recursive: true });

async function get(resource, params = {}) {
  const url = new URL(resource, base);
  if (url.origin !== 'https://api.moysklad.ru' || !url.pathname.startsWith('/api/remap/1.2/')) throw new Error('Invalid API origin');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(60000), headers: { Authorization: `Bearer ${token}`, Accept: 'application/json;charset=utf-8', 'Accept-Encoding': 'gzip' } });
    if ((response.status === 429 || response.status >= 500) && attempt < 3) { await response.body?.cancel(); await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1))); continue; }
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(`MoySklad HTTP ${response.status}; codes ${(body.errors || []).map(e => e.code).join(',')}`); }
    return response.json();
  }
}

const byProduct = new Map();
const variants = new Map();
const seenDocs = new Set();
const documentTotals = [];
let duplicateRows = 0;
let extendedPositionPages = 0;

async function productHref(assortment) {
  if (['product', 'bundle'].includes(assortment?.meta?.type)) return assortment.meta.href;
  if (assortment?.meta?.type !== 'variant') return null;
  if (!variants.has(assortment.meta.href)) {
    const variant = await get(assortment.meta.href);
    if (!variant.product?.meta?.href) throw new Error('Variant parent missing');
    variants.set(assortment.meta.href, variant.product.meta.href);
  }
  return variants.get(assortment.meta.href);
}

try {
  for (const store of scope.stores) {
    for (const type of ['demand', 'retaildemand']) {
      let offset = 0;
      let total = 0;
      do {
        const cachePath = path.join(cacheDir, `${store.id}-${type}-${offset}.json`);
        let saved;
        if (process.argv.includes('--resume')) saved = await readFile(cachePath, 'utf8').then(JSON.parse).catch(() => null);
        if (!saved) {
          const page = await get(`entity/${type}`, { filter: `moment>=${from};moment<${until};applicable=true;store=${base}entity/store/${store.id}`, expand: 'positions', limit: 100, offset, order: 'moment, id' });
          if (!Array.isArray(page.rows) || !Number.isInteger(page.meta?.size)) throw new Error('Invalid document collection');
          const documents = [];
          for (const doc of page.rows) {
            if (!doc.applicable || doc.moment < from || doc.moment >= until || doc.store?.meta?.href !== `${base}entity/store/${store.id}`) throw new Error('Document outside requested scope');
            const positions = [...(doc.positions?.rows || [])];
            const count = doc.positions?.meta?.size;
            if (!Number.isInteger(count)) throw new Error('Missing positions count');
            while (positions.length < count) {
              const extra = await get(doc.positions.meta.href, { limit: 1000, offset: positions.length });
              if (!extra.rows?.length) throw new Error('Incomplete document positions');
              positions.push(...extra.rows); extendedPositionPages++;
            }
            const items = new Map();
            for (const p of positions) {
              if (!(p.quantity > 0)) continue;
              const href = await productHref(p.assortment);
              if (!href) continue;
              if (items.has(href)) duplicateRows++;
              items.set(href, (items.get(href) || 0) + p.quantity);
            }
            // No names, contacts, addresses, prices or customer data from documents are saved.
            documents.push({ id: doc.id, type, moment: doc.moment, items: [...items].map(([href, quantity]) => ({ href, quantity })) });
          }
          saved = { from, until, total: page.meta.size, rowsRead: page.rows.length, documents };
          await writeFile(cachePath, JSON.stringify(saved));
        }
        if (saved.from !== from || saved.until !== until) throw new Error('Cached period mismatch');
        total = saved.total;
        for (const doc of saved.documents) {
          const docKey = `${doc.type}/${doc.id}`;
          if (seenDocs.has(docKey)) throw new Error('Repeated sale document across pages');
          seenDocs.add(docKey);
          for (const item of doc.items) {
            const record = byProduct.get(item.href) || { saleCount: 0, quantity: 0 };
            record.saleCount++;
            record.quantity += item.quantity;
            byProduct.set(item.href, record);
          }
        }
        if (!saved.rowsRead && offset < total) throw new Error('Incomplete document pagination');
        offset += saved.rowsRead;
        console.log(JSON.stringify({ store: store.name, type, processed: offset, total }));
      } while (offset < total);
      documentTotals.push({ store: store.name, type, count: total });
    }
  }
  const products = audit.products.map(p => {
    const frequency = byProduct.get(p.href) || { saleCount: 0, quantity: 0 };
    const retail = p.salePrices.find(price => price.priceType === 'Розница ЛАБ.');
    return { ...p, saleCount: frequency.saleCount, documentQuantity: frequency.quantity, retailPriceMinor: retail?.value > 0 ? retail.value : null, retailPriceType: 'Розница ЛАБ.', quantityMatchesPriorReport: Math.abs(frequency.quantity - p.soldQuantity) < 0.00001 };
  });
  const selected = products.filter(p => p.saleCount >= minSales).sort((a,b) => b.saleCount - a.saleCount);
  const belowThreshold = products.filter(p => p.saleCount < minSales);
  const summary = { from, untilExclusive: until, minSales, definition: 'distinct posted demand/retaildemand documents, duplicate lines in one document count once, variants aggregated to parent product', sourceProducts: products.length, selectedProducts: selected.length, belowThreshold: belowThreshold.length, withoutRetailPrice: selected.filter(p => p.retailPriceMinor === null).length, withImages: selected.filter(p => p.imagesCount > 0).length, quantityMismatches: products.filter(p => !p.quantityMatchesPriorReport).length, duplicateRowsCollapsed: duplicateRows, extendedPositionPages, documents: documentTotals };
  await writeFile(path.join(root, 'catalog-frequency.json'), JSON.stringify({ summary, products: selected, belowThreshold }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error(error.message.startsWith('MoySklad HTTP') ? error.message : `Frequency audit failed: ${error.message.replaceAll(token, '[redacted]')}`);
  process.exitCode = 1;
}
