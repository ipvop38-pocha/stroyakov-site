"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Calculator, ClipboardText, EnvelopeSimple, Phone, Truck, X } from "@phosphor-icons/react";

const categories = [
  { label: "Сухие смеси", image: "dry-mixes", category: "mixes" },
  { label: "Гипсокартон", image: "drywall", category: "drywall" },
  { label: "Профили", image: "profiles", category: "profiles" },
  { label: "Утеплители", image: "insulation", category: "insulation" },
];

export function HomeMaterialsHero() {
  const listDialog = useRef<HTMLDialogElement>(null);

  return (
    <section className="materials-hero" id="top" aria-label="Материалы для стройки">
      <div className="materials-stage">
        <div className="materials-art">
          <Image src="/assets/hero-materials-scene-v1.webp" alt="Гипсокартон, металлические профили, утеплитель и сухие смеси на красном подиуме" fill priority sizes="100vw" />
        </div>
        <div className="materials-copy">
          <p className="materials-eyebrow">Строяков · Материалы и решения</p>
          <h1><span>Материалы<br />для стройки.</span><span>Подобраны<br />под задачу.</span></h1>
          <p className="materials-description">Поможем выбрать совместимые материалы, рассчитать количество и собрать заказ на ваш объект.</p>
          <div className="materials-actions">
            <Link className="materials-primary" href="/catalog/">Открыть каталог <ArrowRight aria-hidden size={22} /></Link>
            <button className="materials-list-link" type="button" onClick={() => listDialog.current?.showModal()}>Подобрать по списку</button>
          </div>
          <ul className="materials-benefits">
            <li><ClipboardText aria-hidden /><span>Подбор<br />под задачу</span></li>
            <li><Calculator aria-hidden /><span>Расчёт<br />количества</span></li>
            <li><Truck aria-hidden /><span>Доставка<br />на объект</span></li>
          </ul>
        </div>
      </div>
      <nav className="materials-categories" id="catalog" aria-label="Популярные категории">
        {categories.map(({ label, image, category }) => (
          <Link href={`/catalog/?category=${category}#products`} key={category}>
            <Image src={`/assets/categories/${image}.png`} alt="" width={88} height={80} sizes="88px" />
            <span>{label}</span><ArrowRight aria-hidden size={20} />
          </Link>
        ))}
      </nav>
      <dialog className="materials-list-dialog" ref={listDialog} aria-labelledby="materials-list-title" onClick={(event) => { if (event.target === event.currentTarget) listDialog.current?.close(); }}>
        <button className="materials-dialog-close" aria-label="Закрыть" type="button" onClick={() => listDialog.current?.close()}><X aria-hidden size={24} /></button>
        <ClipboardText className="materials-dialog-icon" aria-hidden size={32} />
        <h2 id="materials-list-title">Пришлите список материалов</h2>
        <p>Подойдёт таблица, фото сметы или список текстом. Укажите количество и адрес объекта — поможем с подбором.</p>
        <a className="materials-primary" href="mailto:info@stroyakov.ru?subject=Подбор%20материалов%20по%20списку"><EnvelopeSimple aria-hidden size={22} /> Открыть почту</a>
        <span className="materials-dialog-email">info@stroyakov.ru</span>
        <a className="materials-dialog-phone" href="tel:+79280446070"><Phone aria-hidden size={20} /> +7 (928) 044-60-70</a>
      </dialog>
    </section>
  );
}
