import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Marmitaria Telles",
    template: "%s | Marmitaria Telles",
  },
  description:
    "Comida caseira feita com carinho para deixar o seu domingo mais gostoso.",
  openGraph: {
    title: "Marmitaria Telles",
    description: "Escolha sua marmita e receba o almoço de domingo em casa.",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1716,
        height: 920,
        alt: "Marmitaria Telles — comida com gosto de casa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marmitaria Telles",
    description: "Escolha sua marmita e receba o almoço de domingo em casa.",
    images: ["/og.png"],
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
