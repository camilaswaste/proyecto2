import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioID = searchParams.get("usuarioID")

    if (!usuarioID) {
      return NextResponse.json({ error: "UsuarioID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    const entrenadorResult = await pool
      .request()
      .input("usuarioID", usuarioID)
      .query(`
        SELECT EntrenadorID 
        FROM Entrenadores 
        WHERE UsuarioID = @usuarioID
      `)

    if (entrenadorResult.recordset.length === 0) {
      return NextResponse.json([])
    }

    const entrenadorID = entrenadorResult.recordset[0].EntrenadorID

    const result = await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        SELECT 
          ClaseID,
          NombreClase,
          Descripcion,
          DiaSemana,
          HoraInicio,
          HoraFin,
          CupoMaximo,
          Activa as Estado
        FROM Clases
        WHERE EntrenadorID = @entrenadorID
        ORDER BY 
          CASE DiaSemana
            WHEN 'Lunes' THEN 1
            WHEN 'Martes' THEN 2
            WHEN 'Miércoles' THEN 3
            WHEN 'Jueves' THEN 4
            WHEN 'Viernes' THEN 5
            WHEN 'Sábado' THEN 6
            WHEN 'Domingo' THEN 7
          END,
          HoraInicio ASC
      `)

    const clasesMap = new Map()

    result.recordset.forEach((clase: any) => {
      const key = `${clase.NombreClase}-${clase.HoraInicio}-${clase.HoraFin}`
      if (clasesMap.has(key)) {
        const existing = clasesMap.get(key)
        existing.DiaSemana.push(clase.DiaSemana)
      } else {
        clasesMap.set(key, {
          ...clase,
          DiaSemana: [clase.DiaSemana],
        })
      }
    })

    return NextResponse.json(Array.from(clasesMap.values()))
  } catch (error) {
    console.error("Error al obtener clases del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener clases" }, { status: 500 })
  }
}
