import { z } from "zod";

export function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export const customerSchema = z.object({
  name: z.string().trim().min(5, "Informe nome e sobrenome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  cpf: z.string().refine(isValidCPF, "CPF inválido").transform(onlyDigits),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
});

export const addressSchema = z.object({
  cep: z.string().transform(onlyDigits).refine((v) => v.length === 8, "CEP inválido"),
  street: z.string().trim().min(3, "Informe a rua"),
  number: z.string().trim().min(1, "Informe o número"),
  complement: z.string().trim().max(80).optional().default(""),
  district: z.string().trim().min(2, "Informe o bairro"),
  city: z.string().trim().min(2, "Informe a cidade"),
  state: z.string().trim().length(2, "UF inválida").toUpperCase(),
});

export const checkoutSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1).max(64), quantity: z.number().int().min(1).max(10) }))
    .min(1, "Carrinho vazio")
    .max(30),
  customer: customerSchema,
  address: addressSchema.optional(),
  method: z.enum(["pix", "card"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Address = z.infer<typeof addressSchema>;
