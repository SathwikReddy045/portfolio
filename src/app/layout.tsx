import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/core/SmoothScroll";
import CustomCursor from "@/components/core/CustomCursor";
import Navigation from "@/components/core/Navigation";
import ThemeSwitcher from "@/components/core/ThemeSwitcher";
import Script from "next/script";
import { themeBootScript, paletteById, DEFAULT_THEME } from "@/lib/theme";

const defaultPalette = paletteById(DEFAULT_THEME);
import { site } from "@/content/site";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.roleLong}`,
  description: site.intro,
  openGraph: {
    title: `${site.name} — ${site.roleLong}`,
    description: site.intro,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: defaultPalette.bg,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${mono.variable}`}
      data-theme={DEFAULT_THEME}
      data-light={defaultPalette.light ? "1" : "0"}
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <SmoothScroll>
          <Navigation />
          {children}
        </SmoothScroll>
        <CustomCursor />
        <ThemeSwitcher />
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
