"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { getUser } from "@/lib/auth-client"

interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  DiaSemana: string[]
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  Estado: boolean
  TipoClase: string
  NumeroSemanas: number
  FechaInicio: string
}

export default function EntrenadorClasesPage() {
  const [clases, setClases] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingClase, setEditingClase] = useState<Clase | null>(null)
  const [formData, setFormData] = useState({
    NombreClase: "",
    Descripcion: "",
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
  }, [])

  const fetchClases = async () => {
    try {
      const user = getUser()
      if (!user?.usuarioID) return

      const response = await fetch(`/api/entrenador/clases?usuarioID=${user.usuarioID}`)
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

  const handleOpenDialog = (clase?: Clase) => {
    if (clase) {
      setEditingClase(clase)
      setFormData({
        NombreClase: clase.NombreClase,
        Descripcion: clase.Descripcion || "",
        DiasSemana: clase.DiaSemana,
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
      const user = getUser()
      if (!user?.usuarioID) return

      const entrenadorResponse = await fetch(`/api/entrenador/profile?usuarioID=${user.usuarioID}`)
      if (!entrenadorResponse.ok) {
        alert("Error al obtener información del entrenador")
        return
      }
      const entrenadorData = await entrenadorResponse.json()

      const url = editingClase ? `/api/admin/clases?id=${editingClase.ClaseID}` : "/api/admin/clases"
      const method = editingClase ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          EntrenadorID: entrenadorData.EntrenadorID,
        }),
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

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando clases...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Clases</h1>
            <p className="text-muted-foreground">Administra tus clases grupales</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Clase
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clases Programadas</CardTitle>
            <CardDescription>Tus clases grupales semanales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tienes clases programadas</p>
              ) : (
                clases.map((clase) => (
                  <div key={clase.ClaseID} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{clase.NombreClase}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{clase.DiaSemana.join(", ")}</span>
                          <span>
                            {clase.HoraInicio} - {clase.HoraFin}
                          </span>
                          <span>Cupo: {clase.CupoMaximo} personas</span>
                          {clase.TipoClase === "Temporal" && (
                            <span className="text-orange-600">Temporal ({clase.NumeroSemanas} semanas)</span>
                          )}
                        </div>
                        {clase.Descripcion && <p className="text-sm text-muted-foreground mt-2">{clase.Descripcion}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(clase)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(clase.ClaseID)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
