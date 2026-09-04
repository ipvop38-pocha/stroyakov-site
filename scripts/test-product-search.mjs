import assert from 'node:assert/strict';
import { matchesProductSearch } from '../app/lib/product-search.ts';

const moisture = { name: 'Гипсокартон влагостойкий Danogips 2500×1200×12,5 мм', brand: 'DANOGIPS', code: '00140', searchAliases: ['ПГВ', 'ГКЛВ'] };
const standard = { name: 'Гипсокартон обычный Danogips 2500×1200×12,5 мм', searchAliases: ['ПГО'] };
const putty = { name: 'Шпаклёвка гипсовая Сатентек, 20 кг', searchAliases: ['Гипс выравнивающий 20кг Сатинтек'] };
for (const query of ['ПГВ', 'гклв', 'даногипс влагостойкий', '2500х1200 12.5', 'ПГВ 12,5', 'гипсокартн', '00140', '   ']) assert.equal(matchesProductSearch(moisture, query), true, query);
for (const query of ['ПГВ 9,5', 'ПГО', '00141', '12,7', 'краска', '???']) assert.equal(matchesProductSearch(moisture, query), false, query);
assert.equal(matchesProductSearch(standard, 'ПГВ'), false);
assert.equal(matchesProductSearch(standard, 'гкл'), true);
for (const query of ['сатинтек', 'шпатлевка сатентек', 'гипс выравнивающий', 'satentek 20']) assert.equal(matchesProductSearch(putty, query), true, query);
console.log('Product search: 20 checks passed.');
