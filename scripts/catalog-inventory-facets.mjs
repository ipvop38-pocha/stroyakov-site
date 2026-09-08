const numbers = (value) => String(Number(value.replace(",", "."))).replace(".", ",");
const normalized = (value) => value.toLowerCase().replace(/ё/g, "е").replace(/[×*]/g, "x").replace(/(\d)\s*х\s*(?=\d)/g, "$1x");

// Dimensions and explicit generic product labels from inventory; chemical and application facts live in catalog/product-facts.json.
export function inventoryFacets(product) {
  const name = normalized(product.name);
  const properties = {};
  const set = (id, value) => { properties[id] = [...new Set([...(properties[id] || []), value])]; };
  const spec = (pattern) => normalized((product.specs || []).filter(([key]) => pattern.test(key.toLowerCase())).map(([, value]) => value).join(" "));
  const packing = spec(/фасовка/) || name;
  for (const match of packing.matchAll(/(\d+(?:[.,]\d+)?)\s*(кг|кгл|л)(?=$|[^а-яa-z])/g)) set("packing", `${numbers(match[1])} ${match[2] === "кгл" ? "кг" : match[2]}`);

  if (product.subgroup === "Гипсокартон") {
    if (/огнестой/.test(name)) set("sheetType", "Огнестойкий");
    else if (/влаг|гклв|пгв(?:$|[^а-я])|(?:^|[^a-zа-я])[hн][23](?:$|[^\d])/.test(name)) set("sheetType", "Влагостойкий");
    else if (/гипсокартон|гкл|гсп\s+а|пго(?:$|[^а-я])/.test(name)) set("sheetType", "Обычный");
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
    else if (/фасадн|штукатурн/.test(name)) set("purpose", "Штукатурная / фасадная");
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
