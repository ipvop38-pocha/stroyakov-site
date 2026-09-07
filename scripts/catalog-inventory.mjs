import { hiddenCatalogName } from './catalog-taxonomy.mjs';

export function catalogInventory(rostov, labinsk) {
  const scopes = [
    [rostov, 'СтроякоV Склад Ростовское шоссе', 'Краснодар'],
    [labinsk, 'Основной склад Лабинск Родина', 'Лабинск · Родина'],
  ];
  const products = new Map();
  let hiddenByPolicy = 0, hiddenOperationalItems = 0;
  for (const [snapshot, store, label] of scopes) {
    if (snapshot.stores.length !== 1 || snapshot.stores[0].name !== store) throw new Error(`Unexpected warehouse scope: ${label}`);
    for (const product of snapshot.products) {
      if (product.code === '0545816227') { hiddenOperationalItems++; continue; }
      if (hiddenCatalogName.test(product.rawName)) { hiddenByPolicy++; continue; }
      if (product.archived || /поликарбонат/i.test(`${product.rawName} ${product.categoryPath}`)) throw new Error(`Excluded inventory: ${product.code}`);
      if (snapshot === labinsk && (!/^\(В\) МЕТАЛЛ(?:\/|$)/u.test(product.categoryPath) || !(product.available > 0))) throw new Error(`Outside Labinsk metal scope: ${product.code}`);
      if (snapshot === rostov && (!(product.available > 0 || product.selectedBySales) || /(?:^|\/)ЛАБИНСК(?:\/|$)/i.test(product.categoryPath))) throw new Error(`Outside Rostov scope: ${product.code}`);
      // A new overlap requires an explicit price/stock policy; never silently double-count it.
      if (products.has(product.code)) throw new Error(`Warehouse overlap needs review: ${product.code}`);
      products.set(product.code, { ...product, stockLocation: label });
    }
  }
  return { products: [...products.values()], hiddenByPolicy, hiddenOperationalItems };
}
