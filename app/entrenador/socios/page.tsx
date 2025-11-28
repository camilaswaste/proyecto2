"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { getUser } from "@/lib/auth-client"

interface Socio {
  SocioID: number
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  NombrePlan?: string
  EstadoMembresia?: string
  TotalSesiones?: number
}

export default function EntrenadorSociosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [todosSocios, setTodosSocios] = useState<Socio[]>([])
  const [sociosConSesiones, setSociosConSesiones] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const user = getUser()
        if (!user?.usuarioID) {
          console.error("No user found")
          setLoading(false)
          return
        }

        const profileResponse = await fetch(`/api/entrenador/profile?usuarioID=${user.usuarioID}`)
        if (!profileResponse.ok) {
          console.error("Failed to fetch entrenador profile")
          setLoading(false)
          return
        }

        const profileData = await profileResponse.json()

        if (!profileData.EntrenadorID) {
          console.error("No EntrenadorID found in profile")
          setLoading(false)
          return
        }

        const response = await fetch(`/api/entrenador/socios?entrenadorID=${profileData.EntrenadorID}`)
        if (response.ok) {
          const data = await response.json()
          setTodosSocios(data.todosSocios || [])
          setSociosConSesiones(data.sociosConSesiones || [])
        } else {
          console.error("Failed to fetch socios:", await response.text())
        }
      } catch (error) {
        console.error("Error al cargar socios:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSocios()
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando socios...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Socios</h1>
          <p className="text-muted-foreground">Gestiona tus socios y sesiones</p>
        </div>

        <Tabs defaultValue="con-sesiones" className="space-y-4">
          <TabsList>
            <TabsTrigger value="con-sesiones">Con Sesiones Agendadas</TabsTrigger>
            <TabsTrigger value="todos">Todos los Socios</TabsTrigger>
          </TabsList>

          <TabsContent value="con-sesiones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Socios con Sesiones Agendadas</CardTitle>
                <CardDescription>Socios que han reservado sesiones contigo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar socio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-3">
                    {sociosConSesiones.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No hay socios con sesiones agendadas</p>
                    ) : (
                      sociosConSesiones.map((socio) => (
                        <div key={socio.SocioID} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">
                                {socio.Nombre} {socio.Apellido}
                              </h3>
                              <p className="text-sm text-muted-foreground">{socio.Email}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-muted-foreground">
                                  {socio.TotalSesiones || 0} sesiones completadas
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="todos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos los Socios</CardTitle>
                <CardDescription>Lista completa de socios del gimnasio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar socio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">Nombre</th>
                          <th className="text-left p-3 font-medium">Email</th>
                          <th className="text-left p-3 font-medium">Teléfono</th>
                          <th className="text-left p-3 font-medium">Membresía</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todosSocios.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No se encontraron socios
                            </td>
                          </tr>
                        ) : (
                          todosSocios.map((socio) => (
                            <tr key={socio.SocioID} className="border-t">
                              <td className="p-3">
                                {socio.Nombre} {socio.Apellido}
                              </td>
                              <td className="p-3">{socio.Email}</td>
                              <td className="p-3">{socio.Telefono || "N/A"}</td>
                              <td className="p-3">
                                {socio.EstadoMembresia === "Activa" ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {socio.NombrePlan || "Activa"}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Sin membresía</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
