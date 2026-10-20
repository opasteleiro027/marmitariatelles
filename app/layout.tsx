import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Pote Mix",
    template: "%s | Pote Mix",
  },
  description:
    "Monte seu macarrão, escolha uma receita pronta ou peça uma salada fresquinha.",
  icons: {
    icon: "/brand/pote-mix-mark.webp",
    apple: "/brand/pote-mix-mark.webp",
  },
  openGraph: {
    title: "Pote Mix",
    description: "Você escolhe. Você monta. A gente prepara.",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-pote-mix.webp",
        width: 1200,
        height: 630,
        alt: "Pote Mix — seu sabor favorito, no pote perfeito",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pote Mix",
    description: "Você escolhe. Você monta. A gente prepara.",
    images: ["/og-pote-mix.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
