"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Calculator, CaretDown, Check, Heart, Minus, Package, Plus, SealCheck, ShoppingCartSimple, Storefront, Truck } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { CatalogProductCard } from "../../components/catalog-product-card";
import { SiteChrome } from "../../components/site-chrome";
import { catalogProducts, catalogStockMoment, categoryUrl, CatalogProduct } from "../../catalog/data";
import { readCart, readFavorites, writeCart, writeFavorites } from "../../lib/commerce";
import { calculateProductQuantity, productPriceText, productStockText, productQuantityText } from "../../lib/product-presentation";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const product = catalogProducts.find(item => item.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [area, setArea] = useState(12);
  const [reserve, setReserve] = useState(10);
  const [thickness, setThickness] = useState(10);
  const [tab, setTab] = useState<"description" | "specs">("description");
  const [relatedAdded, setRelatedAdded] = useState<string[]>([]);
  const [relatedFavorites, setRelatedFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!product) return;
    const ids = readFavorites();
    setFavorite(ids.includes(product.id));
    setRelatedFavorites(ids);
    setQuantity(1);
    setAdded(false);
    setCalcOpen(false);
    setThickness(product.calculator?.type === "dry-mix" ? product.calculator.defaultThickness : 10);
  }, [product]);

  if (!product) return <SiteChrome><div className="not-found-card"><h1>Товар не найден</h1><Link className="primary-inline" href="/catalog/">Вернуться в каталог<ArrowRight/></Link></div></SiteChrome>;
  const selectedProduct = product;
  const calculator = product.calculator;
  const calculated = calculateProductQuantity(calculator, area, reserve, thickness);
  const variants = product.variantGroup ? catalogProducts.filter(item => item.variantGroup === product.variantGroup) : [];
  const related = catalogProducts.filter(item => item.id !== product.id && item.category === product.category).slice(0, 3);
  const stockDate = catalogStockMoment.slice(0, 10).split("-").reverse().join(".");
  const hasStock = product.stock !== null && product.stock > 0;

  function toggleFavorite() {
    const ids = readFavorites();
    const next = ids.includes(selectedProduct.id) ? ids.filter(id => id !== selectedProduct.id) : [...ids, selectedProduct.id];
    writeFavorites(next);
    setFavorite(next.includes(selectedProduct.id));
    setRelatedFavorites(next);
  }
  function add(item: CatalogProduct = selectedProduct, count = quantity) {
    if (item.price === null || !Number.isFinite(count) || count < 1) return;
    const current = readCart();
    const id = `product-${item.id}`;
    const existing = current.find(entry => entry.id === id);
    writeCart([...current.filter(entry => entry.id !== id), { id, title: item.name, price: item.price, quantity: (existing?.quantity || 0) + count, image: item.image, detail: `${item.brand} · ${item.unit}` }]);
    if (item.id === selectedProduct.id) setAdded(true);
    else setRelatedAdded(ids => [...ids, item.id]);
  }

  return <SiteChrome><div className="inner-canvas product-page">
    <nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><Link href="/catalog/">Каталог</Link><span>/</span><Link href={categoryUrl(product.category)}>{product.category}</Link><span>/</span><span>{product.name}</span></nav>
    <section className="product-detail-layout">
      <div className="product-gallery-wrap single-photo">
        <div className={`product-gallery ${product.photoStyle === "approved-studio" ? "studio-product-image" : ""}`}>
          <Image alt={product.name} fill priority sizes="(max-width:767px) 100vw, 50vw" src={product.image}/>
        </div>
        <p className="product-photo-note">Внешний вид упаковки может отличаться в зависимости от партии.</p>
      </div>
      <div className="product-info">
        <div className="product-brand-row"><p className="card-eyebrow">{product.brand}</p><span>Код: {product.code}</span></div>
        <h1>{product.name}</h1>
        <div className={`product-stock-large ${hasStock ? "" : "stock-unconfirmed"}`}><span/><b>{productStockText(product)}</b><small>Свободный остаток на {stockDate}, {catalogStockMoment.slice(11, 16)} мск. Подтвердим перед оплатой.</small></div>
        {variants.length > 1 && <div className="product-variants"><b>Толщина и исполнение</b><div>{variants.map(item => <Link className={item.id === product.id ? "is-active" : ""} href={`/product/${item.slug}/`} key={item.id}>{item.variantLabel}</Link>)}</div></div>}
        <div className="product-price-large"><strong>{productPriceText(product.price)}</strong>{product.oldPrice && <del>{product.oldPrice} ₽</del>}{product.price !== null && <small>/ {product.unit}</small>}</div>
        <div className="product-buy-row">
          {product.price !== null ? <><div className="cart-quantity"><button aria-label="Уменьшить" onClick={() => setQuantity(Math.max(1, quantity - 1))} type="button"><Minus/></button><b>{quantity}</b><button aria-label="Увеличить" onClick={() => setQuantity(quantity + 1)} type="button"><Plus/></button></div><button className="primary-inline" onClick={() => add()} type="button">{added ? <>В корзине<Check/></> : <>В корзину<ShoppingCartSimple/></>}</button></> : <Link className="primary-inline" href="/contacts/">Уточнить цену<ArrowRight/></Link>}
          <button aria-label={favorite ? "Убрать из избранного" : "В избранное"} className={`product-favorite-large ${favorite ? "is-active" : ""}`} onClick={toggleFavorite} type="button"><Heart weight={favorite ? "fill" : "regular"}/></button>
        </div>
        {added && <button className="go-cart" onClick={() => router.push("/cart/")} type="button">Перейти в корзину<ArrowRight/></button>}
        {calculator && <>
          <button className={`quantity-calc-toggle ${calcOpen ? "is-open" : ""}`} aria-expanded={calcOpen} onClick={() => setCalcOpen(!calcOpen)} type="button"><Calculator weight="bold"/><span><b>Рассчитать количество</b><small>{calculator.type === "dry-mix" ? "По площади стен и толщине слоя" : "По площади облицовки с запасом"}</small></span><CaretDown/></button>
          {calcOpen && <div className="quantity-calculator">
            <label>Площадь, м²<input min="0.1" step="0.1" onChange={event => setArea(event.target.valueAsNumber)} type="number" value={Number.isFinite(area) ? area : ""}/></label>
            {calculator.type === "dry-mix" && <label>Средний слой, мм<input min={calculator.minThickness} max={calculator.maxThickness} step="1" onChange={event => setThickness(event.target.valueAsNumber)} type="number" value={Number.isFinite(thickness) ? thickness : ""}/></label>}
            <label>Запас<select onChange={event => setReserve(Number(event.target.value))} value={reserve}><option value="5">5%</option><option value="10">10%</option><option value="15">15%</option></select></label>
            <div aria-live="polite"><small>Понадобится</small><strong>{calculated === null ? "Проверьте значения" : productQuantityText(calculated, product.unit)}</strong><button disabled={calculated === null} onClick={() => { if (calculated !== null) { setQuantity(calculated); setCalcOpen(false); } }} type="button">Применить</button></div>
            <p className="calculator-note">{calculator.type === "dry-mix" ? `Ориентир для стен: ${calculator.consumptionAt10mm} кг/м² при слое 10 мм — верхняя граница расхода производителя. Допустимый слой ${calculator.minThickness}–${calculator.maxThickness} мм. На потолке — не более 15 мм. Реальный расход зависит от основания.` : `Расчёт на один слой облицовки. Площадь листа — ${calculator.area.toLocaleString("ru-RU", { maximumFractionDigits: 4 })} м². Учитывайте раскрой и число слоёв конструкции.`}</p>
          </div>}
        </>}
        <div className="product-service-notes"><article><Truck/><span><b>Доставка на объект</b><small>Рассчитаем по адресу</small></span></article><article><Storefront/><span><b>Самовывоз со склада</b><small>Согласуем склад и время</small></span></article></div>
      </div>
    </section>
    <section className="product-content">
      <div className="product-tabs"><button className={tab === "description" ? "is-active" : ""} onClick={() => setTab("description")} type="button">Описание</button><button className={tab === "specs" ? "is-active" : ""} onClick={() => setTab("specs")} type="button">Характеристики</button></div>
      {tab === "description" ? <div className="product-description"><div><p className="eyebrow">О товаре</p><h2>Для каких работ подходит</h2><p>{product.description}</p><ul><li><Check/>Проверим наличие перед оплатой</li><li><Check/>Подберём сопутствующие материалы</li><li><Check/>Поможем рассчитать доставку на объект</li></ul></div><aside><Package/><b>Комплектуем под задачу</b><p>Подберём совместимые материалы и проверим наличие перед оплатой.</p><Link href="/business/assembly/">Помочь с комплектом<ArrowRight/></Link></aside></div> : <div className="product-specs"><div><p className="eyebrow">Характеристики</p><h2>Основные параметры</h2></div><dl>{product.specs?.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}<div><dt>Бренд</dt><dd>{product.brand}</dd></div><div><dt>Единица продажи</dt><dd>{product.unit}</dd></div></dl></div>}
      {!!product.sources?.length && <p className="product-source-links">Информация производителя: {product.sources.map(source => <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.url}>{source.label}<ArrowRight/></a>)}</p>}
    </section>
    <section className="product-receiving"><div><p className="eyebrow">Получение товара</p><h2>Выберите удобный способ</h2></div><div className="receiving-grid"><article><span><Truck weight="bold"/></span><h3>Доставка на объект</h3><p>Подберём машину по объёму заказа и согласуем интервал.</p><Link href="/delivery/">Условия доставки<ArrowRight/></Link></article><article><span><Storefront weight="bold"/></span><h3>Самовывоз со склада</h3><p>Подготовим заказ к приезду и проверим комплектность.</p><Link href="/contacts/">Как нас найти<ArrowRight/></Link></article><article><span><SealCheck weight="bold"/></span><h3>Проверка заказа</h3><p>Менеджер подтвердит остатки и замены до оплаты.</p><Link href="/business/assembly/">Комплектация<ArrowRight/></Link></article></div></section>
    <section className="product-documents"><div><p className="eyebrow">Документы</p><h2>Документы по товару</h2><p>Уточним наличие паспорта качества и документов о соответствии для актуальной партии.</p></div><Link className="primary-inline" href="/contacts/">Запросить документы<ArrowRight/></Link></section>
    {related.length > 0 && <section className="related-products"><div className="section-heading-row"><div><p className="eyebrow">Похожие позиции</p><h2>Сравните варианты</h2></div><Link href={categoryUrl(product.category)}>Смотреть категорию<ArrowRight/></Link></div><div className="catalog-product-grid">{related.map(item => <CatalogProductCard added={relatedAdded.includes(item.id)} favorite={relatedFavorites.includes(item.id)} key={item.id} onAdd={() => add(item, 1)} onFavorite={() => { const ids = readFavorites(); const next = ids.includes(item.id) ? ids.filter(id => id !== item.id) : [...ids, item.id]; setRelatedFavorites(next); writeFavorites(next); }} product={item}/>)}</div></section>}
  </div></SiteChrome>;
}
