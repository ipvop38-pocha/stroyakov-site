import { ReactNode } from "react";
import type { Metadata } from "next";
import { catalogProducts } from "../../catalog/data";

export function generateStaticParams() {
  return catalogProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = catalogProducts.find(item => item.slug === slug);
  if (!product) return { title: "Товар не найден — СТРОЯКОВ" };
  return {
    title: `${product.name} — купить в Краснодаре | СТРОЯКОВ`,
    description: `${product.name}: характеристики и цена за ${product.unit}. Поможем рассчитать количество и подобрать сопутствующие материалы. Доставка и самовывоз.`,
  };
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return children;
}
