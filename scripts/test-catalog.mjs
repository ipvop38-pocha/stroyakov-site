import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { calculateProductQuantity, productPriceText, productStockText } from '../app/lib/product-presentation.ts';
import { matchesProductSearch } from '../app/lib/product-search.ts';
import { classifyProduct, hiddenCatalogName } from './catalog-taxonomy.mjs';
import { catalogInventory } from './catalog-inventory.mjs';
const catalog = JSON.parse(await readFile('app/catalog/products.generated.json', 'utf8'));
const snapshot = JSON.parse(await readFile('private/moysklad/catalog-snapshot.json', 'utf8'));
const labinsk = JSON.parse(await readFile('private/moysklad/labinsk-metal-snapshot.json', 'utf8'));
const inventory = catalogInventory(snapshot, labinsk);
assert.equal(snapshot.stores.length, 1, 'Rostov scope remains separate');
assert.equal(snapshot.stores[0].name, 'СтроякоV Склад Ростовское шоссе');
assert.ok(catalog.products.length >= 254, 'Every sellable Rostovskoye Shosse product must be public');
assert.equal(catalog.hiddenOperationalItems, 1);
assert.equal(catalog.hiddenByPolicy, snapshot.products.filter(p => hiddenCatalogName.test(p.rawName)).length);
assert.equal(catalog.products.length, inventory.products.length);
assert.equal(catalog.products.filter(p=>p.stockLocation==='Лабинск · Родина').length, labinsk.products.filter(p=>!hiddenCatalogName.test(p.rawName)).length);
assert.equal(catalog.products.some(p=>p.code==='03260'),false,'Unidentified steel blank removed');
assert.throws(()=>catalogInventory(snapshot,{...labinsk,stores:[{name:'Другой склад'}]}),/Unexpected warehouse/);
assert.throws(()=>catalogInventory(snapshot,{...labinsk,products:[{...labinsk.products[0],categoryPath:'Другая группа'}]}),/Outside Labinsk/);
assert.throws(()=>catalogInventory(snapshot,{...labinsk,products:[{...labinsk.products[0],code:snapshot.products[0].code}]}),/overlap/);
assert.equal(catalog.products.some(product => product.code === '0545816227'), false, 'Delivery service must stay out of the product grid');
assert.ok(new Set(catalog.products.map(product => product.category)).size >= 10, 'Expanded category directory');
for (const product of catalog.products) {
  const current = inventory.products.find(p => p.code === product.code);
  assert.ok(current, `Current warehouse product ${product.code}`);
  assert.ok(current.available > 0 || current.selectedBySales, 'Product must have Rostov stock or pass the two-store sales rule');
  assert.doesNotMatch(`${current.rawName} ${current.categoryPath}`, /поликарбонат|(?:^|\/)ЛАБИНСК(?:\/|$)/i);
  assert.equal(product.price, current.retailPriceMinor === null ? null : current.retailPriceMinor / 100);
  assert.equal(product.stock, Math.max(0, current.stock - current.reserve));
  assert.equal(product.stockLocation,current.stockLocation);
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
  '01968': ['Сетки и ленты', 'Сетки и стеклохолст'],
  '01603': ['Сетки и ленты', 'Ленты'],
  '00712': ['Сетки и ленты', 'Сетки и стеклохолст'],
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
assert.equal(rusgips.name, 'Штукатурка Русгипс №6 гипсовая, 30 кг');
assert.deepEqual(rusgips.companionIds, ['00971','00859','00668']);
assert.ok(catalog.products.some(product => product.code === '01060' && matchesProductSearch(product, 'шпаклевка сатинтек')));
assert.ok(catalog.products.some(product => product.code === '00140' && matchesProductSearch(product, 'пгв 12,5')));
assert.equal(catalog.products.find(product => product.code === '01680')?.subgroup, 'Саморезы');
assert.match(catalog.products.find(product => product.code === '01769')?.name || '', /Дюбель-гвоздь.*6×40 мм, 200 шт/i);
for(const code of ['00833','00842','00848','00834']) assert.equal(catalog.products.find(p=>p.code===code).brand,'ЕП');
for(const code of ['03255','00062','01633','03247','03248','00861']) assert.equal(catalog.products.find(p=>p.code===code).brand,'');
assert.equal(catalog.products.find(p=>p.code==='03246').brand,'PROFF-СТАЛЬ','A warehouse folder must not override the actual brand');
assert.match(catalog.products.find(p=>p.code==='00054').name,/11,7 м$/,'Diameter must not be mistaken for stock length');
assert.match(catalog.products.find(p=>p.code==='00425').name,/6 м$/);
assert.match(catalog.products.find(p=>p.code==='00424').name,/А240С/);
assert.match(catalog.products.find(p=>p.code==='0545816414').name,/12 м$/);
assert.deepEqual(catalog.products.find(p=>p.code==='00866').facets.packing,['25 кг'],'Gypsum grade Г-5 Г-6 must not become a 5 g package');
assert.equal(catalog.products.find(p=>p.code==='05458166168').name,'Катанка в прутках, Ø6,5 мм');
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
console.log(`Catalog verified: ${catalog.products.length} physical products, scoped Labinsk metal, retail prices, privacy, names, brands, search and quantity calculation.`);
