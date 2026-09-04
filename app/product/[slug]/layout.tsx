import { ReactNode } from "react";
import { catalogProducts } from "../../catalog/data";

export function generateStaticParams() {
  return catalogProducts.map((product) => ({ slug: product.slug }));
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return children;
}
