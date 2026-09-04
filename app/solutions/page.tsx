"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { SiteChrome } from "../components/site-chrome";
import { masterKits, solutionCards } from "./data";
import { warehouseSnapshot } from "../data/warehouse-snapshot";

export default function SolutionsPage() {
  return <SiteChrome>
    <div className="inner-canvas solutions-index">
      <nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><span>Готовые решения</span></nav>
      <section className="inner-hero compact-inner-hero">
        <p className="eyebrow">Расчёт, система, совместимость</p>
        <h1>Готовые решения<br />под вашу задачу</h1>
        <p>Выберите строительную задачу или набор мастера. Комплектуем только совместимые позиции и разрешаем заменить любой товар аналогом.</p>
        <div className="trust-line"><CheckCircle aria-hidden weight="fill" /> Остатки и отгрузки сверены по МоемуСкладу на {warehouseSnapshot.capturedAt}</div>
      </section>

      <section className="inner-section">
        <div className="inner-section-heading"><div><p className="eyebrow">Материалы, которые работают вместе</p><h2>Решения по строительной задаче</h2><p>Стоимость уточняется после выбора площади, геометрии и варианта материалов.</p></div><span className="outline-pill">6 решений</span></div>
        <div className="solution-card-grid">
          {solutionCards.map((solution, index) => <article className={`system-card ${index === 0 ? "is-featured" : ""}`} key={solution.slug}>
            <Link className="system-card-image" href={`/solutions/${solution.slug}`}><Image alt={solution.title} fill sizes="(max-width: 767px) 100vw, 33vw" src={solution.image} /></Link>
            <div className="system-card-body"><p className="card-eyebrow">{solution.eyebrow}</p><h3>{solution.title}</h3><p>{solution.text}</p><div className="system-card-meta"><span>{solution.meta}</span><span>{solution.items} позиций</span></div><Link className={index === 0 ? "primary-inline" : "secondary-inline"} href={`/solutions/${solution.slug}`}>{index === 0 ? "Рассчитать комплект" : "Смотреть решение"}<ArrowRight aria-hidden weight="bold" /></Link></div>
          </article>)}
        </div>
      </section>

      <section className="inner-section master-kits-section">
        <div className="inner-section-heading"><div><p className="eyebrow">Только нужный ручной инструмент</p><h2>Наборы мастера</h2><p>Без дрелей, случайных позиций и декоративного реквизита.</p></div><span className="outline-pill">2 набора</span></div>
        <div className="master-kit-grid">{masterKits.map((kit) => <article className="master-kit-card" key={kit.slug}><div><span className="soft-pill">Набор мастера</span><h3>{kit.title}</h3><p>{kit.text}</p><div className="kit-availability"><span />Соберём после проверки <b>{kit.items} предметов</b></div><Link className="primary-inline" href={`/solutions/${kit.slug}`}>Смотреть набор<ArrowRight aria-hidden weight="bold" /></Link></div><div className="master-kit-image"><Image alt={kit.title} fill sizes="(max-width: 767px) 100vw, 35vw" src={kit.image} /></div></article>)}</div>
      </section>

      <section className="solution-lead"><div><p className="eyebrow">Расчёт и комплектация</p><h2>Не нашли точную задачу?</h2><p>Пришлите размеры, фото или смету. Специалист соберёт совместимый комплект и согласует замены.</p></div><Link className="primary-inline" href="/business/assembly">Отправить задачу<ArrowRight aria-hidden weight="bold" /></Link></section>
    </div>
  </SiteChrome>;
}
