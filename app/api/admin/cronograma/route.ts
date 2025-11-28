import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0]

    const pool = await getConnection()

    // Get all classes for the week
    const clases = await pool
      .request()
      .input("Fecha", fecha)
      .query(`
      SELECT 
        c.ClaseID,
        c.NombreClase,
        c.DiaSemana,
        c.HoraInicio,
        c.HoraFin,
        c.CupoMaximo,
        u.Nombre + ' ' + u.Apellido as NombreEntrenador,
        (SELECT COUNT(*) FROM ReservasClases rc 
         WHERE rc.ClaseID = c.ClaseID 
         AND rc.Estado = 'Reservada'
         AND rc.FechaClase >= DATEADD(week, DATEDIFF(week, 0, @Fecha), 0)
         AND rc.FechaClase < DATEADD(week, DATEDIFF(week, 0, @Fecha) + 1, 0)
        ) as Inscritos
      FROM Clases c
      INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE c.Activa = 1
      ORDER BY c.DiaSemana, c.HoraInicio
    `)

    // Get all personal sessions for the week
    const sesiones = await pool
      .request()
      .input("Fecha", fecha)
      .query(`
      SELECT 
        sp.SesionID,
        sp.FechaSesion,
        sp.HoraInicio,
        sp.HoraFin,
        sp.Estado,
        ut.Nombre + ' ' + ut.Apellido as NombreEntrenador,
        us.Nombre + ' ' + us.Apellido as NombreSocio
      FROM SesionesPersonales sp
      INNER JOIN Entrenadores e ON sp.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios ut ON e.UsuarioID = ut.UsuarioID
      INNER JOIN Socios s ON sp.SocioID = s.SocioID
      INNER JOIN Usuarios us ON s.Email = us.Email
      WHERE sp.FechaSesion >= DATEADD(week, DATEDIFF(week, 0, @Fecha), 0)
        AND sp.FechaSesion < DATEADD(week, DATEDIFF(week, 0, @Fecha) + 1, 0)
        AND sp.Estado != 'Cancelada'
      ORDER BY sp.FechaSesion, sp.HoraInicio
    `)

    return NextResponse.json({
      clases: clases.recordset,
      sesiones: sesiones.recordset,
    })
  } catch (error) {
    console.error("Error al obtener cronograma:", error)
    return NextResponse.json({ error: "Error al obtener cronograma" }, { status: 500 })
  }
}
