import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { productFacets, matchesFacets, facetDefinitions, availableFacets, readFacetSelection } from '../app/lib/catalog-facets.ts';

const { products } = JSON.parse(await readFile('app/catalog/products.generated.json', 'utf8'));
const item = id => products.find(product => product.id === id);
const plaster = products.filter(product => product.subgroup === 'Штукатурки');
const match = selection => plaster.filter(product => matchesFacets(productFacets(product), selection));
assert.deepEqual(productFacets(item('00876')).application, ['Машинное']);
assert.deepEqual(productFacets(item('00895')).application, ['Ручное']);
assert.deepEqual(productFacets(item('01076')).application, ['Ручное', 'Машинное']);
assert.deepEqual(productFacets(item('05458164740')).base, ['Цементно-гипсовая']);
assert.equal(productFacets(item('00810')).base, undefined, 'A facade name alone does not prove the binder');
assert.ok(match({ base: ['Гипсовая'], application: ['Машинное'] }).some(product => product.id === '00876'));
assert.ok(!match({ base: ['Гипсовая'], application: ['Машинное'] }).some(product => product.id === '00895'));
assert.ok(match({ application: ['Ручное', 'Машинное'] }).length > match({ application: ['Машинное'] }).length);
const definitions = facetDefinitions('Сухие смеси', 'Штукатурки');
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
  ['00141', 'thickness', '9,5'], ['03227', 'thickness', '15'], ['00592', 'profileSize', '50 × 50'],
  ['00833', 'thickness', '0,5'], ['03236', 'profileSize', '100 × 40'], ['01959', 'thickness', '6'],
  ['03302', 'thickness', '30'], ['03233', 'thickness', '100'], ['00971', 'purpose', 'Глубокого проникновения'],
  ['00712', 'purpose', 'Стеклохолст'], ['00712', 'density', '35'], ['00730', 'width', '52'],
  ['01940', 'material', 'ПВХ-покрытие'], ['03240', 'length', '200'], ['01076', 'base', 'Цементная'],
]) assert.ok(productFacets(item(id))[property]?.includes(expected), `${id}: ${property} must include ${expected}`);
for (const product of products) {
  const selection = productFacets(product);
  assert.ok(matchesFacets(selection, {}), 'No filters retains every product, including unknown properties');
  assert.ok(matchesFacets(selection, selection));
}
console.log('Catalog facets: property evidence, combined selection, dynamic counts, URL validation and 330 products passed.');
