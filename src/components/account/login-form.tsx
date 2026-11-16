"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/format";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    setMsg(null);
    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMsg({ ok: false, text: "E-mail ou senha incorretos." });
      router.push(next);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setLoading(false);
      if (error) return setMsg({ ok: false, text: error.message });
      setMsg({ ok: true, text: "Conta criada! Confira seu e-mail para confirmar o cadastro." });
    }
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 rounded-xl bg-areia-100 p-1 text-sm font-semibold">
        {(["entrar", "cadastrar"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn("rounded-lg py-2 capitalize transition", mode === m ? "bg-white text-brand-800 shadow-sm" : "text-ink-500")}
          >
            {m === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "cadastrar" && (
          <Field label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        )}
        <Field label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <Field
          label="Senha"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "entrar" ? "current-password" : "new-password"}
          hint={mode === "cadastrar" ? "Mínimo de 8 caracteres" : undefined}
          required
        />
        {msg && (
          <p className={cn("rounded-lg p-3 text-sm", msg.ok ? "bg-mandacaru-50 text-mandacaru-700" : "bg-coral-50 text-coral-600")}>{msg.text}</p>
        )}
        <Button type="submit" variant="buy" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === "entrar" ? "Entrar" : "Criar minha conta"}
        </Button>
        <p className="text-center text-xs text-ink-400">
          Use o mesmo e-mail da compra para ver todos os seus produtos.
        </p>
      </form>
    </>
  );
}
