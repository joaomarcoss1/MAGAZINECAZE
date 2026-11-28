import "server-only";
import { updateTag } from "next/cache";
import { catalogTag, productSlugTag, productTag } from "./cache-tags";

export function invalidateProduct(id: string, ...slugs: string[]) {
  updateTag(catalogTag);
  updateTag(productTag(id));
  for (const slug of new Set(slugs)) updateTag(productSlugTag(slug));
}
