import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-8xl font-extrabold text-brand-100">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">Eita! Página não encontrada</h1>
      <p className="mt-2 text-ink-500">O link pode ter mudado ou o produto saiu da loja.</p>
      <ButtonLink href="/" variant="buy" className="mt-6">Voltar para o início</ButtonLink>
    </div>
  );
}
