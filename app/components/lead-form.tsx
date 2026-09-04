"use client";

import { ArrowRight, Check } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";

export function LeadForm({ title = "Опишите задачу", button = "Отправить заявку", compact = false }: { title?: string; button?: string; compact?: boolean }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); if (!form.get("name") || String(form.get("phone") || "").replace(/\D/g, "").length < 10) { setError("Укажите имя и корректный номер телефона."); return; } setError(""); setSent(true); }
  if (sent) return <div className={`lead-form success-lead-form ${compact ? "is-compact" : ""}`}><span><Check weight="bold" /></span><h3>Заявка принята</h3><p>Менеджер уточнит задачу и свяжется с вами.</p><button onClick={() => setSent(false)} type="button">Отправить ещё одну</button></div>;
  return <form className={`lead-form ${compact ? "is-compact" : ""}`} onSubmit={submit}><h3>{title}</h3><label>Имя<input name="name" placeholder="Как к вам обращаться" /></label><label>Телефон<input inputMode="tel" name="phone" placeholder="+7 900 000-00-00" /></label>{!compact && <label>Вопрос<textarea name="question" placeholder="Коротко опишите задачу или укажите номер заказа" /></label>}{error && <p className="field-message">{error}</p>}<button className="primary-inline" type="submit">{button}<ArrowRight weight="bold" /></button><small>Нажимая кнопку, вы соглашаетесь с политикой обработки данных.</small></form>;
}
