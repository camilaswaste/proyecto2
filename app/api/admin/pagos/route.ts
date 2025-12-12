// app/api/admin/pagos/route.ts
import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

// 🔹 GET: listado de pagos para el historial
export async function GET(request: Request) {
  try {
    const pool = await getConnection()

    const result = await pool.query(`
      SELECT 
        p.PagoID,
        p.SocioID,
        p.MontoPago AS Monto,
        p.FechaPago,
        p.MedioPago AS MetodoPago,
        p.Concepto,
        p.NumeroComprobante,
        p.ComprobantePath,
        pm.NombrePlan
      FROM Pagos p
      LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
      LEFT JOIN PlanesMembresía pm ON m.PlanID = pm.PlanID
      ORDER BY p.FechaPago DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}

// 🔹 POST: registrar un nuevo pago desde /admin/pagos/procesar
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, monto, metodoPago, concepto } = body

    if (!socioID || !monto || !metodoPago) {
      return NextResponse.json(
        { error: "Datos incompletos para registrar el pago" },
        { status: 400 }
      )
    }

    const pool = await getConnection()

    // Generamos un número de comprobante simple
    const numeroComprobante = `COMP-${Date.now()}-${socioID}`

    const insertResult = await pool
      .request()
      .input("SocioID", socioID)
      .input("MontoPago", monto)
      .input("MedioPago", metodoPago)
      .input("Concepto", concepto || null)
      .input("NumeroComprobante", numeroComprobante)
      .query(`
        INSERT INTO Pagos (
          SocioID, 
          MontoPago, 
          MedioPago, 
          FechaPago, 
          Concepto, 
          NumeroComprobante
        )
        OUTPUT INSERTED.PagoID
        VALUES (
          @SocioID, 
          @MontoPago, 
          @MedioPago, 
          GETDATE(), 
          @Concepto, 
          @NumeroComprobante
        );
      `)

    const pagoID = insertResult.recordset[0].PagoID

    return NextResponse.json(
      {
        pagoID,
        numeroComprobante,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al registrar pago:", error)
    return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 })
  }
}