"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChatCircle,
  GridFour,
  Heart,
  List,
  MagnifyingGlass,
  MapPin,
  Phone,
  ShoppingCartSimple,
  User,
  X,
} from "@phosphor-icons/react";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { COMMERCE_CHANGE_EVENT, readCommerceSummary } from "../lib/commerce";

export function SiteChrome({ children, active = "" }: { children: ReactNode; active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [commerce, setCommerce] = useState({ cartCount: 0, cartTotal: 0, favoritesCount: 0 });

  useEffect(() => {
    const refresh = () => setCommerce(readCommerceSummary());
    refresh();
    window.addEventListener(COMMERCE_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(COMMERCE_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    window.location.href = value ? `/catalog/?q=${encodeURIComponent(value)}` : "/catalog/";
  }

  return (
    <main className="site-shell inner-shell">
      <header className="site-header">
        <div className="utility-bar">
          <span><MapPin aria-hidden weight="bold" />Краснодар</span>
          <nav aria-label="Служебная навигация">
            <Link href="/delivery/">Доставка и оплата</Link>
            <Link href="/solutions/">Готовые решения</Link>
            <Link href="/business/">Для бизнеса</Link>
            <Link href="/contacts/">Контакты</Link>
            <a href="tel:+79280446070"><Phone aria-hidden weight="bold" />+7 928 044-60-70</a>
          </nav>
        </div>
        <div className="main-navigation">
          <Link aria-label="На главную" className="header-logo" href="/">
            <Image alt="Строяков — мы снабжаем" height={40} priority src="/assets/logo-header.png" width={144} />
          </Link>
          <Link className="catalog-button" href="/catalog/">Каталог <List aria-hidden weight="bold" /></Link>
          <form className="header-search" onSubmit={submitSearch}>
            <MagnifyingGlass aria-hidden weight="bold" />
            <input aria-label="Поиск по каталогу" onChange={(event) => setQuery(event.target.value)} placeholder="Найти товар, бренд или категорию" value={query} />
          </form>
          <div className="header-actions">
            <Link aria-label="Войти в личный кабинет" href="/account/"><User aria-hidden /><span><small>Профиль</small><b>Войти</b></span></Link>
            <Link aria-label={`Избранное: ${commerce.favoritesCount}`} href="/favorites/"><Heart aria-hidden weight={commerce.favoritesCount ? "fill" : "regular"} /><span><small>Избранное</small><b>{commerce.favoritesCount}</b></span></Link>
            <Link aria-label={`Корзина: ${commerce.cartCount}, ${commerce.cartTotal.toLocaleString("ru-RU")} рублей`} href="/cart/"><ShoppingCartSimple aria-hidden /><span><small>Корзина · {commerce.cartCount}</small><b>{commerce.cartTotal.toLocaleString("ru-RU")} ₽</b></span></Link>
          </div>
          <Link aria-label={`Открыть корзину, товаров: ${commerce.cartCount}`} className="mobile-round-button" href="/cart/"><ShoppingCartSimple aria-hidden weight="bold" />{commerce.cartCount > 0 && <span>{commerce.cartCount}</span>}</Link>
          <button aria-label="Открыть меню" className="mobile-menu-button" onClick={() => setMenuOpen(true)} type="button"><List aria-hidden weight="bold" /></button>
        </div>
        <form className="mobile-search" onSubmit={submitSearch}>
          <MagnifyingGlass aria-hidden weight="bold" />
          <input aria-label="Поиск по каталогу" onChange={(event) => setQuery(event.target.value)} placeholder="Найти товар, бренд или категорию" value={query} />
        </form>
      </header>

      {children}

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Image alt="Строяков — мы снабжаем" height={83} src="/assets/logo-footer.png" width={304} />
            <p>Строительные материалы и готовые решения для дома, ремонта и объекта.</p>
            <a href="tel:+79183410144">+7 918-341-01-44</a>
            <a className="footer-address" href="https://yandex.ru/maps/?text=Краснодар%2C%20Ростовское%20шоссе%2C%2024%20лит.%20А" rel="noreferrer" target="_blank">Краснодар, Ростовское шоссе, 24 лит. А</a>
          </div>
          <FooterColumn title="Каталог" links={[["Сухие смеси", "/catalog/?category=mixes#products"], ["Гипсокартон и листовые", "/catalog/?category=drywall#products"], ["Профили и комплектующие", "/catalog/?category=profiles#products"], ["Утеплители", "/catalog/?category=insulation#products"], ["Все категории", "/catalog/"]]} />
          <FooterColumn title="Покупателям" links={[["Доставка и оплата", "/delivery/"], ["Возврат товара", "/returns/"], ["Готовые решения", "/solutions/"], ["Контакты", "/contacts/"], ["Личный кабинет", "/account/"]]} />
          <FooterColumn title="Для бизнеса" links={[["Комплектация объектов", "/business/assembly/"], ["Спецусловия для бизнеса", "/business/"], ["Работа с застройщиками", "/business/"], ["Поставки по ЮФО", "/business/"], ["Реквизиты", "/documents/"]]} />
        </div>
        <div className="footer-bottom"><span>© 2026 ООО «СТРОЯКОВ»</span><span><Link href="/legal/privacy/">Политика конфиденциальности</Link><span className="footer-separator"> · </span><Link href="/legal/terms/">Пользовательское соглашение</Link></span><span>Информация на сайте не является публичной офертой.</span></div>
      </footer>

      <div className="mobile-bottom-safe" />
      <nav aria-label="Мобильная навигация" className="mobile-bottom-nav">
        <a href="tel:+79183410144"><Phone aria-hidden weight="bold" /><span>Позвонить</span></a>
        <Link href="/contacts/"><ChatCircle aria-hidden weight="bold" /><span>Написать</span></Link>
        <Link className={active === "catalog" ? "mobile-nav-primary" : ""} href="/catalog/"><GridFour aria-hidden weight="bold" /><span>Каталог</span></Link>
        <Link className={active === "favorites" ? "is-active" : ""} href="/favorites/"><Heart aria-hidden weight={commerce.favoritesCount ? "fill" : "bold"} /><span>Избранное</span>{commerce.favoritesCount > 0 && <b>{commerce.favoritesCount}</b>}</Link>
        <Link className={active === "cart" ? "is-active" : ""} href="/cart/"><ShoppingCartSimple aria-hidden weight="bold" /><span>Корзина</span>{commerce.cartCount > 0 && <b>{commerce.cartCount}</b>}</Link>
      </nav>

      {menuOpen && <div className="overlay" role="presentation"><aside aria-label="Мобильное меню" className="side-panel menu-panel">
        <button aria-label="Закрыть меню" className="panel-close" onClick={() => setMenuOpen(false)} type="button"><X aria-hidden weight="bold" /></button>
        <Image alt="Строяков" height={40} src="/assets/logo-header.png" width={144} />
        <h2>Меню</h2>
        {[["Каталог", "/catalog/"], ["Готовые решения", "/solutions/"], ["Доставка и оплата", "/delivery/"], ["Для бизнеса", "/business/"], ["Контакты", "/contacts/"], ["Избранное", "/favorites/"]].map(([label, href]) => <Link href={href} key={label}>{label}<ArrowRight aria-hidden /></Link>)}
        <a href="tel:+79280446070"><Phone aria-hidden weight="bold" />+7 928 044-60-70</a>
      </aside></div>}
    </main>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return <details className="footer-column" open><summary>{title}<span>+</span></summary>{links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}</details>;
}
