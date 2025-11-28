"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2 } from "lucide-react"

interface Entrenador {
  EntrenadorID: number
  UsuarioID: number
  Nombre: string
  Apellido: string
  Email: string
  Telefono: string
  Especialidad: string
  Activo: boolean
}

export default function AdminEntrenadoresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEntrenador, setEditingEntrenador] = useState<Entrenador | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    especialidad: "",
    certificaciones: "",
    biografia: "",
  })

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/admin/entrenadores")
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      }
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (entrenador?: Entrenador) => {
    if (entrenador) {
      setEditingEntrenador(entrenador)
      setFormData({
        nombre: entrenador.Nombre,
        apellido: entrenador.Apellido,
        email: entrenador.Email,
        telefono: entrenador.Telefono || "",
        especialidad: entrenador.Especialidad || "",
        certificaciones: "",
        biografia: "",
      })
    } else {
      setEditingEntrenador(null)
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        especialidad: "",
        certificaciones: "",
        biografia: "",
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingEntrenador) {
      try {
        const validationResponse = await fetch("/api/auth/validate-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            userType: "Usuario",
          }),
        })

        const validationResult = await validationResponse.json()
        if (!validationResult.valid) {
          alert(validationResult.errors.join("\n"))
          return
        }
      } catch (error) {
        console.error("Error validating account:", error)
        alert("Error al validar la cuenta")
        return
      }
    }

    try {
      const body = editingEntrenador
        ? { ...formData, entrenadorID: editingEntrenador.EntrenadorID, estado: editingEntrenador.Activo }
        : formData

      const url = "/api/admin/entrenadores"
      const method = editingEntrenador ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const result = await response.json()
        if (!editingEntrenador && result.tempPassword) {
          alert(
            `Entrenador creado exitosamente.\n\nCredenciales de acceso:\nEmail: ${formData.email}\nContraseña temporal: ${result.tempPassword}\n\nIMPORTANTE: El entrenador debe cambiar su contraseña al iniciar sesión por primera vez.\nPor favor, comparte estas credenciales de forma segura.`,
          )
        } else if (editingEntrenador) {
          alert("Entrenador actualizado exitosamente")
        }
        setShowDialog(false)
        fetchEntrenadores()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar entrenador")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar entrenador")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este entrenador?")) return

    try {
      const response = await fetch(`/api/admin/entrenadores?entrenadorID=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchEntrenadores()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const filteredEntrenadores = entrenadores.filter(
    (entrenador) =>
      entrenador.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrenador.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrenador.Email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando entrenadores...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Entrenadores</h1>
            <p className="text-muted-foreground">Administra el equipo de entrenadores</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Entrenador
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Entrenadores</CardTitle>
            <CardDescription>Total: {entrenadores.length} entrenadores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar entrenador..."
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
                      <th className="text-left p-3 font-medium">Especialidad</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntrenadores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No se encontraron entrenadores
                        </td>
                      </tr>
                    ) : (
                      filteredEntrenadores.map((entrenador) => (
                        <tr key={entrenador.EntrenadorID} className="border-t">
                          <td className="p-3 font-medium">
                            {entrenador.Nombre} {entrenador.Apellido}
                          </td>
                          <td className="p-3">{entrenador.Especialidad || "N/A"}</td>
                          <td className="p-3">{entrenador.Email}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                entrenador.Activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {entrenador.Activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(entrenador)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(entrenador.EntrenadorID)}>
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
              <DialogTitle>{editingEntrenador ? "Editar Entrenador" : "Nuevo Entrenador"}</DialogTitle>
              <DialogClose onClose={() => setShowDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingEntrenador}
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input
                  id="especialidad"
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="certificaciones">Certificaciones</Label>
                <Input
                  id="certificaciones"
                  value={formData.certificaciones}
                  onChange={(e) => setFormData({ ...formData, certificaciones: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="biografia">Biografía</Label>
                <textarea
                  id="biografia"
                  value={formData.biografia}
                  onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingEntrenador ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
