import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entrenadorID = searchParams.get("entrenadorID")
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0]

    if (!entrenadorID) {
      return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Get personal sessions for the week
    const sesionesResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("fecha", fecha)
      .query(`
        SELECT 
          sp.SesionID,
          sp.FechaSesion,
          sp.HoraInicio,
          sp.HoraFin,
          sp.Estado,
          sp.Notas,
          u.Nombre + ' ' + u.Apellido as NombreSocio,
          'Personal' as TipoSesion
        FROM SesionesPersonales sp
        INNER JOIN Socios s ON sp.SocioID = s.SocioID
        INNER JOIN Usuarios u ON s.UsuarioID = u.UsuarioID
        WHERE sp.EntrenadorID = @entrenadorID
        AND sp.FechaSesion >= DATEADD(day, -DATEPART(weekday, @fecha) + 1, @fecha)
        AND sp.FechaSesion < DATEADD(day, 8 - DATEPART(weekday, @fecha), @fecha)
        ORDER BY sp.FechaSesion, sp.HoraInicio
      `)

    // Get group classes for the week
    const clasesResult = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("fecha", fecha)
      .query(`
        SELECT 
          ClaseID,
          NombreClase,
          Horario as FechaSesion,
          Horario as HoraInicio,
          DATEADD(minute, Duracion, Horario) as HoraFin,
          Estado,
          CupoDisponible,
          'Grupal' as TipoSesion
        FROM Clases
        WHERE EntrenadorID = @entrenadorID
        AND Horario >= DATEADD(day, -DATEPART(weekday, @fecha) + 1, @fecha)
        AND Horario < DATEADD(day, 8 - DATEPART(weekday, @fecha), @fecha)
        AND Estado = 'Activa'
        ORDER BY Horario
      `)

    return NextResponse.json({
      sesionesPersonales: sesionesResult.recordset,
      clasesGrupales: clasesResult.recordset,
    })
  } catch (error) {
    console.error("Error al obtener horario del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener horario" }, { status: 500 })
  }
}
