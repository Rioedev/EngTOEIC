import type { Metadata } from "next";
import "./globals.css";

const themeInitializationScript = `
  (() => {
    try {
      const theme = localStorage.getItem("engtoeic-theme");
      const glass = localStorage.getItem("engtoeic-glass");
      const themes = ["mint", "lime", "violet", "sky", "coral", "amber", "rose", "slate"];
      const glassLevels = ["clear", "frosted", "soft"];

      if (themes.includes(theme)) document.documentElement.dataset.theme = theme;
      if (glassLevels.includes(glass)) document.documentElement.dataset.glass = glass;
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
