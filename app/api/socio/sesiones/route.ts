import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const socioID = searchParams.get("socioID")

    if (!socioID) {
      return NextResponse.json({ error: "SocioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const result = await pool
      .request()
      .input("socioID", socioID)
      .query(`
        SELECT 
          sp.SesionID,
          sp.FechaSesion,
          sp.HoraInicio,
          sp.HoraFin,
          sp.Estado,
          sp.Notas,
          u.Nombre + ' ' + u.Apellido as NombreEntrenador,
          e.Especialidad
        FROM SesionesPersonales sp
        INNER JOIN Entrenadores e ON sp.EntrenadorID = e.EntrenadorID
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE sp.SocioID = @socioID
        ORDER BY sp.FechaSesion DESC, sp.HoraInicio DESC
      `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error al obtener sesiones:", error)
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 })
  }
}

// Book a personal session
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { socioID, entrenadorID, fechaSesion, horaInicio, horaFin, notas } = body

    if (!socioID || !entrenadorID || !fechaSesion || !horaInicio || !horaFin) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    // Check if trainer is available at that time
    const existingSessions = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("fechaSesion", fechaSesion)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        SELECT COUNT(*) as Count
        FROM SesionesPersonales
        WHERE EntrenadorID = @entrenadorID
          AND FechaSesion = @fechaSesion
          AND Estado != 'Cancelada'
          AND (
            (HoraInicio < @horaFin AND HoraFin > @horaInicio)
          )
      `)

    if (existingSessions.recordset[0].Count > 0) {
      return NextResponse.json({ error: "El entrenador no está disponible en ese horario" }, { status: 400 })
    }

    await pool
      .request()
      .input("socioID", socioID)
      .input("entrenadorID", entrenadorID)
      .input("fechaSesion", fechaSesion)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .input("notas", notas || null)
      .query(`
        INSERT INTO SesionesPersonales (SocioID, EntrenadorID, FechaSesion, HoraInicio, HoraFin, Estado, Notas)
        VALUES (@socioID, @entrenadorID, @fechaSesion, @horaInicio, @horaFin, 'Agendada', @notas)
      `)

    return NextResponse.json({ message: "Sesión agendada exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error al agendar sesión:", error)
    return NextResponse.json({ error: "Error al agendar sesión" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sesionID = searchParams.get("sesionID")

    if (!sesionID) {
      return NextResponse.json({ error: "SesionID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("sesionID", sesionID)
      .query(`
        UPDATE SesionesPersonales
        SET Estado = 'Cancelada'
        WHERE SesionID = @sesionID
      `)

    return NextResponse.json({ message: "Sesión cancelada exitosamente" })
  } catch (error) {
    console.error("Error al cancelar sesión:", error)
    return NextResponse.json({ error: "Error al cancelar sesión" }, { status: 500 })
  }
}
