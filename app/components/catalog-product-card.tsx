"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Check, Heart, ShoppingCartSimple } from '@phosphor-icons/react';
import type { CatalogProduct } from '../catalog/data';
import { productPriceText, productStockText } from '../lib/product-presentation';

export function CatalogProductCard({ product, favorite, onFavorite, onAdd, added }: { product: CatalogProduct; favorite: boolean; onFavorite: () => void; onAdd: () => void; added: boolean }) {
  return <article className="catalog-product-card">
    <Link className={`catalog-product-image ${product.photoStyle === 'approved-studio' ? 'studio-product-image' : ''}`} href={`/product/${product.slug}/`}>
      <Image alt={product.name} fill sizes="(max-width:767px) 50vw, 25vw" src={product.image}/>
    </Link>
    <button aria-label={favorite ? 'Убрать из избранного' : 'В избранное'} className={`catalog-heart ${favorite ? 'is-active' : ''}`} onClick={onFavorite} type="button"><Heart weight={favorite ? 'fill' : 'regular'}/></button>
    <div className="catalog-product-copy">
      <p>{product.brand}</p><Link href={`/product/${product.slug}/`}>{product.name}</Link>
      <span className={product.stock && product.stock > 0 ? '' : 'stock-unconfirmed'}><i/>{productStockText(product)}</span>
      <div><strong>{productPriceText(product.price)}</strong>{product.oldPrice && <del>{product.oldPrice} ₽</del>}{product.price !== null && <small>/ {product.unit}</small>}</div>
    </div>
    {product.price !== null ? <button className={`catalog-add ${added ? 'is-added' : ''}`} onClick={onAdd} type="button">{added ? <>В корзине<Check weight="bold"/></> : <>В корзину<ShoppingCartSimple weight="bold"/></>}</button> : <Link className="catalog-add" href="/contacts/">Уточнить цену</Link>}
  </article>;
}
