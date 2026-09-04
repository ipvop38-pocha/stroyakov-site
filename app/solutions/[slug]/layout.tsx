import { ReactNode } from "react";
import { masterKits, solutionCards } from "../data";

export function generateStaticParams() {
  return [...solutionCards, ...masterKits].map((solution) => ({ slug: solution.slug }));
}

export default function SolutionLayout({ children }: { children: ReactNode }) {
  return children;
}
