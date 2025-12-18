import { getConnection } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipoUsuario = searchParams.get("tipoUsuario")
    const usuarioID = searchParams.get("usuarioID")

    console.log("[v0] GET notificaciones:", { tipoUsuario, usuarioID })

    if (!tipoUsuario) {
      return NextResponse.json({ error: "TipoUsuario es requerido" }, { status: 400 })
    }

    const pool = await getConnection()
    let notificaciones

    if (tipoUsuario === "Admin") {
      // Admin no tiene usuarioID específico
      const result = await pool
        .request()
        .input("tipoUsuario", tipoUsuario)
        .query(`
          SELECT 
            NotificacionID,
            TipoEvento,
            Titulo,
            Mensaje,
            Leida,
            FechaCreacion
          FROM Notificaciones
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID IS NULL
          ORDER BY FechaCreacion DESC
        `)
      notificaciones = result.recordset
    } else {
      // Entrenador y Socio tienen usuarioID específico
      if (!usuarioID) {
        return NextResponse.json({ error: "UsuarioID es requerido para Entrenador/Socio" }, { status: 400 })
      }

      const result = await pool
        .request()
        .input("tipoUsuario", tipoUsuario)
        .input("usuarioID", Number.parseInt(usuarioID))
        .query(`
          SELECT 
            NotificacionID,
            TipoEvento,
            Titulo,
            Mensaje,
            Leida,
            FechaCreacion
          FROM Notificaciones
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID = @usuarioID
          ORDER BY FechaCreacion DESC
        `)
      notificaciones = result.recordset
    }

    // Convertir FechaCreacion a string ISO
    const notificacionesFormateadas = notificaciones.map((n: any) => ({
      ...n,
      FechaCreacion: n.FechaCreacion.toISOString(),
    }))

    console.log("[v0] Notificaciones encontradas:", notificacionesFormateadas.length)

    return NextResponse.json({ notificaciones: notificacionesFormateadas })
  } catch (error) {
    console.error("[v0] Error al obtener notificaciones:", error)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificacionID, marcarTodasLeidas, tipoUsuario, usuarioID } = body

    console.log("[v0] PATCH notificaciones:", body)

    const pool = await getConnection()

    if (marcarTodasLeidas) {
      // Marcar todas como leídas
      if (tipoUsuario === "Admin") {
        await pool
          .request()
          .input("tipoUsuario", tipoUsuario)
          .query(`
          UPDATE Notificaciones
          SET Leida = 1
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID IS NULL
        `)
      } else {
        await pool
          .request()
          .input("tipoUsuario", tipoUsuario)
          .input("usuarioID", usuarioID)
          .query(`
          UPDATE Notificaciones
          SET Leida = 1
          WHERE TipoUsuario = @tipoUsuario AND UsuarioID = @usuarioID
        `)
      }

      console.log("[v0] Todas las notificaciones marcadas como leídas")
      return NextResponse.json({ success: true })
    } else if (notificacionID) {
      // Marcar una específica como leída
      await pool
        .request()
        .input("notificacionID", notificacionID)
        .query(`
        UPDATE Notificaciones
        SET Leida = 1
        WHERE NotificacionID = @notificacionID
      `)

      console.log("[v0] Notificación marcada como leída:", notificacionID)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error al actualizar notificaciones:", error)
    return NextResponse.json({ error: "Error al actualizar notificaciones" }, { status: 500 })
  }
}
