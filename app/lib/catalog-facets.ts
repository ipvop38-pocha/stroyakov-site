import type { CatalogProduct } from "../catalog/data";

export type FacetSelection = Record<string, string[]>;
type FacetProduct = Pick<CatalogProduct, "facets">;
type FacetDefinition = { id: string; label: string };
export type CatalogFacet = FacetDefinition & { options: { value: string; count: number }[] };

const labels: Record<string, string> = {
  base: "Основа", application: "Нанесение", purpose: "Назначение",
  packing: "Фасовка", sheetType: "Тип листа", thickness: "Толщина, мм",
  profileType: "Тип профиля", profileSize: "Сечение, мм", width: "Ширина, мм",
  length: "Длина, мм", density: "Плотность, г/м²", material: "Материал", shape: "Форма",
  stockLength: "Длина, м", diameter: "Диаметр, мм",
};

// Properties are reviewed at export; changing a display name cannot change filtering.
export function productFacets(product: FacetProduct): FacetSelection {
  return product.facets || {};
}

export function facetDefinitions(category: string, subgroup: string): FacetDefinition[] {
  const groups: Record<string, string[]> = {
    "Штукатурки": ["base", "application", "packing"],
    "Шпаклёвки": ["base", "application", "purpose", "packing"],
    "Плиточные клеи": ["purpose", "packing"],
    "Гипсокартон": ["sheetType", "thickness"], "OSB": ["thickness"], "Шифер": ["shape", "thickness"],
    "Стеновые профили": ["profileType", "profileSize", "thickness"],
    "Потолочные профили": ["profileType", "profileSize", "thickness"],
    "Маяки металлические": ["thickness"], "Маяки ПВХ": ["thickness"],
    "Минеральная вата": ["thickness"], "XPS": ["thickness"], "Подложки": ["thickness"],
    "Грунтовки": ["purpose", "packing"], "Краски": ["packing"],
    "Сетки и стеклохолст": ["purpose", "density"], "Ленты": ["purpose", "width"],
    "Кисти": ["shape", "width"], "Валики": ["material"], "Перчатки": ["material"],
    "Саморезы": ["purpose", "length", "packing"], "Дюбели": ["purpose", "length"],
    "Трубы": ["shape", "profileSize", "thickness", "stockLength"],
    "Арматура": ["shape", "diameter", "stockLength"],
    "Листы стальные": ["shape", "thickness"],
    "Кладка и монтаж": ["purpose", "packing"], "Монтажные клеи": ["purpose", "packing"],
  };
  const ids = groups[subgroup] || (category === "Цемент" || (category === "Сухие смеси" && subgroup !== "Все подгруппы") ? ["packing"] : []);
  return ids.map(id => ({ id, label: /Маяки/.test(subgroup) && id === "thickness" ? "Высота маяка, мм" : labels[id] }));
}

export function matchesFacets(properties: FacetSelection, selection: FacetSelection, except?: string) {
  // OR within a property, AND between properties.
  return Object.entries(selection).every(([id, values]) => id === except || values.length === 0 || values.some(value => properties[id]?.includes(value)));
}

export function availableFacets(products: FacetProduct[], definitions: FacetDefinition[], selection: FacetSelection, candidates = products): CatalogFacet[] {
  return definitions.map(definition => {
    const values = [...new Set(products.flatMap(product => productFacets(product)[definition.id] || []))];
    return { ...definition, options: values.sort((a, b) => a.localeCompare(b, "ru", { numeric: true })).map(value => ({ value,
      count: candidates.filter(product => {
        const properties = productFacets(product);
        return properties[definition.id]?.includes(value) && matchesFacets(properties, selection, definition.id);
      }).length,
    })) };
  }).filter(facet => facet.options.length > 1);
}

export function readFacetSelection(params: URLSearchParams, facets: CatalogFacet[]): FacetSelection {
  return Object.fromEntries(facets.flatMap(facet => {
    const values = [...new Set(params.getAll(`f_${facet.id}`))].filter(value => facet.options.some(option => option.value === value));
    return values.length ? [[facet.id, values]] : [];
  }));
}
