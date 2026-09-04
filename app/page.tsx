"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChatCircle,
  Check,
  ClipboardText,
  Cube,
  GridFour,
  Gauge,
  Headset,
  Heart,
  List,
  MagnifyingGlass,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingCartSimple,
  Truck,
  User,
  X,
} from "@phosphor-icons/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { catalogProducts, CatalogProduct as Product } from "./catalog/data";
import { readCart, readFavorites, writeCart, writeFavorites } from "./lib/commerce";

const categories = [
  { label: "Сухие смеси", image: "/assets/categories/dry-mixes.png", href: "/catalog?category=mixes#products" },
  { label: "Гипсокартон", image: "/assets/categories/drywall.png", href: "/catalog?category=drywall#products" },
  { label: "Профили", image: "/assets/categories/profiles.png", href: "/catalog?category=profiles#products" },
  { label: "Утеплители", image: "/assets/categories/insulation.png", href: "/catalog?category=insulation#products" },
  { label: "Кирпич и блоки", image: "/assets/categories/bricks.png", href: "/catalog?category=bricks#products" },
  { label: "Крепёж", image: "/assets/categories/fasteners.png", href: "/catalog?category=fasteners#products" },
  { label: "Все категории", image: "/assets/categories/all.png", href: "/catalog" },
];

const products: Product[] = catalogProducts;

const manufacturers = [
  ["Danogips", "ГКЛ и шпаклёвки", "/assets/brands/danogips.png"],
  ["Русгипс", "ГКЛ и гипсовые смеси", "/assets/brands/rusgips.png"],
  ["Ильский строитель", "Смеси для наружной отделки", "/assets/brands/ilskiy.png"],
  ["РОКС", "Штукатурные смеси", "/assets/brands/roks.png"],
  ["Основит", "Смеси и системы", "/assets/brands/osnovit.png"],
  ["ЕС", "Смеси для отделочных работ", "/assets/brands/es.png"],
  ["ТЕХНОНИКОЛЬ", "Мембраны и теплоизоляция", "/assets/brands/technonicol.png"],
  ["ПЕНОПЛЭКС", "Теплоизоляция", "/assets/brands/penoplex.png"],
  ["IZOLIFE", "Каменная вата", "/assets/brands/izolife.png"],
  ["ВОЛМА", "ГКЛ и строительные смеси", "/assets/brands/volma.png"],
];

const serviceCards = [
  {
    title: "Рассчитаем количество",
    description: "По площади, размерам или готовому списку.",
    image: "/assets/services/calculation.png",
  },
  {
    title: "Подберём товары",
    description: "По задаче, бюджету и наличию.",
    image: "/assets/services/products.png",
  },
  {
    title: "Соберём заказ",
    description: "Объединим материалы в одну заявку и подготовим к выдаче.",
    image: "/assets/services/order.png",
  },
  {
    title: "Доставим на объект",
    description: "Подберём транспорт и согласуем удобное время.",
    image: "/assets/services/delivery.png",
  },
];

const advantages = [
  { icon: Truck, mobileIcon: Truck, title: "Своя логистика", mobileTitle: "Доставка по ЮФО", text: "Доставляем быстро и точно в удобное для вас время" },
  { icon: ClipboardText, mobileIcon: ClipboardText, title: "Реальные остатки", mobileTitle: "Контроль качества", text: "Актуальные остатки 24/7 на складе и в пути" },
  { icon: Cube, mobileIcon: Gauge, title: "Широкий ассортимент", mobileTitle: "Выгодные цены", text: "10 000+ товаров для всех этапов строительства" },
  { icon: Headset, mobileIcon: Headset, title: "Решение под задачу", mobileTitle: "Решение под задачу", text: "Подберём материалы под ваш проект" },
];

const pageRoutes: Record<string, string> = {
  "Каталог": "/catalog",
  "Все категории": "/catalog",
  "Готовые решения": "/solutions",
  "Доставка и оплата": "/delivery",
  "Для бизнеса": "/business",
  "Контакты": "/contacts",
  "Комплектация объектов": "/business/assembly",
  "Личный кабинет": "/account",
  "Избранное": "/favorites",
  "Возврат товара": "/returns",
  "Реквизиты": "/documents",
  "Сухие смеси": "/catalog?category=mixes#products",
  "Гипсокартон и листовые": "/catalog?category=drywall#products",
  "Профили и крепёж": "/catalog?category=profiles#products",
  "Утеплители": "/catalog?category=insulation#products",
  "Кирпичи и блоки": "/catalog?category=bricks#products",
  "Спецусловия для бизнеса": "/business",
  "Работа с застройщиками": "/business",
  "Поставки по ЮФО": "/business",
};

const formatPrice = (value: number) => new Intl.NumberFormat("ru-RU").format(value);

function pluralize(value: number, one: string, few: string, many: string) {
  const lastTwo = value % 100;
  const last = value % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function PrimaryButton({ children, onClick, type = "button", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button className={`primary-button ${className}`} onClick={onClick} type={type}>
      <span>{children}</span>
      <ArrowRight aria-hidden weight="bold" />
    </button>
  );
}

function ProductCard({ product, favorite, onFavorite, onAdd }: {
  product: Product;
  favorite: boolean;
  onFavorite: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="product-card">
      <div className="product-media">
        <span className="product-badge">Хит</span>
        <button
          aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
          className={`favorite-button ${favorite ? "is-active" : ""}`}
          onClick={onFavorite}
          type="button"
        >
          <Heart aria-hidden weight={favorite ? "fill" : "regular"} />
        </button>
        <Image alt={product.name} fill sizes="(max-width: 767px) 294px, 244px" src={product.image} />
      </div>
      <div className="product-copy">
        <p className="product-brand">{product.brand}</p>
        <h3>{product.name}</h3>
        <p className="product-stock"><span />В наличии: {product.stock} {pluralize(product.stock, "лист", "листа", "листов")}</p>
        <div className="product-price-row">
          <strong>{formatPrice(product.price)} ₽</strong>
          {product.oldPrice && <del>{formatPrice(product.oldPrice)} ₽</del>}
          <small>/ {product.unit}</small>
        </div>
      </div>
      <button className="add-button" onClick={onAdd} type="button">
        В корзину <ShoppingCartSimple aria-hidden weight="bold" />
      </button>
    </article>
  );
}

function SearchResults({ items, onSelect }: { items: Product[]; onSelect: (product: Product) => void }) {
  return (
    <div className="search-results">
      {items.length ? items.map((product) => (
        <button key={product.id} onMouseDown={() => onSelect(product)} type="button">
          <span><b>{product.name}</b><small>{product.brand} · в наличии</small></span>
          <strong>{formatPrice(product.price)} ₽</strong>
        </button>
      )) : <p>По вашему запросу ничего не найдено</p>}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [area, setArea] = useState(12);
  const [phone, setPhone] = useState("");
  const [formState, setFormState] = useState<"idle" | "error" | "success">("idle");
  const [toast, setToast] = useState("");

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products.slice(0, 3);
    return products.filter((product) => `${product.brand} ${product.name}`.toLowerCase().includes(needle)).slice(0, 4);
  }, [query]);
  const drywallSheets = Math.ceil((area * 2) / 3);
  const screwCount = Math.ceil((area * 40) / 50) * 50;

  useEffect(() => {
    const stored = readCart();
    setCartCount(stored.reduce((sum, item) => sum + (item.quantity || 1), 0));
    setCartTotal(stored.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0));
    setFavorites(readFavorites());
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function addProduct(product: Product) {
    setCartCount((count) => count + 1);
    setCartTotal((total) => total + product.price);
    const stored = readCart();
    const id = `product-${product.id}`;
    const existing = stored.find((item) => item.id === id);
    writeCart(existing ? stored.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item) : [...stored, { id, title: product.name, price: product.price, quantity: 1, image: product.image, detail: `${product.brand} · ${product.unit}` }]);
    notify(`${product.brand}: товар добавлен в корзину`);
  }

  function addSolution() {
    setCartCount((count) => count + 6);
    setCartTotal((total) => total + Math.round(area * 1850));
    const stored = readCart();
    const payload = { id: "gkl-partition", title: "Перегородка из ГКЛ", price: Math.round(area * 1120), quantity: 1, image: "/assets/solutions/partition.jpg", detail: `${area} м² · Стандарт C111` };
    writeCart([...stored.filter((item) => item.id !== payload.id), payload]);
    notify(`Комплект C111 на ${area} м² добавлен в корзину`);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeFavorites(next);
      return next;
    });
  }

  function submitCalculation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setFormState("error");
      return;
    }
    setFormState("success");
    notify("Заявка принята — специалист свяжется с вами");
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="utility-bar">
          <span><MapPin aria-hidden weight="bold" />Краснодар</span>
          <nav aria-label="Служебная навигация">
            <button onClick={() => { window.location.href = "/delivery"; }} type="button">Доставка и оплата</button>
            <button onClick={() => { window.location.href = "/solutions"; }} type="button">Готовые решения</button>
            <button onClick={() => { window.location.href = "/business"; }} type="button">Для бизнеса</button>
            <button onClick={() => { window.location.href = "/contacts"; }} type="button">Контакты</button>
            <a href="tel:+79280446070"><Phone aria-hidden weight="bold" />+7 928 044-60-70</a>
          </nav>
        </div>

        <div className="main-navigation">
          <button aria-label="На главную" className="header-logo" onClick={() => scrollToSection("top")} type="button">
            <Image alt="Строяков — мы снабжаем" height={40} priority src="/assets/logo-header.png" width={144} />
          </button>
          <button className="catalog-button" onClick={() => { window.location.href = "/catalog"; }} type="button">
            Каталог <List aria-hidden weight="bold" />
          </button>
          <div className="header-search">
            <MagnifyingGlass aria-hidden weight="bold" />
            <input
              aria-label="Поиск по каталогу"
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => { if (event.key === "Enter") window.location.href = `/catalog?q=${encodeURIComponent(query.trim())}`; }}
              placeholder="Найти товар, бренд или категорию"
              value={query}
            />
            {searchOpen && <SearchResults items={suggestions} onSelect={(product) => { window.location.href = `/product/${product.slug}`; }} />}
          </div>
          <div className="header-actions">
            <button aria-label="Войти в личный кабинет" onClick={() => notify("Вход в кабинет подключим на этапе авторизации")} type="button">
              <User aria-hidden />
              <span><small>Профиль</small><b>Войти</b></span>
            </button>
            <button aria-label={`Избранное, товаров: ${favorites.length}`} onClick={() => { window.location.href = "/favorites"; }} type="button">
              <Heart aria-hidden weight={favorites.length ? "fill" : "regular"} />
              <span><small>Избранное</small><b>{favorites.length}</b></span>
            </button>
            <button aria-label={`Корзина: ${cartCount} ${pluralize(cartCount, "товар", "товара", "товаров")}, на сумму ${formatPrice(cartTotal)} рублей`} onClick={() => setCartOpen(true)} type="button">
              <ShoppingCartSimple aria-hidden />
              <span><small>Корзина</small><b>{formatPrice(cartTotal)} ₽</b></span>
            </button>
          </div>
          <button aria-label="Открыть корзину" className="mobile-round-button" onClick={() => setCartOpen(true)} type="button">
            <ShoppingCartSimple aria-hidden weight="bold" />
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
          <button aria-label="Открыть меню" className="mobile-menu-button" onClick={() => setMenuOpen(true)} type="button">
            <List aria-hidden weight="bold" />
          </button>
        </div>

        <div className="mobile-search">
          <MagnifyingGlass aria-hidden weight="bold" />
          <input
            aria-label="Поиск по каталогу"
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => { if (event.key === "Enter") window.location.href = `/catalog?q=${encodeURIComponent(query.trim())}`; }}
            placeholder="Найти товар, бренд или категорию"
            value={query}
          />
          {searchOpen && <SearchResults items={suggestions} onSelect={(product) => { window.location.href = `/product/${product.slug}`; }} />}
        </div>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-scene">
          <picture>
            <source media="(max-width: 767px)" srcSet="/assets/hero-mobile-v2.png" />
            <Image alt="Бобёр Строяков на складе строительных материалов" fill priority sizes="(max-width: 767px) 100vw, 70vw" src="/assets/hero-scene.png" />
          </picture>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Материалы для стройки</p>
          <h1><span>Строим</span><b>Решения</b></h1>
          <span className="brush-line" aria-hidden />
          <p className="hero-description">Подберём материалы под задачу, проверим наличие и доставим на объект.</p>
          <div className="hero-actions">
            <PrimaryButton onClick={() => scrollToSection("calculation")}>Подобрать материалы</PrimaryButton>
            <button className="text-link" onClick={() => scrollToSection("catalog")} type="button">Открыть каталог <ArrowRight aria-hidden className="mobile-link-icon" weight="bold" /></button>
          </div>
        </div>
        <div className="advantages-band">
          {advantages.map(({ icon: Icon, mobileIcon: MobileIcon, title, mobileTitle, text }) => (
            <article key={title}>
              <span className="advantage-icon"><Icon aria-hidden className="desktop-advantage-symbol" weight="bold" /><MobileIcon aria-hidden className="mobile-advantage-symbol" weight="bold" /></span>
              <div><h2><span className="desktop-copy">{title}</span><span className="mobile-copy">{mobileTitle}</span></h2><p>{text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section categories-section" id="catalog">
        <h2 className="section-title compact">Популярные категории</h2>
        <div className="horizontal-viewport category-viewport">
          <div className="category-track">
            {categories.map((category) => (
              <Link className="category-card" href={category.href} key={category.label}>
                <span className="category-image"><Image alt="" fill sizes="150px" src={category.image} /></span>
                <strong>{category.label}</strong>
                <ArrowRight aria-hidden weight="bold" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section products-section" id="products">
        <h2 className="section-title compact">Популярные товары</h2>
        <div className="horizontal-viewport product-viewport">
          <div className="product-track">
            {products.map((product) => (
              <ProductCard
                favorite={favorites.includes(product.id)}
                key={product.id}
                onAdd={() => addProduct(product)}
                onFavorite={() => toggleFavorite(product.id)}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section solutions-section" id="solutions">
        <div className="section-heading-row">
          <div>
            <h2 className="section-title"><span className="desktop-copy">Готовые решения под вашу задачу</span><span className="mobile-copy">Готовые решения</span></h2>
            <p><span className="desktop-copy">Не набор случайных товаров, а совместимая система с расчётом расхода и возможностью замены.</span><span className="mobile-copy">Комплекты материалов под задачу — с расчётом расхода и возможностью замены.</span></p>
          </div>
          <span className="outline-pill">Рассчитано комплектом</span>
        </div>
        <div className="horizontal-viewport solution-viewport">
          <div className="solution-layout">
            <article className="featured-solution">
              <div className="solution-information">
                <span className="soft-pill">Популярное решение</span>
                <h3>Перегородка из ГКЛ</h3>
                <p><span className="desktop-copy">Соберём каркас, обшивку, шумоизоляцию и материалы для заделки швов — всё совместимо между собой.</span><span className="mobile-copy">Каркас, обшивка, шумоизоляция и материалы для швов — одним комплектом.</span></p>
                <div className="area-row">
                  <span><b>Площадь стены</b><small>без проёмов</small></span>
                  <div className="area-control">
                    <button aria-label="Уменьшить площадь" onClick={() => setArea((value) => Math.max(1, value - 1))} type="button"><Minus aria-hidden weight="bold" /></button>
                    <strong>{area} м²</strong>
                    <button aria-label="Увеличить площадь" onClick={() => setArea((value) => Math.min(100, value + 1))} type="button"><Plus aria-hidden weight="bold" /></button>
                  </div>
                  <span className="position-pill">6 позиций</span>
                </div>
                <div className="kit-composition">
                  <div className="kit-heading"><b>Предварительный состав</b><small>на {area} м²</small></div>
                  <ul>
                    <li><span>ГКЛ 12,5 мм</span><b>{drywallSheets} {pluralize(drywallSheets, "лист", "листа", "листов")}</b></li>
                    <li><span>Акустическая вата</span><b>{(area * 1.05).toFixed(1)} м²</b></li>
                    <li><span>ПН 75×40</span><b>{Math.max(2, Math.ceil(area / 4))} шт.</b></li>
                    <li><span>Саморезы TN25</span><b>{screwCount} шт.</b></li>
                    <li><span>ПС 75×50</span><b>{drywallSheets} шт.</b></li>
                    <li><span>Шпаклёвка + лента</span><b>комплект</b></li>
                  </ul>
                </div>
                <p className="replacement-note"><span /><span className="desktop-copy">Каждый товар можно заменить совместимым аналогом</span><span className="mobile-copy">Любой товар можно заменить аналогом</span></p>
                <div className="solution-actions">
                <PrimaryButton onClick={() => { window.location.href = "/solutions/gkl-partition"; }}>Рассчитать комплект</PrimaryButton>
                  <button className="ghost-link" onClick={() => { window.location.href = "/solutions/gkl-partition"; }} type="button">Что входит в решение <ArrowRight aria-hidden weight="bold" /></button>
                </div>
              </div>
              <div className="featured-solution-image">
                <Image alt="Конструкция перегородки из гипсокартона по системе C111" fill sizes="(max-width: 767px) 314px, 388px" src="/assets/solutions/partition.jpg" />
                <span>Система C111</span>
              </div>
            </article>

            <div className="secondary-solutions">
              <article className="secondary-solution">
                <div className="secondary-solution-image"><Image alt="Слои подготовки стен под покраску" fill sizes="180px" src="/assets/solutions/paint-prep.jpg" /></div>
                <div><h3>Стены под покраску</h3><p>От основания до гладкого финиша — под тип стены и требуемое качество.</p><span className="soft-pill">4 позиции</span><button onClick={() => { window.location.href = "/solutions/paint-prep"; }} type="button">Смотреть решение <ArrowRight aria-hidden weight="bold" /></button></div>
              </article>
              <article className="secondary-solution">
                <div className="secondary-solution-image"><Image alt="Слои утепления пола плитами XPS" fill sizes="180px" src="/assets/solutions/xps-floor.jpg" /></div>
                <div><h3>Утепление пола XPS</h3><p>Плиты XPS, разделительная плёнка, армирование и материалы для стяжки.</p><span className="soft-pill">5 позиций</span><button onClick={() => { window.location.href = "/solutions/xps-floor"; }} type="button">Смотреть решение <ArrowRight aria-hidden weight="bold" /></button></div>
              </article>
              <button className="all-solutions-button" onClick={() => { window.location.href = "/solutions"; }} type="button">Все готовые решения <ArrowRight aria-hidden weight="bold" /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="section services-section" id="business">
        <div className="section-heading-row"><div><h2 className="section-title"><span className="desktop-copy">Поможем со снабжением объекта</span><span className="mobile-copy">Поможем со снабжением</span></h2><p>Расчёт, подбор, комплектация и доставка — одной заявкой.</p></div></div>
        <div className="services-layout">
          <article className="service-lead-card">
            <div>
              <h3>Соберём заказ под вашу задачу</h3>
              <p>Пришлите список, фото или размеры. Рассчитаем количество, подберём товары и организуем доставку.</p>
              <small>Фото, таблица или смета — подойдёт любой формат.</small>
              <PrimaryButton onClick={() => scrollToSection("calculation")}>Рассчитать заказ</PrimaryButton>
            </div>
            <Image alt="Специалист Строяков по комплектации объектов" height={348} src="/assets/services/manager.png" width={217} />
          </article>
          <div className="services-grid">
            {serviceCards.map((service) => (
              <button className="service-card" key={service.title} onClick={() => scrollToSection("calculation")} type="button">
                <span><h3>{service.title}</h3><p>{service.description}</p></span>
                <span className="service-image"><Image alt="" fill sizes="180px" src={service.image} /></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section manufacturers-section">
        <div className="section-heading-row">
          <div><h2 className="section-title">Популярные производители</h2><p><span className="desktop-copy">Выбирайте товары знакомых брендов — от гипсокартона и смесей до утеплителей.</span><span className="mobile-copy">Товары проверенных брендов — от ГКЛ и смесей до утеплителей.</span></p></div>
          <button className="red-link desktop-only" onClick={() => notify("Полный список производителей откроется в каталоге")} type="button">Все производители</button>
        </div>
        <div className="manufacturer-grid">
          {manufacturers.map(([name, category, image]) => (
            <button className="manufacturer-card" key={name} onClick={() => { setQuery(name); scrollToSection("products"); }} type="button">
              <span className="manufacturer-logo"><Image alt={name} fill sizes="220px" src={image} /></span>
              <small>{category}</small>
            </button>
          ))}
        </div>
        <button className="all-manufacturers-mobile" onClick={() => notify("Полный список производителей откроется в каталоге")} type="button">Все производители <ArrowRight aria-hidden weight="bold" /></button>
      </section>

      <section aria-label="География поставок и партнёры Строяков" className="trusted-section">
        <picture>
          <source media="(max-width: 767px)" srcSet="/assets/trusted/mobile.png" />
          <Image alt="Нам доверяют застройщики, подрядчики и объекты по всему Югу России" height={560} src="/assets/trusted/desktop.png" width={1440} />
        </picture>
      </section>

      <section className="calculation-section" id="calculation">
        <div className="calculation-card">
          <div className="calculation-copy">
            <p className="eyebrow">Расчёт и подбор материалов</p>
            <h2>Рассчитаем материалы<br />под вашу задачу</h2>
            <p>Опишите объект или пришлите список. Специалист уточнит детали, рассчитает количество и предложит подходящие варианты.</p>
            <small>Расчёт количества&nbsp; · &nbsp;Подбор под бюджет&nbsp; · &nbsp;Аналоги в наличии</small>
          </div>
          <div className="calculation-visual"><Image alt="Инструменты и смета для расчёта материалов" fill sizes="300px" src="/assets/calculation-visual.png" /></div>
          <form className={`calculation-form ${formState}`} onSubmit={submitCalculation}>
            {formState === "success" ? (
              <div className="form-success"><span><Check aria-hidden weight="bold" /></span><h3>Заявка принята</h3><p>Специалист уточнит задачу и подготовит расчёт.</p><button onClick={() => setFormState("idle")} type="button">Отправить ещё одну</button></div>
            ) : (
              <>
                <h3>Получите расчёт и подбор</h3>
                <label htmlFor="calculation-phone">Телефон</label>
                <input id="calculation-phone" onChange={(event) => { setPhone(event.target.value); setFormState("idle"); }} placeholder="+7 (___) ___-__-__" value={phone} />
                {formState === "error" && <p className="field-error">Введите корректный номер телефона</p>}
                <PrimaryButton className="form-submit" type="submit">Получить расчёт</PrimaryButton>
                <small>Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных.</small>
              </>
            )}
          </form>
        </div>
      </section>

      <footer className="site-footer" id="contacts">
        <div className="footer-main">
          <div className="footer-brand">
            <Image alt="Строяков — мы снабжаем" height={83} src="/assets/logo-footer.png" width={304} />
            <p>Строительные материалы и готовые решения для дома, ремонта и объекта.</p>
            <a href="tel:+79183410144">+7 918-341-01-44</a>
            <a className="footer-address" href="https://yandex.ru/maps/?text=Краснодар%2C%20Ростовское%20шоссе%2C%2024%20лит.%20А" rel="noreferrer" target="_blank">Краснодар, Ростовское шоссе, 24 лит. А</a>
          </div>
          {[
            ["Каталог", "Сухие смеси", "Гипсокартон и листовые", "Профили и крепёж", "Утеплители", "Кирпичи и блоки", "Все категории"],
            ["Покупателям", "Доставка и оплата", "Возврат товара", "Готовые решения", "Контакты", "Личный кабинет"],
            ["Для бизнеса", "Комплектация объектов", "Спецусловия для бизнеса", "Работа с застройщиками", "Поставки по ЮФО", "Реквизиты"],
          ].map(([title, ...links]) => (
            <details className="footer-column" key={title} open>
              <summary>{title}<Plus aria-hidden /></summary>
              {links.map((link) => <button key={link} onClick={() => pageRoutes[link] ? window.location.href = pageRoutes[link] : notify(`${link}: раздел в следующем блоке переноса`)} type="button">{link}</button>)}
            </details>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 ООО «СТРОЯКОВ»</span>
          <span><Link href="/legal/privacy">Политика конфиденциальности</Link><span className="footer-separator"> · </span><Link href="/legal/terms">Пользовательское соглашение</Link></span>
          <span>Информация на сайте не является публичной офертой.</span>
        </div>
      </footer>

      <div className="mobile-bottom-safe" />
      <nav aria-label="Мобильная навигация" className="mobile-bottom-nav">
        <a href="tel:+79183410144"><Phone aria-hidden weight="bold" /><span>Позвонить</span></a>
        <button onClick={() => scrollToSection("calculation")} type="button"><ChatCircle aria-hidden weight="bold" /><span>Написать</span></button>
        <button className="mobile-nav-primary" onClick={() => scrollToSection("catalog")} type="button"><GridFour aria-hidden weight="bold" /><span>Каталог</span></button>
        <button onClick={() => { window.location.href = "/favorites"; }} type="button"><Heart aria-hidden weight={favorites.length ? "fill" : "bold"} /><span>Избранное</span></button>
        <button onClick={() => setCartOpen(true)} type="button"><ShoppingCartSimple aria-hidden weight="bold" /><span>Корзина</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
      </nav>

      {menuOpen && (
        <div className="overlay" role="presentation">
          <aside aria-label="Мобильное меню" className="side-panel menu-panel">
            <button aria-label="Закрыть меню" className="panel-close" onClick={() => setMenuOpen(false)} type="button"><X aria-hidden weight="bold" /></button>
            <Image alt="Строяков" height={40} src="/assets/logo-header.png" width={144} />
            <h2>Меню</h2>
            {[
              ["Каталог", "/catalog"],
              ["Готовые решения", "/solutions"],
              ["Доставка и оплата", "/delivery"],
              ["Для бизнеса", "/business"],
              ["Контакты", "/contacts"],
            ].map(([label, href]) => (
              <button key={label} onClick={() => { setMenuOpen(false); window.location.href = href; }} type="button">{label}<ArrowRight aria-hidden /></button>
            ))}
            <button onClick={() => { setMenuOpen(false); window.location.href = "/favorites"; }} type="button">Избранное{favorites.length ? ` · ${favorites.length}` : ""}<Heart aria-hidden weight={favorites.length ? "fill" : "bold"} /></button>
            <a href="tel:+79280446070"><Phone aria-hidden weight="bold" />+7 928 044-60-70</a>
          </aside>
        </div>
      )}

      {cartOpen && (
        <div className="overlay" role="presentation">
          <aside aria-label="Корзина" className="side-panel cart-panel">
            <button aria-label="Закрыть корзину" className="panel-close" onClick={() => setCartOpen(false)} type="button"><X aria-hidden weight="bold" /></button>
            <span className="cart-panel-icon"><ShoppingCartSimple aria-hidden weight="bold" /></span>
            <h2>{cartCount ? "Корзина собрана" : "Корзина пуста"}</h2>
            <p>{cartCount ? `${cartCount} ${pluralize(cartCount, "позиция", "позиции", "позиций")} на сумму ${formatPrice(cartTotal)} ₽. Состав можно уточнить перед оформлением.` : "Добавьте товар или готовый комплект — он появится здесь."}</p>
            {cartCount > 0 && <PrimaryButton onClick={() => { setCartOpen(false); window.location.href = "/cart"; }}>Перейти к оформлению</PrimaryButton>}
            <button className="secondary-button" onClick={() => setCartOpen(false)} type="button">Продолжить покупки</button>
          </aside>
        </div>
      )}

      {toast && <div aria-live="polite" className="toast"><Check aria-hidden weight="bold" />{toast}</div>}
      <span id="delivery" />
    </main>
  );
}
