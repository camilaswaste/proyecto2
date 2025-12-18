"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, QrCodeIcon, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { CreditCard } from "lucide-react"
import { QrCodeQuickChart } from "@/components/QrCodeQuickChart"
import { useRouter } from "next/navigation"
import { MembershipModal } from "@/components/membership-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlanMembresia {
  PlanID: number
  NombrePlan: string
  Precio: number
  DuracionDias: number
}
interface Socio {
  SocioID: number
  RUT: string
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  FechaNacimiento?: string
  Direccion?: string
  EstadoSocio: string
  CodigoQR: string
  NombrePlan: string | null
  EstadoMembresia: string | null
  FechaInicio: string | null
  FechaFin: string | null
}

export default function AdminSociosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEstadoMembresia, setFilterEstadoMembresia] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()

  const [showDialog, setShowDialog] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [qrSocio, setQrSocio] = useState<Socio | null>(null)
  const [formData, setFormData] = useState({
    RUT: "",
    Nombre: "",
    Apellido: "",
    Email: "",
    Telefono: "",
    FechaNacimiento: "",
    Direccion: "",
    EstadoSocio: "Activo",
  })

  const [showMembresiaDialog, setShowMembresiaDialog] = useState(false)
  const [membresiaSocio, setMembresiaSocio] = useState<Socio | null>(null)
  const [planes, setPlanes] = useState<PlanMembresia[]>([])
  const [selectedPlanID, setSelectedPlanID] = useState<number>(0)

  useEffect(() => {
    fetchSocios()
    fetchPlanes()
  }, [])

  const fetchSocios = async () => {
    try {
      const response = await fetch("/api/admin/socios")
      if (response.ok) {
        const data = await response.json()
        setSocios(data)
      }
    } catch (error) {
      console.error("Error al cargar socios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (socio?: Socio) => {
    if (socio) {
      setEditingSocio(socio)
      setFormData({
        RUT: socio.RUT,
        Nombre: socio.Nombre,
        Apellido: socio.Apellido,
        Email: socio.Email,
        Telefono: socio.Telefono || "",
        FechaNacimiento: socio.FechaNacimiento || "",
        Direccion: socio.Direccion || "",
        EstadoSocio: socio.EstadoSocio,
      })
    } else {
      setEditingSocio(null)
      setFormData({
        RUT: "",
        Nombre: "",
        Apellido: "",
        Email: "",
        Telefono: "",
        FechaNacimiento: "",
        Direccion: "",
        EstadoSocio: "Activo",
      })
    }
    setShowDialog(true)
  }

  const handleOpenQrDialog = (socio: Socio) => {
    setQrSocio(socio)
    setShowQrDialog(true)
  }

  const fetchPlanes = async () => {
    try {
      const response = await fetch("/api/admin/membresias")
      if (response.ok) {
        const data = await response.json()
        const activePlanes = data.filter((p: PlanMembresia & { Activo: boolean }) => p.Activo)
        setPlanes(activePlanes)
        if (activePlanes.length > 0) {
          setSelectedPlanID(activePlanes[0].PlanID)
        }
      }
    } catch (error) {
      console.error("Error al cargar planes:", error)
    }
  }

  const handleOpenMembresiaDialog = (socio: Socio) => {
    setMembresiaSocio(socio)
    setSelectedPlanID(planes.length > 0 ? planes[0].PlanID : 0)
    setShowMembresiaDialog(true)
  }

  const handleMembershipAction = async (action: "assign" | "pause" | "cancel" | "resume" | null, data?: any) => {
    if (!membresiaSocio) return

    if (action === "assign") {
      const params = new URLSearchParams({
        socioID: membresiaSocio.SocioID.toString(),
        planID: selectedPlanID.toString(),
      })
      setShowMembresiaDialog(false)
      router.push(`/admin/pagos/procesar?${params.toString()}`)
    } else if (action === "pause") {
      try {
        const res = await fetch("/api/admin/membresias/pausar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            socioID: membresiaSocio.SocioID,
            dias: data.pauseDuration,
            motivo: data.pauseReason,
          }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "No se pudo pausar")

        alert(`Membresía pausada por ${data.pauseDuration} días.`)
        setShowMembresiaDialog(false)
        fetchSocios()
      } catch (e: any) {
        alert(e.message || "Error al pausar")
      }
    } else if (action === "cancel") {
      try {
        const res = await fetch("/api/admin/membresias/cancelar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            socioID: membresiaSocio.SocioID,
            motivo: data.cancelReason,
          }),
        })

        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "No se pudo cancelar")

        alert("Membresía cancelada.")
        setShowMembresiaDialog(false)
        fetchSocios()
      } catch (e: any) {
        alert(e.message || "Error al cancelar")
      }
    } else if (action === "resume") {
      const extender = data?.extendVencimiento === "on" // checkbox manda "on"
      const res = await fetch("/api/admin/membresias/reanudar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID: membresiaSocio.SocioID,
          extenderVencimiento: extender,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "No se pudo reanudar")

      alert("Membresía reanudada ")
      setShowMembresiaDialog(false)
      fetchSocios()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const validationResponse = await fetch("/api/auth/validate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.Email,
          rut: formData.RUT,
          excludeId: editingSocio?.SocioID,
          userType: "Socio",
        }),
      })

      const validationResult = await validationResponse.json()
      if (!validationResult.valid) {
        alert(validationResult.errors.join("\n"))
        return
      }

      const body = editingSocio ? { ...formData, socioID: editingSocio.SocioID } : formData

      const url = "/api/admin/socios"
      const method = editingSocio ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        if (!editingSocio && result.tempPassword) {
          alert(
            `Socio creado exitosamente.\n\nCredenciales de acceso:\nEmail: ${formData.Email}\nContraseña temporal: ${result.tempPassword}\n\nIMPORTANTE: El socio debe cambiar su contraseña al iniciar sesión por primera vez.\nPor favor, comparte estas credenciales de forma segura.`,
          )
        } else if (editingSocio) {
          alert("Socio actualizado exitosamente")
        }
        setShowDialog(false)
        fetchSocios()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar socio")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar socio")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este socio?")) return

    try {
      const response = await fetch(`/api/admin/socios?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchSocios()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const filteredSocios = socios.filter((socio) => {
    const matchesSearch =
      socio.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado =
      filterEstadoMembresia === "todos" ||
      socio.EstadoMembresia === filterEstadoMembresia ||
      (filterEstadoMembresia === "sin-plan" && !socio.EstadoMembresia)

    return matchesSearch && matchesEstado
  })

  const totalPages = Math.ceil(filteredSocios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSocios = filteredSocios.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterEstadoMembresia])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Error"
    }
  }

  const formatRUT = (rut: string) => {
    if (!rut) return "N/A"
    const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "")
    const dv = cleanRUT.slice(-1)
    const body = cleanRUT.slice(0, -1)

    let formattedBody = ""
    let counter = 0
    for (let i = body.length - 1; i >= 0; i--) {
      formattedBody = body[i] + formattedBody
      counter++
      if (counter === 3 && i !== 0) {
        formattedBody = "." + formattedBody
        counter = 0
      }
    }
    return `${formattedBody}-${dv}`
  }

  const formatTelefono = (telefono: string) => {
    if (!telefono) return "N/A"
    const cleanPhone = telefono.replace(/\D/g, "")
    if (cleanPhone.startsWith("56") && cleanPhone.length >= 11) {
      const code = cleanPhone.slice(0, 2)
      const mobile = cleanPhone.slice(2, 3)
      const part1 = cleanPhone.slice(3, 7)
      const part2 = cleanPhone.slice(7, 11)
      return `+(${code}${mobile}) ${part1} ${part2}`
    }
    if (cleanPhone.length === 9) {
      const part1 = cleanPhone.slice(0, 4)
      const part2 = cleanPhone.slice(4)
      return `+(569) ${part1} ${part2}`
    }
    return telefono
  }

  const getEstadoMembresiaColor = (estado: string | null) => {
    switch (estado) {
      case "Vigente":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pausada":
        return "bg-gray-400 text-gray-800 border-gray-300"
      case "Vencida":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Cancelada":
        return "bg-red-100 text-red-800 border-red-200"
      case "Suspendida":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando socios...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Socios</h1>
            <p className="text-muted-foreground">Administra los miembros del gimnasio</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Socio
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Socios</CardTitle>
            <CardDescription>Total: {socios.length} socios registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-64">
                  <Select value={filterEstadoMembresia} onValueChange={setFilterEstadoMembresia}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="Vigente">Vigente</SelectItem>
                      <SelectItem value="Pausada">Pausada</SelectItem>
                      <SelectItem value="Vencida">Vencida</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                      <SelectItem value="Suspendida">Suspendida</SelectItem>
                      <SelectItem value="sin-plan">Sin plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">RUT</th>
                      <th className="text-left p-3 font-medium">Nombre</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Plan/Estado</th>
                      <th className="text-left p-3 font-medium">Inicio Plan</th>
                      <th className="text-left p-3 font-medium">Fin Plan</th>
                      <th className="text-left p-3 font-medium">Teléfono</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">QR</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSocios.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-muted-foreground">
                          No se encontraron socios
                        </td>
                      </tr>
                    ) : (
                      paginatedSocios.map((socio) => (
                        <tr key={socio.SocioID} className="border-t hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-mono text-sm">{formatRUT(socio.RUT)}</td>
                          <td className="p-3">
                            {socio.Nombre} {socio.Apellido}
                          </td>
                          <td className="p-3 text-sm">{socio.Email}</td>
                          <td className="p-3">
                            <p className="font-medium text-sm">{socio.NombrePlan || "Sin Plan"}</p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium border ${getEstadoMembresiaColor(
                                socio.EstadoMembresia,
                              )}`}
                            >
                              {socio.EstadoMembresia || "N/A"}
                            </span>
                          </td>
                          <td className="p-3">
                            <p className="text-sm">{formatDate(socio.FechaInicio)}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-sm">{formatDate(socio.FechaFin)}</p>
                          </td>
                          <td className="p-3 text-sm font-mono">{formatTelefono(socio.Telefono)}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                socio.EstadoSocio === "Activo"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {socio.EstadoSocio}
                            </span>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenQrDialog(socio)}
                              disabled={!socio.CodigoQR}
                            >
                              <QrCodeIcon
                                className={`h-4 w-4 ${socio.CodigoQR ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </Button>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenMembresiaDialog(socio)}
                                className="hover:bg-blue-50 transition-colors"
                                title="Gestionar membresía"
                              >
                                <CreditCard className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(socio)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(socio.SocioID)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredSocios.length)} de {filteredSocios.length}{" "}
                    socios
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 py-1 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSocio ? "Editar Socio" : "Nuevo Socio"}</DialogTitle>
              <DialogClose onClose={() => setShowDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="RUT">RUT *</Label>
                  <Input
                    id="RUT"
                    value={formData.RUT}
                    onChange={(e) => setFormData({ ...formData, RUT: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="FechaNacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="FechaNacimiento"
                    type="date"
                    value={formData.FechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, FechaNacimiento: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="Nombre">Nombre *</Label>
                  <Input
                    id="Nombre"
                    value={formData.Nombre}
                    onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="Apellido">Apellido *</Label>
                  <Input
                    id="Apellido"
                    value={formData.Apellido}
                    onChange={(e) => setFormData({ ...formData, Apellido: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="Email">Email *</Label>
                <Input
                  id="Email"
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="Telefono">Teléfono</Label>
                <Input
                  id="Telefono"
                  value={formData.Telefono}
                  onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="Direccion">Dirección</Label>
                <Input
                  id="Direccion"
                  value={formData.Direccion}
                  onChange={(e) => setFormData({ ...formData, Direccion: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="EstadoSocio">Estado</Label>
                <select
                  id="EstadoSocio"
                  value={formData.EstadoSocio}
                  onChange={(e) => setFormData({ ...formData, EstadoSocio: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="Suspendido">Suspendido</option>
                  <option value="Moroso">Moroso</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Activo">Activo</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingSocio ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Código QR de Acceso</DialogTitle>
              <DialogClose onClose={() => setShowQrDialog(false)} />
            </DialogHeader>
            {qrSocio && (
              <div className="flex flex-col items-center space-y-4 p-4">
                <p className="text-center text-lg font-semibold">
                  {qrSocio.Nombre} {qrSocio.Apellido} ({qrSocio.RUT})
                </p>
                {qrSocio.CodigoQR ? (
                  <>
                    <div className="p-4 border border-gray-300 rounded-lg bg-white shadow-xl">
                      <QrCodeQuickChart value={qrSocio.CodigoQR} size={256} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Este código se usa para el control de acceso.
                    </p>
                  </>
                ) : (
                  <p className="text-red-500">Este socio no tiene un Código QR asignado.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <MembershipModal
          open={showMembresiaDialog}
          onOpenChange={setShowMembresiaDialog}
          socio={membresiaSocio}
          planes={planes}
          selectedPlanID={selectedPlanID}
          onPlanChange={setSelectedPlanID}
          onSubmit={handleMembershipAction}
        />
      </div>
    </DashboardLayout>
  )
}
