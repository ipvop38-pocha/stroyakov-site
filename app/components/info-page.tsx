import Link from "next/link";
import { SiteChrome } from "./site-chrome";

export function InfoPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: { title: string; text: string }[] }) {
  return <SiteChrome><div className="inner-canvas info-page"><nav className="breadcrumbs"><Link href="/">Главная</Link><span>/</span><span>{title}</span></nav><section className="info-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></section><div className="info-layout"><aside><b>Содержание</b>{sections.map((section,index)=><a href={`#info-${index}`} key={section.title}>0{index+1} {section.title}</a>)}</aside><article>{sections.map((section,index)=><section id={`info-${index}`} key={section.title}><span>0{index+1}</span><div><h2>{section.title}</h2><p>{section.text}</p></div></section>)}</article></div></div></SiteChrome>;
}
