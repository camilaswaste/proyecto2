import { getConnection } from "@/lib/db"
import sql from "mssql"

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
  | "membresia_asignada"
  | "membresia_actualizada"
  | "pago_registrado"
  | "membresia_inactiva"

interface NotificacionParams {
  tipoUsuario: "Admin" | "Entrenador" | "Socio"
  usuarioID?: number
  tipoEvento: TipoEvento
  titulo: string
  mensaje: string
}

export async function crearNotificacion(params: NotificacionParams) {
  try {
    const pool = await getConnection()

    // 1. Insertar la notificación con tipos de datos explícitos para evitar errores de conversión
    await pool
      .request()
      .input("tipoUsuario", sql.NVarChar, params.tipoUsuario)
      .input("usuarioID", sql.Int, params.usuarioID || null)
      .input("tipoEvento", sql.NVarChar, params.tipoEvento)
      .input("titulo", sql.NVarChar, params.titulo)
      .input("mensaje", sql.NVarChar, params.mensaje)
      .query(`
        INSERT INTO Notificaciones (TipoUsuario, UsuarioID, TipoEvento, Titulo, Mensaje, Leida, FechaCreacion)
        VALUES (@tipoUsuario, @usuarioID, @tipoEvento, @titulo, @mensaje, 0, GETDATE())
      `)

    console.log("[v0] Notificación creada:", params.titulo)

    // 2. Limpieza optimizada: Se ejecuta sin 'await' para no bloquear la respuesta al usuario
    // Solo mantenemos las últimas 50 para evitar que la tabla crezca infinitamente
    limpiarNotificacionesAntiguas(params.tipoUsuario, params.usuarioID)

  } catch (error) {
    console.error("[v0] Error al crear notificación:", error)
  }
}

/**
 * Función auxiliar para limpiar registros antiguos sin bloquear el hilo principal
 */
async function limpiarNotificacionesAntiguas(tipoUsuario: string, usuarioID?: number) {
  try {
    const pool = await getConnection()
    const request = pool.request().input("tipoUsuario", sql.NVarChar, tipoUsuario)
    
    let whereClause = "WHERE TipoUsuario = @tipoUsuario AND UsuarioID IS NULL"
    if (usuarioID) {
      request.input("usuarioID", sql.Int, usuarioID)
      whereClause = "WHERE TipoUsuario = @tipoUsuario AND UsuarioID = @usuarioID"
    }

    // Usamos una lógica de DELETE basada en exclusión del TOP 50
    await request.query(`
      DELETE FROM Notificaciones
      WHERE NotificacionID NOT IN (
        SELECT TOP 50 NotificacionID
        FROM Notificaciones
        ${whereClause}
        ORDER BY FechaCreacion DESC
      )
      AND TipoUsuario = @tipoUsuario
      ${usuarioID ? "AND UsuarioID = @usuarioID" : "AND UsuarioID IS NULL"}
    `)
  } catch (error) {
    console.error("[v0] Error en limpieza de notificaciones:", error)
  }
}