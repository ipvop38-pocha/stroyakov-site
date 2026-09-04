"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { CatalogProductCard } from "../components/catalog-product-card";
import { SiteChrome } from "../components/site-chrome";
import { catalogProducts, CatalogProduct } from "../catalog/data";
import { readCart, readFavorites, writeCart, writeFavorites } from "../lib/commerce";

export default function FavoritesPage() {
  const [ids, setIds] = useState<string[]>([]); const [added, setAdded] = useState<string[]>([]);
  useEffect(() => setIds(readFavorites()), []);
  function remove(id:string){const next=ids.filter(item=>item!==id);setIds(next);writeFavorites(next);}
  function add(product:CatalogProduct){if(product.price===null)return;const current=readCart();const id=`product-${product.id}`;writeCart([...current.filter((item)=>item.id!==id),{id,title:product.name,price:product.price,quantity:1,image:product.image,detail:`${product.brand} · ${product.unit}`}]);setAdded(v=>[...v,product.id]);}
  const items=catalogProducts.filter(item=>ids.includes(item.id));
  return <SiteChrome active="favorites"><div className="inner-canvas favorites-page"><nav className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><span>Избранное</span></nav><section className="catalog-heading"><div><p className="eyebrow">Сохранённые товары</p><h1>Избранное</h1><p>Соберите короткий список и добавляйте нужные позиции в корзину.</p></div></section>{items.length?<div className="catalog-product-grid">{items.map(product=><CatalogProductCard added={added.includes(product.id)} favorite key={product.id} onAdd={()=>add(product)} onFavorite={()=>remove(product.id)} product={product}/>)}</div>:<section className="empty-commerce-card"><span><Heart weight="bold"/></span><h2>В избранном пока пусто</h2><p>Сохраняйте товары сердцем — они появятся здесь.</p><Link className="primary-inline" href="/catalog">Перейти в каталог<ArrowRight/></Link></section>}</div></SiteChrome>;
}
