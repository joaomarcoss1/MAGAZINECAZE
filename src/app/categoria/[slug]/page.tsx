import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategory } from "@/lib/catalog/repository";
import { CatalogView, type CatalogParams } from "@/components/product/catalog-view";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogParams> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  return c ? { title: c.name, description: c.description } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const sp = await searchParams;
  return (
    <CatalogView
      params={{ ...sp, categoria: slug }}
      basePath={`/categoria/${slug}`}
      title={category.name}
      description={category.description}
    />
  );
}
