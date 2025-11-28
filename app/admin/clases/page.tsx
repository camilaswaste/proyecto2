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

interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  EntrenadorID: number
  NombreEntrenador: string
  DiasSemana: string[]
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  Estado: boolean
  TipoClase: string
  NumeroSemanas: number
  FechaInicio: string
}

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
}

export default function AdminClasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [clases, setClases] = useState<Clase[]>([])
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingClase, setEditingClase] = useState<Clase | null>(null)
  const [formData, setFormData] = useState({
    NombreClase: "",
    Descripcion: "",
    EntrenadorID: "",
    DiasSemana: [] as string[],
    HoraInicio: "",
    HoraFin: "",
    CupoMaximo: "",
    TipoClase: "Indefinida",
    NumeroSemanas: "",
    FechaInicio: "",
  })

  useEffect(() => {
    fetchClases()
    fetchEntrenadores()
  }, [])

  const fetchClases = async () => {
    try {
      const response = await fetch("/api/admin/clases")
      if (response.ok) {
        const data = await response.json()
        setClases(data)
      }
    } catch (error) {
      console.error("Error al cargar clases:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/admin/entrenadores")
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      }
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
    }
  }

  const handleOpenDialog = (clase?: Clase) => {
    if (clase) {
      setEditingClase(clase)
      setFormData({
        NombreClase: clase.NombreClase,
        Descripcion: clase.Descripcion || "",
        EntrenadorID: clase.EntrenadorID.toString(),
        DiasSemana: clase.DiasSemana || [],
        HoraInicio: clase.HoraInicio,
        HoraFin: clase.HoraFin,
        CupoMaximo: clase.CupoMaximo.toString(),
        TipoClase: clase.TipoClase || "Indefinida",
        NumeroSemanas: clase.NumeroSemanas ? clase.NumeroSemanas.toString() : "",
        FechaInicio: clase.FechaInicio || "",
      })
    } else {
      setEditingClase(null)
      setFormData({
        NombreClase: "",
        Descripcion: "",
        EntrenadorID: "",
        DiasSemana: [],
        HoraInicio: "",
        HoraFin: "",
        CupoMaximo: "",
        TipoClase: "Indefinida",
        NumeroSemanas: "",
        FechaInicio: "",
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.DiasSemana.length === 0) {
      alert("Debes seleccionar al menos un día de la semana")
      return
    }

    if (formData.TipoClase === "Temporal" && (!formData.NumeroSemanas || Number.parseInt(formData.NumeroSemanas) < 1)) {
      alert("Debes especificar el número de semanas para clases temporales")
      return
    }

    try {
      const url = editingClase ? `/api/admin/clases?id=${editingClase.ClaseID}` : "/api/admin/clases"
      const method = editingClase ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowDialog(false)
        fetchClases()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar clase")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar clase")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta clase?")) return

    try {
      const response = await fetch(`/api/admin/clases?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchClases()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const toggleDia = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      DiasSemana: prev.DiasSemana.includes(dia) ? prev.DiasSemana.filter((d) => d !== dia) : [...prev.DiasSemana, dia],
    }))
  }

  const filteredClases = clases.filter((clase) => clase.NombreClase.toLowerCase().includes(searchTerm.toLowerCase()))

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando clases...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Clases</h1>
            <p className="text-muted-foreground">Administra las clases grupales</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Clase
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clases Programadas</CardTitle>
            <CardDescription>Total: {clases.length} clases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clase..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Clase</th>
                      <th className="text-left p-3 font-medium">Entrenador</th>
                      <th className="text-left p-3 font-medium">Día</th>
                      <th className="text-left p-3 font-medium">Horario</th>
                      <th className="text-left p-3 font-medium">Cupo</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No se encontraron clases
                        </td>
                      </tr>
                    ) : (
                      filteredClases.map((clase) => (
                        <tr key={clase.ClaseID} className="border-t">
                          <td className="p-3 font-medium">{clase.NombreClase}</td>
                          <td className="p-3">{clase.NombreEntrenador}</td>
                          <td className="p-3">
                            {Array.isArray(clase.DiasSemana) ? clase.DiasSemana.join(", ") : clase.DiasSemana || "N/A"}
                          </td>
                          <td className="p-3">
                            {clase.HoraInicio} - {clase.HoraFin}
                          </td>
                          <td className="p-3">{clase.CupoMaximo} personas</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(clase)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(clase.ClaseID)}>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClase ? "Editar Clase" : "Nueva Clase"}</DialogTitle>
              <DialogClose onClose={() => setShowDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="NombreClase">Nombre de la Clase *</Label>
                <Input
                  id="NombreClase"
                  value={formData.NombreClase}
                  onChange={(e) => setFormData({ ...formData, NombreClase: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="Descripcion">Descripción</Label>
                <textarea
                  id="Descripcion"
                  value={formData.Descripcion}
                  onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[60px]"
                />
              </div>
              <div>
                <Label htmlFor="EntrenadorID">Entrenador *</Label>
                <select
                  id="EntrenadorID"
                  value={formData.EntrenadorID}
                  onChange={(e) => setFormData({ ...formData, EntrenadorID: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">Seleccionar entrenador</option>
                  {entrenadores.map((entrenador) => (
                    <option key={entrenador.EntrenadorID} value={entrenador.EntrenadorID}>
                      {entrenador.Nombre} {entrenador.Apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Días de la Semana * (selecciona uno o más)</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {diasSemana.map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`dia-${dia}`}
                        checked={formData.DiasSemana.includes(dia)}
                        onChange={() => toggleDia(dia)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor={`dia-${dia}`} className="text-sm font-medium leading-none cursor-pointer">
                        {dia}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="HoraInicio">Hora de Inicio *</Label>
                  <Input
                    id="HoraInicio"
                    type="time"
                    value={formData.HoraInicio}
                    onChange={(e) => setFormData({ ...formData, HoraInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="HoraFin">Hora de Fin *</Label>
                  <Input
                    id="HoraFin"
                    type="time"
                    value={formData.HoraFin}
                    onChange={(e) => setFormData({ ...formData, HoraFin: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="CupoMaximo">Cupo Máximo *</Label>
                <Input
                  id="CupoMaximo"
                  type="number"
                  value={formData.CupoMaximo}
                  onChange={(e) => setFormData({ ...formData, CupoMaximo: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="TipoClase">Duración de la Clase *</Label>
                <select
                  id="TipoClase"
                  value={formData.TipoClase}
                  onChange={(e) => setFormData({ ...formData, TipoClase: e.target.value })}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="Indefinida">Indefinida (hasta que se cancele)</option>
                  <option value="Temporal">Temporal (número específico de semanas)</option>
                </select>
              </div>
              {formData.TipoClase === "Temporal" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="NumeroSemanas">Número de Semanas *</Label>
                    <Input
                      id="NumeroSemanas"
                      type="number"
                      min="1"
                      value={formData.NumeroSemanas}
                      onChange={(e) => setFormData({ ...formData, NumeroSemanas: e.target.value })}
                      placeholder="Ej: 8"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="FechaInicio">Fecha de Inicio *</Label>
                    <Input
                      id="FechaInicio"
                      type="date"
                      value={formData.FechaInicio}
                      onChange={(e) => setFormData({ ...formData, FechaInicio: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingClase ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
