"use client";

import { useActionState } from "react";
import { previewImport } from "@/app/admin/produtos/importacoes/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

export function CatalogImportForm() {
  const [state, action, pending] = useActionState(previewImport, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Planilha do catálogo" type="file" name="catalog" accept=".csv,.xlsx" required />
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Validando…" : "Ver prévia"}</Button>
      {state.error && <p role="alert" className="text-sm text-coral-700">{state.error}</p>}
    </form>
  );
}
