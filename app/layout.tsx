import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "СТРОЯКОВ — строим решения",
  description: "Интернет-магазин строительных материалов"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
