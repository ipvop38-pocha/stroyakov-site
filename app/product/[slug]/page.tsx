"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Calculator, CaretDown, Check, FileText, Heart, Minus, Package, Plus, SealCheck, ShoppingCartSimple, Storefront, Truck } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { CatalogProductCard, ProductImage } from "../../components/catalog-product-card";
import { SiteChrome } from "../../components/site-chrome";
import { catalogProducts, categoryUrl, CatalogProduct } from "../../catalog/data";
import { readCart, readFavorites, writeCart, writeFavorites } from "../../lib/commerce";
import { calculateProductQuantity, productPriceText, productStockText, productQuantityText } from "../../lib/product-presentation";
import { productAnalogs } from "../../lib/product-analogs";

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
    setArea(12);
    setReserve(10);
    setRelatedAdded([]);
    setThickness(product.calculator?.type === "dry-mix" ? product.calculator.defaultThickness : 10);
  }, [product]);

  if (!product) return <SiteChrome><div className="not-found-card"><h1>Товар не найден</h1><Link className="primary-inline" href="/catalog/">Вернуться в каталог<ArrowRight/></Link></div></SiteChrome>;
  const selectedProduct = product;
  const calculator = product.calculator;
  const calculated = calculateProductQuantity(calculator, area, reserve, thickness);
  const variants = product.variantGroup ? catalogProducts.filter(item => item.variantGroup === product.variantGroup) : [];
  const companions = (product.companionIds || []).map(id => catalogProducts.find(item => item.id === id)).filter((item): item is CatalogProduct => Boolean(item)).slice(0, 3);
  const analogs = productAnalogs(product, catalogProducts);
  const hasStock = product.stock !== null && product.stock > 0;
  const groupUrl = categoryUrl(product.category).replace('#products', `&group=${encodeURIComponent(product.subgroup)}#products`);
  const documentRequest = `mailto:info@stroyakov.ru?subject=${encodeURIComponent(`Документы на товар ${product.code}`)}&body=${encodeURIComponent(`Здравствуйте! Нужны документы на товар: ${product.name}.\nКод: ${product.code}.\nНомер заказа или партия (если известны):\n`)}`;
  const keySpecs = product.specs?.filter(([label])=>!['Состав','Фасовка','Срок хранения'].includes(label)).slice(0,4) || [];

  function toggleFavorite() {
    const ids = readFavorites();
    const next = ids.includes(selectedProduct.id) ? ids.filter(id => id !== selectedProduct.id) : [...ids, selectedProduct.id];
    writeFavorites(next);
    setFavorite(next.includes(selectedProduct.id));
    setRelatedFavorites(next);
  }
  function add(item: CatalogProduct = selectedProduct, count = quantity) {
    if (item.price === null || !item.stock || item.stock < 0 || !Number.isFinite(count) || count < 1) return;
    const current = readCart();
    const id = `product-${item.id}`;
    const existing = current.find(entry => entry.id === id);
    writeCart([...current.filter(entry => entry.id !== id), { id, title: item.name, price: item.price, quantity: (existing?.quantity || 0) + count, image: item.image, detail: [item.brand, item.unit, item.stockLocation].filter(Boolean).join(" · ") }]);
    if (item.id === selectedProduct.id) setAdded(true);
    else setRelatedAdded(ids => [...ids, item.id]);
  }

  return <SiteChrome><div className="inner-canvas product-page">
    <nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><Link href="/catalog/">Каталог</Link><span>/</span><Link href={groupUrl}>{product.subgroup}</Link><span>/</span><span>{product.name}</span></nav>
    <section className="product-detail-layout">
      <div className="product-gallery-wrap single-photo">
        <div className={`product-gallery ${product.photoStyle === "approved-studio" ? "studio-product-image" : ""}`}>
          <ProductImage product={product} priority sizes="(max-width:767px) 100vw, 50vw"/>
        </div>
        {product.image && <p className="product-photo-note">Внешний вид товара может отличаться в зависимости от партии.</p>}
      </div>
      <div className="product-info">
        <div className="product-brand-row">{product.brand && <p className="card-eyebrow">{product.brand}</p>}<span>Код: {product.code}</span></div>
        <h1>{product.name}</h1>
        <p className="product-quick-description">{product.quickDescription}</p>
        {keySpecs.length>0 && <dl className="product-key-specs">{keySpecs.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        <div className={`product-stock-large ${hasStock ? "" : "stock-unconfirmed"}`}><span/><b>{productStockText(product)}</b></div>
        {variants.length > 1 && <div className="product-variants"><b>Варианты исполнения</b><div>{variants.map(item => <Link className={item.id === product.id ? "is-active" : ""} href={`/product/${item.slug}/`} key={item.id}>{item.variantLabel}</Link>)}</div></div>}
        <div className="product-purchase-panel">
          <div className="product-price-large"><strong>{productPriceText(product.price)}</strong>{product.oldPrice && <del>{product.oldPrice} ₽</del>}{product.price !== null && <small>/ {product.unit}</small>}</div>
          <div className="product-buy-row">
            {product.price === null ? <Link className="primary-inline" href={`/contacts/?product=${product.slug}`}>Уточнить цену<ArrowRight/></Link> : hasStock ? <><div className="cart-quantity"><button aria-label="Уменьшить" onClick={() => setQuantity(Math.max(1, quantity - 1))} type="button"><Minus/></button><b>{quantity}</b><button aria-label="Увеличить" onClick={() => setQuantity(quantity + 1)} type="button"><Plus/></button></div><button className="primary-inline" onClick={() => add()} type="button">{added ? <>В корзине<Check/></> : <>В корзину<ShoppingCartSimple/></>}</button></> : <Link className="primary-inline order-request" href={`/contacts/?product=${product.slug}`}>Заказать<ArrowRight/></Link>}
            <button aria-label={favorite ? "Убрать из избранного" : "В избранное"} className={`product-favorite-large ${favorite ? "is-active" : ""}`} onClick={toggleFavorite} type="button"><Heart weight={favorite ? "fill" : "regular"}/></button>
          </div>
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
    <nav className="product-section-nav" aria-label="Разделы карточки"><a href="#description">Описание</a><a href="#specifications">Характеристики</a><a href="#documents">Документы</a>{analogs.length>0&&<a href="#analogs">Аналоги</a>}</nav>
    <section className="product-content" id="description" aria-labelledby="description-heading">
      <div className="product-description"><div><p className="eyebrow">О товаре</p><h2 id="description-heading">Для каких работ подходит</h2><p>{product.description}</p></div><div className="product-application"><h3>Что учесть при работе</h3><ul>{product.applicationNotes?.map(note=><li key={note}><Check aria-hidden="true"/><span>{note}</span></li>)}</ul></div></div>
    </section>
    <section className="product-specs product-specifications" id="specifications" aria-labelledby="specifications-heading"><div><p className="eyebrow">Характеристики</p><h2 id="specifications-heading">Параметры товара</h2></div><dl>{product.specs?.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}{product.brand && <div><dt>Бренд</dt><dd>{product.brand}</dd></div>}<div><dt>Единица продажи</dt><dd>{product.unit}</dd></div><div><dt>Код товара</dt><dd>{product.code}</dd></div></dl>{Boolean(product.unresolvedSpecs?.length)&&<p className="product-unresolved"><b>Уточняем:</b> {product.unresolvedSpecs?.join('; ')}. <a href={documentRequest}>Задать вопрос по товару<ArrowRight/></a></p>}</section>
    <section className="product-receiving"><div><p className="eyebrow">Получение товара</p><h2>Выберите удобный способ</h2></div><div className="receiving-grid"><article><span><Truck weight="bold"/></span><h3>Доставка на объект</h3><p>Подберём машину по объёму заказа и согласуем интервал.</p><Link href="/delivery/">Условия доставки<ArrowRight/></Link></article><article><span><Storefront weight="bold"/></span><h3>Самовывоз со склада</h3><p>Подготовим заказ к приезду и проверим комплектность.</p><Link href="/contacts/">Как нас найти<ArrowRight/></Link></article><article><span><SealCheck weight="bold"/></span><h3>Проверка заказа</h3><p>Менеджер подтвердит остатки и замены до оплаты.</p><Link href="/business/assembly/">Комплектация<ArrowRight/></Link></article></div></section>
    <section className="product-documents product-document-resources" id="documents" aria-labelledby="documents-heading"><div><p className="eyebrow">Документы</p><h2 id="documents-heading">Инструкции и документы</h2><div className="product-document-list">{product.documents?.map(document=><a href={document.url} key={document.url} target="_blank" rel="noreferrer"><FileText aria-hidden="true"/><span><b>{document.label}</b><small>PDF · сайт производителя</small></span><ArrowRight aria-hidden="true"/></a>)}{product.manufacturerUrl&&<a href={product.manufacturerUrl} target="_blank" rel="noreferrer"><FileText aria-hidden="true"/><span><b>Информация производителя</b><small>Описание, применение и технические данные</small></span><ArrowRight aria-hidden="true"/></a>}{!product.documents?.length&&!product.manufacturerUrl&&<p>Документы на эту позицию пока не опубликованы. Их можно запросить для конкретного заказа или партии.</p>}</div></div><aside className="product-batch-documents"><Package aria-hidden="true"/><h3>Документы к вашей партии</h3><p>Паспорт качества и документы о соответствии подберём по номеру заказа или маркировке партии.</p><a className="primary-inline" href={documentRequest}>Запросить документы<ArrowRight/></a><small>Запрос по электронной почте · код {product.code}</small></aside></section>
    {companions.length > 0 && <ProductRecommendations title="С этим товаром покупают" eyebrow="Для монтажа" items={companions} category={product.category} added={relatedAdded} favorites={relatedFavorites} onAdd={add} onFavorites={setRelatedFavorites}/>}
    {analogs.length > 0 && <ProductRecommendations title="Аналоги для сравнения" eyebrow="Сравните перед выбором" items={analogs} category={product.category} groupUrl={groupUrl} sectionId="analogs" added={relatedAdded} favorites={relatedFavorites} onAdd={add} onFavorites={setRelatedFavorites}/>}
  </div></SiteChrome>;
}

function ProductRecommendations({ title, eyebrow, items, category, groupUrl, sectionId, added, favorites, onAdd, onFavorites }: { title: string; eyebrow: string; items: CatalogProduct[]; category: string; groupUrl?: string; sectionId?: string; added: string[]; favorites: string[]; onAdd: (item: CatalogProduct, count: number) => void; onFavorites: (ids: string[]) => void }) {
  return <section className="related-products" id={sectionId}><div className="section-heading-row"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><Link href={groupUrl || categoryUrl(category)}>Смотреть категорию<ArrowRight/></Link></div><div className="catalog-product-grid">{items.map(item => <CatalogProductCard added={added.includes(item.id)} favorite={favorites.includes(item.id)} key={item.id} onAdd={() => onAdd(item, 1)} onFavorite={() => { const ids = readFavorites(); const next = ids.includes(item.id) ? ids.filter(id => id !== item.id) : [...ids, item.id]; onFavorites(next); writeFavorites(next); }} product={item}/>)}</div></section>;
}
