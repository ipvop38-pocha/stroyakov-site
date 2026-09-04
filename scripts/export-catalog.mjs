import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const [selection, snapshot, editorial] = await Promise.all([
  read('private/moysklad/catalog-frequency.json'),
  read('private/moysklad/catalog-snapshot.json'),
  read('catalog/editorial.json'),
]);
const selected = new Map(selection.products.map(p => [p.code, p]));
const current = new Map(snapshot.products.map(p => [p.code, p]));
const output = [];
for (const entry of editorial.filter(p => p.status === 'published')) {
  const original = selected.get(entry.code);
  const live = current.get(entry.code);
  if (!original || !live || live.id !== original.id || original.saleCount < 5) throw new Error(`Invalid selection: ${entry.code}`);
  if (/поликарбонат/i.test(`${live.rawName} ${live.categoryPath}`) || live.archived) throw new Error(`Excluded product: ${entry.code}`);
  if (!live.unit || !['шт', 'шт.', 'лист', 'лист.', 'меш', 'меш.', 'мешок'].includes(live.unit.name)) throw new Error(`Review sale unit: ${entry.code}`);
  if (!entry.image?.startsWith('/assets/products/') || !entry.name || !entry.description || !entry.specs?.length) throw new Error(`Incomplete editorial entry: ${entry.code}`);
  const asset = path.resolve('public', '.' + entry.image);
  if (!asset.startsWith(path.resolve('public/assets/products') + path.sep)) throw new Error('Invalid image path.');
  await access(asset);
  // Deliberate allowlist. Raw sales, costs, account details and tokens never enter application data.
  output.push({
    id: entry.code, code: entry.code, slug: entry.slug, brand: entry.brand, name: entry.name,
    category: entry.category, unit: entry.unit, image: entry.image, photoStyle: entry.photoStyle,
    stock: live.available, price: live.retailPriceMinor === null ? null : live.retailPriceMinor / 100,
    popularity: selection.products.length - selection.products.findIndex(p => p.code === entry.code),
    searchAliases: [...new Set([...(entry.searchAliases || []), live.rawName])],
    description: entry.description, specs: entry.specs, sources: entry.sources || [],
    ...(entry.variantGroup ? { variantGroup: entry.variantGroup, variantLabel: entry.variantLabel } : {}),
    ...(entry.calculator ? { calculator: entry.calculator } : {}),
  });
}
if (new Set(output.map(p => p.slug)).size !== output.length || new Set(output.map(p => p.id)).size !== output.length) throw new Error('Duplicate product routes or ids.');
output.sort((a,b) => b.popularity - a.popularity);
await writeFile('app/catalog/products.generated.json', JSON.stringify({ updatedAt: snapshot.completedAt, stockMoment: snapshot.stockMoment, products: output }, null, 2) + '\n');
const published = new Set(output.map(p => p.code));
const queue = selection.products.filter(p => !published.has(p.code)).map(p => ({
  code: p.code, id: p.id, originalName: p.name, categoryPath: p.categoryPath,
  saleCount: p.saleCount, retailPrice: current.get(p.code)?.retailPriceMinor === null ? null : current.get(p.code)?.retailPriceMinor / 100,
  unit: current.get(p.code)?.unit?.name, available: current.get(p.code)?.available,
  needs: ['Редактура названия', 'Источник характеристик', 'Описание', 'Оригинал фото производителя', 'Фото в утверждённом стиле', ...(current.get(p.code)?.retailPriceMinor === null ? ['Уточнить розничную цену'] : [])],
}));
await writeFile('private/moysklad/editorial-queue.json', JSON.stringify({ updatedAt: snapshot.completedAt, totalSelected: selection.products.length, published: output.length, remaining: queue.length, products: queue }, null, 2) + '\n');
console.log(JSON.stringify({ published: output.length, inEditorialQueue: queue.length, missingRetailPrices: snapshot.products.filter(p => p.retailPriceMinor === null).length }));
