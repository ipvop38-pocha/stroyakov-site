"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, ShoppingCartSimple } from "@phosphor-icons/react";
import { CatalogProduct } from "../catalog/data";

export function CatalogProductCard({ product, favorite, onFavorite, onAdd, added }: { product: CatalogProduct; favorite: boolean; onFavorite: () => void; onAdd: () => void; added: boolean }) {
  return <article className="catalog-product-card"><Link className="catalog-product-image" href={`/product/${product.slug}`}><span className="product-badge">Хит</span><Image alt={product.name} fill sizes="(max-width:767px) 50vw, 25vw" src={product.image}/></Link><button aria-label={favorite ? "Убрать из избранного" : "В избранное"} className={`catalog-heart ${favorite ? "is-active" : ""}`} onClick={onFavorite} type="button"><Heart weight={favorite ? "fill" : "regular"}/></button><div className="catalog-product-copy"><p>{product.brand}</p><Link href={`/product/${product.slug}`}>{product.name}</Link><span><i/>В наличии: {product.stock.toLocaleString("ru-RU")} {product.unit}</span><div><strong>{product.price.toLocaleString("ru-RU")} ₽</strong>{product.oldPrice && <del>{product.oldPrice} ₽</del>}<small>/ {product.unit}</small></div></div><button className={`catalog-add ${added ? "is-added" : ""}`} onClick={onAdd} type="button">{added ? <>В корзине<Check weight="bold"/></> : <>В корзину<ShoppingCartSimple weight="bold"/></>}</button></article>;
}
