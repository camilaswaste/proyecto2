import { getConnection } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching recepción data...")

    const pool = await getConnection()

    const horarios = await pool.request().query(`
      SELECT 
        hr.HorarioRecepcionID,
        hr.EntrenadorID,
        hr.DiaSemana,
        CONVERT(VARCHAR(5), hr.HoraInicio, 108) as HoraInicio,
        CONVERT(VARCHAR(5), hr.HoraFin, 108) as HoraFin,
        u.Nombre,
        u.Apellido,
        e.Especialidad
      FROM HorariosRecepcion hr
      INNER JOIN Entrenadores e ON hr.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE hr.Activo = 1
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

    console.log("[v0] Horarios encontrados:", horarios.recordset.length)

    const entrenadores = await pool.request().query(`
      SELECT 
        e.EntrenadorID,
        u.Nombre,
        u.Apellido,
        e.Especialidad,
        u.Email
      FROM Entrenadores e
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE u.Activo = 1
      ORDER BY u.Nombre, u.Apellido
    `)

    console.log("[v0] Entrenadores encontrados:", entrenadores.recordset.length)

    return NextResponse.json({
      horarios: horarios.recordset,
      entrenadores: entrenadores.recordset,
    })
  } catch (error) {
    console.error("[v0] Error fetching recepción data:", error)
    return NextResponse.json({ error: "Error al obtener datos de recepción" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { entrenadorID, diaSemana, horaInicio, horaFin } = await request.json()

    const pool = await getConnection()

    // Validar que el entrenador existe y está activo
    const entrenador = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT e.EntrenadorID
        FROM Entrenadores e
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE e.EntrenadorID = @entrenadorID AND u.Activo = 1
      `)

    if (entrenador.recordset.length === 0) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    // Verificar que no haya conflicto con otro horario de recepción del mismo entrenador
    const conflictoRecepcion = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("diaSemana", diaSemana)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        SELECT HorarioRecepcionID
        FROM HorariosRecepcion
        WHERE EntrenadorID = @entrenadorID
          AND DiaSemana = @diaSemana
          AND Activo = 1
          AND (
            (@horaInicio >= HoraInicio AND @horaInicio < HoraFin)
            OR (@horaFin > HoraInicio AND @horaFin <= HoraFin)
            OR (@horaInicio <= HoraInicio AND @horaFin >= HoraFin)
          )
      `)

    if (conflictoRecepcion.recordset.length > 0) {
      return NextResponse.json(
        { error: "El entrenador ya tiene un horario de recepción en este rango de horas" },
        { status: 400 },
      )
    }

    // Verificar que no haya clases grupales del entrenador en este horario
    const conflictoClases = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("diaSemana", diaSemana)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        SELECT ClaseID
        FROM Clases
        WHERE EntrenadorID = @entrenadorID
          AND DiaSemana = @diaSemana
          AND Activa = 1
          AND (
            (@horaInicio >= HoraInicio AND @horaInicio < HoraFin)
            OR (@horaFin > HoraInicio AND @horaFin <= HoraFin)
            OR (@horaInicio <= HoraInicio AND @horaFin >= HoraFin)
          )
      `)

    if (conflictoClases.recordset.length > 0) {
      return NextResponse.json(
        { error: "El entrenador tiene clases grupales programadas en este horario" },
        { status: 400 },
      )
    }

    // Crear el horario de recepción
    await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("diaSemana", diaSemana)
      .input("horaInicio", horaInicio)
      .input("horaFin", horaFin)
      .query(`
        INSERT INTO HorariosRecepcion (EntrenadorID, DiaSemana, HoraInicio, HoraFin)
        VALUES (@entrenadorID, @diaSemana, @horaInicio, @horaFin)
      `)

    return NextResponse.json({ message: "Horario de recepción asignado exitosamente" })
  } catch (error) {
    console.error("Error creating recepción:", error)
    return NextResponse.json({ error: "Error al asignar horario de recepción" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const horarioID = searchParams.get("id")

    if (!horarioID) {
      return NextResponse.json({ error: "ID de horario requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    // Verificar que no haya intercambios pendientes relacionados con este horario
    const intercambiosPendientes = await pool
      .request()
      .input("horarioID", horarioID)
      .query(`
        SELECT IntercambioID
        FROM IntercambiosHorario
        WHERE (HorarioOrigenID = @horarioID OR HorarioDestinoID = @horarioID)
          AND Estado = 'Pendiente'
      `)

    if (intercambiosPendientes.recordset.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: hay solicitudes de intercambio pendientes para este horario" },
        { status: 400 },
      )
    }

    // Eliminar físicamente el horario
    await pool
      .request()
      .input("horarioID", horarioID)
      .query(`
        DELETE FROM HorariosRecepcion
        WHERE HorarioRecepcionID = @horarioID
      `)

    return NextResponse.json({ message: "Horario de recepción eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting recepción:", error)
    return NextResponse.json({ error: "Error al eliminar horario de recepción" }, { status: 500 })
  }
}
