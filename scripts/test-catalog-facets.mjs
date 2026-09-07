import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assertFacetCoverage } from './catalog-facet-coverage.mjs';
import { productFacets, matchesFacets, facetDefinitions, availableFacets, readFacetSelection } from '../app/lib/catalog-facets.ts';

const { products } = JSON.parse(await readFile('app/catalog/products.generated.json', 'utf8'));
const item = id => products.find(product => product.id === id);
const plaster = products.filter(product => product.subgroup === 'Штукатурки');
const match = selection => plaster.filter(product => matchesFacets(productFacets(product), selection));
const facts = JSON.parse(await readFile('catalog/product-facts.json', 'utf8')).products;
assert.equal(plaster.length, 24);
for (const product of plaster) assertFacetCoverage(product, facts[product.id]);
const complete = plaster[0];
for (const key of ['base', 'application']) {
  for (const invalid of [undefined, [], ['Не определено']]) {
    assert.throws(() => assertFacetCoverage({ ...complete, facets: { ...complete.facets, [key]: invalid } }, facts[complete.id]), /Incomplete catalog facets/);
  }
}
assert.throws(() => assertFacetCoverage(complete, {}), /Missing manufacturer evidence/);
for (const code of ['00907', '01051', '01057']) {
  assert.deepEqual(productFacets(item(code)).base, ['Гипсовая']);
  assert.deepEqual(productFacets(item(code)).application, ['Ручное']);
}
assert.deepEqual(productFacets(item('01072')).base, ['Цементно-известковая']);
assert.deepEqual(productFacets(item('01072')).application, ['Ручное', 'Машинное']);
assert.deepEqual(productFacets(item('01055')).base, ['Цементная']);
assert.deepEqual(productFacets(item('01055')).application, ['Ручное', 'Машинное']);
assert.deepEqual(productFacets(item('00876')).application, ['Машинное']);
assert.deepEqual(productFacets(item('00895')).application, ['Ручное', 'Машинное']);
assert.deepEqual(productFacets(item('05458164740')).base, ['Цементно-гипсовая']);
assert.deepEqual(productFacets(item('00810')).base, ['Цементно-известковая']);
assert.deepEqual(productFacets(item('00734')).base,['Гипсополимерная']);
assert.deepEqual(productFacets(item('00911')).base,['Гипсополимерная']);
assert.deepEqual(productFacets(item('05458166006')).base,['Гипсополимерная']);
assert.deepEqual(productFacets(item('00727')).base,['Полимерная']);
assert.deepEqual(productFacets(item('00733')).base,['Цементно-полимерная']);
assert.deepEqual(productFacets(item('01163')).purpose,['Выравнивающая'],'Finish in a name does not prove finishing purpose');
assert.deepEqual(productFacets(item('00734')).application,['Ручное'],'Machine sanding does not imply machine application');
assert.deepEqual(productFacets({...item('00911'),name:'Товар без указания состава'}),productFacets(item('00911')));
assert.deepEqual(productFacets({name:'Гипсовая штукатурка машинного нанесения'}),{},'Names cannot invent properties');
assert.ok(match({ base: ['Гипсовая'], application: ['Машинное'] }).some(product => product.id === '00876'));
assert.ok(match({ base: ['Гипсовая'], application: ['Машинное'] }).some(product => product.id === '00895'));
assert.ok(match({ application: ['Ручное', 'Машинное'] }).length > match({ application: ['Машинное'] }).length);
const definitions = facetDefinitions('Сухие смеси', 'Штукатурки');
const allFacets = availableFacets(plaster, definitions, {});
assert.equal(allFacets.find(facet => facet.id === 'base').options.reduce((sum, option) => sum + option.count, 0), plaster.length);
for (const key of ['base', 'application']) {
  const options = allFacets.find(facet => facet.id === key).options;
  const covered = new Set(options.flatMap(option => match({ [key]: [option.value] }).map(product => product.id)));
  assert.equal(covered.size, plaster.length, `${key} must cover every plaster, counting overlapping options only once`);
}
const facets = availableFacets(plaster, definitions, { base: ['Гипсовая'] });
assert.equal(facets.find(facet => facet.id === 'application').options.find(option => option.value === 'Машинное').count,
  match({ base: ['Гипсовая'], application: ['Машинное'] }).length);
const inStock = plaster.filter(product => product.stock > 0);
const stockFacets = availableFacets(plaster, definitions, {}, inStock);
assert.equal(stockFacets.find(facet => facet.id === 'base').options.find(option => option.value === 'Гипсовая').count,
  inStock.filter(product => productFacets(product).base?.includes('Гипсовая')).length);
assert.deepEqual(readFacetSelection(new URLSearchParams('f_base=Гипсовая&f_base=Гипсовая&f_base=Несуществующая&f_length=25'), facets), { base: ['Гипсовая'] });
for (const [id, property, expected] of [
  ['00140', 'sheetType', 'Влагостойкий'], ['00142', 'sheetType', 'Обычный'], ['0545816231', 'sheetType', 'Огнестойкий'],
  ['00711','sheetType','Обычный'],
  ['00141', 'thickness', '9,5'], ['03227', 'thickness', '15'], ['00592', 'profileSize', '50 × 50'],
  ['00833', 'thickness', '0,5'], ['03236', 'profileSize', '100 × 40'], ['01959', 'thickness', '6'],
  ['03302', 'thickness', '30'], ['03233', 'thickness', '100'], ['00971', 'purpose', 'Глубокого проникновения'],
  ['00712', 'purpose', 'Стеклохолст'], ['00712', 'density', '35'], ['00730', 'width', '52'],
  ['01940', 'material', 'ПВХ-покрытие'], ['03240', 'length', '200'],
  ['00062','profileSize','40 × 20'], ['00062','thickness','2'], ['00062','stockLength','6'],
]) assert.ok(productFacets(item(id))[property]?.includes(expected), `${id}: ${property} must include ${expected}`);
for (const product of products) {
  const selection = productFacets(product);
  assert.ok(matchesFacets(selection, {}), 'No filters retains every product, including unknown properties');
  assert.ok(matchesFacets(selection, selection));
}
console.log(`Catalog facets: official composition, name independence, combined selection, dynamic counts, URLs and ${products.length} products passed.`);
