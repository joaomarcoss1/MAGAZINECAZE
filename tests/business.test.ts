import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { isValidCPF } from "../src/lib/validators";
import { installments, pixPrice } from "../src/lib/format";
import { shippingFor } from "../src/lib/shipping";
import { buildBrCode } from "../src/lib/payments/brcode";
import { verifyMercadoPagoSignature } from "../src/lib/payments/mercadopago";

test("CPF confere os dígitos verificadores", () => {
  assert.equal(isValidCPF("529.982.247-25"), true);
  for (const cpf of ["52998224726", "11111111111", "123"]) assert.equal(isValidCPF(cpf), false);
});
test("parcelas respeitam o mínimo e o máximo", () => {
  assert.deepEqual(installments(1999), { count: 1, value: 1999 });
  assert.deepEqual(installments(2001), { count: 2, value: 1001 });
  assert.deepEqual(installments(13000), { count: 12, value: 1084 });
});
test("Pix arredonda o desconto para centavos", () => {
  assert.equal(pixPrice(999), 949);
  assert.equal(pixPrice(10), 10);
});
test("frete grátis começa em R$ 199", () => {
  assert.equal(shippingFor(19899), 1990);
  assert.equal(shippingFor(19900), 0);
});
test("BR Code contém o valor e o CRC esperado", () => {
  const code = buildBrCode({ key: "pix@example.com", name: "Cazé", city: "Fortaleza", amountCents: 1234, txid: "A-1" });
  assert.equal(code, "00020126370014br.gov.bcb.pix0115pix@example.com520400005303986540512.345802BR5904CAZE6009FORTALEZA62060502A163048F03");
});
test("Mercado Pago verifica assinatura e rejeita dados divergentes", () => {
  const old = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const deployment = process.env.VERCEL_ENV;
  try {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = "segredo-apenas-para-teste";
    const hash = createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET)
      .update("id:abc;request-id:req-123;ts:1700000000;").digest("hex");
    const opts = { xSignature: `ts=1700000000,v1=${hash}`, xRequestId: "req-123", dataId: "ABC" };
    assert.equal(verifyMercadoPagoSignature(opts), true);
    assert.equal(verifyMercadoPagoSignature({ ...opts, dataId: "outro" }), false);
    assert.equal(verifyMercadoPagoSignature({ ...opts, xSignature: null }), false);
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    process.env.VERCEL_ENV = "production";
    assert.equal(verifyMercadoPagoSignature(opts), false);
  } finally {
    if (old === undefined) delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    else process.env.MERCADOPAGO_WEBHOOK_SECRET = old;
    if (deployment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = deployment;
  }
});
