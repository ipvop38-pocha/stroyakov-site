import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const [selection, snapshot, editorial] = await Promise.all([
  read('private/moysklad/catalog-frequency.json'),
  read('private/moysklad/catalog-snapshot.json'),
  read('catalog/editorial.json'),
]);
const current = new Map(snapshot.products.map(product => [product.code, product]));
const curated = new Map(editorial.filter(product => product.status === 'published').map(product => [product.code, product]));
const operationalCodes = new Set(['0545816227']); // «Доставка (товар)» is not a physical catalog product.

const categoryRules = [
  ['Металлопрокат', /\(В\) МЕТАЛЛ|АРМАТУР|ТРУБЫ|УГОЛКИ|ШВЕЛЛЕР|ЛИСТЫ Г\/К|ПРОВОЛОКА/i],
  ['Гипсокартон и листовые', /ГИПСОКАРТОН|\bПГ[ОВ]\b|\bГСП\b|\bOSB\b|\bОС[БП]\b|ШИФЕР/i],
  ['Крепёж', /КРЕПЕЖ|КРЕПЁЖ|САМОРЕЗ|ДЮБЕЛ|ХОМУТ/i],
  ['Инструмент и расходники', /СОПУТКА|ПЕРЧАТК|ЛЕНТ|СЕТК|КИСТ|ВАЛИК|КРУГИ|ШПАТЕЛ|КАРАНДАШ|ЧЕРЕНОК|ТАЗ СТРОИТЕЛЬНЫЙ|ПЛЕНКА|ПЛЁНКА/i],
  ['Сухие смеси', /ШТУКАТУР|ШПАКЛ|ШПАТЛ|ПЛИТОЧНЫЙ КЛЕЙ|КЛЕЙ ДЛЯ ПЛИТКИ|НАЛИВНОЙ ПОЛ|СТЯЖК|РОВНИТЕЛ|КЛАДКА И МОНТАЖ|МОНТАЖНЫЙ КЛЕЙ|\bЦПС\b|САТИНТЕК|ВЯЖУЩЕЕ ГИПСОВОЕ|ГИПС СТРОИТЕЛЬНЫЙ/i],
  ['Утеплители', /ПЕНОПЛЭКС|ИЗОЛАЙФ|УТЕПЛ|ПОДЛОЖК/i],
  ['Гидроизоляция и кровля', /ГИДРОИЗОЛ|БИПОЛЬ|УНИФЛЕКС|ПРАЙМЕР БИТУМ/i],
  ['Пены и герметики', /ПЕНА|ГЕРМЕТИК/i],
  ['ЛКМ и грунтовки', /ГРУНТ|КРАСК|ЛАК|ЭМАЛ/i],
  ['Профили и комплектующие', /ПРОФИЛЬ|ПОДВЕС|МАЯЧК/i],
  ['Стеновые материалы', /БЛОКИ|КИРПИЧ/i],
  ['Цемент', /ЦЕМЕНТ/i],
];

function categoryFor(product) {
  const haystack = `${product.categoryPath} ${product.name}`;
  return categoryRules.find(([, pattern]) => pattern.test(haystack))?.[0] || 'Прочие материалы';
}

function productKindFor(product, category) {
  const text = `${product.categoryPath} ${product.name}`;
  const rules = [
    ['Штукатурки', /ШТУКАТУР/i], ['Шпаклёвки', /ШПАКЛ|ШПАТЛ|САТИНТЕК/i],
    ['Плиточные клеи', /ПЛИТОЧНЫЙ КЛЕЙ|КЛЕЙ ДЛЯ ПЛИТКИ|КЛЕЙ ПЛИТОЧНЫЙ|КЛЕЙ Д\/ПЛИТКИ/i],
    ['Смеси для пола', /НАЛИВНОЙ ПОЛ|СТЯЖК|РОВНИТЕЛ|НИВЕЛИР/i],
    ['Кладочные и монтажные смеси', /КЛАДКА И МОНТАЖ|МОНТАЖНЫЙ КЛЕЙ|\bМ-?150\b|\bМ-?300\b|\bЦПС\b/i],
    ['Гипсокартон', /ГИПСОКАРТОН|\bПГ[ОВ]\b|\bГСП\b/i], ['OSB', /\bOSB\b|\bОС[БП]\b/i],
    ['Шифер', /ШИФЕР/i], ['Потолочные профили', /ПОТОЛОЧНЫЙ/i], ['Стеновые профили', /СТЕНОВОЙ/i],
    ['Маяки и уголки', /МАЯЧК|МАЯК|УГОЛОК ПВХ/i], ['Грунтовки', /ГРУНТ/i],
    ['Краски', /КРАСК/i], ['Теплоизоляция', /ПЕНОПЛЭКС|ИЗОЛАЙФ|УТЕПЛ/i],
    ['Арматура', /АРМАТУР/i], ['Трубы', /ТРУБ/i], ['Саморезы', /САМОРЕЗ/i],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || category;
}

function cleanTitle(raw, category) {
  let title = raw.normalize('NFKC').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim();
  title = title.replace(/\bNo\s*(\d+)/gi, '№$1').replace(/(\d)\s*[xх*]\s*(?=\d)/g, '$1×');
  title = title.replace(/\bдля внутренних и наружных работ\b/gi, '').replace(/\bдля вн\.? и наруж\.? работ\b/gi, '');
  title = title.replace(/\s*<\s*\d+\s*шт\s*>\s*\([А-ЯМЗ]\)\s*$/i, '');
  for (let pass = 0; pass < 3; pass++) {
    title = title.replace(/\s*\(([^()]*)\)\s*$/i, (match, content) => {
      const pack = content.trim();
      const weightPack = pack.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*\d+(?:\s*шт\.?)?$/i);
      if (weightPack && (category === 'Сухие смеси' || category === 'Цемент')) return `, ${weightPack[1]} кг`;
      if (/(?:шт|пал|паллет|бэг|кор|шоубокс|упак|пар)/i.test(pack) || /^\d+(?:\s*\/\s*\d+)?$/.test(pack) || /^\d+\s*[/,]\s*\d+/.test(pack)) return '';
      return match;
    });
  }
  title = title.replace(/(\d+(?:[.,]\d+)?)\s*кг\s*\/\s*\d+(?:\s*шт\.?)?/gi, '$1 кг');
  title = title.replace(/\s*[/,]?\s*\d+\s*(?:шт\.?\s*\/\s*паллет|шт\.?|лист(?:ов)?\s*\/\s*пал|паллет)\s*$/i, '');
  title = title.replace(/\s*,?\s*\bарт\.?\s*\d+.*$/i, '');
  title = title.replace(/\s*выдерживают\s+до\s+\d+\s*кг.*$/i, '');
  title = title.replace(/машинного и ручного нанесения/gi, 'ручного и МН').replace(/машинного нанесения/gi, 'МН');
  title = title.replace(/шпатлевк/gi, 'шпаклёвк').replace(/Шпатлевк/g, 'Шпаклёвк');
  title = title.replace(/\bТрубы электросварные\b/gi, 'Труба электросварная').replace(/\bтрубы электросварные\b/g, 'Труба электросварная');
  title = title.replace(/\bпрямоуг(?=\d|\s)/gi, 'прямоугольная ');
  title = title.replace(/(?:ГОСТ|ТУ)\s+дл\.?\s*6000/gi, 'длина 6 м').replace(/(?:ГОСТ|ТУ)\s+дл\.?\s*12000/gi, 'длина 12 м');
  title = title.replace(/\bдл\.?\s*6000\b/gi, 'длина 6 м').replace(/\bдл\.?\s*12000\b/gi, 'длина 12 м').replace(/\bдл\.?\s*11[,.]\s*7\s*м?\b/gi, 'длина 11,7 м');
  title = title.replace(/\s+(?:ГОСТ|ТУ)\s*\d[\d.\-/]*(?:-\d+)?/gi, '');
  title = title.replace(/\s+,/g, ',').replace(/,{2,}/g, ',').replace(/\s{2,}/g, ' ').trim();
  title = title.replace(/[,.\/-]+$/g, '').trim();
  const insulation = title.match(/(?:Утеплитель\s+)?IZOLIFE\s+(.+?)\s+(\d{4})[.×](\d{3})[.×](\d+)\b/i);
  if (insulation) {
    const count = raw.match(/\((\d+)\s*(?:плит|пл\.)/i)?.[1];
    title = `Утеплитель Izolife ${insulation[1].trim()} ${insulation[2]}×${insulation[3]}×${insulation[4]} мм${count ? `, ${count} плит` : ''}`;
  }
  const overrides = {
    '00876': 'Штукатурка гипсовая Русгипс №6 МН, 30 кг',
    '00699': 'Штукатурка гипсовая Русгипс №8 толстослойная, 25 кг',
    '01060': 'Шпаклёвка гипсовая Satentek, 20 кг',
    '00700': 'Шпаклёвка гипсовая Русгипс №21 финишная, 25 кг',
    '00140': 'Гипсокартон влагостойкий Danogips 2500×1200×12,5 мм',
    '00141': 'Гипсокартон влагостойкий Danogips 2500×1200×9,5 мм',
    '00142': 'Гипсокартон Danogips 2500×1200×12,5 мм',
    '00144': 'Гипсокартон Danogips 2500×1200×9,5 мм',
    '00143': 'Шпаклёвка готовая финишная Danogips SuperFinish, 18,1 кг / 11 л',
    '00704': 'Шпаклёвка готовая финишная Danogips SuperFinish, 28 кг / 17 л',
    '00895': 'Штукатурка гипсовая Русгипс №5 ручного нанесения, 30 кг',
    '00562': 'Клей для плитки ЕС 3000, 25 кг',
    '00563': 'Клей для плитки ЕС 2000, 25 кг',
    '00823': 'Монтажная смесь ИС Монтажный, 25 кг',
    '00810': 'Штукатурка фасадная ИС, 25 кг',
    '00801': 'ЦПС ИС М-300, 25 кг',
    '00816': 'Клей плиточный ИС Стандарт, 25 кг',
    '00814': 'Стяжка ИС, 25 кг',
  };
  title = overrides[this?.code] || title;
  if (title.length > 108) {
    const shortened = title.slice(0, 105);
    title = shortened.slice(0, shortened.lastIndexOf(' ')).replace(/[,.\/-]+$/g, '').trim();
  }
  return title;
}
function brandFor(product) {
  const text = `${product.name} ${product.categoryPath}`;
  const brands = [
    ['DANOGIPS', /DANOGIPS|ДАНОГИПС/i], ['РУСГИПС', /РУСГИПС/i], ['SATENTEK', /САТ[ЕИ]НТЕ[КК]|SATENTEK/i],
    ['ПЕНОПЛЭКС', /ПЕНОПЛЭКС/i], ['KNAUF', /КНАУФ|KNAUF/i], ['CERESIT', /ЦЕРЕЗИТ|CERESIT/i],
    ['ВОЛМА', /ВОЛМА/i], ['ОСНОВИТ', /ОСНОВИТ/i], ['ХАБЕЗ', /ХАБЕЗ/i], ['LITOKOL', /ЛИТОКОЛ|LITOKOL/i],
    ['KRATEX', /КРАТЭКС|KRATEX/i], ['IZOLIFE', /ИЗОЛАЙФ|IZOLIFE/i], ['ROKS', /РОКС/i],
    ['ЕС', /ЕС-СМЕСИ|\bЕС\b/i], ['ИС', /ИС-СМЕСИ|\bИС[- ]/i], ['МТ', /МТ-ПРОФИЛЬ|\bМТ\b/i],
    ['MAXITOOL', /MAXI\s*TOOL/i], ['ТЕХНОНИКОЛЬ', /ТЕХНОНИКОЛЬ/i],
  ];
  return brands.find(([, pattern]) => pattern.test(text))?.[0] || (product.categoryPath.startsWith('(В) МЕТАЛЛ') ? 'МЕТАЛЛОПРОКАТ' : '');
}

function unitFor(product, category) {
  const api = product.unit?.name?.toLowerCase();
  if (api === 'шт' || api === 'шт.') {
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

const output = [];
for (const original of selection.products) {
  if (operationalCodes.has(original.code)) continue;
  const live = current.get(original.code);
  if (!live || live.id !== original.id || original.saleCount < 5) throw new Error(`Invalid selection: ${original.code}`);
  if (/поликарбонат/i.test(`${live.rawName} ${live.categoryPath}`) || live.archived) throw new Error(`Excluded product: ${original.code}`);
  const entry = curated.get(original.code);
  const category = ['Гипсокартон','Листовые материалы'].includes(entry?.category) ? 'Гипсокартон и листовые' : entry?.category || categoryFor(original);
  const draft = { ...original, code: original.code };
  const name = cleanTitle.call(draft, entry?.name || live.rawName, category);
  const kind = entry?.productKind || productKindFor(original, category);
  const image = entry?.image || null;
  if (image) {
    if (!image.startsWith('/assets/products/')) throw new Error('Invalid image path.');
    const asset = path.resolve('public', '.' + image);
    if (!asset.startsWith(path.resolve('public/assets/products') + path.sep)) throw new Error('Invalid image path.');
    await access(asset);
  }
  output.push({
    id: original.code, code: original.code, slug: entry?.slug || slugFor(original.code, name),
    brand: entry?.brand || brandFor(original), name, category, productKind: kind,
    unit: entry?.unit || unitFor(live, category), image, photoStyle: entry?.photoStyle || 'pending',
    stock: live.available, price: live.retailPriceMinor === null ? null : live.retailPriceMinor / 100,
    popularity: selection.products.length - selection.products.findIndex(product => product.code === original.code),
    searchAliases: [...new Set([...(entry?.searchAliases || []), live.rawName, original.categoryPath, kind])],
    quickDescription: entry?.quickDescription || quickByCategory[category] || `Товар из раздела «${category}». Уточним параметры и совместимость перед заказом.`,
    description: entry?.description || genericCopy(name, category),
    specs: entry?.specs || [['Код товара', original.code], ['Раздел', kind]],
    ...(entry?.variantGroup ? { variantGroup: entry.variantGroup, variantLabel: entry.variantLabel } : {}),
    ...(entry?.calculator ? { calculator: entry.calculator } : {}),
    ...(original.code === '00876' ? { companionIds: ['00971','00859','00668'] } : {}),
    comparisonGroup: /штукатур.*гипсов|гипсов.*штукатур/i.test(`${name} ${live.rawName}`) ? 'gypsum-plaster' : kind,
  });
}
if (output.length !== selection.products.length - operationalCodes.size) throw new Error('Catalog count mismatch.');
if (new Set(output.map(product => product.slug)).size !== output.length || new Set(output.map(product => product.id)).size !== output.length) throw new Error('Duplicate routes or ids.');
output.sort((left, right) => right.popularity - left.popularity);
await writeFile('app/catalog/products.generated.json', JSON.stringify({ updatedAt: snapshot.completedAt, stockMoment: snapshot.stockMoment, selectedProducts: selection.products.length, hiddenOperationalItems: operationalCodes.size, products: output }, null, 2) + '\n');
const queue = output.filter(product => !product.image || !curated.has(product.code)).map(product => ({
  code: product.code, name: product.name, category: product.category, productKind: product.productKind,
  needs: [...(!product.image ? ['Оригинал фото производителя', 'Фото в утверждённом стиле'] : []), ...(!curated.has(product.code) ? ['Редакторская проверка названия', 'Источники характеристик', 'SEO-описание'] : []), ...(product.price === null ? ['Уточнить Розница ЛАБ.'] : [])],
}));
await writeFile('private/moysklad/editorial-queue.json', JSON.stringify({ updatedAt: snapshot.completedAt, selected: selection.products.length, publishedInCatalog: output.length, hiddenOperationalItems: operationalCodes.size, remainingEditorialWork: queue.length, products: queue }, null, 2) + '\n');
console.log(JSON.stringify({ selected: selection.products.length, publishedInCatalog: output.length, hiddenOperationalItems: operationalCodes.size, categories: Object.fromEntries([...new Set(output.map(product => product.category))].sort().map(category => [category, output.filter(product => product.category === category).length])), withoutRetailPrice: output.filter(product => product.price === null).length, withoutFinalPhoto: output.filter(product => !product.image).length }));
