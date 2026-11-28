"use client";

import { useActionState } from "react";
import { uploadProductImage } from "@/app/admin/produtos/image-actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

export function ProductImageUpload({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<{ error?: string; uploaded?: boolean }, FormData>(uploadProductImage.bind(null, productId), {});
  return (
    <section className="mt-8 rounded-2xl border border-areia-200 bg-white p-5">
      <h2 className="text-xl font-extrabold">Enviar imagem</h2>
      <p className="mb-4 text-sm text-ink-500">JPEG, PNG ou WebP de até 2 MB. As imagens aparecem na ordem de envio.</p>
      <form action={action} className="space-y-4">
        <Field label="Arquivo de imagem" name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
        <Field label="Texto alternativo" name="alt" maxLength={160} required />
        <Button type="submit" variant="outline" disabled={pending}>{pending ? "Enviando…" : "Adicionar à galeria"}</Button>
        {state.error && <p role="alert" className="text-sm text-coral-700">{state.error}</p>}
        {state.uploaded && <p role="status" className="text-sm text-mandacaru-700">Imagem adicionada à galeria.</p>}
      </form>
    </section>
  );
}
