"use client";

import Image from "next/image";
import Link from "next/link";
import { CaretDown, Faders, SquaresFour, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { CatalogProductCard } from "../components/catalog-product-card";
import { SiteChrome } from "../components/site-chrome";
import { readCart, readFavorites, writeCart, writeFavorites } from "../lib/commerce";
import { catalogCategories, catalogProducts, CatalogProduct, categoryMap } from "./data";
import { matchesProductSearch } from "../lib/product-search";

const categorySlugMap = Object.fromEntries(Object.entries(categoryMap).map(([slug, name]) => [name, slug]));
type Availability = "all" | "stock" | "order";

export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все товары");
  const [subgroup, setSubgroup] = useState("Все подгруппы");
  const [sort, setSort] = useState("popular");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability>("all");
  const [brands, setBrands] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const url = new URL(window.location.href);
    setQuery(url.searchParams.get("q") || "");
    setCategory(categoryMap[url.searchParams.get("category") || ""] || "Все товары");
    setSubgroup(url.searchParams.get("group") || "Все подгруппы");
    setAvailability(url.searchParams.get("availability") === "order" ? "order" : url.searchParams.get("availability") === "stock" ? "stock" : "all");
    setFavorites(readFavorites());
    if (url.searchParams.has("category") || url.hash === "#products") window.setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }, []);

  const categorySubgroups = useMemo(() => category === "Все товары" ? [] : [...new Set(catalogProducts.filter(product => product.category === category).map(product => product.subgroup))], [category]);
  const filtered = useMemo(() => catalogProducts.filter(product =>
    (category === "Все товары" || product.category === category) &&
    (subgroup === "Все подгруппы" || product.subgroup === subgroup) &&
    (availability === "all" || (availability === "stock" ? product.stock !== null && product.stock > 0 : product.stock === null || product.stock <= 0)) &&
    (!brands.length || brands.includes(product.brand)) && matchesProductSearch(product, query)
  ).sort((a, b) => sort === "popular" ? b.popularity - a.popularity : a.price === null ? b.price === null ? 0 : 1 : b.price === null ? -1 : sort === "price-asc" ? a.price - b.price : b.price - a.price), [availability, brands, category, query, sort, subgroup]);
  useEffect(() => setVisibleCount(24), [availability, brands, category, query, sort, subgroup]);

  function updateUrl(nextCategory = category, nextSubgroup = subgroup, nextAvailability = availability) {
    const url = new URL(window.location.href); const slug = categorySlugMap[nextCategory];
    if (slug) url.searchParams.set("category", slug); else url.searchParams.delete("category");
    if (nextSubgroup !== "Все подгруппы") url.searchParams.set("group", nextSubgroup); else url.searchParams.delete("group");
    if (nextAvailability !== "all") url.searchParams.set("availability", nextAvailability); else url.searchParams.delete("availability");
    if (query) url.searchParams.set("q", query); else url.searchParams.delete("q");
    url.hash = "products"; history.replaceState(null, "", url);
  }
  function chooseCategory(name: string) { setCategory(name); setSubgroup("Все подгруппы"); setFiltersOpen(false); updateUrl(name, "Все подгруппы"); window.setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }
  function chooseSubgroup(name: string) { setSubgroup(name); updateUrl(category, name); }
  function chooseAvailability(value: Availability) { const next = availability === value ? "all" : value; setAvailability(next); updateUrl(category, subgroup, next); }
  function toggleFavorite(id: string) { setFavorites(current => { const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]; writeFavorites(next); return next; }); }
  function addProduct(product: CatalogProduct) {
    if (product.price === null || product.stock === null || product.stock <= 0) return;
    const current = readCart(); const id = `product-${product.id}`; const existing = current.find(item => item.id === id);
    writeCart(existing ? current.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { id, title: product.name, price: product.price, quantity: 1, image: product.image, detail: `${product.brand} · ${product.unit}` }]);
    setAdded(value => [...new Set([...value, product.id])]);
  }
  function resetFilters() { setCategory("Все товары"); setSubgroup("Все подгруппы"); setQuery(""); setBrands([]); setAvailability("all"); updateUrl("Все товары", "Все подгруппы", "all"); }

  return <SiteChrome active="catalog"><div className="inner-canvas catalog-page">
    <nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><span>Каталог</span></nav>
    <section className="catalog-heading"><div><p className="eyebrow">Строительные материалы</p><h1>Каталог</h1><p>Подберите материалы по задаче. Наличие и стоимость подтвердим перед оплатой.</p></div></section>
    <section className="category-directory"><div className="directory-heading"><div><SquaresFour weight="bold"/><span><b>Каталог категорий</b><small>13 направлений из актуального ассортимента</small></span></div><Link href="/solutions/">Подобрать готовое решение</Link></div><div className="directory-grid">{catalogCategories.map(item => { const count = catalogProducts.filter(product => product.category === item.name).length; return <Link className="directory-card" href={`/catalog/?category=${item.slug}#products`} key={item.slug} onClick={event => { event.preventDefault(); chooseCategory(item.name); }}><span className="directory-card-image"><Image alt="" fill sizes="110px" src={item.image}/></span><div><b>{item.name}</b><small>{item.note}</small><em>{count} товаров</em></div></Link>; })}</div></section>
    <div className="catalog-section-head" id="products"><div><p className="eyebrow">Товарная выдача</p><h2>{category}</h2>{query && <button onClick={() => setQuery("")} type="button">По запросу «{query}» <X/></button>}</div><div className="catalog-head-actions"><button className="mobile-filter-button" onClick={() => setFiltersOpen(true)} type="button"><Faders weight="bold"/>Фильтры</button><label>Сортировка<select onChange={event => setSort(event.target.value)} value={sort}><option value="popular">По популярности</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option></select><CaretDown/></label></div></div>
    {categorySubgroups.length > 1 && <div className="subcategory-strip" aria-label="Подгруппы"><button className={subgroup === "Все подгруппы" ? "is-active" : ""} onClick={() => chooseSubgroup("Все подгруппы")} type="button">Все</button>{categorySubgroups.map(item => <button className={subgroup === item ? "is-active" : ""} key={item} onClick={() => chooseSubgroup(item)} type="button">{item}<span>{catalogProducts.filter(product => product.category === category && product.subgroup === item).length}</span></button>)}</div>}
    <div className="catalog-layout"><aside className={`catalog-filters ${filtersOpen ? "is-open" : ""}`}><button aria-label="Закрыть фильтры" className="filter-close" onClick={() => setFiltersOpen(false)} type="button"><X/></button><h2>Фильтры</h2>
      <div className="filter-group"><b>Категория</b>{["Все товары", ...new Set(catalogProducts.map(product => product.category))].map(item => <button className={category === item ? "is-active" : ""} key={item} onClick={() => chooseCategory(item)} type="button"><span/>{item}<em>{item === "Все товары" ? catalogProducts.length : catalogProducts.filter(product => product.category === item).length}</em></button>)}</div>
      <div className="filter-group"><b>Наличие</b><button className={availability === "stock" ? "is-active" : ""} onClick={() => chooseAvailability("stock")} type="button"><span/>В наличии</button><button className={availability === "order" ? "is-active" : ""} onClick={() => chooseAvailability("order")} type="button"><span/>Под заказ</button></div>
      <div className="filter-group"><b>Бренды</b>{[...new Set(catalogProducts.map(product => product.brand).filter(Boolean))].map(item => <button className={brands.includes(item) ? "is-active" : ""} key={item} onClick={() => setBrands(current => current.includes(item) ? current.filter(brand => brand !== item) : [...current, item])} type="button"><span/>{item}</button>)}</div>
      <div className="filter-note"><b>Остатки Краснодар</b><p>Наличие и итоговую стоимость подтвердим перед отгрузкой.</p></div>
    </aside><section className="catalog-results"><div className="catalog-result-meta"><span>{filtered.length} позиции</span><small>Цены указаны за единицу товара</small></div>{filtered.length ? <><div className="catalog-product-grid">{filtered.slice(0, visibleCount).map(product => <CatalogProductCard added={added.includes(product.id)} favorite={favorites.includes(product.id)} key={product.id} onAdd={() => addProduct(product)} onFavorite={() => toggleFavorite(product.id)} product={product}/>)}</div>{visibleCount < filtered.length && <button className="catalog-load-more" onClick={() => setVisibleCount(count => count + 24)} type="button">Показать ещё 24 товара</button>}</> : <div className="catalog-empty"><h2>Товары не найдены</h2><p>Попробуйте другой запрос или сбросьте фильтры. Если нужного товара пока нет в каталоге, поможем подобрать его по заявке.</p><button onClick={resetFilters} type="button">Показать доступные товары</button></div>}</section></div>
  </div></SiteChrome>;
}
