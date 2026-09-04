import type { CatalogProduct, ProductCalculator } from '../catalog/data';

export function productPriceText(price: number | null): string {
  return price === null ? 'Цена по запросу' : `${price.toLocaleString('ru-RU')} ₽`;
}

export function productStockText(product: Pick<CatalogProduct, 'stock' | 'unit'>): string {
  if (product.stock === null) return 'Наличие уточняется';
  return product.stock > 0 ? `В наличии: ${productQuantityText(product.stock, product.unit)}` : 'Уточнить срок поставки';
}

export function productQuantityText(quantity: number, unit: string): string {
  const forms: Record<string, Record<string, string>> = {
    лист: { one: 'лист', few: 'листа', many: 'листов', other: 'листа' },
    мешок: { one: 'мешок', few: 'мешка', many: 'мешков', other: 'мешка' },
    упаковка: { one: 'упаковка', few: 'упаковки', many: 'упаковок', other: 'упаковки' },
  };
  const noun = forms[unit]?.[new Intl.PluralRules('ru-RU').select(quantity)] || unit;
  return `${quantity.toLocaleString('ru-RU')} ${noun}`;
}

export function calculateProductQuantity(calculator: ProductCalculator | undefined, area: number, reserve: number, thickness: number): number | null {
  if (!calculator || !Number.isFinite(area) || area <= 0 || !Number.isFinite(reserve) || reserve < 0 || reserve > 100) return null;
  if (calculator.type === 'sheet') {
    if (calculator.area <= 0) return null;
    return roundUpUnits(area * (1 + reserve / 100) / calculator.area);
  }
  if (!Number.isFinite(thickness) || thickness < calculator.minThickness || thickness > calculator.maxThickness || calculator.weight <= 0 || calculator.consumptionAt10mm <= 0) return null;
  return roundUpUnits(area * calculator.consumptionAt10mm * thickness / 10 * (1 + reserve / 100) / calculator.weight);
}

function roundUpUnits(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  // Avoid buying a whole extra bag for a floating point residue such as 33.00000000000001.
  return Math.max(1, Math.ceil(value - Number.EPSILON * Math.max(1, value) * 4));
}
