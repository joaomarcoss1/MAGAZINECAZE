export type ProductType = "curso" | "preparatorio" | "ebook" | "sistema" | "fisico";

export type CoverTheme = "atlantico" | "sol" | "caja" | "mandacaru" | "coral" | "noite";

export interface Category {
  slug: string;
  parentSlug?: string | null;
  name: string;
  description: string;
  icon: string; // nome do ícone lucide (ver components/ui/icon.tsx)
  theme: CoverTheme;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  type: ProductType;
  categorySlug: string;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  reviewsCount: number;
  soldCount: number;
  badge: string | null;
  coverTheme: CoverTheme;
  coverIcon: string;
  imageUrl: string | null;
  highlights: string[];
  specs: Record<string, string>;
  /** Para físicos: estoque. Digitais: null (ilimitado). */
  stock: number | null;
  featured: boolean;
  active: boolean;
  /** Entrega digital: caminho no Storage (ebook/sistema) ou URL da área do aluno (curso). */
  deliveryPath: string | null;
  createdAt: string;
  status?: "draft" | "active" | "archived";
  publishAt?: string | null;
  sku?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export type SortOption = "relevancia" | "mais-vendidos" | "menor-preco" | "maior-preco" | "avaliacao" | "novidades";

export interface ProductQuery {
  q?: string;
  category?: string;
  type?: ProductType;
  sort?: SortOption;
  maxPrice?: number;
  limit?: number;
  page?: number;
  attribute?: { name: string; value: string };
}

export const productTypeLabel: Record<ProductType, string> = {
  curso: "Curso online",
  preparatorio: "Preparatório",
  ebook: "E-book",
  sistema: "Sistema",
  fisico: "Produto físico",
};

export function isDigital(p: Pick<Product, "type">): boolean {
  return p.type !== "fisico";
}
