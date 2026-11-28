import sharp from "sharp";

export const maxImageBytes = 2 * 1024 * 1024;

export async function normalizeCatalogImage(input: Buffer) {
  if (!input.length || input.length > maxImageBytes) throw new Error("Imagem fora do limite.");
  // Verifica a assinatura antes de entregar bytes ao decodificador.
  const jpeg = input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff;
  const png = input.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  const webp = input.toString("ascii", 0, 4) === "RIFF" && input.toString("ascii", 8, 12) === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("Formato não aceito.");

  const source = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" });
  const metadata = await source.metadata();
  if ((metadata.pages ?? 1) > 1) throw new Error("Use uma imagem fixa.");
  const image = await source.autoOrient().resize({
    width: 1800, height: 1800, fit: "inside", withoutEnlargement: true,
  }).webp({ quality: 82 }).toBuffer();
  if (image.length > maxImageBytes) throw new Error("Imagem final fora do limite.");
  return image;
}
