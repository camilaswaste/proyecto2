"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Pago {
  PagoID: number
  NombreSocio: string
  Monto: number
  FechaPago: string
  MetodoPago: string
  Estado: string
  Concepto: string
  NombrePlan: string | null
}

export default function AdminPagosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await fetch("/api/admin/pagos")
        if (response.ok) {
          const data = await response.json()
          setPagos(data)
        }
      } catch (error) {
        console.error("Error al cargar pagos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPagos()
  }, [])

  const filteredPagos = pagos.filter((pago) => pago.NombreSocio.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando pagos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground">Historial de pagos realizados</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
            <CardDescription>Total: {pagos.length} pagos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por socio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Socio</th>
                      <th className="text-left p-3 font-medium">Monto</th>
                      <th className="text-left p-3 font-medium">Fecha</th>
                      <th className="text-left p-3 font-medium">Medio de Pago</th>
                      <th className="text-left p-3 font-medium">Concepto</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPagos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No se encontraron pagos
                        </td>
                      </tr>
                    ) : (
                      filteredPagos.map((pago) => (
                        <tr key={pago.PagoID} className="border-t">
                          <td className="p-3">{pago.NombreSocio}</td>
                          <td className="p-3 font-medium">${pago.Monto.toLocaleString()}</td>
                          <td className="p-3">{new Date(pago.FechaPago).toLocaleDateString()}</td>
                          <td className="p-3">{pago.MetodoPago}</td>
                          <td className="p-3">{pago.Concepto || pago.NombrePlan || "N/A"}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                pago.Estado === "Completado"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {pago.Estado}
                            </span>
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
      </div>
    </DashboardLayout>
  )
}
