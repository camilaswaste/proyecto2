import { NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { uploadComprobantePDF } from "@/lib/s3"


export const runtime = "nodejs" // usamos runtime Node clásico

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 })
    }

    const pagoID = parseInt(id, 10)
    if (Number.isNaN(pagoID)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 })
    }

    const pool = await getConnection()

    // 🔹 Usa los nombres REALES de tu tabla Pagos (según tu script SQL)
    const result = await pool
      .request()
      .input("pagoID", pagoID)
      .query(`
        SELECT 
          p.PagoID,
          p.NumeroComprobante,
          p.FechaPago,
          p.MontoPago     AS Monto,        -- alias para usar data.Monto
          p.MedioPago     AS MetodoPago,   -- alias para usar data.MetodoPago
          p.Concepto,
          s.Nombre,
          s.Apellido,
          s.RUT
        FROM Pagos p
        INNER JOIN Socios s ON p.SocioID = s.SocioID
        WHERE p.PagoID = @pagoID;
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 })
    }

    const data = result.recordset[0]

    // ========= Crear PDF con pdf-lib =========
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = height - 50
    const fontSizeTitle = 20
    const fontSizeNormal = 10

    const drawText = (
      text: string,
      options: {
        x?: number
        y?: number
        size?: number
        bold?: boolean
        color?: { r: number; g: number; b: number }
      } = {}
    ) => {
      const {
        x = 50,
        y: yPos,
        size = fontSizeNormal,
        bold = false,
        color = { r: 0, g: 0, b: 0 },
      } = options

      page.drawText(text, {
        x,
        y: yPos ?? y,
        size,
        font: bold ? fontBold : font,
        color: rgb(color.r, color.g, color.b),
      })
    }

    // Encabezado izquierda
    drawText("MUNDO FITNESS", { x: 50, y, size: fontSizeTitle, bold: true })
    y -= 18
    drawText("Chimbarongo, Región de O'Higgins", { x: 50, y })
    y -= 12
    drawText("RUT: 76.XXX.XXX-X", { x: 50, y })

    // Encabezado derecha (datos del comprobante)
    const rightX = width - 250
    let yRight = height - 50
    drawText("RECIBO DE PAGO", { x: rightX, y: yRight, size: 14, bold: true })
    yRight -= 14
    drawText(data.NumeroComprobante || `REF-${data.PagoID}`, {
      x: rightX,
      y: yRight,
      size: 10,
    })
    yRight -= 12
    drawText(new Date(data.FechaPago).toLocaleString("es-CL"), {
      x: rightX,
      y: yRight,
      size: 10,
    })

    // Línea separadora
    y -= 40
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 30

    // Cliente
    drawText("Cliente", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Nombre: ${data.Nombre} ${data.Apellido}`, { x: 50, y })
    y -= 12
    drawText(`RUT: ${data.RUT}`, { x: 50, y })
    y -= 12
    drawText(`ID Pago: #${data.PagoID}`, { x: 50, y })

    // Resumen de Pago
    y -= 24
    drawText("Resumen de pago", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Método: ${data.MetodoPago}`, { x: 50, y })
    y -= 12
    drawText("Estado: Pagado", { x: 50, y })

    // Detalle
    y -= 24
    drawText("Detalle", { x: 50, y, size: 12, bold: true })
    y -= 16
    drawText(`Concepto: ${data.Concepto || "Pago de servicios de gimnasio"}`, {
      x: 50,
      y,
      size: 10,
    })

    // Total
    y -= 24
    const totalCLP = Number(data.Monto || 0).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    })
    drawText(`Total Pagado: ${totalCLP}`, {
      x: 50,
      y,
      size: 14,
      bold: true,
    })

    // Footer
    y -= 40
    drawText("Documento generado electrónicamente.", {
      x: 50,
      y,
      size: 8,
    })

    const pdfBytes = await pdfDoc.save() // Uint8Array

    const { url : pdfUrl } = await uploadComprobantePDF("planes", pagoID, pdfBytes)
    console.log("PDF subido a S3 en URL:", pdfUrl)
    
    await pool
        .request()
        .input("url", pdfUrl)
        .input("pagoID", pagoID)
        .query(`
            UPDATE Pagos
            SET ComprobantePath = @url
            WHERE PagoID = @pagoID;
        `)

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${data.PagoID}.pdf"`,
        "x-comprobante-url": pdfUrl,
      },
    })
  } catch (err) {
    console.error("Error al generar PDF:", err)
    return NextResponse.json({ error: "Error interno al generar PDF" }, { status: 500 })
  }
}