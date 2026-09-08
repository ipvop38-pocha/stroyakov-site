import assert from 'node:assert/strict';
import fs from 'node:fs';
import schema from '../catalog/facet-schema.json' with {type:'json'};
import facts from '../catalog/selection-facts.json' with {type:'json'};
import {completeSelectionFacets,UNCONFIRMED,selectionCoverageReport} from './catalog-selection-coverage.mjs';
import {selectionInventoryFacets} from './catalog-selection-facets.mjs';
import {productFacets,brandFilterValue,availableFacets,facetDefinitions,matchesFacets,readFacetSelection} from '../app/lib/catalog-facets.ts';
const ps=JSON.parse(fs.readFileSync('app/catalog/products.generated.json','utf8')).products;
const item=code=>ps.find(p=>p.code===code);
for (const code of ['01048','01050','01047']) assert.deepEqual(item(code).facets.sheetSize,['2500 × 1200']);
for (const code of ['0545816327','0545816328']) assert.deepEqual(item(code).facets.thickness,['2']);
assert.deepEqual(item('03255').facets.stockLength,['6']);
for (const code of ['00861','01662','01549']) assert.deepEqual(item(code).facets.stockLength,['3']);
for (const code of ['01680','01705']) {
 assert.deepEqual(item(code).facets.diameter,['3,5']);
 assert.deepEqual(item(code).facets.fastenerType,['TN']);
}
assert.deepEqual(item('02089').facets.season,['Всесезонная']);
for (const code of ['02597','03133','02297','03247','03240']) {
 assert.deepEqual(item(code).facets.packing,['Поштучно']);
 assert.equal(item(code).unit,'шт.','Retail price and quantity must remain per piece');
}
assert.equal(ps.length,427);
assert.deepEqual(item('03251').facets.material,['Полиакрил']);
const meshes=ps.filter(p=>p.subgroup==='Сетки и стеклохолст');
const meshDefs=facetDefinitions('Сетки и ленты','Сетки и стеклохолст');
const meshOptions=availableFacets(meshes,meshDefs,{});
const sharedMeshes=meshes.filter(p=>matchesFacets(p.facets,{purpose:['Штукатурная / фасадная']}));
assert.deepEqual(new Set(sharedMeshes.map(p=>p.code)),new Set(['01858','01968','03254','01561','03218','01684','03232']));
assert.equal(sharedMeshes.filter(p=>matchesFacets(p.facets,{density:['160']})).length,2,'Density must still narrow the combined group');
for(const oldValue of ['Фасадная сетка','Штукатурная сетка']) assert.deepEqual(readFacetSelection(new URLSearchParams({f_purpose:oldValue}),meshOptions),{purpose:['Штукатурная / фасадная']},'Saved mesh filter links remain usable');
assert.ok(meshDefs.find(f=>f.id==='purpose').help.includes('подтверждена производителем'));
assert.deepEqual(new Set(ps.map(p=>p.subgroup)),new Set(Object.keys(schema.groups)),'Every existing subgroup has a reviewed schema');
for(const [group,keys] of Object.entries(schema.groups)){
 const members=ps.filter(p=>p.subgroup===group);const defs=facetDefinitions(members[0].category,group);
 assert.deepEqual(defs.map(d=>d.id),keys.map(k=>k === "tileFormat" ? "tileSize_indoor" : k));
 for(const key of keys){
  assert.ok(members.every(p=>Array.isArray(p.facets[key])&&p.facets[key].length),`${group}/${key}: no silent omissions`);
  const all=availableFacets(members,defs,{});const facet=all.find(f=>f.id===key);if(!facet)continue;
  const covered=new Set(facet.options.flatMap(o=>members.filter(p=>matchesFacets(p.facets,{[key]:[o.value]})).map(p=>p.id)));
  assert.equal(covered.size,members.length,`${group}/${key}: all members remain reachable`);
  for(const o of facet.options)assert.equal(o.count,members.filter(p=>matchesFacets(p.facets,{[key]:[o.value]})).length);
 }
}
assert.throws(()=>completeSelectionFacets({code:'NEW',subgroup:'Трубы',facets:{}},new Set()),/Unreviewed missing/);
assert.throws(()=>completeSelectionFacets({code:'NEW',subgroup:'Плиточные клеи',facets:{adhesiveClass:['C1']}},new Set()),/Missing manufacturer evidence/);
assert.throws(()=>completeSelectionFacets({code:'NEW',subgroup:'Новая категория',facets:{}},new Set()),/Unreviewed catalog subgroup/);
assert.equal(selectionCoverageReport(ps).groups.flatMap(g=>g.properties.flatMap(p=>p.missing)).length,0);
for(const p of ps.filter(p=>p.subgroup==='Минеральная вата'))assert.ok(['50','100'].includes(p.facets.thickness[0]));
for(const [code,key,value] of [['00913','adhesiveClass','C2'],['00885','adhesiveClass','C2TE'],['01068','adhesiveClass','C0T'],['00661','adhesiveClass','C1'],['0545658','adhesiveClass','C1T'],['00809','mixType','ЦПС (цементно-песчаная смесь)'],['03218','meshCell','5 × 5'],['03232','density',UNCONFIRMED],['03234','width','300'],['03224','boreDiameter','22,2'],['0545816412','diameter','2'],['00431','nominalDiameter','15'],['00436','diameter','57'],['01885','volume','20'],['03221','packing','200 шт.'],['01062','layerRange','20–200']])assert.ok(item(code).facets[key].includes(value),`${code}/${key}`);
const tiles=ps.filter(p=>p.subgroup==='Плиточные клеи');const defs=facetDefinitions('Сухие смеси','Плиточные клеи');
assert.ok(!defs.some(f=>f.id==='purpose'),'Tile filtering prioritizes manufacturer class and format');
const filtered=tiles.filter(p=>matchesFacets(p.facets,{adhesiveClass:['C2T','C2TE']}));
assert.ok(filtered.some(p=>p.code==='00948')&&filtered.some(p=>p.code==='00943'));
assert.ok(!filtered.some(p=>p.facets.adhesiveClass.includes(UNCONFIRMED)));
const roundtrip={adhesiveClass:['C2TE'],tileSize_indoor:['160 × 160']};
const params=new URLSearchParams();for(const[k,vs]of Object.entries(roundtrip))for(const v of vs)params.append('f_'+k,v);
assert.deepEqual(readFacetSelection(params,availableFacets(tiles,defs,roundtrip)),roundtrip);
assert.deepEqual(tiles.filter(p=>matchesFacets(productFacets(p),roundtrip)).map(p=>p.code),['00943']);
assert.ok(!item('01083').facets.adhesiveClass.includes('C2E'),'New K80 properties must not be silently assigned to old Litoflex stock');
assert.deepEqual(selectionInventoryFacets({name:'Клей C2 120×120',subgroup:'Плиточные клеи',category:'Сухие смеси'}),{},'Chemical class and tile compatibility cannot be extracted from names');
assert.ok(facts.products['00172'].sources.some(s=>s.url.endsWith('/docs/catalog.pdf')&&s.scope.includes('tileFormat')));
assert.equal(brandFilterValue({brand:''}),'Бренд не указан');
assert.equal(brandFilterValue({brand:'ЕП'}),'ЕП');
for(const context of ['indoor','outdoorWall','outdoorFloor']){
 const key='tileSize_'+context;const facet=availableFacets(tiles,facetDefinitions('Сухие смеси','Плиточные клеи',context),{}).find(f=>f.id===key);
 const covered=new Set(facet.options.flatMap(o=>tiles.filter(p=>matchesFacets(productFacets(p),{[key]:[o.value]})).map(p=>p.code)));
 assert.equal(covered.size,tiles.length,'Every product remains reachable in every installation context');
}
assert.ok(productFacets(item('00738')).tileSize_indoor.includes('60 × 60'));
assert.ok(!productFacets(item('00738')).tileSize_outdoorWall.includes('60 × 60'),'Indoor allowance must not leak into facade selection');
assert.ok(!productFacets(item('00738')).tileSize_outdoorFloor.includes('45 × 45'));
assert.ok(productFacets(item('0545658')).tileSize_indoor.includes('60 × 120'));
assert.ok(!productFacets(item('0545658')).tileSize_outdoorFloor.includes('60 × 120'));
assert.ok(!productFacets(item('0545658')).tileSize_indoor.includes('120 × 120'),'Rectangle limits cannot be replaced with area equivalence');
assert.ok(productFacets(item('00943')).tileSize_indoor.includes('60 × 60'),'Adhesives with a larger allowed maximum also match a smaller target tile');
assert.ok(!productFacets(item('00816')).tileSize_indoor.includes('45 × 45'));
assert.ok(productFacets(item('00172')).tileSize_indoor.includes('45 × 45'));
console.log(`All ${Object.keys(schema.groups).length} groups / ${ps.length} products: filter coverage, evidence guards, dimensions and combined URLs passed.`);
