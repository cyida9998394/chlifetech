import type { Metadata } from "next";
import { Noto_Sans_TC, Zhi_Mang_Xing } from "next/font/google";
import localFont from "next/font/local";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const zhiMangXing = Zhi_Mang_Xing({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: "400",
});

const kurewaGothic = localFont({
  src: [
    {
      path: "./fonts/KurewaGothicCjkTc-Regular.woff2",
      weight: "400",
    },
    {
      path: "./fonts/KurewaGothicCjkTc-Bold.woff2",
      weight: "700",
    },
  ],
  variable: "--font-kurewa",
});

export const metadata: Metadata = {
  title: "CH LIFE TECH 承禾生活科技",
  description: "科技，讓生活更美好。用科技，走進每一個日常。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSansTC.variable} ${zhiMangXing.variable} ${kurewaGothic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
