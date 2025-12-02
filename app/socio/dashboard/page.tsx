"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { QrCodeQuickChart } from "@/components/QrCodeQuickChart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUser } from "@/lib/auth-client"
import { Calendar, CreditCard, QrCode, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MembresiaData {
  plan: string
  fechaInicio: string
  fechaVencimiento: string
  diasRestantes: number
  estado: string
  codigoQR?: string
}

export default function SocioDashboardPage() {
  const [membershipData, setMembershipData] = useState<MembresiaData | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser()
        if (!user || !user.socioID) {
          console.error("[v0] No socio ID found")
          return
        }

        const response = await fetch(`/api/socio/membresia?socioID=${user.socioID}`)
        if (!response.ok) throw new Error("Error al obtener datos de membresía")

        const data = await response.json()

        if (data) {
          const fechaVencimiento = new Date(data.FechaFin)
          const hoy = new Date()
          const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

          setMembershipData({
            plan: data.NombrePlan,
            fechaInicio: new Date(data.FechaInicio).toLocaleDateString("es-CL"),
            fechaVencimiento: fechaVencimiento.toLocaleDateString("es-CL"),
            diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
            estado: data.Estado,
            codigoQR: data.CodigoQR,
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching membership data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Mock stats (esto se puede mejorar después)
  const stats = {
    asistenciasMes: 18,
    proximaSesion: "2025-01-22 11:00",
    clasesReservadas: 3,
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido a tu portal de miembro</p>
        </div>

        {/* Membership Status */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Estado de Membresía
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan Actual</p>
                <p className="text-2xl font-bold">{membershipData?.plan || "Sin plan"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    membershipData?.estado === "Vigente" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {membershipData?.estado || "Sin datos"}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                <p className="text-lg font-medium">{membershipData?.fechaVencimiento || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Días Restantes</p>
                <p className="text-lg font-medium">
                  {membershipData?.diasRestantes !== undefined ? `${membershipData.diasRestantes} días` : "N/A"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/socio/membresia">
                <Button>Ver Detalles de Membresía</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencias este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.asistenciasMes}</div>
              <p className="text-xs text-muted-foreground">+3 vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Sesión</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{stats.proximaSesion}</div>
              <p className="text-xs text-muted-foreground">Con Pedro Martínez</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Reservadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clasesReservadas}</div>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/socio/entrenadores">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Sesión con Entrenador
                </Button>
              </Link>
              <Link href="/socio/membresia">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver Mi Membresía
                </Button>
              </Link>
              <Link href="/socio/pagos">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Realizar Pago
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setShowQR(true)}
                disabled={!membershipData?.codigoQR}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Ver Mi Código QR
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Actividades</CardTitle>
              <CardDescription>Tus sesiones y clases programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded p-2 min-w-[50px]">
                    <span className="text-xs font-medium text-primary">11:00</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sesión Personal</p>
                    <p className="text-xs text-muted-foreground">Con Pedro Martínez</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="flex flex-col items-center justify-center bg-blue-100 rounded p-2 min-w-[50px]">
                    <span className="text-xs font-medium text-blue-700">18:00</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Clase Funcional</p>
                    <p className="text-xs text-muted-foreground">Miércoles</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tu Código QR de Acceso</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {membershipData?.codigoQR ? (
              <>
                <QrCodeQuickChart value={membershipData.codigoQR} size={250} />
                <p className="text-sm text-muted-foreground text-center">Muestra este código al ingresar al gimnasio</p>
                <p className="text-xs text-muted-foreground">Código: {membershipData.codigoQR}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No tienes un código QR asignado aún</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
