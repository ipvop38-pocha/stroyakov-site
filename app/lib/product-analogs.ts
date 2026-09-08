import type { CatalogProduct } from '../catalog/data';

// Comparison is deliberately conservative: no category-wide fallback. An
// unknown critical property cannot establish compatibility with another SKU.
const keysByGroup: Record<string, string[]> = {
  'Штукатурки':['base','application'],
  'Шпаклёвки':['base','application','purpose'],
  'Плиточные клеи':['adhesiveClass','tileFormat','purpose'],
  'Кладка и монтаж':['mixType','strengthGrade'],
  'Гипсокартон':['sheetType','thickness','sheetSize'],
  'Стеновые профили':['profileType','profileSize','thickness','stockLength'],
  'Потолочные профили':['profileType','profileSize','thickness','stockLength'],
  'Цемент':['cementType','strengthGrade'],
  'Саморезы':['fastenerType','purpose','diameter','length'],
  'Дюбели':['purpose','diameter','length'],
  'Ленты':['purpose','width','rollLength'],
  'Сетки и стеклохолст':['purpose','density','meshCell','rollLength'],
  'Маяки металлические':['beaconHeight','metalThickness','stockLength'],
  'Маяки ПВХ':['beaconHeight','stockLength'],
  'Минеральная вата':['series','sheetSize','thickness'],
  'Трубы':['shape','profileSize','thickness','stockLength'],
  'Листы стальные':['shape','sheetSize','thickness'],
  'Полосы стальные':['width','thickness','stockLength'],
  'Уголки стальные':['profileSize','thickness','stockLength'],
  'Арматура':['shape','diameter','strengthGrade','stockLength'],
};
const normalized = (values: string[]) => [...values].sort().join('|');
function sameFacet(a: CatalogProduct,b: CatalogProduct,key: string){
  const left=a.facets?.[key],right=b.facets?.[key];
  return Boolean(left?.length && right?.length && !left.includes('Требует уточнения') && !right.includes('Требует уточнения') && normalized(left)===normalized(right));
}
function familyName(product: CatalogProduct){
  // Different packaging of an otherwise identical named product is an actual
  // alternative even in groups without a cross-manufacturer compatibility rule.
  return product.name.replace(/,\s*\d+(?:[.,]\d+)?\s*(?:кг|л|шт\.)/g,'').trim();
}
export function areProductAnalogs(a: CatalogProduct,b: CatalogProduct): boolean {
  if(a.id===b.id || a.subgroup!==b.subgroup)return false;
  if(a.brand && a.brand===b.brand && familyName(a)===familyName(b))return true;
  const keys=keysByGroup[a.subgroup];
  if(!keys || !keys.every(key=>sameFacet(a,b,key)))return false;
  if(a.subgroup==='Штукатурки'){
    if(/короед|декоратив/i.test(a.name+b.name))return false;
    // Exterior cement products must agree on exterior use; gypsum products
    // compare only with the same declared application method above.
    if(!a.facets?.base?.every(base=>/Гипсовая/.test(base))){
      // Exterior wall use individually verified from these manufacturers'
      // application sections. The name alone must not establish facade use.
      const exterior=new Set(['00810','01072','00756','00697','01076','01066','0545655','00900','01055','00564']);
      return exterior.has(a.code)&&exterior.has(b.code);
    }
  }
  if(a.subgroup==='Шпаклёвки' && /готовая/i.test(a.name)!==/готовая/i.test(b.name))return false;
  if(a.subgroup==='Кладка и монтаж' && !a.facets?.mixType?.some(type=>/ЦПС/.test(type)))return false;
  if(a.subgroup==='Дюбели' && !/дюбель-гвоздь/i.test(a.name+b.name))return false;
  return true;
}
export function productAnalogs(product: CatalogProduct, catalog: CatalogProduct[]): CatalogProduct[] {
  return catalog.filter(item=>areProductAnalogs(product,item))
    .sort((a,b)=>Number((b.stock||0)>0)-Number((a.stock||0)>0) || (b.popularity||0)-(a.popularity||0))
    .slice(0,4);
}
