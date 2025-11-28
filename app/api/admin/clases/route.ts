import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        c.ClaseID,
        c.NombreClase,
        c.Descripcion,
        c.EntrenadorID,
        u.Nombre + ' ' + u.Apellido as NombreEntrenador,
        c.DiaSemana,
        c.HoraInicio,
        c.HoraFin,
        c.CupoMaximo,
        c.Activa as Estado,
        c.TipoClase,
        c.NumeroSemanas,
        c.FechaInicio,
        c.FechaFin
      FROM Clases c
      INNER JOIN Entrenadores e ON c.EntrenadorID = e.EntrenadorID
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE c.Activa = 1
      ORDER BY c.NombreClase, c.DiaSemana, c.HoraInicio ASC
    `)

    const groupedClases = result.recordset.reduce((acc: any[], clase: any) => {
      const existing = acc.find(
        (c) =>
          c.NombreClase === clase.NombreClase &&
          c.HoraInicio === clase.HoraInicio &&
          c.HoraFin === clase.HoraFin &&
          c.EntrenadorID === clase.EntrenadorID,
      )

      if (existing) {
        existing.DiasSemana.push(clase.DiaSemana)
      } else {
        acc.push({
          ...clase,
          DiasSemana: [clase.DiaSemana],
        })
      }

      return acc
    }, [])

    return NextResponse.json(groupedClases)
  } catch (error) {
    console.error("Error al obtener clases:", error)
    return NextResponse.json({ error: "Error al obtener clases" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      NombreClase,
      Descripcion,
      EntrenadorID,
      DiasSemana,
      HoraInicio,
      HoraFin,
      CupoMaximo,
      TipoClase,
      NumeroSemanas,
      FechaInicio,
    } = body

    if (
      !NombreClase ||
      !EntrenadorID ||
      !DiasSemana ||
      DiasSemana.length === 0 ||
      !HoraInicio ||
      !HoraFin ||
      !CupoMaximo
    ) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const pool = await getConnection()

    let fechaFin = null
    if (TipoClase === "Temporal" && NumeroSemanas && FechaInicio) {
      const startDate = new Date(FechaInicio)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + Number.parseInt(NumeroSemanas) * 7)
      fechaFin = endDate.toISOString().split("T")[0]
    }

    const checkColumnsQuery = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Clases' AND COLUMN_NAME IN ('TipoClase', 'NumeroSemanas', 'FechaInicio', 'FechaFin')
    `)

    const hasNewColumns = checkColumnsQuery.recordset.length > 0

    for (const dia of DiasSemana) {
      if (hasNewColumns) {
        await pool
          .request()
          .input("NombreClase", NombreClase)
          .input("Descripcion", Descripcion || null)
          .input("EntrenadorID", EntrenadorID)
          .input("DiaSemana", dia)
          .input("HoraInicio", HoraInicio)
          .input("HoraFin", HoraFin)
          .input("CupoMaximo", CupoMaximo)
          .input("TipoClase", TipoClase || "Indefinida")
          .input("NumeroSemanas", NumeroSemanas ? Number.parseInt(NumeroSemanas) : null)
          .input("FechaInicio", FechaInicio || null)
          .input("FechaFin", fechaFin)
          .query(`
            INSERT INTO Clases (NombreClase, Descripcion, EntrenadorID, DiaSemana, HoraInicio, HoraFin, CupoMaximo, Activa, TipoClase, NumeroSemanas, FechaInicio, FechaFin)
            VALUES (@NombreClase, @Descripcion, @EntrenadorID, @DiaSemana, @HoraInicio, @HoraFin, @CupoMaximo, 1, @TipoClase, @NumeroSemanas, @FechaInicio, @FechaFin)
          `)
      } else {
        await pool
          .request()
          .input("NombreClase", NombreClase)
          .input("Descripcion", Descripcion || null)
          .input("EntrenadorID", EntrenadorID)
          .input("DiaSemana", dia)
          .input("HoraInicio", HoraInicio)
          .input("HoraFin", HoraFin)
          .input("CupoMaximo", CupoMaximo)
          .query(`
            INSERT INTO Clases (NombreClase, Descripcion, EntrenadorID, DiaSemana, HoraInicio, HoraFin, CupoMaximo, Activa)
            VALUES (@NombreClase, @Descripcion, @EntrenadorID, @DiaSemana, @HoraInicio, @HoraFin, @CupoMaximo, 1)
          `)
      }
    }

    return NextResponse.json({ message: "Clase(s) creada(s) exitosamente" }, { status: 201 })
  } catch (error) {
    console.error("Error al crear clase:", error)
    return NextResponse.json({ error: "Error al crear clase" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()
    const {
      NombreClase,
      Descripcion,
      EntrenadorID,
      DiasSemana,
      HoraInicio,
      HoraFin,
      CupoMaximo,
      TipoClase,
      NumeroSemanas,
      FechaInicio,
    } = body

    if (!id) {
      return NextResponse.json({ error: "ID de clase requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    let fechaFin = null
    if (TipoClase === "Temporal" && NumeroSemanas && FechaInicio) {
      const startDate = new Date(FechaInicio)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + Number.parseInt(NumeroSemanas) * 7)
      fechaFin = endDate.toISOString().split("T")[0]
    }

    const checkColumnsQuery = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Clases' AND COLUMN_NAME IN ('TipoClase', 'NumeroSemanas', 'FechaInicio', 'FechaFin')
    `)

    const hasNewColumns = checkColumnsQuery.recordset.length > 0

    if (hasNewColumns) {
      await pool
        .request()
        .input("ClaseID", id)
        .input("NombreClase", NombreClase)
        .input("Descripcion", Descripcion || null)
        .input("EntrenadorID", EntrenadorID)
        .input("DiaSemana", DiasSemana[0])
        .input("HoraInicio", HoraInicio)
        .input("HoraFin", HoraFin)
        .input("CupoMaximo", CupoMaximo)
        .input("TipoClase", TipoClase || "Indefinida")
        .input("NumeroSemanas", NumeroSemanas ? Number.parseInt(NumeroSemanas) : null)
        .input("FechaInicio", FechaInicio || null)
        .input("FechaFin", fechaFin)
        .query(`
          UPDATE Clases
          SET NombreClase = @NombreClase,
              Descripcion = @Descripcion,
              EntrenadorID = @EntrenadorID,
              DiaSemana = @DiaSemana,
              HoraInicio = @HoraInicio,
              HoraFin = @HoraFin,
              CupoMaximo = @CupoMaximo,
              TipoClase = @TipoClase,
              NumeroSemanas = @NumeroSemanas,
              FechaInicio = @FechaInicio,
              FechaFin = @FechaFin
          WHERE ClaseID = @ClaseID
        `)
    } else {
      await pool
        .request()
        .input("ClaseID", id)
        .input("NombreClase", NombreClase)
        .input("Descripcion", Descripcion || null)
        .input("EntrenadorID", EntrenadorID)
        .input("DiaSemana", DiasSemana[0])
        .input("HoraInicio", HoraInicio)
        .input("HoraFin", HoraFin)
        .input("CupoMaximo", CupoMaximo)
        .query(`
          UPDATE Clases
          SET NombreClase = @NombreClase,
              Descripcion = @Descripcion,
              EntrenadorID = @EntrenadorID,
              DiaSemana = @DiaSemana,
              HoraInicio = @HoraInicio,
              HoraFin = @HoraFin,
              CupoMaximo = @CupoMaximo
          WHERE ClaseID = @ClaseID
        `)
    }

    return NextResponse.json({ message: "Clase actualizada exitosamente" })
  } catch (error) {
    console.error("Error al actualizar clase:", error)
    return NextResponse.json({ error: "Error al actualizar clase" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID de clase requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("ClaseID", id)
      .query(`
        UPDATE Clases
        SET Activa = 0
        WHERE ClaseID = @ClaseID
      `)

    return NextResponse.json({ message: "Clase eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar clase:", error)
    return NextResponse.json({ error: "Error al eliminar clase" }, { status: 500 })
  }
}
