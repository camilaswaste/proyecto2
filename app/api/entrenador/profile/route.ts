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

    const result = await pool
      .request()
      .input("usuarioID", usuarioID)
      .query(`
        SELECT 
          e.EntrenadorID,
          e.UsuarioID,
          u.Nombre,
          u.Apellido,
          u.Email,
          e.Especialidad,
          e.Certificaciones,
          e.Biografia,
          e.FotoURL
        FROM Entrenadores e
        INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
        WHERE e.UsuarioID = @usuarioID AND e.Activo = 1
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.recordset[0])
  } catch (error) {
    console.error("Error al obtener perfil del entrenador:", error)
    return NextResponse.json({ error: "Error al obtener perfil del entrenador" }, { status: 500 })
  }
}
