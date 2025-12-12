// lib/s3.ts

export async function uploadComprobantePDF(
  tipo: "planes" | "productos",
  pagoID: number,
  pdfBytes: Uint8Array
) {
  const bucket = process.env.S3_BUCKET!
  const region = process.env.S3_REGION!

  // Carpeta por tipo y por año
  const hoy = new Date()
  const year = hoy.getFullYear()

  // EJEMPLOS:
  // comprobantes/planes/2025/comprobante-15.pdf
  // comprobantes/productos/2025/comprobante-88.pdf
  const key = `comprobantes/${tipo}/${year}/comprobante-${pagoID}.pdf`

  const uploadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: pdfBytes,
    headers: {
      "Content-Type": "application/pdf",
    },
  })

  if (!res.ok) {
    throw new Error(`Error al subir PDF a S3: ${res.status} ${res.statusText}`)
  }

  return {
    url: uploadUrl,
    key,
  }
}