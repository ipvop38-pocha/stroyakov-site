"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { SiteChrome } from "../components/site-chrome";

export default function OrderSuccessPage() {
  return <SiteChrome><div className="order-success-page"><section className="success-card"><span className="success-icon"><CheckCircle weight="fill" /></span><p className="soft-pill">Заказ № ST-2481</p><h1>Заказ оформлен</h1><p>Спасибо! Менеджер проверит наличие и условия доставки, затем свяжется с вами для подтверждения заказа.</p><ol><li className="is-active"><span>1</span><b>Заказ принят<small>Выполнено</small></b></li><li><span>2</span><b>Проверка менеджером<small>Далее</small></b></li><li><span>3</span><b>Подтверждение<small>Далее</small></b></li></ol><div><Link className="primary-inline" href="/catalog">Вернуться в каталог<ArrowRight /></Link><Link className="secondary-inline" href="/">Перейти на главную</Link></div><small>Вопрос по заказу? +7 928 044-60-70</small></section></div></SiteChrome>;
}
