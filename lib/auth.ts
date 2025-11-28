// Utilidades de autenticación y seguridad
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "f2b194816aecf83207e99f52a79d5aafb6365c992482ae150af3672620be3d53"

export interface UserPayload {
  usuarioID: number
  nombreUsuario: string
  email: string
  rol: string
  rolID: number
  socioID?: number // Opcional: usado cuando el usuario es un socio
  entrenadorID?: number // Opcional: usado cuando el usuario es un entrenador
}

// Hashear contraseña
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generar JWT token
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

// Verificar JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch (error) {
    console.error("Error verificando token:", error)
    return null
  }
}

// Generar código QR único para socio
export function generateQRCode(socioID: number): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `MF-${socioID}-${timestamp}-${random}`
}
