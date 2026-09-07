"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Check, Heart, ImageSquare, ShoppingCartSimple } from '@phosphor-icons/react';
import type { CatalogProduct } from '../catalog/data';
import { productPriceText, productStockText } from '../lib/product-presentation';

export function ProductImage({ product, sizes, priority = false }: { product: CatalogProduct; sizes: string; priority?: boolean }) {
  if (product.image) return <Image alt={product.name} fill priority={priority} sizes={sizes} src={product.image}/>;
  return <span className="product-image-pending" role="img" aria-label="Фотография товара готовится">
    <ImageSquare aria-hidden weight="duotone"/><b>{product.brand || product.category}</b><small>Фото готовится</small>
  </span>;
}

export function CatalogProductCard({ product, favorite, onFavorite, onAdd, added }: { product: CatalogProduct; favorite: boolean; onFavorite: () => void; onAdd: () => void; added: boolean }) {
  return <article className="catalog-product-card">
    <Link className={`catalog-product-image ${product.photoStyle === 'approved-studio' ? 'studio-product-image' : ''}`} href={`/product/${product.slug}/`}>
      <ProductImage product={product} sizes="(max-width:767px) 50vw, 25vw"/>
    </Link>
    <button aria-label={favorite ? 'Убрать из избранного' : 'В избранное'} className={`catalog-heart ${favorite ? 'is-active' : ''}`} onClick={onFavorite} type="button"><Heart weight={favorite ? 'fill' : 'regular'}/></button>
    <div className="catalog-product-copy">
      <p>{product.brand || product.productKind}</p><Link href={`/product/${product.slug}/`}>{product.name}</Link>
      <span className={product.stock && product.stock > 0 ? '' : 'stock-unconfirmed'}><i/>{productStockText(product)}</span>
      <div><strong>{productPriceText(product.price)}</strong>{product.oldPrice && <del>{product.oldPrice} ₽</del>}{product.price !== null && <small>/ {product.unit}</small>}</div>
    </div>
    {product.price === null ? <Link className="catalog-add order-request" href={`/contacts/?product=${product.slug}`}>Уточнить цену</Link> : product.stock === null || product.stock <= 0 ? <Link className="catalog-add order-request" href={`/contacts/?product=${product.slug}`}>Под заказ<ShoppingCartSimple weight="bold"/></Link> : <button className={`catalog-add ${added ? 'is-added' : ''}`} onClick={onAdd} type="button">{added ? <>В корзине<Check weight="bold"/></> : <>В корзину<ShoppingCartSimple weight="bold"/></>}</button>}
  </article>;
}
