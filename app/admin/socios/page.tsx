"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPhone, formatRUT, validatePhone, validateRUT } from "@/lib/validations"
import { Edit, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

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
  NombrePlan: string | null
  EstadoMembresia: string | null
}

export default function AdminSociosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)
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
  const [rutError, setRutError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  useEffect(() => {
    fetchSocios()
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
    setRutError("")
    setPhoneError("")

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

  const handleRUTChange = (value: string) => {
    const formatted = formatRUT(value)
    setFormData({ ...formData, RUT: formatted })

    if (formatted.length >= 11) {
      if (!validateRUT(formatted)) {
        setRutError("RUT inválido. Verifica el dígito verificador.")
      } else {
        setRutError("")
      }
    } else {
      setRutError("")
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setFormData({ ...formData, Telefono: formatted })

    if (formatted.length > 0 && formatted.length >= 17) {
      if (!validatePhone(formatted)) {
        setPhoneError("Teléfono inválido. Formato: (+56) 9 xxxx xxxx")
      } else {
        setPhoneError("")
      }
    } else {
      setPhoneError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRUT(formData.RUT)) {
      alert("Por favor ingresa un RUT válido en formato xx.xxx.xxx-x")
      return
    }

    if (formData.Telefono && !validatePhone(formData.Telefono)) {
      alert("Por favor ingresa un teléfono válido en formato (+56) 9 xxxx xxxx")
      return
    }

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

  const filteredSocios = socios.filter(
    (socio) =>
      socio.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.Email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">RUT</th>
                      <th className="text-left p-3 font-medium">Nombre</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Teléfono</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSocios.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No se encontraron socios
                        </td>
                      </tr>
                    ) : (
                      filteredSocios.map((socio) => (
                        <tr key={socio.SocioID} className="border-t">
                          <td className="p-3">{socio.RUT}</td>
                          <td className="p-3">
                            {socio.Nombre} {socio.Apellido}
                          </td>
                          <td className="p-3">{socio.Email}</td>
                          <td className="p-3">{socio.Telefono || "N/A"}</td>
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
                            <div className="flex gap-2">
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
                    onChange={(e) => handleRUTChange(e.target.value)}
                    placeholder="12.345.678-9"
                    required
                    maxLength={12}
                  />
                  {rutError && <p className="text-sm text-red-600 mt-1">{rutError}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Formato: xx.xxx.xxx-x</p>
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
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(+56) 9 xxxx xxxx"
                  maxLength={17}
                />
                {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
                <p className="text-xs text-muted-foreground mt-1">Formato: (+56) 9 xxxx xxxx</p>
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
                  <option value="Activo">Activo</option>
                  <option value="Suspendido">Suspendido</option>
                  <option value="Moroso">Moroso</option>
                  <option value="Inactivo">Inactivo</option>
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
      </div>
    </DashboardLayout>
  )
}
