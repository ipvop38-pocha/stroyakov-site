import { readFile, writeFile, mkdir } from 'node:fs/promises';

// GET-only addition explicitly requested for metal assortment at Rodina, Labinsk.
const base = 'https://api.moysklad.ru/api/remap/1.2/';
const token = (await readFile(process.argv[2], 'utf8')).trim().replace(/^Bearer\s+/i, '');
if (!token || /\s|[^\x21-\x7e]/.test(token)) throw new Error('Expected one ASCII token.');
async function get(resource, params = {}) {
  const url = new URL(resource, base);
  if (url.origin !== 'https://api.moysklad.ru' || !url.pathname.startsWith('/api/remap/1.2/')) throw new Error('Unexpected API origin.');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  for (let attempt=0; attempt<6; attempt++) {
    await new Promise(resolve=>setTimeout(resolve,400));
    const response = await fetch(url, { method:'GET', redirect:'error', signal:AbortSignal.timeout(45000), headers:{Authorization:`Bearer ${token}`,Accept:'application/json;charset=utf-8','Accept-Encoding':'gzip'} });
    if ((response.status===429 || response.status>=500) && attempt<5) {
      await response.body?.cancel();
      await new Promise(resolve=>setTimeout(resolve,5000*(attempt+1)));
      continue;
    }
    if (!response.ok) throw new Error(`MoySklad HTTP ${response.status}`);
    return response.json();
  }
}
async function all(resource, params = {}) {
  const rows=[];
  for (let offset=0;;) {
    const page=await get(resource,{...params,limit:1000,offset});
    if (!Array.isArray(page.rows) || !Number.isInteger(page.meta?.size)) throw new Error('Unexpected collection');
    rows.push(...page.rows); offset+=page.rows.length;
    if (offset>=page.meta.size) return rows;
    if (!page.rows.length) throw new Error('Incomplete collection');
  }
}
const stores=await all('entity/store');
const store=stores.find(item=>item.name==='Основной склад Лабинск Родина');
if (!store) throw new Error('Exact store not found');
const moment=new Date(Date.now()+3*3600000).toISOString().slice(0,19).replace('T',' ');
const rows=await all('report/stock/all',{filter:`store=${store.meta.href};stockMode=all;quantityMode=all;moment=${moment}`,groupBy:'product'});
const positive=rows.filter(row=>Number.isFinite(row.stock)&&Number.isFinite(row.reserve)&&row.stock-row.reserve>0);
const products=[], units=new Map(), currencies=new Map();
// Match the complete product collection by ID and folder, including unusual warehouse abbreviations.
const inventory=await all('entity/product',{filter:'archived=false'});
const entityKey=href=>{const url=new URL(href);return url.origin+url.pathname;};
const byHref=new Map(inventory.map(product=>[entityKey(product.meta.href),product]));
const candidates=positive.filter(row=>row.meta?.type==='variant'||/^\(В\) МЕТАЛЛ(?:\/|$)/u.test(byHref.get(entityKey(row.meta.href))?.pathName||''));
if (!candidates.length) throw new Error('Empty metal scope: refusing to replace the snapshot');
console.log(JSON.stringify({store:store.name,candidates:candidates.length}));
for (const row of candidates) {
  if (!['product','variant'].includes(row.meta?.type)) continue;
  const assortment=byHref.get(entityKey(row.meta.href))||await get(row.meta.href);
  const parent=assortment.meta.type==='variant'?(byHref.get(entityKey(assortment.product.meta.href))||await get(assortment.product.meta.href)):assortment;
  if (parent.archived || /поликарбонат/i.test(`${parent.name} ${parent.pathName}`) || !/^\(В\) МЕТАЛЛ(?:\/|$)/u.test(parent.pathName||'')) continue;
  const unitHref=parent.uom?.meta?.href;
  if (unitHref && !units.has(unitHref)) { const unit=await get(unitHref); units.set(unitHref,{name:unit.name,description:unit.description||''}); }
  const prices=(parent.salePrices||[]).filter(price=>price.priceType?.name==='Розница ЛАБ.');
  if (prices.length>1) throw new Error('Ambiguous retail price');
  const retail=prices[0], currencyHref=retail?.currency?.meta?.href;
  if (currencyHref && !currencies.has(currencyHref)) { const c=await get(currencyHref); currencies.set(currencyHref,{code:c.code,isoCode:c.isoCode,name:c.name}); }
  const currency=currencies.get(currencyHref), rub=currency&&(currency.isoCode==='RUB'||String(currency.code)==='643');
  products.push({id:assortment.id,code:assortment.code||parent.code,entityType:assortment.meta.type,rawName:assortment.meta.type==='variant'?`${parent.name} — ${assortment.name}`:parent.name,archived:false,categoryPath:parent.pathName||'',unit:units.get(unitHref)||null,retailPriceMinor:rub&&Number.isFinite(retail?.value)&&retail.value>0?retail.value:null,retailCurrency:currency||null,priceType:'Розница ЛАБ.',stock:row.stock,reserve:row.reserve,available:Math.max(0,Math.round((row.stock-row.reserve)*1e6)/1e6),selectedBySales:false,article:parent.article||'',description:parent.description||'',attributes:(parent.attributes||[]).filter(a=>/бренд|производ|марка|серия/i.test(a.name||'')).map(a=>({name:a.name,value:typeof a.value==='string'?a.value:a.value?.name||null}))});
}
await mkdir('private/moysklad',{recursive:true});
await writeFile('private/moysklad/labinsk-metal-snapshot.json',JSON.stringify({completedAt:new Date().toISOString(),stockMoment:moment,stores:[{id:store.id,name:store.name}],selectionDefinition:'Positive available stock in metal folders only; other Labinsk goods excluded',products},null,2)+'\n');
console.log(JSON.stringify({store:store.name,reportRows:rows.length,candidates:candidates.length,metalProducts:products.length,missingPrices:products.filter(p=>p.retailPriceMinor===null).length}));
