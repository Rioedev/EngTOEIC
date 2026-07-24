import type { Metadata } from "next";
import "./globals.css";

const themeInitializationScript = `
  (() => {
    try {
      const theme = localStorage.getItem("engtoeic-theme");
      const glass = localStorage.getItem("engtoeic-glass");
      const language = localStorage.getItem("engtoeic-language");
      const reduceMotion = localStorage.getItem("engtoeic-reduce-motion");
      const highContrast = localStorage.getItem("engtoeic-high-contrast");
      const largeText = localStorage.getItem("engtoeic-large-text");
      const themes = ["mint", "lime", "violet", "sky", "coral", "amber", "rose", "slate"];
      const glassLevels = ["clear", "frosted", "soft"];

      if (themes.includes(theme)) document.documentElement.dataset.theme = theme;
      if (glassLevels.includes(glass)) document.documentElement.dataset.glass = glass;
      if (language === "vi" || language === "en") {
        document.documentElement.lang = language;
        document.documentElement.dataset.language = language;
      }
      if (reduceMotion === "true" || reduceMotion === "false") document.documentElement.dataset.reduceMotion = reduceMotion;
      if (highContrast === "true" || highContrast === "false") document.documentElement.dataset.highContrast = highContrast;
      if (largeText === "true" || largeText === "false") document.documentElement.dataset.largeText = largeText;
    } catch {}
  })();
`;

export const metadata: Metadata = {
  title: "EngTOEIC",
  description: "Cozy TOEIC study dashboard",
  icons: {
    icon: "/images/engtoeic-lion-logo-transparent.png",
    apple: "/images/engtoeic-lion-logo-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
