import { isDemoMode } from "@/lib/config";

export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div className="bg-caja-300 px-4 py-1.5 text-center text-xs font-semibold text-ink-900">
      Modo demonstração: produtos de exemplo e pagamentos simulados. Configure o Supabase e o Mercado Pago no
      arquivo .env para vender de verdade.
    </div>
  );
}
