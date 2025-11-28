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

interface Plan {
  PlanID: number
  NombrePlan: string
  Descripcion: string
  Precio: number
  DuracionDias: number
  TipoPlan: string
  Activo: boolean
}

export default function AdminMembresiasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    nombrePlan: "",
    descripcion: "",
    precio: "",
    duracionDias: "",
    tipoPlan: "Normal",
    beneficios: "",
  })

  useEffect(() => {
    fetchPlanes()
  }, [])

  const fetchPlanes = async () => {
    try {
      const response = await fetch("/api/admin/membresias")
      if (response.ok) {
        const data = await response.json()
        setPlanes(data)
      }
    } catch (error) {
      console.error("Error al cargar membresías:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        nombrePlan: plan.NombrePlan,
        descripcion: plan.Descripcion || "",
        precio: plan.Precio.toString(),
        duracionDias: plan.DuracionDias.toString(),
        tipoPlan: plan.TipoPlan,
        beneficios: "",
      })
    } else {
      setEditingPlan(null)
      setFormData({
        nombrePlan: "",
        descripcion: "",
        precio: "",
        duracionDias: "",
        tipoPlan: "Normal",
        beneficios: "",
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const body = editingPlan ? { ...formData, planID: editingPlan.PlanID, activo: editingPlan.Activo } : formData

      const url = "/api/admin/membresias"
      const method = editingPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowDialog(false)
        fetchPlanes()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar plan")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar plan")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return

    try {
      const response = await fetch(`/api/admin/membresias?planID=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchPlanes()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const filteredPlanes = planes.filter((plan) => plan.NombrePlan.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando membresías...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Membresías</h1>
            <p className="text-muted-foreground">Administra los planes de membresía</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Membresía
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planes de Membresía</CardTitle>
            <CardDescription>Total: {planes.length} planes disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Nombre del Plan</th>
                      <th className="text-left p-3 font-medium">Precio</th>
                      <th className="text-left p-3 font-medium">Duración (días)</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlanes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No se encontraron planes de membresía
                        </td>
                      </tr>
                    ) : (
                      filteredPlanes.map((plan) => (
                        <tr key={plan.PlanID} className="border-t">
                          <td className="p-3 font-medium">{plan.NombrePlan}</td>
                          <td className="p-3">${plan.Precio.toLocaleString()}</td>
                          <td className="p-3">{plan.DuracionDias} días</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                plan.Activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {plan.Activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.PlanID)}>
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
              <DialogTitle>{editingPlan ? "Editar Plan" : "Nuevo Plan de Membresía"}</DialogTitle>
              <DialogClose onClose={() => setShowDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombrePlan">Nombre del Plan *</Label>
                <Input
                  id="nombrePlan"
                  value={formData.nombrePlan}
                  onChange={(e) => setFormData({ ...formData, nombrePlan: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precio">Precio *</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duracionDias">Duración (días) *</Label>
                  <Input
                    id="duracionDias"
                    type="number"
                    value={formData.duracionDias}
                    onChange={(e) => setFormData({ ...formData, duracionDias: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tipoPlan">Tipo de Plan</Label>
                <select
                  id="tipoPlan"
                  value={formData.tipoPlan}
                  onChange={(e) => setFormData({ ...formData, tipoPlan: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="Normal">Normal</option>
                  <option value="Oferta">Oferta</option>
                </select>
              </div>
              <div>
                <Label htmlFor="beneficios">Beneficios</Label>
                <textarea
                  id="beneficios"
                  value={formData.beneficios}
                  onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[80px]"
                  placeholder="Lista de beneficios del plan..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingPlan ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
