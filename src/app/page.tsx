import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BulbIcon,
  HeartIcon,
  HomeIcon,
  LeafIcon,
} from "@/components/icons";
import HandDrawnUnderline from "@/components/hand-drawn-underline";
import NewsletterForm from "@/components/newsletter-form";
import Parallax from "@/components/parallax";
import Reveal from "@/components/reveal";

const features = [
  {
    icon: LeafIcon,
    title: "精選好物",
    desc: "嚴選實用．質感設計",
  },
  {
    icon: HomeIcon,
    title: "貼近日常",
    desc: "從日常需求出發",
  },
  {
    icon: BulbIcon,
    title: "創新科技",
    desc: "探索科技更多可能",
  },
  {
    icon: HeartIcon,
    title: "質感生活",
    desc: "讓好設計融入生活",
  },
];

const products = [
  {
    no: "01",
    name: "AI 車載助理",
    title: "",
    desc: "不只是導航，而是懂你的 AI 夥伴。",
    tags: ["AI語音", "智慧導航", "行車夥伴"],
    image: "from-slate-900 via-slate-800 to-ink",
    photo: "/products/more-to-come.webp",
  },
  {
    no: "02",
    name: "墨水屏鑰匙圈",
    title: "",
    desc: "把喜歡的畫面，帶在身邊。",
    tags: ["個性化顯示", "NFC應用", "輕巧隨身"],
    image: "from-amber-100 via-orange-50 to-stone-200",
    photo: "/products/more-to-come.webp",
  },
  {
    no: "03",
    name: "強力隨身電風扇",
    title: "",
    desc: "小巧強勁，隨時享受涼感。",
    tags: ["大風力", "輕量便攜", "長效續航"],
    image: "from-slate-100 via-white to-slate-200",
    photo: "/products/more-to-come.webp",
  },
  {
    no: "04",
    name: "更多生活科技",
    title: "",
    desc: "持續探索中，敬請期待。",
    tags: ["創新選物", "未來更多可能", "敬請期待"],
    image: "from-indigo-50 via-slate-100 to-mist",
    photo: "/products/more-to-come.webp",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <Parallax speed={0.15}>
          <Image
            src="/hero-banner.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[60%_center]"
          />
        </Parallax>
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white/95 via-white/60 to-transparent md:w-3/5" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:py-28 lg:px-10">
          <Reveal className="flex flex-col justify-center">
            <p className="text-xs font-medium tracking-[0.3em] text-ink/50">
              TECHNOLOGY
              <br />
              FOR A BRIGHTER
              <br />
              EVERYDAY
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight text-ink sm:text-5xl">
              科技，
              <br />
              讓生活更美好。
            </h1>
            <p className="mt-5 text-base text-ink/60">
              用科技，走進每一個日常。
            </p>
            <Link
              href="#products"
              className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-ink/85"
            >
              探索我們的世界
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <div className="mt-16 flex items-center gap-4">
              <span className="h-px w-10 bg-ink/30" />
              <p className="text-xs tracking-[0.25em] text-ink/50">
                SIMPLE · TECH · LOVELY · LIFE
              </p>
            </div>
          </Reveal>

          <div className="relative hidden md:block">
            <Reveal delay={200} className="absolute -right-28 top-16 -rotate-6">
              <p className="font-kurewa text-2xl leading-relaxed text-ink/80 lg:text-3xl">
                讓科技，
                <br />
                陪伴每一個美好的日常。
              </p>
              <HandDrawnUnderline className="-mt-3 h-6 w-full text-ink/70" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-line px-6 lg:grid-cols-4 lg:divide-x lg:divide-y-0 lg:px-10">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal
              key={title}
              delay={i * 90}
              className="flex flex-col items-center gap-3 px-4 py-10 text-center"
            >
              <Icon className="h-7 w-7 text-ink/80" />
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-xs text-ink/50">{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section id="products" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.3em] text-ink/40">
              FEATURED PRODUCTS
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-black text-ink sm:text-3xl">
                最近，我們找到這些有趣的東西。
              </h2>
              <Link
                href="#products"
                className="text-sm font-medium text-ink underline underline-offset-4"
              >
                查看全部商品 →
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.no} delay={i * 100} className="group flex flex-col">
                <div
                  className={`relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 ${p.image}`}
                >
                  {p.photo && (
                    <Image
                      src={p.photo}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  <div className="relative flex items-start justify-between">
                    <span className="text-xs font-semibold tracking-widest text-white/80 drop-shadow-sm">
                      {p.no}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform group-hover:translate-x-0.5">
                      <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative">
                    {p.title && (
                      <p className="text-xs font-medium text-white/70">
                        {p.name}
                      </p>
                    )}
                    <p className="mt-1 text-base font-bold text-white">
                      {p.title || p.name}
                    </p>
                    <p className="mt-1 text-sm text-white/70">{p.desc}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-ink/50 px-3 py-1 text-xs text-ink"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative overflow-hidden bg-cream py-20">
        <Parallax speed={0.1}>
          <Image
            src="/about-bg.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </Parallax>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-10">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.3em] text-ink/40">
              ABOUT US
            </p>
            <h2 className="mt-4 text-3xl font-black text-ink">關於我們</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-ink/60">
              我們是一個小而專注的科技工作室。
              <br />
              從生活中的小需求出發，探索實用、有趣且具有設計感的科技產品。
            </p>
            <p className="mt-5 max-w-lg text-sm leading-7 text-ink/60">
              讓科技簡單一點，
              <br />
              也讓生活更好一點。
            </p>
            <Link
              href="#contact"
              className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white"
            >
              了解更多
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <div className="hidden text-right text-xs leading-loose tracking-[0.25em] text-ink/40 md:block">
            SIMPLE
            <br />
            TECH
            <br />
            LOVELY
            <br />
            LIFE
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section id="news" className="relative overflow-hidden bg-ink">
        <Parallax speed={0.15}>
          <Image
            src="/city-banner.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </Parallax>
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/25 to-black/15" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <Reveal>
            <p className="font-kurewa text-3xl font-bold text-white sm:text-4xl">
              探索更多生活的可能
            </p>
            <p className="mt-4 text-xs tracking-[0.25em] text-white/60">
              MORE TECH
              <br />
              A BRIGHTER EVERYDAY.
            </p>
          </Reveal>

          <Reveal delay={150} className="flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
            <div id="contact" />
            <NewsletterForm />
            <p className="text-xs text-white/60">
              搶先收到新品上市通知，與我們一起發現更好的生活。
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
