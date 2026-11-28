const bucketPath = "/storage/v1/object/public/produtos/";
const localHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);

function httpUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function catalogImageSources(supabase: string | undefined, configured: string | undefined) {
  const storage = httpUrl(supabase);
  const external = [...new Set((configured ?? "").split(",").map((entry) => entry.trim()).filter(Boolean))];
  const origins = external.map((entry) => {
    const url = httpUrl(entry);
    if (!url || url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.hostname.includes("*") || localHosts.has(url.hostname)) {
      throw new Error("NEXT_PUBLIC_CATALOG_IMAGE_ORIGINS deve conter apenas origens HTTPS explícitas.");
    }
    return url.origin;
  });
  return { storage, origins };
}

export function catalogImageSource(value: string | null | undefined) {
  if (!value) return null;
  const url = httpUrl(value);
  if (!url || url.search || url.hash) return null;
  const { storage, origins } = catalogImageSources(
    process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_CATALOG_IMAGE_ORIGINS,
  );
  if (storage && url.origin === storage.origin) {
    if (!url.pathname.startsWith(bucketPath)) return null;
    return url.protocol === "https:" || localHosts.has(url.hostname)
      ? { url: url.href, local: url.protocol === "http:" } : null;
  }
  return origins.includes(url.origin) ? { url: url.href, local: false } : null;
}

export function imageRemotePatterns(supabase: string | undefined, configured: string | undefined) {
  const { storage, origins } = catalogImageSources(supabase, configured);
  return [
    ...(storage?.protocol === "https:" ? [new URL(bucketPath + "**", storage.origin)] : []),
    ...origins.filter((origin) => origin !== storage?.origin).map((origin) => new URL("/**", origin)),
  ];
}

export function localCatalogImageOrigin(supabase: string | undefined) {
  const url = httpUrl(supabase);
  return url?.protocol === "http:" && localHosts.has(url.hostname) ? url.origin : null;
}
