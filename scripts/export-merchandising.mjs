import { readFile, writeFile } from 'node:fs/promises';
const report = JSON.parse(await readFile('private/moysklad/profit-report.json', 'utf8'));
const { products } = JSON.parse(await readFile('app/catalog/products.generated.json', 'utf8'));
const expectedStores = JSON.parse(await readFile('private/moysklad/catalog-sales-scope.json', 'utf8')).stores.map(s => s.id).sort();
if (JSON.stringify(report.reports.map(r => r.store.id).sort()) !== JSON.stringify(expectedStores)) throw new Error('Profit report warehouse scope differs from the approved sales scope');
if (report.from !== '2026-03-01' || report.to !== '2026-08-31') throw new Error('Unexpected sales period');
const profits = new Map();
for (const { rows } of report.reports) for (const row of rows) {
  if (!Number.isFinite(row.profit)) throw new Error('Missing profit data');
  const code = row.assortment?.code;
  if (code) profits.set(code, (profits.get(code) || 0) + row.profit);
}
const ranked = products.filter(p => profits.has(p.code)).sort((a,b) => profits.get(b.code) - profits.get(a.code) || a.code.localeCompare(b.code));
const featured = ranked.filter(p => profits.get(p.code) > 0 && p.stock > 0 && p.price > 0 && p.subgroup !== 'Саморезы').slice(0,4);
if (featured.length !== 4) throw new Error('Not enough eligible featured products');
// Only identifiers and their display order may enter the public build.
await writeFile('catalog/merchandising.json', JSON.stringify({ rankedIds: ranked.map(p => p.code), featuredIds: featured.map(p => p.code) }, null, 2) + '\n');
console.log(JSON.stringify({rankedProducts: ranked.length, featured: featured.map(p => ({code: p.code, name:p.name}))}));
