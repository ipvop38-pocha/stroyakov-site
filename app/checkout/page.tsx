"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, MapPin, Storefront } from "@phosphor-icons/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CartItem } from "../cart/page";
import { SiteChrome } from "../components/site-chrome";
import { clearCart, readCart } from "../lib/commerce";

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [delivery, setDelivery] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState<"online" | "receive" | "invoice">("online");
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => setItems(readCart()), []);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("name") || String(form.get("phone") || "").replace(/\D/g, "").length < 10 || (delivery === "delivery" && !form.get("address")) || !consent) { setError("Заполните имя, телефон, адрес и подтвердите согласие."); return; }
    clearCart();
    router.push("/order-success");
  }

  return <SiteChrome><div className="inner-canvas checkout-page"><nav aria-label="Хлебные крошки" className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><Link href="/cart">Корзина</Link><span>/</span><span>Оформление заказа</span></nav><h1>Оформление заказа</h1><form className="checkout-layout" onSubmit={submit}><div className="checkout-forms">
    <section className="checkout-card"><h2>Контактные данные</h2><p>Используем их только для подтверждения заказа и связи по доставке.</p><div className="field-grid"><label>Имя<input name="name" placeholder="Как к вам обращаться" /></label><label>Телефон<input inputMode="tel" name="phone" placeholder="+7 900 000-00-00" /></label><label>Email<input name="email" placeholder="mail@company.ru" type="email" /></label><label>Компания или ИНН<input name="company" placeholder="Необязательно" /></label></div></section>
    <section className="checkout-card"><h2>Получение заказа</h2><p>Стоимость и ближайшее окно доставки уточним после проверки адреса.</p><div className="choice-grid"><Choice active={delivery === "delivery"} icon={<MapPin />} note="Привезём на объект или по адресу" onClick={() => setDelivery("delivery")} title="Доставка"/><Choice active={delivery === "pickup"} icon={<Storefront />} note="Ростовское шоссе, 24А" onClick={() => setDelivery("pickup")} title="Самовывоз"/></div>{delivery === "delivery" && <div className="field-grid delivery-fields"><label className="wide-field">Адрес доставки<input name="address" placeholder="Город, улица, дом, строение" /></label><label>Желаемая дата<input name="date" type="date" /></label><label>Время<input name="time" placeholder="Любое время" /></label></div>}</section>
    <section className="checkout-card"><h2>Оплата и комментарий</h2><div className="choice-grid payment-grid">{[["online", "Онлайн", "Банковской картой"], ["receive", "При получении", "Картой или наличными"], ["invoice", "По счёту", "Для компаний и ИП"]].map(([id, title, note]) => <Choice active={payment === id} key={id} note={note} onClick={() => setPayment(id as typeof payment)} title={title}/>)}</div><label>Комментарий к заказу<textarea name="comment" placeholder="Пожелания по разгрузке, подъёму или времени звонка" /></label><button className={`consent-check ${consent ? "is-active" : ""}`} onClick={() => setConsent(!consent)} type="button"><span>{consent && <Check weight="bold" />}</span>Согласен на обработку данных</button>{error && <p className="checkout-error">{error}</p>}</section>
  </div><aside className="order-summary checkout-summary"><h2>Ваш заказ</h2>{items.map((item) => <div className="checkout-line" key={item.id}><span>{item.title}<small>{item.quantity} шт.</small></span><b>{new Intl.NumberFormat("ru-RU").format(item.price * item.quantity)} ₽</b></div>)}<dl><div><dt>Товары</dt><dd>{new Intl.NumberFormat("ru-RU").format(total)} ₽</dd></div><div><dt>Доставка</dt><dd>После адреса</dd></div></dl><div className="summary-total"><span>Итого</span><strong>{new Intl.NumberFormat("ru-RU").format(total)} ₽</strong></div><button className="primary-inline" type="submit">Подтвердить заказ<ArrowRight /></button><p>Менеджер проверит состав, наличие и свяжется с вами перед оплатой.</p></aside></form></div></SiteChrome>;
}

function Choice({ active, title, note, icon, onClick }: { active: boolean; title: string; note: string; icon?: React.ReactNode; onClick: () => void }) { return <button className={active ? "is-active" : ""} onClick={onClick} type="button"><span>{active && <Check weight="bold" />}</span><div>{icon}<b>{title}</b><small>{note}</small></div></button>; }
