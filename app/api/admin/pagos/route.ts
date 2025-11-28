import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        p.PagoID,
        p.SocioID,
        u.Nombre + ' ' + u.Apellido as NombreSocio,
        p.Monto,
        p.FechaPago,
        p.MetodoPago,
        p.Estado,
        p.Concepto,
        pl.NombrePlan
      FROM Pagos p
      INNER JOIN Socios s ON p.SocioID = s.SocioID
      INNER JOIN Usuarios u ON s.UsuarioID = u.UsuarioID
      LEFT JOIN Membresías m ON p.MembresíaID = m.MembresíaID
      LEFT JOIN PlanesMembresía pl ON m.PlanID = pl.PlanID
      ORDER BY p.FechaPago DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}
