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
