import { getConnection } from "@/lib/db"

export type TipoEvento =
  | "clase_creada"
  | "clase_eliminada"
  | "sesion_agendada"
  | "sesion_cancelada_socio"
  | "sesion_cancelada_entrenador"
  | "intercambio_solicitado"
  | "intercambio_aprobado"
  | "intercambio_rechazado"
  | "recepcion_asignada"
  | "inscripcion_clase"

interface NotificacionParams {
  tipoUsuario: "Admin" | "Entrenador" | "Socio"
  usuarioID?: number
  tipoEvento: TipoEvento
  titulo: string
  mensaje: string
}

export async function crearNotificacion(params: NotificacionParams) {
  const pool = await getConnection()

  try {
    // Crear la notificación
    await pool
      .request()
      .input("tipoUsuario", params.tipoUsuario)
      .input("usuarioID", params.usuarioID || null)
      .input("tipoEvento", params.tipoEvento)
      .input("titulo", params.titulo)
      .input("mensaje", params.mensaje)
      .query(`
        INSERT INTO Notificaciones (TipoUsuario, UsuarioID, TipoEvento, Titulo, Mensaje)
        VALUES (@tipoUsuario, @usuarioID, @tipoEvento, @titulo, @mensaje)
      `)

    // Limpiar notificaciones antiguas (mantener solo las últimas 50 por usuario)
    if (params.usuarioID) {
      await pool
        .request()
        .input("tipoUsuario", params.tipoUsuario)
        .input("usuarioID", params.usuarioID)
        .query(`
          DELETE FROM Notificaciones
          WHERE NotificacionID IN (
            SELECT NotificacionID
            FROM Notificaciones
            WHERE TipoUsuario = @tipoUsuario AND UsuarioID = @usuarioID
            ORDER BY FechaCreacion DESC
            OFFSET 50 ROWS
          )
        `)
    } else {
      // Para Admin (sin usuarioID específico)
      await pool
        .request()
        .input("tipoUsuario", params.tipoUsuario)
        .query(`
          DELETE FROM Notificaciones
          WHERE NotificacionID IN (
            SELECT NotificacionID
            FROM Notificaciones
            WHERE TipoUsuario = @tipoUsuario AND UsuarioID IS NULL
            ORDER BY FechaCreacion DESC
            OFFSET 50 ROWS
          )
        `)
    }

    console.log("[v0] Notificación creada:", params.titulo)
  } catch (error) {
    console.error("[v0] Error al crear notificación:", error)
  }
}
