"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Widget = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const challengeEnabled = Boolean(sitekey);

export function Turnstile({ action, onToken, attempt }: {
  action: "checkout" | "auth";
  onToken: (token: string | undefined) => void;
  attempt: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready || !sitekey || !container.current) return;
    const widget = (window as Window & { turnstile?: Widget }).turnstile;
    if (!widget) return;
    const id = widget.render(container.current, {
      sitekey,
      action,
      appearance: "interaction-only",
      callback: (token: string) => { setFailed(false); onToken(token); },
      "expired-callback": () => { onToken(undefined); widget.reset(id); },
      "error-callback": () => { onToken(undefined); setFailed(true); },
    });
    return () => widget.remove(id);
  }, [ready, action, onToken, attempt]);

  if (!sitekey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)} />
      <div ref={container} />
      {failed && <p role="alert" className="text-sm">Verificação de segurança indisponível. Recarregue a página.</p>}
    </>
  );
}
