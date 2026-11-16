import { getCategories, getProducts } from "@/lib/catalog/repository";
import { Hero } from "@/components/home/hero";
import { CategoryTiles } from "@/components/home/category-tiles";
import { Benefits } from "@/components/home/benefits";
import { PromoBanners } from "@/components/home/promo-banners";
import { Testimonials } from "@/components/home/testimonials";
import { ProductRail } from "@/components/product/product-card";
import { SectionTitle } from "@/components/ui/section-title";

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured, bestSellers, newest, ebooks] = await Promise.all([
    getCategories(),
    getProducts({ sort: "relevancia", limit: 3 }),
    getProducts({ sort: "mais-vendidos", limit: 8 }),
    getProducts({ sort: "novidades", limit: 4 }),
    getProducts({ category: "ebooks", sort: "mais-vendidos", limit: 4 }),
  ]);

  return (
    <>
      <Hero spotlight={featured} />
      <div className="container-page relative -mt-10 space-y-16">
        <Benefits />

        <section>
          <SectionTitle title="Navegue por categoria" subtitle="Tudo o que você precisa para estudar, trabalhar e empreender" />
          <CategoryTiles categories={categories} />
        </section>

        <section>
          <SectionTitle title="🔥 Mais vendidos da semana" href="/produtos?ordem=mais-vendidos" />
          <ProductRail products={bestSellers.slice(0, 4)} />
        </section>

        <PromoBanners />

        <section>
          <SectionTitle title="Novidades na loja" subtitle="Acabaram de chegar" href="/produtos?ordem=novidades" />
          <ProductRail products={newest} />
        </section>

        <section>
          <SectionTitle title="E-books para ler hoje" subtitle="Entrega imediata no seu e-mail e na sua conta" href="/categoria/ebooks" />
          <ProductRail products={ebooks} />
        </section>

        <section>
          <SectionTitle title="Quem comprou, aprovou" subtitle="Histórias de clientes de todo o Nordeste" />
          <Testimonials />
        </section>
      </div>
    </>
  );
}
