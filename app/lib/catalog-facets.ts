import type { CatalogProduct } from "../catalog/data";

export type FacetSelection = Record<string, string[]>;
type FacetProduct = Pick<CatalogProduct, "name" | "category" | "subgroup" | "specs">;
type FacetDefinition = { id: string; label: string };
export type CatalogFacet = FacetDefinition & { options: { value: string; count: number }[] };

const labels: Record<string, string> = {
  base: "Основа", application: "Нанесение", purpose: "Назначение",
  packing: "Фасовка", sheetType: "Тип листа", thickness: "Толщина, мм",
  profileType: "Тип профиля", profileSize: "Сечение, мм", width: "Ширина, мм",
  length: "Длина, мм", density: "Плотность, г/м²", material: "Материал", shape: "Форма",
};

const numbers = (value: string) => String(Number(value.replace(",", "."))).replace(".", ",");
const normalized = (value: string) => value.toLowerCase().replace(/ё/g, "е").replace(/[×*]/g, "x").replace(/(\d)\s*х\s*(?=\d)/g, "$1x");

// Only explicit names and product specifications supply properties. Missing facts stay empty.
export function productFacets(product: FacetProduct): FacetSelection {
  const name = normalized(product.name);
  const properties: FacetSelection = {};
  const set = (id: string, value: string) => { properties[id] = [...new Set([...(properties[id] || []), value])]; };
  const spec = (pattern: RegExp) => normalized((product.specs || []).filter(([key]) => pattern.test(key.toLowerCase())).map(([, value]) => value).join(" "));
  const packing = spec(/фасовка/) || name;
  for (const match of packing.matchAll(/(\d+(?:[.,]\d+)?)\s*(кг|кгл|л)(?=$|[^а-яa-z])/g)) set("packing", `${numbers(match[1])} ${match[2] === "кгл" ? "кг" : match[2]}`);

  if (product.category === "Сухие смеси") {
    const base = spec(/основа|вяжущее/) || name;
    if (/цементно-гипс|гипсо-цемент/.test(base)) set("base", "Цементно-гипсовая");
    else if (/гипсо-полимер/.test(base)) set("base", "Гипсополимерная");
    else if (/цементно-полимер/.test(base)) set("base", "Цементно-полимерная");
    else if (/гипс(?:ов|овое)/.test(base)) set("base", "Гипсовая");
    else if (/цемент/.test(base)) set("base", "Цементная");
    else if (/полим/.test(base)) set("base", "Полимерная");
    const method = spec(/нанесение/) || name;
    if (/ручн|(?:^|[^а-я])р\.?\s?н\.?\s*(?=$|[^а-я])/.test(method)) set("application", "Ручное");
    if (/машин|механиз|(?:^|[^а-я])мн(?:$|[^а-я])/.test(method)) set("application", "Машинное");
    if (product.subgroup === "Шпаклёвки") {
      if (/финиш|finish/.test(name)) set("purpose", "Финишная");
      if (/выравнива|базов|base/.test(name)) set("purpose", "Выравнивающая");
      if (/универсаль/.test(name)) set("purpose", "Универсальная");
    }
    if (product.subgroup === "Плиточные клеи") {
      if (/керамогранит/.test(name)) set("purpose", "Для керамогранита");
      if (/керамич/.test(name)) set("purpose", "Для керамической плитки");
      if (/камня|камень/.test(name)) set("purpose", "Для камня");
    }
  }

  if (product.subgroup === "Гипсокартон") {
    if (/огнестой|пго(?:$|[^а-я])/.test(name)) set("sheetType", "Огнестойкий");
    else if (/влаг|гклв|(?:^|[^a-zа-я])[hн][23](?:$|[^\d])/.test(name)) set("sheetType", "Влагостойкий");
    else if (/гипсокартон|гкл|гсп\s+а/.test(name)) set("sheetType", "Обычный");
    const thickness = name.match(/(?:^|[^\d])(9[.,]5|12[.,]5)(?:$|[^\d])/);
    if (thickness) set("thickness", numbers(thickness[1]));
  }
  if (product.subgroup === "OSB") {
    const thickness = name.match(/x(9|12|15|18|22)(?:\s|$)/);
    if (thickness) set("thickness", thickness[1]);
  }
  if (product.subgroup === "Шифер") {
    if (/плоск/.test(name)) set("shape", "Плоский");
    if (/волнов/.test(name)) set("shape", "Волновой");
    const thickness = name.match(/(?:^|[^\d])(\d+(?:[.,]\d+)?)\s*мм/);
    if (thickness && Number(thickness[1].replace(",", ".")) < 30) set("thickness", numbers(thickness[1]));
  }
  if (product.category === "Утеплители") {
    const dimensions = name.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/);
    if (dimensions) set("thickness", numbers(product.subgroup === "XPS" ? dimensions[1] : dimensions[3]));
    else {
      const thickness = name.match(/(\d+)\s*мм/);
      if (thickness) set("thickness", thickness[1]);
    }
  }
  if (product.category === "Профили и комплектующие") {
    const thickness = name.match(/(?:^|[^\d])(0[.,]\d+)\s*(?:мм|\))/);
    if (thickness) set("thickness", numbers(thickness[1]));
    if (/^(?:Стеновые|Потолочные) профили$/.test(product.subgroup)) {
      const kind = name.match(/профиль\s+(псн|ппн|пс|пн|пп)(?:$|[^а-я])/);
      if (kind) set("profileType", /псн|ппн|^пн$/.test(kind[1]) ? "Направляющий" : kind[1] === "пс" ? "Стоечный" : "Потолочный");
      const size = name.match(/(?:^|[^\d.,])(\d{2,3})\s*[x/]\s*(\d{2})(?:$|[^\d])/);
      if (size) set("profileSize", `${size[1]} × ${size[2]}`);
    }
    if (/Маяки/.test(product.subgroup)) {
      const height = name.match(/(?:^|[^\d])(6|10)\s*мм|пм-(10)/);
      if (height) set("thickness", height[1] || height[2]);
    }
  }
  if (product.subgroup === "Грунтовки") {
    if (/глуб.*проник/.test(name)) set("purpose", "Глубокого проникновения");
    if (/бетон.?контакт/.test(name)) set("purpose", "Бетоноконтакт");
    if (/универсаль/.test(name)) set("purpose", "Универсальная");
    if (/концентрат/.test(name)) set("purpose", "Концентрат");
  }
  if (product.subgroup === "Сетки и стеклохолст") {
    if (/стеклохолст/.test(name)) set("purpose", "Стеклохолст");
    else if (/кладочн/.test(name)) set("purpose", "Кладочная сетка");
    else if (/фасадн/.test(name)) set("purpose", "Фасадная сетка");
    else if (/штукатурн/.test(name)) set("purpose", "Штукатурная сетка");
    else if (/малярн/.test(name)) set("purpose", "Малярная сетка");
    const density = name.match(/(\d+)\s*г(?:р)?\s*\/?м|фасадная\s+(145|160)/);
    if (density) set("density", density[1] || density[2]);
  }
  if (product.subgroup === "Ленты") {
    if (/серпянка/.test(name)) set("purpose", "Серпянка");
    else if (/бум\./.test(name)) set("purpose", "Бумажная для швов");
    else if (/уплотнит/.test(name)) set("purpose", "Уплотнительная");
    else if (/малярн/.test(name)) set("purpose", "Малярная");
    else if (/упаковочн/.test(name)) set("purpose", "Упаковочная");
    else if (/гидроизоляц/.test(name)) set("purpose", "Гидроизоляционная");
    const width = name.match(/(\d+(?:[.,]\d+)?)\s*(мм|см)/);
    if (width) set("width", numbers(String(Number(width[1].replace(",", ".")) * (width[2] === "см" ? 10 : 1))));
  }
  if (product.subgroup === "Кисти") {
    if (/макловица/.test(name)) set("shape", "Макловица");
    if (/плоская/.test(name)) set("shape", "Плоская");
    const width = name.match(/(\d+)\s*мм/);
    if (width) set("width", width[1]);
  }
  if (product.subgroup === "Валики") {
    if (/поролон/.test(name)) set("material", "Поролон");
    if (/велюр/.test(name)) set("material", "Велюр");
  }
  if (product.subgroup === "Перчатки") {
    if (/латекс/.test(name)) set("material", "Латексное покрытие");
    if (/пвх/.test(name)) set("material", "ПВХ-покрытие");
  }
  if (product.subgroup === "Дюбели" || product.subgroup === "Саморезы") {
    if (/изоляции/.test(name)) set("purpose", "Для теплоизоляции");
    if (/дюбель.?гвоздь/.test(name)) set("purpose", "Дюбель-гвоздь");
    if (/по металлу/.test(name)) set("purpose", "По металлу");
    if (/кровельн/.test(name)) set("purpose", "Кровельные");
    const length = name.match(/\d+(?:[.,]\d+)?x(\d+)(?:$|[^\d])/)
      || name.match(/(?:^|[^\d])(\d+)\s*мм/);
    if (length) set("length", length[1]);
  }
  return properties;
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
    "Саморезы": ["purpose", "length"], "Дюбели": ["purpose", "length"],
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
