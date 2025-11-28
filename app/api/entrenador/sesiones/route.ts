import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entrenadorID = searchParams.get("entrenadorID")

    if (!entrenadorID) {
      return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT 
          sp.SesionID,
          sp.FechaSesion,
          sp.HoraInicio,
          sp.HoraFin,
          sp.Estado,
          s.Nombre as NombreSocio,
          s.Apellido as ApellidoSocio,
          DATENAME(WEEKDAY, sp.FechaSesion) as DiaSemana
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        WHERE sp.EntrenadorID = @entrenadorID
          AND sp.Estado IN ('Programada', 'Confirmada')
          AND sp.FechaSesion >= CAST(GETDATE() AS DATE)
        ORDER BY sp.FechaSesion, sp.HoraInicio
      `)

    // Map English day names to Spanish
    const dayMap: Record<string, string> = {
      Monday: "Lunes",
      Tuesday: "Martes",
      Wednesday: "Miércoles",
      Thursday: "Jueves",
      Friday: "Viernes",
      Saturday: "Sábado",
      Sunday: "Domingo",
    }

    const sesiones = result.recordset.map((sesion) => ({
      ...sesion,
      DiaSemana: dayMap[sesion.DiaSemana] || sesion.DiaSemana,
    }))

    return NextResponse.json(sesiones)
  } catch (error) {
    console.error("Error al obtener sesiones del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 })
  }
}
