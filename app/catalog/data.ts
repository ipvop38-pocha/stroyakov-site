import generated from './products.generated.json';

export type ProductCalculator =
  | { type: 'sheet'; area: number }
  | { type: 'dry-mix'; weight: number; consumptionAt10mm: number; minThickness: number; maxThickness: number; defaultThickness: number };

export type CatalogProduct = {
  id: string; slug: string; brand: string; name: string; category: string; subgroup: string; productKind: string;
  stock: number | null; popularity: number; price: number | null; oldPrice?: number;
  unit: string; image: string | null; code: string; searchAliases?: string[];
  quickDescription: string; description?: string; specs?: [string, string][];
  photoStyle?: string; variantGroup?: string; variantLabel?: string;
  calculator?: ProductCalculator; comparisonGroup?: string; companionIds?: string[];
};

export const catalogCategories = [
  { name: 'Сухие смеси', slug: 'mixes', note: 'Штукатурки, шпаклёвки, клеи', image: '/assets/categories/dry-mixes.png' },
  { name: 'Гипсокартон и листовые', slug: 'drywall', note: 'ГКЛ, OSB и шифер', image: '/assets/categories/drywall.png' },
  { name: 'Профили и комплектующие', slug: 'profiles', note: 'Профили, маяки и подвесы', image: '/assets/categories/profiles.png' },
  { name: 'Утеплители', slug: 'insulation', note: 'Минеральная вата и XPS', image: '/assets/categories/insulation.png' },
  { name: 'Стеновые материалы', slug: 'bricks', note: 'Блоки и кладочные материалы', image: '/assets/categories/bricks.png' },
  { name: 'Цемент', slug: 'cement', note: 'Цемент разных марок и фасовок', image: '/assets/categories/cement.svg' },
  { name: 'Металлопрокат', slug: 'metal', note: 'Арматура, трубы, уголки и листы', image: '/assets/categories/metal.svg' },
  { name: 'Крепёж', slug: 'fasteners', note: 'Саморезы, дюбели и хомуты', image: '/assets/categories/fasteners.png' },
  { name: 'ЛКМ и грунтовки', slug: 'paint', note: 'Краски, эмали и подготовка основания', image: '/assets/categories/paint.svg' },
  { name: 'Гидроизоляция и кровля', slug: 'waterproofing', note: 'Мастики, мембраны и кровельные материалы', image: '/assets/categories/waterproofing.svg' },
  { name: 'Пены и герметики', slug: 'foam', note: 'Монтажные пены и герметики', image: '/assets/categories/foam.svg' },
  { name: 'Инструмент и расходники', slug: 'tools', note: 'Инструмент, сетки, ленты и защита', image: '/assets/categories/tools.svg' },
  { name: 'Прочие материалы', slug: 'other', note: 'Дополнительные товары для объекта', image: '/assets/categories/all.png' },
];
export const categoryMap: Record<string, string> = Object.fromEntries(catalogCategories.map(item => [item.slug, item.name]));
export function categoryUrl(category: string) {
  const slug = Object.entries(categoryMap).find(([, name]) => name === category)?.[0];
  return slug ? `/catalog/?category=${slug}#products` : '/catalog/#products';
}

export const catalogProducts = generated.products as CatalogProduct[];
