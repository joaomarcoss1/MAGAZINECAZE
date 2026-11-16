/** Gera um BR Code (Pix copia e cola) estático — usado apenas no modo demonstração. */
function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function buildBrCode(opts: { key: string; name: string; city: string; amountCents: number; txid: string }) {
  const clean = (s: string, n: number) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase().slice(0, n);
  const payload =
    tlv("00", "01") +
    tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", opts.key)) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", (opts.amountCents / 100).toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", clean(opts.name, 25)) +
    tlv("60", clean(opts.city, 15)) +
    tlv("62", tlv("05", opts.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25))) +
    "6304";
  return payload + crc16(payload);
}
