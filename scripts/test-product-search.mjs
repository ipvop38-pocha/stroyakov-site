import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogSearchShortcuts, matchesProductSearch } from '../app/lib/product-search.ts';

const moisture = { name: 'Гипсокартон влагостойкий Danogips 2500×1200×12,5 мм', brand: 'DANOGIPS', code: '00140', searchAliases: ['ПГВ', 'ГКЛВ'] };
const standard = { name: 'Гипсокартон обычный Danogips 2500×1200×12,5 мм', searchAliases: ['ПГО'] };
const putty = { name: 'Шпаклёвка гипсовая Сатентек, 20 кг', searchAliases: ['Гипс выравнивающий 20кг Сатинтек'] };
for (const query of ['ПГВ', 'гклв', 'даногипс влагостойкий', '2500х1200 12.5', 'ПГВ 12,5', 'гипсокартн', '00140', '   ']) assert.equal(matchesProductSearch(moisture, query), true, query);
for (const query of ['ПГВ 9,5', 'ПГО', '00141', '12,7', 'краска', '???']) assert.equal(matchesProductSearch(moisture, query), false, query);
assert.equal(matchesProductSearch(standard, 'ПГВ'), false);
assert.equal(matchesProductSearch(standard, 'гкл'), true);
for (const query of ['сатинтек', 'шпатлевка сатентек', 'гипс выравнивающий', 'satentek 20']) assert.equal(matchesProductSearch(putty, query), true, query);
console.log('Product search: 20 checks passed.');

const products = JSON.parse(readFileSync(new URL('../app/catalog/products.generated.json', import.meta.url), 'utf8')).products;
const categories = [{ name: 'Гипсокартон и листовые', slug: 'drywall' }, { name: 'Сухие смеси', slug: 'mixes' }, { name: 'Цемент', slug: 'cement' }];
for (const [query, expectedKind, expectedName] of [
  ['шифер', 'group', 'Шифер'], ['русгипс', 'brand', 'РУСГИПС'], ['rusgips', 'brand', 'РУСГИПС'],
  ['даногипс', 'brand', 'DANOGIPS'], ['рокс', 'brand', 'ROKS'], ['кнауф', 'brand', 'KNAUF'],
  ['сухие смеси', 'category', 'Сухие смеси'], ['цемент', 'category', 'Цемент'],
]) {
  const [first] = catalogSearchShortcuts(products, categories, query);
  assert.equal(first?.kind, expectedKind, query);
  assert.equal(first?.name, expectedName, query);
  const url = new URL(first.href, 'https://example.test');
  assert.equal(url.hash, '#products');
  assert.equal(url.searchParams.has('q'), false, 'Shortcut must not retain a narrowing text query');
  const category = categories.find(item => item.slug === url.searchParams.get('category'));
  const shown = products.filter(product => (!category || product.category === category.name) &&
    (!url.searchParams.has('group') || product.subgroup === url.searchParams.get('group')) &&
    (!url.searchParams.has('brand') || product.brand === url.searchParams.get('brand')));
  assert.equal(shown.length, first.count, query);
  assert.ok(shown.length > 0, query);
}
for (const query of ['', '?', 'я', 'несуществующийбренд', 'русгипс 25', '00140']) assert.deepEqual(catalogSearchShortcuts(products, categories, query), [], query);
assert.equal(catalogSearchShortcuts(products, categories, 'цемент').filter(item => item.name === 'Цемент').length, 1, 'No duplicate category/subgroup link');
assert.ok(catalogSearchShortcuts(products, categories, 'клей').every(item => item.kind !== 'brand'), 'Product words must not suggest unrelated brands');
console.log('Catalog shortcuts: actual groups, brands, aliases, complete counts, URLs and unrelated queries passed.');
