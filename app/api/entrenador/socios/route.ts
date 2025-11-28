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

    const allSociosResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT 
          s.SocioID,
          s.Nombre,
          s.Apellido,
          s.Email,
          s.Telefono,
          m.NombrePlan,
          mem.Estado as EstadoMembresia
        FROM Socios s
        LEFT JOIN Membresías mem ON s.SocioID = mem.SocioID AND mem.Estado = 'Vigente'
        LEFT JOIN PlanesMembresía m ON mem.PlanID = m.PlanID
        WHERE s.EstadoSocio = 'Activo'
        ORDER BY s.Nombre, s.Apellido
      `)

    const sociosConSesionesResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT DISTINCT
          s.SocioID,
          s.Nombre,
          s.Apellido,
          s.Email,
          s.Telefono,
          COUNT(sp.SesionID) as TotalSesiones
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        WHERE sp.EntrenadorID = @entrenadorID
        GROUP BY s.SocioID, s.Nombre, s.Apellido, s.Email, s.Telefono
        ORDER BY s.Nombre, s.Apellido
      `)

    return NextResponse.json({
      todosSocios: allSociosResult.recordset,
      sociosConSesiones: sociosConSesionesResult.recordset,
    })
  } catch (error) {
    console.error("Error al obtener socios del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener socios" }, { status: 500 })
  }
}
