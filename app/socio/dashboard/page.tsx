"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Calendar, QrCode, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function SocioDashboardPage() {
  // Mock data
  const membershipData = {
    plan: "Trimestral",
    fechaInicio: "2025-01-01",
    fechaVencimiento: "2025-04-01",
    diasRestantes: 71,
    estado: "Vigente",
  }

  const stats = {
    asistenciasMes: 18,
    proximaSesion: "2025-01-22 11:00",
    clasesReservadas: 3,
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
                <p className="text-2xl font-bold">{membershipData.plan}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {membershipData.estado}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                <p className="text-lg font-medium">{membershipData.fechaVencimiento}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Días Restantes</p>
                <p className="text-lg font-medium">{membershipData.diasRestantes} días</p>
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
              <Button variant="outline" className="w-full justify-start bg-transparent">
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
    </DashboardLayout>
  )
}
