"use client";

import Image from "next/image";
import Link from "next/link";
import { CaretDown, Faders, SquaresFour, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { CatalogProductCard } from "../components/catalog-product-card";
import { SiteChrome } from "../components/site-chrome";
import { readCart, readFavorites, writeCart, writeFavorites } from "../lib/commerce";
import { catalogCategories, catalogProducts, CatalogProduct } from "./data";

const categoryMap: Record<string,string> = { mixes:"Сухие смеси", drywall:"Гипсокартон", profiles:"Профили и комплектующие", insulation:"Утеплители", bricks:"Кирпич и блоки", fasteners:"Крепёж", sheet:"Листовые материалы" };
const categorySlugMap = Object.fromEntries(Object.entries(categoryMap).map(([slug,name])=>[name,slug]));

export default function CatalogPage() {
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("Все товары");
  const [sort,setSort]=useState("popular");
  const [favorites,setFavorites]=useState<string[]>([]);
  const [added,setAdded]=useState<string[]>([]);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [inStock,setInStock]=useState(true);
  const [brands,setBrands]=useState<string[]>([]);

  useEffect(()=>{const url=new URL(window.location.href);setQuery(url.searchParams.get("q")||"");setCategory(categoryMap[url.searchParams.get("category")||""]||"Все товары");setFavorites(readFavorites());if(url.searchParams.has("category")||url.hash==="#products"){window.setTimeout(()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth",block:"start"}),120);}},[]);
  const filtered=useMemo(()=>catalogProducts.filter(p=>(category==="Все товары"||p.category===category||(category==="Гипсокартон"&&p.category==="Листовые материалы"))&&(!inStock||p.stock>0)&&(!brands.length||brands.includes(p.brand))&&`${p.brand} ${p.name} ${p.code}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="price-asc"?a.price-b.price:sort==="price-desc"?b.price-a.price:b.popularity-a.popularity),[brands,category,inStock,query,sort]);
  function chooseCategory(name:string){setCategory(name);setFiltersOpen(false);const slug=categorySlugMap[name];history.replaceState(null,"",name==="Все товары"?"/catalog#products":`/catalog?category=${slug}#products`);window.setTimeout(()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth",block:"start"}),0);}
  function toggleFavorite(id:string){setFavorites(current=>{const next=current.includes(id)?current.filter(item=>item!==id):[...current,id];writeFavorites(next);return next;});}
  function addProduct(product:CatalogProduct){const current=readCart();const id=`product-${product.id}`;const existing=current.find(item=>item.id===id);writeCart(existing?current.map(item=>item.id===id?{...item,quantity:item.quantity+1}:item):[...current,{id,title:product.name,price:product.price,quantity:1,image:product.image,detail:`${product.brand} · ${product.unit}`}]);setAdded(value=>[...new Set([...value,product.id])]);}

  return <SiteChrome active="catalog"><div className="inner-canvas catalog-page">
    <nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><span>Каталог</span></nav>
    <section className="catalog-heading"><div><p className="eyebrow">Строительные материалы</p><h1>Каталог</h1><p>Категории, характеристики и реальные остатки — чтобы быстро собрать заказ под объект.</p></div></section>
    <section className="category-directory"><div className="directory-heading"><div><SquaresFour weight="bold"/><span><b>Каталог категорий</b><small>Основные направления ассортимента</small></span></div><Link href="/solutions">Подобрать готовое решение</Link></div><div className="directory-grid">{catalogCategories.map(item=><Link className="directory-card" href={`/catalog?category=${item.slug}#products`} key={item.slug} onClick={event=>{event.preventDefault();chooseCategory(item.name);}}><span><Image alt="" fill sizes="150px" src={item.image}/></span><div><b>{item.name}</b><small>{item.note}</small></div></Link>)}</div></section>
    <div className="catalog-section-head" id="products"><div><p className="eyebrow">Товарная выдача</p><h2>{category}</h2>{query&&<button onClick={()=>setQuery("")} type="button">По запросу «{query}» <X/></button>}</div><div className="catalog-head-actions"><button className="mobile-filter-button" onClick={()=>setFiltersOpen(true)} type="button"><Faders weight="bold"/>Фильтры</button><label>Сортировка<select onChange={e=>setSort(e.target.value)} value={sort}><option value="popular">По популярности</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option></select><CaretDown/></label></div></div>
    <div className="catalog-layout"><aside className={`catalog-filters ${filtersOpen?"is-open":""}`}><button aria-label="Закрыть фильтры" className="filter-close" onClick={()=>setFiltersOpen(false)} type="button"><X/></button><h2>Фильтры</h2><div className="filter-group"><b>Категория</b>{["Все товары",...new Set(catalogProducts.map(p=>p.category))].map(item=><button className={category===item?"is-active":""} key={item} onClick={()=>chooseCategory(item)} type="button"><span/>{item}<em>{item==="Все товары"?catalogProducts.length:catalogProducts.filter(p=>p.category===item).length}</em></button>)}</div><div className="filter-group"><b>Наличие</b><button className={inStock?"is-active":""} onClick={()=>setInStock(!inStock)} type="button"><span/>В наличии</button></div><div className="filter-group"><b>Бренды</b>{[...new Set(catalogProducts.map(p=>p.brand))].map(item=><button className={brands.includes(item)?"is-active":""} key={item} onClick={()=>setBrands(current=>current.includes(item)?current.filter(brand=>brand!==item):[...current,item])} type="button"><span/>{item}</button>)}</div><div className="filter-note"><b>Остатки из МоегоСклада</b><p>Наличие и итоговую стоимость подтвердим перед отгрузкой.</p></div></aside><section className="catalog-results"><div className="catalog-result-meta"><span>{filtered.length} позиции</span><small>Цены указаны за единицу товара</small></div>{filtered.length?<div className="catalog-product-grid">{filtered.map(product=><CatalogProductCard added={added.includes(product.id)} favorite={favorites.includes(product.id)} key={product.id} onAdd={()=>addProduct(product)} onFavorite={()=>toggleFavorite(product.id)} product={product}/>)}</div>:<div className="catalog-empty"><h2>В этой категории витрина ещё формируется</h2><p>Полный ассортимент подключим из МоегоСклада. Пока менеджер подберёт товар по заявке.</p><button onClick={()=>{setCategory("Все товары");setQuery("");setBrands([]);}} type="button">Показать доступные товары</button></div>}</section></div>
  </div></SiteChrome>;
}
