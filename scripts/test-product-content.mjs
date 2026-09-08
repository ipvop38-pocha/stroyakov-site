import assert from 'node:assert/strict';
import fs from 'node:fs';
import { productAnalogs, areProductAnalogs } from '../app/lib/product-analogs.ts';

const data=JSON.parse(fs.readFileSync('app/catalog/products.generated.json','utf8'));
const products=data.products;
const byCode=code=>products.find(p=>p.code===code);
const details=JSON.parse(fs.readFileSync('catalog/manufacturer-details.json','utf8')).products;
const groups=new Set();
for(const product of products){
  groups.add(product.subgroup);
  const text=[product.quickDescription,product.description,...product.applicationNotes,...product.specs.flat()].join('\n');
  assert(!/позиция раздела|Товар из раздела|Поможем проверить назначение|undefined|NaN|ЧИТАТЬ ПОЛНОСТЬЮ|МЕРЫ ПРЕДОСТОРОЖНОСТИ|Сопутствующие товары|\u000e/.test(text),product.code+' contains placeholder or extraction noise');
  assert(product.quickDescription.length>20 && product.description.length>55,product.code+' missing meaningful copy');
  assert(product.applicationNotes.length>0,product.code+' missing application guidance');
  assert.equal(new Set(product.specs.map(([key])=>key)).size,product.specs.length,product.code+' duplicate specification');
  assert(product.specs.every(row=>row.length===2&&row.every(value=>typeof value==='string'&&value.trim())),product.code+' invalid specs');
  assert(!product.specs.flat().includes('Требует уточнения'),product.code+' unconfirmed property asserted as specification');
  const analogs=productAnalogs(product,products);
  assert(analogs.length<=4);
  assert.equal(new Set(analogs.map(p=>p.id)).size,analogs.length);
  assert(analogs.every(p=>p.id!==product.id&&p.subgroup===product.subgroup));
  for(const document of product.documents){
    const url=new URL(document.url);
    assert.equal(url.protocol,'https:');
    assert(/\.pdf$/i.test(url.pathname));
    assert(!/cookie|policy|privacy|soglasie|согласие|Положение ПД/i.test(decodeURI(url.pathname)),'Unrelated document');
  }
}
assert.equal(products.length,427);
assert.equal(groups.size,64);
assert(areProductAnalogs(byCode('00810'),byCode('01072')),'Verified cement-lime exterior plaster alternative');
assert(!areProductAnalogs(byCode('00810'),byCode('00876')),'Do not replace facade cement-lime plaster with gypsum');
assert(!areProductAnalogs(byCode('00897'),byCode('00756')),'Decorative bark-beetle finish is not levelling plaster');
assert(!areProductAnalogs(byCode('00592'),byCode('00862')),'Do not substitute thinner profile');
assert(!areProductAnalogs(byCode('01680'),byCode('01705')),'Fastener length matters');
assert(!areProductAnalogs(byCode('00758'),byCode('00759')),'Unknown adhesive classes do not establish compatibility');
assert.equal(productAnalogs(byCode('00810'),products).length,1,'Sparse analog row stays sparse');
assert.equal(productAnalogs(byCode('00866'),products).length,0,'No filler products for standalone items');
assert(byCode('00702').specs.some(([label,value])=>label==='Основа'&&value==='Гипсополимерная'));
assert.deepEqual(byCode('00952').facets.packing,['20 кг']);
assert(!byCode('01083').specs.some(([label])=>/Адгезия|Расход|Открытое время/.test(label)),'Do not copy current K80 recipe into legacy Litoflex K80');
assert(!byCode('00814').specs.some(([label])=>/толщина слоя/i.test(label)),'Conflicting IS screed thickness withheld');
assert(byCode('03301').specs.some(([label,value])=>label.includes('10%')&&value.includes('130')));
assert(byCode('03304').specs.some(([label,value])=>label.includes('10%')&&value.includes('150')));
assert(byCode('0545816465').specs.some(([label,value])=>label==='Плит в упаковке'&&value==='8'));
assert(byCode('05458165492').specs.some(([label,value])=>label==='Плотность'&&value==='50 кг/м³'));
assert(byCode('05458165492').documents.some(d=>d.url.endsWith('izolife_st_50_optima.pdf')),'Current ST50 document verified despite legacy page URL');
assert(byCode('0545816466').documents.some(d=>d.url.endsWith('izolife_l_35_optima.pdf')),'Current L35 Optima document');
assert.equal(byCode('05458165163').name,'Мыло жидкое для рук, 5 л');
assert.deepEqual(byCode('05458164865').facets.packing,['1000 г']);
assert(byCode('00924').specs.some(([label])=>label.includes('среднее испытанное')),'Average adhesion is not a guaranteed minimum');
assert(details['01040'].unresolvedSpecs.some(s=>s.includes('Адгезия')));

if(process.argv.includes('--html')){
 for(const product of products){
  const html=fs.readFileSync(`out/product/${product.slug}/index.html`,'utf8');
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,product.code+' H1 count');
  for(const id of ['description','specifications','documents'])assert(html.includes(`id="${id}"`),product.code+' missing section '+id);
  assert(html.includes(product.code));
  assert(!html.includes('позиция раздела'));
  const expected=productAnalogs(product,products).length;
  assert.equal(html.includes('id="analogs"'),expected>0,product.code+' analog section');
  for(const [label] of product.specs)assert(html.includes(label.replace(/&/g,'&amp;').replace(/"/g,'&quot;')),product.code+' missing SSR specification '+label);
 }
}
console.log(`Product content: ${products.length} pages / ${groups.size} groups; factual coverage, sparse analogs, sources, packing, uncertainty and ${process.argv.includes('--html')?'all static pages':'data'} verified.`);
