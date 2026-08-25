"use client";

import { useEffect, useMemo, useState } from "react";

const PRODUCTS = [
  { name: "DANOGIPS ГКЛ 12,5 мм", group: "Гипсокартон", price: "370 ₽" },
  { name: "Профиль ПП 60×27×3000", group: "Профиль", price: "180 ₽" },
  { name: "DANOGIPS SuperFinish 28 кг", group: "Сухие смеси", price: "2 820 ₽" },
  { name: "Утеплитель Rockwool Акустик", group: "Утеплители", price: "В наличии" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [art, setArt] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    fetch("/art.txt").then(r => r.text()).then(x => setArt(`data:image/webp;base64,${x.trim()}`));
    fetch("/logo.txt").then(r => r.text()).then(x => setLogo(`data:image/webp;base64,${x.trim()}`));
  }, []);

  const filtered = useMemo(() => PRODUCTS.filter(p => `${p.name} ${p.group}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const categories = ["Гипсокартон", "Профиль", "Сухие смеси", "Утеплители", "Кирпич и блоки", "Крепёж"];

  return <main>
    <header className="header shell">
      {logo ? <img className="logo" src={logo} alt="СТРОЯКОВ" /> : <strong className="logoFallback">СТРОЯКОВ</strong>}
      <button className="catalogBtn">☰ <span>КАТАЛОГ</span></button>
      <nav><a>Компания</a><a>Доставка</a><a>Оплата</a><a>Услуги</a><a>Проекты</a><a>Контакты</a></nav>
      <div className="headActions"><button>♡ Избранное</button><button>Войти</button><button>Корзина</button></div>
    </header>

    <section className="searchArea shell">
      <div className={`search ${focused ? "focused" : ""}`}>
        <span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} placeholder="Поиск по товарам, брендам и категориям"/><button>НАЙТИ</button>
      </div>
      {focused && <div className="suggestions">{filtered.length ? filtered.map((p, i) => <button key={i} onMouseDown={() => setQuery(p.group)}><span><b>{p.name}</b><small>{p.group}</small></span><strong>{p.price}</strong></button>) : <div className="empty">Ничего не найдено. Позже сюда подключим полноценный поиск каталога.</div>}</div>}
    </section>

    <section className="hero">
      {art && <div className="heroArt" style={{backgroundImage:`url(${art})`}}><div className="fade"/><div className="glow"/></div>}
      <div className="shell heroInner">
        <div className="heroCopy">
          <div className="kicker">››› СТРОЙМАТЕРИАЛЫ · КРАСНОДАР</div>
          <h1><span>СТРОИМ</span><em>РЕШЕНИЯ</em></h1>
          <p>Находим нужные материалы, проверяем наличие и организуем доставку на объект <b>точно в срок.</b></p>
          <div className="chips">{["Гипсокартон","Профиль","Смеси","Утеплитель"].map(x => <button key={x} onClick={() => {setQuery(x); document.querySelector<HTMLInputElement>(".search input")?.focus()}}>{x}<span>›</span></button>)}</div>
          <div className="heroButtons"><button className="primary">ПЕРЕЙТИ В КАТАЛОГ <i>›››</i></button><button className="secondary" onClick={() => setSolutionOpen(true)}>▣ ПОДОБРАТЬ РЕШЕНИЕ</button></div>
        </div>
      </div>
    </section>

    <section className="benefits shell">{[
      ["01","Своя логистика","Доставим точно в срок"],
      ["02","Реальные остатки","Проверяем наличие перед отправкой"],
      ["03","Широкий ассортимент","Товары для стройки и ремонта"],
      ["04","Решение под задачу","Поможем подобрать и рассчитать"]
      .map(([n,t,s]) => <article key={n}><small>{n}</small><b>{t}</b><span>{s}</span></article>)}</section>

    <section className="cats shell">
      <div className="sectionHead"><div><h2>Популярные категории</h2><p>Быстрый вход в основные группы каталога</p></div><button>Весь каталог ›</button></div>
      <div className="catGrid">{categories.map((x,i) => <button className="cat" key={x}><div className={`catVisual v${i+1}`}>{["ГКЛ","ПП","25 кг","RW","▦","⚙"][i]}</div><b>{x}</b><small>{["25+","80+","120+","60+","90+","150+"][i]} товаров</small><i>›</i></button>)}</div>
    </section>

    {solutionOpen && <div className="modalBackdrop" onMouseDown={() => setSolutionOpen(false)}><div className="modal" onMouseDown={e => e.stopPropagation()}><button className="close" onClick={() => setSolutionOpen(false)}>×</button><small>БОБЁР PRO</small><h3>Подберём решение под вашу задачу</h3><p>Опишите задачу. Следующим этапом подключим реальную отправку в CRM.</p><input placeholder="Что нужно построить или отремонтировать?"/><div className="two"><input placeholder="Имя"/><input placeholder="Телефон"/></div><button className="primary wide">ОТПРАВИТЬ ЗАДАЧУ ›››</button></div></div>}
  </main>;
}
