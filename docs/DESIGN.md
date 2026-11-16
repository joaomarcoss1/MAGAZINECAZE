# Design system — Magazine Cazé

Identidade inspirada no Nordeste: **mar, sol e sertão**. Os tokens ficam em `src/app/globals.css` (`@theme` do Tailwind v4) e viram classes como `bg-brand-700`, `text-sol-500` e `bg-areia-50`.

## Paleta

| Token | Nome | Hex principal | Uso |
|---|---|---|---|
| `brand` | Azul Atlântico | `#0F4772` (700) | Marca, cabeçalho, navegação, links. Transmite confiança. |
| `sol` | Laranja Sol | `#F66510` (500) | **Somente CTAs de compra** ("Comprar agora", "Finalizar") e urgência. |
| `caja` | Amarelo Cajá | `#FFC93C` (400) | Destaques, estrelas, busca, selos "Novo". |
| `mandacaru` | Verde Mandacaru | `#1F9D6B` (500) | Pix, descontos, sucesso, "acesso imediato". |
| `areia` | Areia | `#FCFAF6` (50) | Fundo da página e superfícies neutras quentes. |
| `ink` | Tinta | `#1A1F2B` (900) | Textos. |
| `coral` | Coral | `#E5484D` (500) | Selos de oferta, erros, estoque baixo. |

**Regra de ouro:** laranja = comprar. Se tudo for laranja, nada chama atenção.
O azul organiza, o verde tranquiliza (dinheiro e Pix) e o amarelo destaca.

## Tipografia
- **Plus Jakarta Sans** (títulos e preços): geométrica, moderna, com cara de varejo premium.
- **Inter** (texto e interface): ótima leitura em telas pequenas.

As fontes são servidas pelo próprio site (pacotes `@fontsource`), sem depender do Google Fonts.

## Componentes base (`src/components/ui`)
- `Button` / `ButtonLink`: variantes `buy` (laranja), `primary` (azul), `outline`, `ghost` e `pix` (verde).
- `Badge`: o tom é escolhido automaticamente pelo texto do selo (`badgeTone`).
- `Price`: preço "de/por", % de desconto, parcelamento sem juros e preço no Pix.
- `Rating`: estrelas cajá.
- `Field`: campo de formulário com rótulo, dica e erro.

## Capas geradas
`ProductCover` cria capas elegantes para cada produto (gradiente do tema, motivo de sol e ondas, ícone e título) quando ainda não há imagem.
Basta preencher `image_url` para usar uma arte própria.

## Padrões de conversão aplicados
- Barra de benefícios fixa (Pix, 12x, acesso imediato, atendimento).
- Prova social em cards e na página do produto (nota, avaliações, vendidos).
- Preço ancorado ("de/por") e economia em reais no Pix.
- "Comprar agora" leva direto ao checkout; "Adicionar ao carrinho" mantém o cliente navegando.
- Checkout em uma página, com máscaras, busca de CEP e Pix como opção padrão.
- Garantia de 7 dias visível perto do botão de compra.
