"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Turnstile, challengeEnabled } from "@/components/security/turnstile";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/format";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name, email, password, next, captchaToken }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        setMsg({ ok: false, text: error });
      } else if (mode === "entrar") {
        window.location.assign(next);
      } else {
        setMsg({ ok: true, text: "Conta criada! Confira seu e-mail para confirmar o cadastro." });
      }
    } catch {
      setMsg({ ok: false, text: "Não foi possível continuar. Tente novamente." });
    } finally {
      setCaptchaToken(undefined);
      setAttempt((value) => value + 1);
      setLoading(false);
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
        <Turnstile action="auth" onToken={setCaptchaToken} attempt={attempt} />
        <Button type="submit" variant="buy" size="lg" className="w-full" disabled={loading || (challengeEnabled && !captchaToken)}>
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
