const requiredByGroup = {
  'Штукатурки': {
    base: ['Гипсовая', 'Цементная', 'Цементно-известковая', 'Цементно-гипсовая'],
    application: ['Ручное', 'Машинное'],
  },
};

export function assertFacetCoverage(product, fact) {
  const requirements = requiredByGroup[product.subgroup];
  if (!requirements) return;
  const sources = [fact?.source, ...(fact?.additionalSources || [])].filter(source => source?.url);
  for (const [key, allowed] of Object.entries(requirements)) {
    const values = product.facets?.[key];
    if (!Array.isArray(values) || !values.length || values.some(value => !allowed.includes(value)) ||
        new Set(values).size !== values.length || (key === 'base' && values.length !== 1)) {
      throw new Error(`Incomplete catalog facets for ${product.code || product.id}: ${key}`);
    }
    if (!sources.some(source => source.scope?.includes(key))) {
      throw new Error(`Missing manufacturer evidence for ${product.code || product.id}: ${key}`);
    }
  }
}
