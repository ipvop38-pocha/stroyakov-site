import generated from './products.generated.json';

export type ProductCalculator =
  | { type: 'sheet'; area: number }
  | { type: 'dry-mix'; weight: number; consumptionAt10mm: number; minThickness: number; maxThickness: number; defaultThickness: number };

export type CatalogProduct = {
  id: string; slug: string; brand: string; name: string; category: string;
  stock: number | null; popularity: number; price: number | null; oldPrice?: number;
  unit: string; image: string; code: string; searchAliases?: string[];
  description?: string; specs?: [string, string][];
  photoStyle?: string; variantGroup?: string; variantLabel?: string;
  calculator?: ProductCalculator; sources?: { label: string; url: string }[];
};

export const catalogCategories = [
  { name: 'Сухие смеси', slug: 'mixes', note: 'Штукатурки, шпаклёвки, клеи', image: '/assets/categories/dry-mixes.png' },
  { name: 'Гипсокартон', slug: 'drywall', note: 'ГКЛ, ГКЛВ и листовые материалы', image: '/assets/categories/drywall.png' },
  { name: 'Профили и комплектующие', slug: 'profiles', note: 'Профили, подвесы и элементы каркаса', image: '/assets/categories/profiles.png' },
  { name: 'Утеплители', slug: 'insulation', note: 'Минеральная вата и XPS', image: '/assets/categories/insulation.png' },
  { name: 'Кирпич и блоки', slug: 'bricks', note: 'Стеновые материалы', image: '/assets/categories/bricks.png' },
  { name: 'Крепёж', slug: 'fasteners', note: 'Саморезы, дюбели, подвесы', image: '/assets/categories/fasteners.png' },
];
export const categoryMap: Record<string, string> = Object.fromEntries([
  ...catalogCategories.map(item => [item.slug, item.name]), ['sheet', 'Листовые материалы'],
]);
export function categoryUrl(category: string) {
  const slug = Object.entries(categoryMap).find(([, name]) => name === category)?.[0];
  return slug ? `/catalog/?category=${slug}#products` : '/catalog/#products';
}

export const catalogProducts = generated.products as CatalogProduct[];
export const catalogStockMoment = generated.stockMoment;
