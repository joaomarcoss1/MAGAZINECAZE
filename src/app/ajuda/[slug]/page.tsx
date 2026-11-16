import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { store } from "@/lib/config";

/**
 * Páginas institucionais. ATENÇÃO: textos-base de referência —
 * revise com um(a) advogado(a) antes de publicar.
 */
const pages: Record<string, { title: string; body: string[] }> = {
  sobre: {
    title: "Sobre a Magazine Cazé",
    body: [
      `A ${store.name} nasceu no Nordeste com uma missão simples: levar conhecimento e oportunidades a quem quer crescer, com preço justo e atendimento de gente como a gente.`,
      "Reunimos preparatórios para ENEM e concursos, cursos profissionalizantes, e-books e sistemas para pequenos negócios, além de produtos físicos selecionados.",
    ],
  },
  termos: {
    title: "Termos de uso",
    body: [
      "Ao comprar na loja, você recebe uma licença pessoal e intransferível de uso dos produtos digitais. É proibido compartilhar, revender ou distribuir o conteúdo.",
      "Os preços e as condições de pagamento podem mudar sem aviso, mas o valor confirmado no seu pedido é sempre respeitado.",
      "Os arquivos digitais podem receber uma identificação do comprador (marca d’água) para proteger os direitos autorais.",
    ],
  },
  privacidade: {
    title: "Política de privacidade (LGPD)",
    body: [
      "Coletamos apenas os dados necessários para processar o seu pedido, emitir a nota fiscal e liberar o acesso aos produtos: nome, e-mail, CPF, telefone e, para produtos físicos, o endereço de entrega.",
      "Os pagamentos são processados pelo Mercado Pago. Não armazenamos dados de cartão de crédito.",
      `Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail ${store.supportEmail}.`,
    ],
  },
  "trocas-e-reembolso": {
    title: "Trocas e reembolso",
    body: [
      "Você tem 7 dias corridos a partir da compra para desistir e receber o reembolso integral, como garante o art. 49 do Código de Defesa do Consumidor.",
      "Pagamentos via Pix são reembolsados na mesma conta de origem. No cartão, o estorno aparece em uma ou duas faturas, conforme o banco.",
      "Produtos físicos devem ser devolvidos na embalagem original; o frete de devolução fica por nossa conta.",
    ],
  },
  "entrega-digital": {
    title: "Como recebo meu produto?",
    body: [
      "Pagou com Pix? O acesso é liberado em segundos. No cartão, assim que a operadora aprova.",
      "Os links de download e de acesso aos cursos aparecem na página do pedido e em Minha conta → Meus produtos.",
      "Produtos físicos são enviados com código de rastreio em até 2 dias úteis após a aprovação do pagamento.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = pages[(await params).slug];
  return p ? { title: p.title } : {};
}

export default async function HelpPage({ params }: Props) {
  const page = pages[(await params).slug];
  if (!page) notFound();
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-4xl font-extrabold">{page.title}</h1>
      <div className="mt-8 space-y-5 rounded-3xl border border-areia-200 bg-white p-8 leading-relaxed text-ink-700">
        {page.body.map((p, i) => <p key={i}>{p}</p>)}
        <p className="border-t border-areia-200 pt-5 text-sm text-ink-500">
          Dúvidas? Fale com a gente: <a href={`mailto:${store.supportEmail}`} className="font-semibold text-brand-600">{store.supportEmail}</a>
        </p>
      </div>
    </div>
  );
}
