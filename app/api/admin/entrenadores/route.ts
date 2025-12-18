import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function GET() {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT 
        e.EntrenadorID,
        e.UsuarioID,
        u.Nombre,
        u.Apellido,
        u.Email,
        u.Telefono,
        e.Especialidad,
        e.Certificaciones,
        e.Biografia,
        e.FotoURL,
        e.Activo,
        u.FechaCreacion
      FROM Entrenadores e
      INNER JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
      WHERE e.Activo = 1
      ORDER BY u.FechaCreacion DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error: any) {
    console.error("Error al obtener entrenadores:", error)
    return NextResponse.json({ error: "Error al obtener entrenadores", details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, apellido, email, telefono, especialidad, certificaciones, biografia } = body

    const pool = await getConnection()

    // Obtener el RolID para Entrenador
    const rolResult = await pool.request().query(`
      SELECT RolID FROM Roles WHERE NombreRol = 'Entrenador'
    `)
    const rolID = rolResult.recordset[0]?.RolID

    if (!rolID) {
      return NextResponse.json({ error: "Rol Entrenador no encontrado" }, { status: 400 })
    }

    // Generar contraseña temporal
    const tempPassword = `${nombre.toLowerCase()}123`
    const hashedPassword = await hashPassword(tempPassword)

    // Crear usuario
    const userResult = await pool
      .request()
      .input("rolID", rolID)
      .input("nombreUsuario", email)
      .input("email", email)
      .input("passwordHash", hashedPassword)
      .input("nombre", nombre)
      .input("apellido", apellido)
      .input("telefono", telefono || null)
      .input("requiereCambioPassword", true)
      .query(`
        INSERT INTO Usuarios (RolID, NombreUsuario, Email, PasswordHash, Nombre, Apellido, Telefono, FechaCreacion, Activo, RequiereCambioPassword)
        OUTPUT INSERTED.UsuarioID
        VALUES (@rolID, @nombreUsuario, @email, @passwordHash, @nombre, @apellido, @telefono, GETDATE(), 1, @requiereCambioPassword)
      `)

    const usuarioID = userResult.recordset[0].UsuarioID

    // Crear entrenador
    await pool
      .request()
      .input("usuarioID", usuarioID)
      .input("especialidad", especialidad || null)
      .input("certificaciones", certificaciones || null)
      .input("biografia", biografia || null)
      .query(`
        INSERT INTO Entrenadores (UsuarioID, Especialidad, Certificaciones, Biografia, Activo)
        VALUES (@usuarioID, @especialidad, @certificaciones, @biografia, 1)
      `)

    return NextResponse.json({
      success: true,
      message: "Entrenador creado exitosamente",
      tempPassword: tempPassword,
    })
  } catch (error: any) {
    console.error("Error al crear entrenador:", error)
    return NextResponse.json({ error: "Error al crear entrenador", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { entrenadorID, nombre, apellido, email, telefono, especialidad, certificaciones, estado, fotoURL } = body

    console.log("[v0] PUT entrenador - datos recibidos:", { entrenadorID, fotoURL })

    const pool = await getConnection()

    // Actualizar datos de usuario
    await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("nombre", nombre)
      .input("apellido", apellido)
      .input("email", email)
      .input("telefono", telefono)
      .query(`
        UPDATE Usuarios
        SET Nombre = @nombre, Apellido = @apellido, Email = @email, Telefono = @telefono
        WHERE UsuarioID = (SELECT UsuarioID FROM Entrenadores WHERE EntrenadorID = @entrenadorID)
      `)

    await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .input("especialidad", especialidad)
      .input("certificaciones", certificaciones)
      .input("estado", estado)
      .input("fotoURL", fotoURL || null)
      .query(`
        UPDATE Entrenadores
        SET Especialidad = @especialidad, 
            Certificaciones = @certificaciones, 
            Activo = @estado,
            FotoURL = @fotoURL
        WHERE EntrenadorID = @entrenadorID
      `)

    console.log("[v0] PUT entrenador - FotoURL actualizada exitosamente")

    return NextResponse.json({ success: true, message: "Entrenador actualizado exitosamente" })
  } catch (error: any) {
    console.error("Error al actualizar entrenador:", error)
    return NextResponse.json({ error: "Error al actualizar entrenador", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entrenadorID = searchParams.get("entrenadorID")

    if (!entrenadorID) {
      return NextResponse.json({ error: "EntrenadorID es requerido" }, { status: 400 })
    }

    const pool = await getConnection()

    await pool
      .request()
      .input("entrenadorID", entrenadorID)
      .query(`
        UPDATE Entrenadores
        SET Activo = 0
        WHERE EntrenadorID = @entrenadorID
      `)

    return NextResponse.json({ success: true, message: "Entrenador eliminado exitosamente" })
  } catch (error: any) {
    console.error("Error al eliminar entrenador:", error)
    return NextResponse.json({ error: "Error al eliminar entrenador", details: error.message }, { status: 500 })
  }
}
