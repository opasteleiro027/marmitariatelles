import type { Metadata } from "next";
import { Nunito_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://domingo-na-mesa.openai.site"),
  title: {
    default: "Domingo na Mesa",
    template: "%s | Domingo na Mesa",
  },
  description:
    "Comida caseira feita com carinho para deixar o seu domingo mais gostoso.",
  openGraph: {
    title: "Domingo na Mesa",
    description: "Escolha sua marmita e receba o almoço de domingo em casa.",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1716,
        height: 920,
        alt: "Domingo na Mesa — comida com gosto de casa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Domingo na Mesa",
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
      <body className={`${nunito.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
