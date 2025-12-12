import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // 1. Obtener el ID de la URL (ej: /api/pagos/obtener?id=7)
    const { searchParams } = new URL(request.url)
    const pagoID = searchParams.get("id")

    console.log("[API] Buscando comprobante para PagoID:", pagoID)

    if (!pagoID) {
      return NextResponse.json({ error: "PagoID es requerido" }, { status: 400 })
    }

    // 2. Conectar a la base de datos
    const pool = await getConnection()

    // 3. Ejecutar la consulta
    // Hacemos LEFT JOIN con Socios para traer el RUT real y datos de contacto actualizados
    const result = await pool
      .request()
      .input("pagoID", Number.parseInt(pagoID))
      .query(`
        SELECT 
          c.ComprobanteID,
          c.PagoID,
          c.SocioID,
          s.RUT,              -- Obtenemos el RUT real desde la tabla Socios
          c.MembresíaID,
          c.NumeroComprobante,
          c.FechaEmision,
          c.MontoPago as Monto,
          c.MedioPago as MetodoPago,
          c.NombreSocio,      -- Nombre guardado al momento del pago
          c.EmailSocio,
          c.TelefonoSocio,
          c.NombrePlan,
          c.DuracionPlan,
          c.FechaInicio,
          c.FechaVencimiento,
          c.Concepto,
          c.Estado
        FROM Comprobantes c
        LEFT JOIN Socios s ON c.SocioID = s.SocioID 
        WHERE c.PagoID = @pagoID
      `)

    // 4. Validar si existe
    if (result.recordset.length === 0) {
      console.warn("[API] No se encontró comprobante para PagoID:", pagoID)
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 })
    }

    const data = result.recordset[0]
    
    // 5. Formatear la respuesta para el Frontend
    // Esto asegura que los nombres de campos coincidan con lo que espera tu 'page.tsx'
    const response = {
      PagoID: data.PagoID,
      NumeroComprobante: data.NumeroComprobante,
      Concepto: data.Concepto || `Pago de servicio - Plan ${data.NombrePlan}`,
      FechaPago: data.FechaEmision,
      Monto: data.Monto,
      MetodoPago: data.MetodoPago,
      // Lógica para asegurar que siempre haya Nombre y Apellido
      Nombre: data.NombreSocio ? data.NombreSocio.split(" ")[0] : "Cliente",
      Apellido: data.NombreSocio && data.NombreSocio.split(" ").length > 1 
                ? data.NombreSocio.split(" ").slice(1).join(" ") 
                : "",
      RUT: data.RUT || "N/A", // Aquí enviamos el RUT real
      NombrePlan: data.NombrePlan,
      DuracionDias: data.DuracionPlan,
      FechaInicio: data.FechaInicio,
      FechaVencimiento: data.FechaVencimiento,
    }

    console.log("[API] Datos enviados exitosamente:", response.NumeroComprobante)
    return NextResponse.json(response)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[API] Error crítico:", errorMessage)
    return NextResponse.json({ error: "Error interno del servidor al obtener el comprobante" }, { status: 500 })
  }
}