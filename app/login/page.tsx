"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (data.user.requiereCambioPassword) {
        // Redirect to password change page based on role
        if (data.user.rol === "Administrador") {
          router.push("/admin/configuracion?cambiarPassword=true")
        } else if (data.user.rol === "Entrenador") {
          router.push("/entrenador/configuracion?cambiarPassword=true")
        } else if (data.user.rol === "Socio") {
          router.push("/socio/configuracion?cambiarPassword=true")
        }
        return
      }

      // Redirigir según el rol
      if (data.user.rol === "Administrador") {
        router.push("/admin/dashboard")
      } else if (data.user.rol === "Entrenador") {
        router.push("/entrenador/dashboard")
      } else if (data.user.rol === "Socio") {
        router.push("/socio/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.95_0.05_240)] via-background to-[oklch(0.95_0.05_280)] p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center gradient-admin rounded-t-xl p-8">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-16 w-16 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Mundo Fitness</CardTitle>
          <CardDescription className="text-white/90 text-base">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {showSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ¡Registro exitoso! Ahora puedes iniciar sesión con tus credenciales.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/recuperar-password" className="hover:text-primary">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="text-center">
              <Link href="/">
                <Button variant="ghost" type="button">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
