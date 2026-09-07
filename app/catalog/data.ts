import generated from './products.generated.json';
import merchandising from '../../catalog/merchandising.json';

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
  facets?: Record<string, string[]>; stockLocation?: string;
};

export const catalogCategories = [
  { name: 'Сухие смеси', slug: 'mixes', note: 'Штукатурки, шпаклёвки, клеи', image: '/assets/categories/dry-mixes.png' },
  { name: 'Гипсокартон и листовые', slug: 'drywall', note: 'ГКЛ, OSB, шифер и потолочные плиты', image: '/assets/categories/drywall.png' },
  { name: 'Профили и комплектующие', slug: 'profiles', note: 'Профили, маяки и подвесы', image: '/assets/categories/profiles.png' },
  { name: 'Утеплители', slug: 'insulation', note: 'Минеральная вата и XPS', image: '/assets/categories/insulation.png' },
  { name: 'Стеновые материалы', slug: 'bricks', note: 'Блоки и кладочные материалы', image: '/assets/categories/bricks.png' },
  { name: 'Цемент', slug: 'cement', note: 'Цемент разных марок и фасовок', image: '/assets/categories/cement-v1.png' },
  { name: 'Металлопрокат', slug: 'metal', note: 'Арматура, трубы, уголки и листы', image: '/assets/categories/metal-v1.png' },
  { name: 'Крепёж', slug: 'fasteners', note: 'Саморезы, дюбели и хомуты', image: '/assets/categories/fasteners.png' },
  { name: 'ЛКМ и грунтовки', slug: 'paint', note: 'Краски, эмали и подготовка основания', image: '/assets/categories/paint-v1.png' },
  { name: 'Гидроизоляция и кровля', slug: 'waterproofing', note: 'Мастики, мембраны и кровельные материалы', image: '/assets/categories/waterproofing-v1.png' },
  { name: 'Пены и герметики', slug: 'foam', note: 'Монтажные пены и герметики', image: '/assets/categories/foam-v1.png' },
  { name: 'Сетки и ленты', slug: 'meshes-tapes', note: 'Армирующие сетки, стеклохолст и ленты', image: '/assets/categories/all.png' },
  { name: 'Инструмент и расходники', slug: 'tools', note: 'Кисти, валики, шпатели и перчатки', image: '/assets/categories/tools-v1.png' },
  { name: 'Прочие материалы', slug: 'other', note: 'Дополнительные товары для объекта', image: '/assets/categories/all.png' },
];
export const categoryMap: Record<string, string> = Object.fromEntries(catalogCategories.map(item => [item.slug, item.name]));
export function categoryUrl(category: string) {
  const slug = Object.entries(categoryMap).find(([, name]) => name === category)?.[0];
  return slug ? `/catalog/?category=${slug}#products` : '/catalog/#products';
}

export const catalogProducts = generated.products as CatalogProduct[];
export const featuredProducts = merchandising.featuredIds.flatMap(id => {
  const product = catalogProducts.find(item => item.id === id);
  return product && product.stock !== null && product.stock > 0 && product.price !== null && product.price > 0 && product.subgroup !== 'Саморезы' ? [product] : [];
});
