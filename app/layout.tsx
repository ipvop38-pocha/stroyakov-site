import type { Metadata } from "next";
import "@fontsource/golos-text/cyrillic-400.css";
import "@fontsource/golos-text/cyrillic-500.css";
import "@fontsource/golos-text/cyrillic-600.css";
import "@fontsource/golos-text/cyrillic-700.css";
import "@fontsource/golos-text/cyrillic-800.css";
import "@fontsource/roboto-condensed/cyrillic-900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "СТРОЯКОВ — строительные материалы и готовые решения",
  description: "Подбор строительных материалов, актуальные остатки и доставка на объект по Краснодару и ЮФО.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html data-scroll-behavior="smooth" lang="ru"><body>{children}</body></html>;
}
