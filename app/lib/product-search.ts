type SearchableProduct = {
  name: string;
  brand?: string;
  code?: string;
  category?: string;
  searchAliases?: string[];
};

const aliases: Record<string, string[]> = {
  пгв: ['гипсокартон', 'влагостойкий'],
  гклв: ['гипсокартон', 'влагостойкий'],
  пго: ['гипсокартон', 'обычный'],
  гкл: ['гипсокартон'],
  danogips: ['даногипс'],
  rusgips: ['русгипс'],
  roks: ['рокс'],
  knauf: ['кнауф'],
  ceresit: ['церезит'],
  ultradecor: ['ультрадекор'],
  осб: ['osb'],
  осп: ['osb'],
  сатинтек: ['сатентек'],
  сатентэк: ['сатентек'],
  satentek: ['сатентек'],
  satintek: ['сатентек'],
  суперфиниш: ['superfinish'],
};

function tokens(text: string): string[] {
  const normalized = text.normalize('NFKC').toLowerCase().replace(/ё/g, 'е')
    .replace(/(\d),(?=\d)/g, '$1.')
    .replace(/(\d)\s*[хx×*]\s*(?=\d)/g, '$1 ');
  return (normalized.match(/[a-zа-я]+|\d+(?:\.\d+)?/g) || []).flatMap(token => {
    if (aliases[token]) return aliases[token];
    if (/^гипсокартон/.test(token)) return ['гипсокартон'];
    if (/^влагостойк/.test(token)) return ['влагостойкий'];
    if (/^шпа[кт]ле/.test(token)) return ['шпаклевка'];
    return [token];
  });
}

function oneTypo(a: string, b: string): boolean {
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  let left = 0, right = 0, edits = 0;
  while (left < a.length && right < b.length) {
    if (a[left] === b[right]) { left++; right++; continue; }
    if (++edits > 1) return false;
    if (a.length >= b.length) left++;
    if (b.length >= a.length) right++;
  }
  return edits + (left < a.length ? 1 : 0) + (right < b.length ? 1 : 0) <= 1;
}

export function matchesProductSearch(product: SearchableProduct, query: string): boolean {
  if (!query.trim()) return true;
  const requested = tokens(query);
  if (!requested.length) return false;
  const available = tokens([product.name, product.brand, product.code, product.category, ...(product.searchAliases || [])].filter(Boolean).join(' '));
  return requested.every(term => available.some(word => {
    // Dimensions, thickness and article numbers must not use fuzzy matching.
    if (/^\d/.test(term)) return word === term;
    return word === term || (term.length >= 4 && word.startsWith(term)) || oneTypo(term, word);
  }));
}

type CatalogSearchProduct = SearchableProduct & { category: string; subgroup: string };
export type CatalogSearchShortcut = { name: string; kind: 'category' | 'group' | 'brand'; count: number; href: string };

// Match the section/brand itself, so a product query does not suggest unrelated brands.
export function catalogSearchShortcuts(products: CatalogSearchProduct[], categories: { name: string; slug: string }[], query: string): CatalogSearchShortcut[] {
  const requested = tokens(query).join(' ');
  if (requested.length < 2) return [];
  const targets: CatalogSearchShortcut[] = [];
  const add = (name: string, kind: CatalogSearchShortcut['kind'], members: CatalogSearchProduct[], params: Record<string, string>) => {
    if (members.length && matchesProductSearch({ name }, query)) targets.push({ name, kind, count: members.length, href: `/catalog/?${new URLSearchParams(params)}#products` });
  };
  for (const category of categories) {
    const members = products.filter(product => product.category === category.name);
    add(category.name, 'category', members, { category: category.slug });
    for (const group of new Set(members.map(product => product.subgroup))) {
      if (group === category.name) continue;
      add(group, 'group', members.filter(product => product.subgroup === group), { category: category.slug, group });
    }
  }
  for (const brand of new Set(products.map(product => product.brand).filter((value): value is string => Boolean(value)))) {
    add(brand, 'brand', products.filter(product => product.brand === brand), { brand });
  }
  return targets.sort((a, b) => Number(tokens(b.name).join(' ') === requested) - Number(tokens(a.name).join(' ') === requested) ||
    a.name.length - b.name.length || b.count - a.count || a.name.localeCompare(b.name, 'ru')).slice(0, 3);
}
