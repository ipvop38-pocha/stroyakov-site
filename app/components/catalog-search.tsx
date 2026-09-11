"use client";

import { ArrowRight, GridFour, MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { catalogCategories, catalogProducts } from "../catalog/data";
import { productPriceText, productStockText } from "../lib/product-presentation";
import { catalogSearchShortcuts, matchesProductSearch } from "../lib/product-search";

export function CatalogSearch({ className, query, onQueryChange }: {
  className: "header-search" | "mobile-search";
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => query.trim()
    ? catalogProducts.filter(product => matchesProductSearch(product, query)).slice(0, 5)
    : [], [query]);
  const shortcuts = useMemo(() => catalogSearchShortcuts(catalogProducts, catalogCategories, query), [query]);

  return (
    <form className={className} role="search" onSubmit={event => {
      event.preventDefault();
      const value = query.trim();
      window.location.href = value ? `/catalog/?q=${encodeURIComponent(value)}` : "/catalog/";
    }} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={event => {
      if (event.key === "Escape") setOpen(false);
    }}>
      <MagnifyingGlass aria-hidden weight="bold" />
      <input aria-label="Поиск по каталогу" autoComplete="off"
        onChange={event => { onQueryChange(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Найти товар, бренд или категорию" value={query} />
      {open && query.trim() && <div className="search-results">
        {shortcuts.length > 0 && <nav className="search-shortcuts" aria-label="Быстрые переходы в каталог">
          {shortcuts.map(shortcut => <a className="search-shortcut" key={shortcut.href} href={shortcut.href}>
            <GridFour aria-hidden weight="bold" />
            <span><b>{shortcut.name}</b><small>{shortcut.kind === "brand" ? "Все товары бренда" : "Раздел каталога"} · {shortcut.count} поз.</small></span>
            <ArrowRight aria-hidden />
          </a>)}
        </nav>}
        {/* Full navigation reapplies URL filters even when already in the catalog. */}
        {suggestions.map(product => <a key={product.id} href={`/product/${product.slug}/`}>
          <span><b>{product.name}</b><small>{product.brand || product.category} · {productStockText(product)}</small></span>
          <strong>{productPriceText(product.price)}</strong>
        </a>)}
        {!suggestions.length && !shortcuts.length && <p>По вашему запросу ничего не найдено</p>}
      </div>}
    </form>
  );
}
