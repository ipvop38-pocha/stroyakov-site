import type { CatalogProduct } from "../catalog/data";
import schema from "../../catalog/facet-schema.json" with { type: "json" };

export type FacetSelection = Record<string, string[]>;
type FacetProduct = Pick<CatalogProduct, "facets">;
type FacetDefinition = { id: string; label: string; help?: string };
export type CatalogFacet = FacetDefinition & { options: { value: string; count: number }[] };
export type TileContext = "indoor" | "outdoorWall" | "outdoorFloor";
const tileSizes = [[30, 30], [45, 45], [60, 60], [60, 120], [70, 70], [120, 120], [160, 160]];

function tileSizeOptions(formats: string[], context: TileContext): string[] {
  if (formats.includes("Керамогранит не заявлен")) return ["Керамогранит не заявлен"];
  const confirmed = new Set<string>();
  for (const format of formats) {
    const match = format.match(/^(\d+) × (\d+) см/);
    if (!match) continue;
    const allowed = format.includes("таблица ИС") || (context === "indoor" ? format.includes("внутри") :
      format.includes("внутри и снаружи") || format.endsWith("(снаружи)") || format.includes(context === "outdoorWall" ? "стены снаружи" : "пол снаружи"));
    if (!allowed) continue;
    const [short, long] = [Number(match[1]), Number(match[2])].sort((a,b) => a-b);
    for (const [a,b] of tileSizes) {
      // The IS table lists particular square sizes; it does not declare a maximum.
      if (format.includes("таблица ИС") && (a !== b || ![30,45,60].includes(a))) continue;
      if (a <= short && b <= long) confirmed.add(`${a} × ${b}`);
    }
  }
  return confirmed.size ? [...confirmed] : ["Требует уточнения"];
}

// Properties are reviewed at export; changing a display name cannot change filtering.
export function productFacets(product: FacetProduct): FacetSelection {
  const properties = product.facets || {};
  if (!properties.tileFormat) return properties;
  return { ...properties, ...Object.fromEntries((["indoor", "outdoorWall", "outdoorFloor"] as TileContext[])
    .map(context => [`tileSize_${context}`, tileSizeOptions(properties.tileFormat, context)])) };
}

export function facetDefinitions(category: string, subgroup: string, tileContext: TileContext = "indoor"): FacetDefinition[] {
  const groups: Record<string, string[]> = schema.groups;
  const labels: Record<string, string> = schema.labels;
  const help: Record<string, string> = schema.help;
  const groupHelp: Record<string, Record<string, string>> = schema.groupHelp;
  const overrides: Record<string, Record<string, string>> = schema.groupLabels;
  const ids = groups[subgroup] || (category === "Цемент" ? groups["Цемент"] : []);
  return ids.map(id => id === "tileFormat" ? { id: `tileSize_${tileContext}`, label: "Размер керамогранита, см", help: "Выберите свой формат: покажем клеи, для которых он подтверждён инструкцией или таблицей производителя. Учитываем место укладки. Для керамической плитки ограничения могут отличаться; совместимость с основанием проверяется отдельно." } :
    { id, label: overrides[subgroup]?.[id] || labels[id], ...((groupHelp[subgroup]?.[id] || help[id]) ? { help: groupHelp[subgroup]?.[id] || help[id] } : {}) });
}

export function matchesFacets(properties: FacetSelection, selection: FacetSelection, except?: string) {
  // OR within a property, AND between properties.
  return Object.entries(selection).every(([id, values]) => id === except || values.length === 0 || values.some(value => properties[id]?.includes(value)));
}

export function availableFacets(products: FacetProduct[], definitions: FacetDefinition[], selection: FacetSelection, candidates = products): CatalogFacet[] {
  return definitions.map(definition => {
    const values = [...new Set(products.flatMap(product => productFacets(product)[definition.id] || []))];
    return { ...definition, options: values.sort((a, b) => Number(a === "Требует уточнения") - Number(b === "Требует уточнения") || a.localeCompare(b, "ru", { numeric: true })).map(value => ({ value,
      count: candidates.filter(product => {
        const properties = productFacets(product);
        return properties[definition.id]?.includes(value) && matchesFacets(properties, selection, definition.id);
      }).length,
    })) };
  }).filter(facet => facet.options.length > 1);
}

export function readFacetSelection(params: URLSearchParams, facets: CatalogFacet[]): FacetSelection {
  return Object.fromEntries(facets.flatMap(facet => {
    const values = [...new Set(params.getAll(`f_${facet.id}`).map(value =>
      facet.id === "purpose" && ["Фасадная сетка", "Штукатурная сетка"].includes(value) && facet.options.some(option => option.value === "Штукатурная / фасадная")
        ? "Штукатурная / фасадная" : value))].filter(value => facet.options.some(option => option.value === value));
    return values.length ? [[facet.id, values]] : [];
  }));
}

export function brandFilterValue(product: Pick<CatalogProduct, "brand">) {
  return product.brand || "Бренд не указан";
}
