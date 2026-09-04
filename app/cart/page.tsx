"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Minus, Plus, ShoppingCartSimple, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { SiteChrome } from "../components/site-chrome";
import { readCart, writeCart } from "../lib/commerce";

export type CartItem = { id: string; title: string; price: number; quantity: number; image: string; detail: string };

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => { setItems(readCart()); setLoaded(true); }, []);
  useEffect(() => { if (loaded) writeCart(items); }, [items, loaded]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const discount = promoApplied ? Math.round(subtotal * 0.05) : 0;

  function update(id: string, delta: number) { setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)); }

  return <SiteChrome active="cart"><div className="inner-canvas cart-page">
    <nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><span>Корзина</span></nav>
    <div className="cart-title-row"><h1>Корзина</h1><span>{items.length} товара</span></div>
    {!loaded ? <div className="empty-commerce-card">Загружаем корзину…</div> : items.length === 0 ? <section className="empty-commerce-card"><span><ShoppingCartSimple weight="bold" /></span><h2>Корзина пока пуста</h2><p>Добавьте товары из каталога или рассчитайте готовый комплект.</p><Link className="primary-inline" href="/solutions">Выбрать решение<ArrowRight /></Link></section> : <div className="cart-layout">
      <section className="cart-items"><button className="clear-cart" onClick={() => setItems([])} type="button">Очистить корзину</button>{items.map((item) => <article className="cart-item" key={item.id}><div className="cart-item-image"><Image alt={item.title} fill sizes="160px" src={item.image} /></div><div className="cart-item-copy"><p>Готовое решение</p><h2>{item.title}</h2><span>{item.detail}</span><small>Состав проверяется перед подтверждением</small></div><div className="cart-item-actions"><div><button aria-label="В избранное" type="button"><Heart /></button><button aria-label="Удалить" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} type="button"><Trash /></button></div><strong>{new Intl.NumberFormat("ru-RU").format(item.price)} ₽</strong><div className="cart-quantity"><button aria-label="Уменьшить" onClick={() => update(item.id, -1)} type="button"><Minus /></button><b>{item.quantity}</b><button aria-label="Увеличить" onClick={() => update(item.id, 1)} type="button"><Plus /></button></div></div></article>)}</section>
      <aside className="order-summary"><h2>Ваш заказ</h2><dl><div><dt>Товары, {items.length} поз.</dt><dd>{new Intl.NumberFormat("ru-RU").format(subtotal)} ₽</dd></div>{discount > 0 && <div className="discount-row"><dt>Скидка</dt><dd>−{new Intl.NumberFormat("ru-RU").format(discount)} ₽</dd></div>}<div><dt>Доставка</dt><dd>После адреса</dd></div></dl><div className="promo-row"><input aria-label="Промокод" onChange={(event) => setPromo(event.target.value)} placeholder="Промокод" value={promo}/><button onClick={() => setPromoApplied(promo.trim().length > 2)} type="button">Применить</button></div><div className="summary-total"><span>Итого</span><strong>{new Intl.NumberFormat("ru-RU").format(subtotal - discount)} ₽</strong></div><Link className="primary-inline" href="/checkout">Перейти к оформлению<ArrowRight /></Link><p>Доставку и разгрузку рассчитаем после заполнения адреса.</p></aside>
    </div>}
  </div></SiteChrome>;
}
