"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Check, Minus, Plus, SealCheck } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { SiteChrome } from "../../components/site-chrome";
import { masterKits, solutionCards } from "../data";
import { readCart, writeCart } from "../../lib/commerce";

type Variant = "standard" | "moisture" | "acoustic" | "strong";

const variants: { id: Variant; title: string; note: string; factor: number }[] = [
  { id: "standard", title: "Стандарт C111", note: "Для сухих помещений", factor: 1 },
  { id: "moisture", title: "Влагостойкая", note: "Для кухни и влажных зон", factor: 1.12 },
  { id: "acoustic", title: "Усиленная акустика", note: "Плотная вата и двойная обшивка", factor: 1.38 },
  { id: "strong", title: "Усиленная", note: "Под навесную нагрузку", factor: 1.54 },
];

const simpleCompositions: Record<string, string[]> = {
  "gkl-ceiling": ["Профиль потолочный 60×27", "Профиль направляющий 28×27", "Подвесы и соединители", "ГКЛ 12,5 мм", "Саморезы", "Лента и шпаклёвка", "Грунт"],
  "plaster-walls": ["Грунт по основанию", "Маячковый профиль 6 мм", "Гипсовая штукатурка", "Финишная шпаклёвка"],
  "paint-prep": ["Грунт", "Базовая шпаклёвка", "Армирующая сетка", "Финишная шпаклёвка", "Шлифовальный материал"],
  "level-floor": ["Грунт", "Демпферная лента", "Ровнитель", "Контрольные маяки"],
  "xps-floor": ["Плиты XPS", "Разделительная плёнка", "Армирующая сетка", "Сухая смесь для стяжки", "Демпферная лента"],
  "plasterer-kit": ["Шпатели 100 / 300 / 450 мм", "Правило 2 м", "Ведро 20 л", "Тёрка", "Шлифовальная сетка", "Защитные перчатки"],
  "painter-kit": ["Валики 180 / 240 мм", "Малярная ванночка", "Кисть и макловица", "Малярная лента", "Укрывная плёнка", "Сетка и перчатки"],
};

export default function SolutionDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const solution = solutionCards.find((item) => item.slug === slug) ?? masterKits.find((item) => item.slug === slug);
  const [area, setArea] = useState(12);
  const [height, setHeight] = useState(2.7);
  const [opening, setOpening] = useState(0);
  const [variant, setVariant] = useState<Variant>("standard");
  const [added, setAdded] = useState(false);

  const isPartition = slug === "gkl-partition";
  const isKit = slug.endsWith("-kit");
  const activeVariant = variants.find((item) => item.id === variant)!;
  const effectiveArea = Math.max(1, area - opening);
  const estimate = useMemo(() => isKit ? (slug === "plasterer-kit" ? 2390 : 1690) : Math.round(effectiveArea * (isPartition ? 1120 : 620) * activeVariant.factor), [activeVariant.factor, effectiveArea, isKit, isPartition, slug]);
  const sheets = Math.ceil((effectiveArea * (variant === "acoustic" ? 4 : 2)) / 3);
  const studs = Math.ceil((effectiveArea / height) / 0.6) + 1;

  if (!solution) return <SiteChrome><div className="not-found-card"><h1>Решение не найдено</h1><Link className="primary-inline" href="/solutions">Вернуться к решениям<ArrowRight /></Link></div></SiteChrome>;

  function addToCart() {
    const payload = { id: slug, title: solution!.title, price: estimate, quantity: 1, image: solution!.image, detail: isKit ? `${"items" in solution! ? solution!.items : 1} предметов` : `${area} м² · ${activeVariant.title}` };
    const current = readCart();
    writeCart([...current.filter((item) => item.id !== slug), payload]);
    setAdded(true);
  }

  return <SiteChrome>
    <div className="inner-canvas solution-detail">
      <nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><Link href="/solutions">Готовые решения</Link><span>/</span><span>{solution.title}</span></nav>
      <section className="solution-detail-hero">
        <div><p className="eyebrow">{isKit ? "Набор мастера" : "Готовое решение"}</p><h1>{solution.title}</h1><p>{solution.text}</p><div className="trust-line"><SealCheck aria-hidden weight="fill" />Совместимые позиции с возможностью замены</div></div>
        <div className="solution-detail-image"><Image alt={solution.title} fill priority sizes="(max-width: 767px) 100vw, 48vw" src={solution.image} /><span>{isKit ? "Проверенный состав" : "Конструктивная система"}</span></div>
      </section>

      <section className="configurator-layout">
        <div className="configurator-main">
          {!isKit && <div className="configurator-card"><div className="configurator-heading"><div><p className="eyebrow">Шаг 1</p><h2>Размер задачи</h2></div><span>{effectiveArea.toFixed(1)} м² в расчёте</span></div>
            <div className="dimension-grid"><label>Площадь, м²<div className="number-control"><button aria-label="Уменьшить площадь" onClick={() => setArea(Math.max(1, area - 1))} type="button"><Minus /></button><input aria-label="Площадь" min="1" onChange={(event) => setArea(Number(event.target.value))} type="number" value={area}/><button aria-label="Увеличить площадь" onClick={() => setArea(area + 1)} type="button"><Plus /></button></div></label><label>Высота, м<input min="2" onChange={(event) => setHeight(Number(event.target.value))} step="0.1" type="number" value={height}/></label><label>Проёмы, м²<input min="0" onChange={(event) => setOpening(Number(event.target.value))} step="0.5" type="number" value={opening}/></label></div>
          </div>}

          {isPartition && <div className="configurator-card"><div className="configurator-heading"><div><p className="eyebrow">Шаг 2</p><h2>Вариант системы</h2></div><span>Любую позицию можно заменить</span></div><div className="variant-grid">{variants.map((item) => <button className={variant === item.id ? "is-active" : ""} key={item.id} onClick={() => setVariant(item.id)} type="button"><span>{variant === item.id && <Check weight="bold" />}</span><b>{item.title}</b><small>{item.note}</small></button>)}</div></div>}

          <div className="configurator-card"><div className="configurator-heading"><div><p className="eyebrow">{isKit ? "Проверенный состав" : "Комплект"}</p><h2>Что входит</h2></div><span>{isPartition ? "6 позиций" : `${simpleCompositions[slug]?.length || 0} позиций`}</span></div>
            <div className="composition-list">{isPartition ? <>
              <CompositionRow name="Гипсокартон Danogips 12,5 мм" quantity={`${sheets} листов`} stock="В наличии: 820 листов" />
              <CompositionRow name="Профиль ПС 75×50×3000 мм, 0,6 мм" quantity={`${studs} шт.`} stock="В наличии: 776 шт." />
              <CompositionRow name="Профиль ПН 75×40×3000 мм, 0,45 мм" quantity={`${Math.ceil((effectiveArea / height) * 2 / 3)} шт.`} stock="В наличии: 450 шт." />
              <CompositionRow name="Акустическое заполнение" quantity={`${Math.ceil(effectiveArea * 1.05)} м²`} stock="Остаток ограничен — подберём аналог" />
              <CompositionRow name="Саморезы TN25" quantity={`${Math.ceil(effectiveArea * 40 / 500) * 500} шт.`} stock="В наличии" />
              <CompositionRow name="Шпаклёвка и лента для швов" quantity="комплект" stock="В наличии" />
            </> : simpleCompositions[slug]?.map((name) => <CompositionRow key={name} name={name} quantity="1 компл." stock="В наличии" />)}</div>
          </div>
        </div>

        <aside className="quote-card"><p className="eyebrow">Ваш комплект</p><h2>{solution.title}</h2><dl>{!isKit && <><div><dt>Площадь</dt><dd>{effectiveArea.toFixed(1)} м²</dd></div>{isPartition && <div><dt>Вариант</dt><dd>{activeVariant.title}</dd></div>}</>}<div><dt>Позиций</dt><dd>{isPartition ? 6 : simpleCompositions[slug]?.length}</dd></div></dl><small>Предварительная стоимость материалов</small><strong>{new Intl.NumberFormat("ru-RU").format(estimate)} ₽</strong><button className="primary-inline" onClick={addToCart} type="button">{added ? "Комплект в корзине" : "Добавить в корзину"}{added ? <Check aria-hidden weight="bold" /> : <ArrowRight aria-hidden weight="bold" />}</button>{added && <button className="quote-secondary" onClick={() => router.push("/cart")} type="button">Перейти в корзину</button>}<p>Точную стоимость, наличие и доставку подтвердит менеджер.</p></aside>
      </section>
    </div>
  </SiteChrome>;
}

function CompositionRow({ name, quantity, stock }: { name: string; quantity: string; stock: string }) {
  return <article><span className="composition-mark" /><div><b>{name}</b><small>{stock}</small></div><strong>{quantity}</strong><button type="button">Заменить</button></article>;
}
