import { getConnection } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entrenadorId = searchParams.get("entrenadorId") || searchParams.get("entrenadorID")
    const startDate =
      searchParams.get("startDate") || searchParams.get("fecha") || new Date().toISOString().split("T")[0]

    if (!entrenadorId) {
      return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const clasesResult = await pool
      .request()
      .input("entrenadorID", entrenadorId)
      .input("fecha", startDate)
      .query(`
        SELECT 
          c.ClaseID,
          c.NombreClase,
          c.DiaSemana,
          CONVERT(VARCHAR(5), c.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), c.HoraFin, 108) as HoraFin,
          c.CupoMaximo,
          (SELECT COUNT(*) FROM ReservasClases rc 
           WHERE rc.ClaseID = c.ClaseID 
           AND rc.Estado = 'Reservada'
           AND rc.FechaClase >= DATEADD(week, DATEDIFF(week, 0, @fecha), 0)
           AND rc.FechaClase < DATEADD(week, DATEDIFF(week, 0, @fecha) + 1, 0)
          ) as Inscritos,
          'Grupal' as TipoSesion
        FROM Clases c
        WHERE c.EntrenadorID = @entrenadorID
          AND c.Activa = 1
        ORDER BY 
          CASE c.DiaSemana
            WHEN 'Lunes' THEN 1
            WHEN 'Martes' THEN 2
            WHEN 'Miércoles' THEN 3
            WHEN 'Jueves' THEN 4
            WHEN 'Viernes' THEN 5
            WHEN 'Sábado' THEN 6
            WHEN 'Domingo' THEN 7
          END,
          c.HoraInicio
      `)

    const sesionesResult = await pool
      .request()
      .input("entrenadorID", entrenadorId)
      .input("fecha", startDate)
      .query(`
        SELECT 
          sp.SesionID,
          CONVERT(VARCHAR(10), sp.FechaSesion, 23) as FechaSesion,
          CONVERT(VARCHAR(5), sp.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), sp.HoraFin, 108) as HoraFin,
          sp.Estado,
          s.Nombre + ' ' + s.Apellido as NombreSocio,
          'Personal' as TipoSesion
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        WHERE sp.EntrenadorID = @entrenadorID
          AND sp.FechaSesion >= DATEADD(week, DATEDIFF(week, 0, @fecha), 0)
          AND sp.FechaSesion < DATEADD(week, DATEDIFF(week, 0, @fecha) + 1, 0)
          AND sp.Estado != 'Cancelada'
        ORDER BY sp.FechaSesion, sp.HoraInicio
      `)

    const recepcionResult = await pool
      .request()
      .input("entrenadorID", entrenadorId)
      .query(`
        SELECT 
          hr.HorarioRecepcionID,
          hr.DiaSemana,
          CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
          CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin
        FROM HorariosRecepcion hr
        WHERE hr.EntrenadorID = @entrenadorID
          AND hr.Activo = 1
        ORDER BY 
          CASE hr.DiaSemana
            WHEN 'Lunes' THEN 1
            WHEN 'Martes' THEN 2
            WHEN 'Miércoles' THEN 3
            WHEN 'Jueves' THEN 4
            WHEN 'Viernes' THEN 5
            WHEN 'Sábado' THEN 6
            WHEN 'Domingo' THEN 7
          END,
          hr.HoraInicio
      `)

    return NextResponse.json({
      clases: clasesResult.recordset,
      sesiones: sesionesResult.recordset,
      recepcion: recepcionResult.recordset,
    })
  } catch (error) {
    console.error("Error al obtener horario del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener horario" }, { status: 500 })
  }
}
