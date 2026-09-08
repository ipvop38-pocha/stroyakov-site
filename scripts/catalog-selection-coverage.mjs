import schema from '../catalog/facet-schema.json' with { type: 'json' };
import exceptions from '../catalog/facet-exceptions.json' with { type: 'json' };
export const UNCONFIRMED = 'Требует уточнения';
const manufacturerProperties = new Set(['adhesiveClass','tileFormat','layerRange','base','application']);

// Every displayed property must have a value or an explicitly reviewed exception.
// New omissions fail export instead of silently disappearing from filter counts.
export function completeSelectionFacets(product, officialKeys) {
 const keys=schema.groups[product.subgroup];
 if(!keys)throw Error(`Unreviewed catalog subgroup: ${product.subgroup}`);
 for(const key of keys){
  const values=product.facets[key];
  if(values?.length){
   if(!Array.isArray(values)||values.some(v=>typeof v!=='string'||!v.trim())||new Set(values).size!==values.length)throw Error(`Invalid facet ${product.code}: ${key}`);
   if(values.includes(UNCONFIRMED))throw Error(`Unconfirmed value must be registered as an exception: ${product.code} ${key}`);
   if(manufacturerProperties.has(key)&&!officialKeys.has(key))throw Error(`Missing manufacturer evidence for ${product.code}: ${key}`);
  } else {
   const exception=exceptions.products[product.code]?.properties[key];
   if(!exception?.reason||exception.status!=='unconfirmed')throw Error(`Unreviewed missing facet ${product.code}: ${key}`);
   product.facets[key]=[UNCONFIRMED];
  }
 }
}

export function selectionCoverageReport(products) {
 return {reviewedAt:exceptions.reviewedAt,products:products.length,groups:Object.entries(schema.groups).map(([group,keys])=>{
 const members=products.filter(p=>p.subgroup===group);
 return {group,products:members.length,properties:keys.map(key=>({key,label:schema.labels[key],confirmed:members.filter(p=>p.facets[key]?.length&&!p.facets[key].includes(UNCONFIRMED)&&!p.facets[key].includes('Не применяется')).length,notApplicable:members.filter(p=>p.facets[key]?.includes('Не применяется')).length,unconfirmed:members.filter(p=>p.facets[key]?.includes(UNCONFIRMED)).map(p=>({code:p.code,name:p.name,reason:exceptions.products[p.code]?.properties[key]?.reason})),missing:members.filter(p=>!p.facets[key]?.length).map(p=>p.code)}))};
 })};
}
