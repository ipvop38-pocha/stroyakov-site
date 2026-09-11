import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

const manufacturers = [
  { name: "Danogips", brand: "DANOGIPS", image: "danogips", width: 178 },
  { name: "Русгипс", brand: "РУСГИПС", image: "rusgips", width: 166 },
  { name: "Ильский строитель", brand: "ИС", image: "ilskiy", width: 168 },
  { name: "РОКС", brand: "ROKS", image: "roks", width: 184 },
  { name: "Основит", brand: "ОСНОВИТ", image: "osnovit", width: 174 },
  { name: "Европодрядные строительные смеси", brand: "ЕС", image: "es", width: 154 },
  { name: "ТЕХНОНИКОЛЬ", brand: "ТЕХНОНИКОЛЬ", image: "technonicol", width: 184 },
  { name: "ПЕНОПЛЭКС", brand: "ПЕНОПЛЭКС", image: "penoplex", width: 172 },
  { name: "IZOLIFE", brand: "IZOLIFE", image: "izolife", width: 148 },
  { name: "ВОЛМА", brand: "ВОЛМА", image: "volma", width: 164 },
];

// Preserve the original partner artwork from the existing approved asset.
const partners = [
  { name: "ТОЧНО", x: 116, y: 75, w: 200, h: 45 },
  { name: "DOGMA", x: 1116, y: 75, w: 186, h: 41 },
  { name: "ССК", x: 217, y: 229, w: 186, h: 51 },
  { name: "Семья", x: 1036, y: 220, w: 200, h: 43 },
  { name: "НВМ", x: 116, y: 369, w: 179, h: 40 },
  { name: "Инсити Девелопмент", x: 1106, y: 368, w: 192, h: 37 },
];

export function HomeBrandsSection() {
  return (
    <section className="home-brands" aria-labelledby="home-brands-title">
      <div className="home-brands-heading">
        <div>
          <h2 id="home-brands-title">Производители</h2>
          <p>Надёжные материалы для вашего строительства</p>
        </div>
        <Link href="/catalog/?brands=all#products">Все бренды <ArrowRight aria-hidden /></Link>
      </div>
      <ul className="home-brand-gallery">
        {manufacturers.map(({ name, brand, image, width }) => (
          <li key={brand}>
            <Link href={`/catalog/?brand=${encodeURIComponent(brand)}#products`} aria-label={`Товары ${name}`}>
              <span style={{ width }}>
                <Image src={`/assets/brands/${image}.png`} alt={name} fill sizes="(max-width: 600px) 140px, 184px" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="home-projects" aria-labelledby="home-projects-title">
        <div className="home-projects-photo">
          <Image src="/assets/trusted/architecture-v1.webp" alt="Современный жилой квартал в тёплом вечернем свете" fill sizes="(max-width: 767px) 100vw, 640px" />
        </div>
        <div className="home-projects-copy">
          <p className="home-projects-eyebrow">Для застройщиков и подрядчиков</p>
          <h2 id="home-projects-title">Материалы для<br />больших планов</h2>
          <p className="home-projects-description">Комплектуем строительные объекты<br className="home-projects-break" /> и доставляем материалы по Югу России.</p>
          <div className="home-partners">
            <h3>Нам доверяют</h3>
            <ul>
              {partners.map(({ name, x, y, w, h }) => (
                <li key={name}>
                  <span role="img" aria-label={name} style={{ aspectRatio: `${w} / ${h}`, backgroundSize: `${1440 / w * 100}% ${560 / h * 100}%`, backgroundPosition: `${x / (1440 - w) * 100}% ${y / (560 - h) * 100}%` }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="home-projects-geography">Краснодарский край · Ростовская область · Ставрополье</p>
    </section>
  );
}
