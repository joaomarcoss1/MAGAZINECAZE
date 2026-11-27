import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { limitRequest } from "@/lib/security/limits";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/api/checkout") return (await limitRequest(request, "checkout")) ?? NextResponse.next();
  if (path.startsWith("/api/pedidos/")) return (await limitRequest(request, "pedidos")) ?? NextResponse.next();
  if (path.startsWith("/api/download/")) return (await limitRequest(request, "download")) ?? NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response; // modo demonstração

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (path.startsWith("/conta") || path.startsWith("/admin"))) {
    const login = request.nextUrl.clone();
    login.pathname = "/entrar";
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/api/checkout", "/api/pedidos/:path*", "/api/download/:path*", "/conta/:path*", "/admin/:path*", "/entrar", "/checkout", "/pedido/:path*"],
};
