import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { classifyProduct } from './catalog-taxonomy.mjs';
import { catalogInventory } from './catalog-inventory.mjs';
import { inventoryPresentation, tidyTitle } from './catalog-presentation.mjs';
import { inventoryFacets } from './catalog-inventory-facets.mjs';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const [snapshot, editorial] = await Promise.all([
  read('private/moysklad/catalog-snapshot.json'),
  read('catalog/editorial.json'),
]);
const curated = new Map(editorial.filter(product => product.status === 'published').map(product => [product.code, product]));
const merchandising = await read('catalog/merchandising.json');
const labinsk = await read('private/moysklad/labinsk-metal-snapshot.json');
const facts = (await read('catalog/product-facts.json')).products;
const titles = await read('catalog/title-overrides.json');
const selection = catalogInventory(snapshot, labinsk);
const popularity = new Map(merchandising.rankedIds.map((code, index) => [code, merchandising.rankedIds.length - index]));
function brandFor(product) {
  const text = product.name;
  const brands = [
    ['DANOGIPS', /DANOGIPS|ДАНОГИПС/i], ['РУСГИПС', /РУСГИПС/i], ['SATENTEK', /САТ[ЕИ]НТЕ[КК]|SATENTEK/i],
    ['ПЕНОПЛЭКС', /ПЕНОПЛЭКС/i], ['KNAUF', /КНАУФ|KNAUF/i], ['CERESIT', /ЦЕРЕЗИТ|CERESIT/i],
    ['ВОЛМА', /ВОЛМА/i], ['ОСНОВИТ', /ОСНОВИТ/i], ['ХАБЕЗ', /ХАБЕЗ/i], ['LITOKOL', /ЛИТОКОЛ|LITOKOL/i],
    ['KRATEX', /КРАТЭКС|KRATEX/i], ['IZOLIFE', /ИЗОЛАЙФ|IZOLIFE/i], ['ROKS', /РОКС/i],
    ['ЕС', /ЕС-СМЕСИ|(?<![а-я])ЕС(?![а-я])/iu], ['ИС', /ИС-СМЕСИ|(?<![а-я])ИС[- ]/iu], ['МТ', /МТ-ПРОФИЛЬ|(?<![а-я])МТ(?![а-я])/iu],
    ['ЕП', /(?<![а-я])ЕП(?![а-я])/iu],
    ['ULTRADECOR', /ULTRADECOR/i], ['X-GLASS', /X-\s*Glass/i], ['СТАЛЬНОФФ', /Стальнофф/i],
    ['САМИКС', /САМИКС/i], ['НОВОКОЛОР', /НОВОКОЛОР/i], ['TECH-KREP', /Tech-KREP/i],
    ['DERZHI', /DERZHI/i], ['BIBER', /БИБЕР|BIBER/i], ['КРАТОН', /КРАТОН/i], ['ARMSTRONG', /Armstrong/i],
    ['MAXITOOL', /MAXI\s*TOOL/i], ['ТЕХНОНИКОЛЬ', /ТЕХНОНИКОЛЬ/i],
    ['PROFF-СТАЛЬ', /Proff-Сталь/i], ['KOLOTEK', /Kolotek/i], ['PROFFIT', /PROFFIT/i],
    ['BASTION-PRO', /Bastion-PRO/i], ['REFIT', /REFIT/i], ['FOMERON', /FOMERON/i], ['ПЕНОК', /ПенОК/i],
    ['ИНТЕК', /Интек/i], ['BELTEX', /BELTEX/i], ['НАМЕРЕНИЕ', /Намерение/i],
    ['ЦЕМРОС', /Цемрос/i], ['ВБЦЗ', /ВБЦЗ/i],
  ];
  return brands.find(([, pattern]) => pattern.test(text))?.[0] || '';
}

function unitFor(product, category) {
  const api = product.unit?.name?.toLowerCase();
  if (api === 'шт' || api === 'шт.') {
    if (/superfinish|готов|гот\.|kleifix|эпоксид|затирк/iu.test(product.rawName)) return 'шт.';
    if (category === 'Сухие смеси' || category === 'Цемент') return 'мешок';
    if (category === 'Гипсокартон и листовые') return 'лист';
    return 'шт.';
  }
  const units = { 'упак': 'упаковка', 'упак.': 'упаковка', 'уп': 'упаковка', 'пара': 'пара', 'м': 'м', 'кг': 'кг', 'м2': 'м²', 'рул': 'рулон', 'т': 'т', 'пог. м': 'пог. м' };
  return units[api] || product.unit?.name || 'шт.';
}

function slugFor(code, title) {
  const translit = title.toLowerCase().replace(/ё/g, 'e').replace(/[а-я]/g, letter => ({
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
  }[letter])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64).replace(/-$/,'');
  return `${code}-${translit || 'product'}`;
}

const quickByCategory = {
  'Сухие смеси': 'Сухая строительная смесь. Поможем проверить назначение, фасовку и расход для вашего основания.',
  'Гипсокартон и листовые': 'Листовой материал для строительных работ. Проверим размер, толщину и количество перед отгрузкой.',
  'Металлопрокат': 'Металлопрокат для строительных и монтажных работ. Уточним размер, длину и доступный остаток.',
  'Профили и комплектующие': 'Элемент каркасной или штукатурной системы. Поможем подобрать совместимые комплектующие.',
};
function genericCopy(title, category) {
  return `${title} — позиция раздела «${category}». Цена указана за единицу продажи. Перед оплатой менеджер подтвердит наличие и поможет проверить исполнение товара для вашей задачи.`;
}

const previousCatalog = await read('app/catalog/products.generated.json');
const previousProducts = new Map(previousCatalog.products.map(p => [p.code, p]));
const output = [];
const audit = [];
const { hiddenByPolicy, hiddenOperationalItems } = selection;
for (const live of selection.products) {
  const original = { ...live, name: live.rawName };
  const entry = curated.get(live.code);
  const fact = facts[live.code];
  const { category, subgroup, productKind: kind } = classifyProduct(live);
  if (!titles[live.code] && !fact?.title && category !== 'Металлопрокат' && !['Саморезы','Стеновые профили','Потолочные профили','Маяки металлические'].includes(subgroup)) throw new Error(`Title review required: ${live.code}`);
  const brand = entry?.brand || fact?.brand || brandFor(original);
  const presented = inventoryPresentation(live, category, subgroup, brand, live.rawName);
  const name = tidyTitle(titles[live.code] || (fact?.title ? [fact.title, ...presented.packing].join(', ') : presented.name));
  const filterFacts = { ...inventoryFacets({ name: live.rawName, category, subgroup, specs: entry?.specs || [] }), ...presented.facets, ...(fact?.facets || {}) };
  if (live.code === '03232') delete filterFacts.density; // Warehouse says g/m; area density is unconfirmed.
  const officialKeys = new Set([...(fact?.source?.scope || []), ...(fact?.additionalSources || []).flatMap(source=>source.scope)]);
  for (const key of ['base','application']) if (filterFacts[key] && !officialKeys.has(key)) throw new Error(`Missing manufacturer evidence for ${live.code}: ${key}`);
  audit.push({ code:live.code, name, inventoryName:live.rawName, category, subgroup,
    status:fact?.source?(fact.identityNote?'manufacturer-family-matched':'manufacturer-matched'):!brand?'generic-inventory':'manufacturer-page-unresolved',
    officialSource:fact?.source||null,
    additionalSources:fact?.additionalSources||[],
    identityNote:fact?.identityNote||null,
    inventoryProperties:Object.keys(filterFacts).filter(key=>!officialKeys.has(key)),
    missingSemanticProperties:/Штукатурки|Шпаклёвки/.test(subgroup)?['base','application'].filter(key=>!filterFacts[key]):[],
    reference:!brand&&/Трубы|Саморезы/.test(subgroup)?'Saturn naming pattern; only own inventory dimensions and packaging are used':null,
  });
  const image = entry?.image || null;
  if (image) {
    if (!image.startsWith('/assets/products/')) throw new Error('Invalid image path.');
    const asset = path.resolve('public', '.' + image);
    if (!asset.startsWith(path.resolve('public/assets/products') + path.sep)) throw new Error('Invalid image path.');
    await access(asset);
  }
  output.push({
    id: live.code, code: live.code, slug: entry?.slug || previousProducts.get(live.code)?.slug || slugFor(live.code, name),
    brand, name, category, subgroup, productKind: kind,
    unit: entry?.unit || unitFor(live, category), image, photoStyle: entry?.photoStyle || 'pending',
    stock: Math.max(0, live.available), price: live.retailPriceMinor === null ? null : live.retailPriceMinor / 100,
    stockLocation: live.stockLocation,
    facets: filterFacts,
    popularity: popularity.get(live.code) || 0,
    searchAliases: [...new Set([...(entry?.searchAliases || []), live.rawName, live.categoryPath, kind, subgroup, ...Object.values(filterFacts).flat()])],
    quickDescription: entry?.quickDescription || quickByCategory[category] || `Товар из раздела «${category}». Уточним параметры и совместимость перед заказом.`,
    description: entry?.description || genericCopy(name, category),
    specs: entry?.specs || [['Код товара', live.code], ['Раздел', kind]],
    ...(entry?.variantGroup ? { variantGroup: entry.variantGroup, variantLabel: entry.variantLabel } : {}),
    ...(entry?.calculator ? { calculator: entry.calculator } : {}),
    ...(live.code === '00876' ? { companionIds: ['00971','00859','00668'] } : {}),
    comparisonGroup: /штукатур.*гипсов|гипсов.*штукатур/i.test(`${name} ${live.rawName}`) ? 'gypsum-plaster' : kind,
  });
}
if (output.length !== selection.products.length) throw new Error('Catalog count mismatch.');
if (new Set(output.map(product => product.slug)).size !== output.length || new Set(output.map(product => product.id)).size !== output.length) throw new Error('Duplicate routes or ids.');
output.sort((left, right) => right.popularity - left.popularity);
await writeFile('app/catalog/products.generated.json', JSON.stringify({ updatedAt: snapshot.completedAt, stockMoment: snapshot.stockMoment, labinskStockMoment:labinsk.stockMoment, selectedProducts: snapshot.products.length + labinsk.products.length, hiddenOperationalItems, hiddenByPolicy, products: output }, null, 2) + '\n');
const queue = output.filter(product => !product.image || !curated.has(product.code)).map(product => ({
  code: product.code, name: product.name, category: product.category, productKind: product.productKind,
  needs: [...(!product.image ? ['Оригинал фото производителя', 'Фото в утверждённом стиле'] : []), ...(!curated.has(product.code) ? ['Редакторская проверка названия', 'Источники характеристик', 'SEO-описание'] : []), ...(product.price === null ? ['Уточнить Розница ЛАБ.'] : [])],
}));
const selectedCount = snapshot.products.length + labinsk.products.length;
await writeFile('private/moysklad/editorial-queue.json', JSON.stringify({ updatedAt: snapshot.completedAt, selected: selectedCount, publishedInCatalog: output.length, hiddenOperationalItems, remainingEditorialWork: queue.length, products: queue }, null, 2) + '\n');
console.log(JSON.stringify({ selected: selectedCount, publishedInCatalog: output.length, hiddenOperationalItems, categories: Object.fromEntries([...new Set(output.map(product => product.category))].sort().map(category => [category, output.filter(product => product.category === category).length])), withoutRetailPrice: output.filter(product => product.price === null).length, withoutFinalPhoto: output.filter(product => !product.image).length }));
await writeFile('private/catalog-research/catalog-review.json',JSON.stringify({reviewedAt:'2026-09-07',products:audit},null,2)+'\n');
