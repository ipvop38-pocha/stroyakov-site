import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { calculateProductQuantity, productPriceText, productStockText } from '../app/lib/product-presentation.ts';
import { matchesProductSearch } from '../app/lib/product-search.ts';
import { classifyProduct, hiddenCatalogName } from './catalog-taxonomy.mjs';
const catalog = JSON.parse(await readFile('app/catalog/products.generated.json', 'utf8'));
const snapshot = JSON.parse(await readFile('private/moysklad/catalog-snapshot.json', 'utf8'));
assert.equal(snapshot.stores.length, 1, 'Only one warehouse may supply public stock');
assert.equal(snapshot.stores[0].name, 'СтроякоV Склад Ростовское шоссе');
assert.ok(catalog.products.length >= 254, 'Every sellable Rostovskoye Shosse product must be public');
assert.equal(catalog.hiddenOperationalItems, 1);
assert.equal(catalog.hiddenByPolicy, snapshot.products.filter(p => hiddenCatalogName.test(p.rawName)).length);
assert.equal(catalog.products.length, snapshot.products.length - catalog.hiddenOperationalItems - catalog.hiddenByPolicy);
assert.equal(catalog.products.some(product => product.code === '0545816227'), false, 'Delivery service must stay out of the product grid');
assert.ok(new Set(catalog.products.map(product => product.category)).size >= 10, 'Expanded category directory');
for (const product of catalog.products) {
  const current = snapshot.products.find(p => p.code === product.code);
  assert.ok(current, `Current warehouse product ${product.code}`);
  assert.ok(current.available > 0 || current.selectedBySales, 'Product must have Rostov stock or pass the two-store sales rule');
  assert.doesNotMatch(`${current.rawName} ${current.categoryPath}`, /поликарбонат|(?:^|\/)ЛАБИНСК(?:\/|$)/i);
  assert.equal(product.price, current.retailPriceMinor === null ? null : current.retailPriceMinor / 100);
  assert.equal(product.stock, Math.max(0, current.stock - current.reserve));
  assert.equal(matchesProductSearch(product, product.code), true);
  assert.ok(product.name.length <= 108, `Human title length: ${product.code}`);
  assert.ok(product.quickDescription);
  assert.ok(product.description);
  assert.ok(product.subgroup);
  if (product.image) await access('public' + product.image);
  assert.equal(hiddenCatalogName.test(current.rawName), false);
  for (const forbidden of ['profit','margin','salesMargin','sellCost','sellCostSum','saleCount','soldQuantity','salePrices','retailCurrency','reserve','token','href','categoryPath','sources']) assert.equal(forbidden in product, false, `Private field ${forbidden}`);
}
const taxonomyExamples = {
  '01959': ['Профили и комплектующие', 'Маяки ПВХ'],
  '00668': ['Профили и комплектующие', 'Уголки ПВХ'],
  '03245': ['Инструмент и расходники', 'Мешки'],
  '01411': ['Инструмент и расходники', 'Перчатки'],
  '03238': ['Инструмент и расходники', 'Валики'],
  '05458166415': ['Инструмент и расходники', 'Кисти'],
  '01968': ['Инструмент и расходники', 'Сетки и стеклохолст'],
  '01603': ['Инструмент и расходники', 'Ленты'],
  '00712': ['Инструмент и расходники', 'Сетки и стеклохолст'],
  '00757': ['Сухие смеси', 'Кладка и монтаж'],
  '00784': ['Сухие смеси', 'Наливные полы'],
  '00713': ['Сухие смеси', 'Монтажные клеи'],
  '00884': ['Сухие смеси', 'Кладка и монтаж'],
  '00912': ['Сухие смеси', 'Клеи для теплоизоляции'],
  '01085': ['Профили и комплектующие', 'Соединители и удлинители'],
  '05458164906': ['Профили и комплектующие', 'Соединители и удлинители'],
  '03255': ['Металлопрокат', 'Трубы'],
  '05458164938': ['Инструмент и расходники', 'Пистолеты для пены'],
  '02413': ['Пены и герметики', 'Пены-клеи'],
};
for (const [code, expected] of Object.entries(taxonomyExamples)) {
  const p = catalog.products.find(p => p.code === code);
  assert.deepEqual([p?.category, p?.subgroup], expected, `Taxonomy ${code}`);
  assert.equal(p.productKind, p.subgroup, `Card label ${code}`);
}
for (const rawName of ['Метла полипропиленовая', 'Веник СОРГО', 'Черенок деревянный', 'Черенки для лопат']) assert.equal(hiddenCatalogName.test(rawName), true);
assert.equal(classifyProduct({rawName:'Маяк ПВХ для штукатурки',categoryPath:'ШТУКАТУРКА'}).subgroup, 'Маяки ПВХ');
const merchandising = JSON.parse(await readFile('catalog/merchandising.json', 'utf8'));
assert.deepEqual(Object.keys(merchandising).sort(), ['featuredIds', 'rankedIds']);
assert.equal(merchandising.featuredIds.length, 4);
assert.equal(new Set(merchandising.rankedIds).size, merchandising.rankedIds.length);
for (const id of merchandising.featuredIds) {
  const p = catalog.products.find(p => p.id === id);
  assert.ok(p && p.stock > 0 && p.price > 0 && p.subgroup !== 'Саморезы');
}
const rusgips = catalog.products.find(p => p.code === '00876');
assert.ok(rusgips);
assert.equal(rusgips.name, 'Штукатурка гипсовая Русгипс №6 МН, 30 кг');
assert.deepEqual(rusgips.companionIds, ['00971','00859','00668']);
assert.ok(catalog.products.some(product => product.code === '01060' && matchesProductSearch(product, 'шпаклевка сатинтек')));
assert.ok(catalog.products.some(product => product.code === '00140' && matchesProductSearch(product, 'пгв 12,5')));
assert.equal(catalog.products.find(product => product.code === '01680')?.subgroup, 'Саморезы');
assert.match(catalog.products.find(product => product.code === '01769')?.name || '', /с саморезом/i);
assert.equal(catalog.products.filter(product => /дюбел/i.test(`${product.name} ${product.searchAliases?.join(' ')}`)).length, 8, 'All eight stocked dowel SKUs');
assert.ok(catalog.products.filter(product => /шпател/i.test(`${product.name} ${product.searchAliases?.join(' ')}`)).length >= 13, 'All stocked spatulas');
assert.ok(catalog.products.filter(product => /валик/i.test(`${product.name} ${product.searchAliases?.join(' ')}`)).length >= 4, 'All stocked or proven-demand rollers');
for (const query of ['русгипс 6', 'rusgips штукатурка 30', 'штукатурка машинная', '00876']) assert.ok(matchesProductSearch(rusgips, query), query);
assert.equal(matchesProductSearch(rusgips, 'русгипс 8'), false);
assert.equal(calculateProductQuantity(rusgips.calculator, 100, 10, 10), 33);
assert.equal(calculateProductQuantity(rusgips.calculator, 100, 10, 20), 66);
assert.equal(calculateProductQuantity(rusgips.calculator, 100, 10, 51), null);
assert.equal(calculateProductQuantity(rusgips.calculator, 100, 10, NaN), null);
assert.equal(calculateProductQuantity({ type: 'sheet', area: 3 }, 12, 10, 10), 5);
assert.equal(calculateProductQuantity(undefined, 12, 10, 10), null);
assert.equal(calculateProductQuantity(rusgips.calculator, 0, 10, 10), null);
assert.equal(productPriceText(null), 'Цена по запросу');
assert.equal(productStockText({ stock: null, unit: 'мешок' }), 'Наличие уточняется');
assert.equal(productStockText({ stock: 0, unit: 'мешок' }), 'Под заказ');
assert.equal(productStockText({ stock: 513, unit: 'мешок' }), 'В наличии: 513 мешков');
console.log(`Catalog verified: ${catalog.products.length} physical products from Rostovskoye Shosse; retail prices, privacy, optional assets, search and quantity calculation.`);
