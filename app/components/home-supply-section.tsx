"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowRight, Calculator, Stack, Package, Truck, ClipboardText, EnvelopeSimple, Phone, X } from "@phosphor-icons/react";

const steps = [
  { title: "Рассчитаем количество", description: "По размерам или вашему списку", Icon: Calculator },
  { title: "Подберём материалы", description: "С учётом задачи и бюджета", Icon: Stack },
  { title: "Соберём заказ", description: "Подготовим к выдаче", Icon: Package },
  { title: "Доставим на объект", description: "Согласуем транспорт и время", Icon: Truck },
];

export function HomeSupplySection() {
  const requestDialog = useRef<HTMLDialogElement>(null);

  return (
    <section className="section supply-section" id="business" aria-labelledby="supply-title">
      <header className="supply-heading">
        <h2 id="supply-title">Поможем со снабжением объекта</h2>
        <p>От списка материалов до доставки на объект</p>
      </header>
      <div className="supply-banner">
        <div className="supply-photo">
          <Image src="/assets/services/supply-warehouse-v1.webp" alt="Специалист по комплектации с планшетом на складе строительных материалов" fill sizes="(max-width: 600px) 100vw, (max-width: 1440px) 90vw, 1280px" />
        </div>
        <div className="supply-copy">
          <h3>Пришлите список —<br />соберём заказ</h3>
          <p>Рассчитаем количество, подберём материалы и согласуем доставку.</p>
          <button className="supply-button" type="button" onClick={() => requestDialog.current?.showModal()}>Рассчитать заказ <ArrowRight aria-hidden size={20} /></button>
          <small>Подойдёт список, фото или смета</small>
        </div>
      </div>
      <ol className="supply-steps" aria-label="Как проходит комплектация заказа">
        {steps.map(({ title, description, Icon }, index) => (
          <li key={title}>
            <div className="supply-step-number" aria-hidden="true"><span>0{index + 1}</span></div>
            <Icon className="supply-step-icon" aria-hidden size={32} weight="light" />
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <dialog className="materials-list-dialog" ref={requestDialog} aria-labelledby="supply-request-title" onClick={(event) => { if (event.target === event.currentTarget) requestDialog.current?.close(); }}>
        <button className="materials-dialog-close" aria-label="Закрыть" type="button" onClick={() => requestDialog.current?.close()}><X aria-hidden size={24} /></button>
        <ClipboardText className="materials-dialog-icon" aria-hidden size={32} />
        <h2 id="supply-request-title">Пришлите список материалов</h2>
        <p>Подойдёт таблица, фото сметы или список текстом. Укажите количество и адрес объекта — поможем с подбором.</p>
        <a className="materials-primary" href="mailto:info@stroyakov.ru?subject=Расчёт%20заказа%20по%20списку"><EnvelopeSimple aria-hidden size={22} /> Открыть почту</a>
        <span className="materials-dialog-email">info@stroyakov.ru</span>
        <a className="materials-dialog-phone" href="tel:+79280446070"><Phone aria-hidden size={20} /> +7 (928) 044-60-70</a>
      </dialog>
    </section>
  );
}
