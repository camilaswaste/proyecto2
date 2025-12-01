"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Clock, Trash2, UserCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface Horario {
  HorarioRecepcionID: number
  EntrenadorID: number
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  Nombre: string
  Apellido: string
  Especialidad: string
}

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
  Especialidad: string
  Email: string
}

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export default function RecepcionPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [selectedEntrenador, setSelectedEntrenador] = useState<number | null>(null)
  const [selectedDia, setSelectedDia] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      console.log("[v0] Fetching recepción data from API...")
      const response = await fetch("/api/admin/recepcion")
      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response content-type:", response.headers.get("content-type"))

      if (!response.ok) {
        const text = await response.text()
        console.error("[v0] Error response:", text)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Data received:", data)
      console.log("[v0] Entrenadores:", data.entrenadores?.length)

      setHorarios(data.horarios || [])
      setEntrenadores(data.entrenadores || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    }
  }

  const handleAsignar = async () => {
    if (!selectedEntrenador || !selectedDia || !horaInicio || !horaFin) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      })
      return
    }

    if (horaFin <= horaInicio) {
      toast({
        title: "Horario inválido",
        description: "La hora de fin debe ser posterior a la hora de inicio",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/recepcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entrenadorID: selectedEntrenador,
          diaSemana: selectedDia,
          horaInicio,
          horaFin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Éxito",
        description: "Horario de recepción asignado correctamente",
      })

      // Limpiar formulario
      setSelectedEntrenador(null)
      setSelectedDia("")
      setHoraInicio("")
      setHoraFin("")

      // Recargar datos
      fetchData()
    } catch (error) {
      console.error("Error asignando horario:", error)
      toast({
        title: "Error",
        description: "No se pudo asignar el horario",
        variant: "destructive",
      })
    }
  }

  const handleEliminar = async (horarioID: number) => {
    if (!confirm("¿Está seguro de eliminar este horario de recepción?")) return

    try {
      const response = await fetch(`/api/admin/recepcion?id=${horarioID}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Éxito",
        description: "Horario eliminado correctamente",
      })

      fetchData()
    } catch (error) {
      console.error("Error eliminando horario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario",
        variant: "destructive",
      })
    }
  }

  // Agrupar horarios por día
  const horariosPorDia: { [key: string]: Horario[] } = {}
  diasSemana.forEach((dia) => {
    horariosPorDia[dia] = horarios.filter((h) => h.DiaSemana === dia)
  })

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Recepción</h1>
          <p className="text-muted-foreground">Asigna horarios de recepción a los entrenadores</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de asignación */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Asignar Horario</CardTitle>
              <CardDescription>Selecciona un entrenador y define el horario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Entrenador</Label>
                <Select
                  value={selectedEntrenador?.toString()}
                  onValueChange={(val) => setSelectedEntrenador(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar entrenador" />
                  </SelectTrigger>
                  <SelectContent>
                    {entrenadores.map((e) => (
                      <SelectItem key={e.EntrenadorID} value={e.EntrenadorID.toString()}>
                        {e.Nombre} {e.Apellido} - {e.Especialidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Día de la semana</Label>
                <Select value={selectedDia} onValueChange={setSelectedDia}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia} value={dia}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
                </div>
              </div>

              <Button onClick={handleAsignar} className="w-full">
                Asignar Horario
              </Button>
            </CardContent>
          </Card>

          {/* Cronograma semanal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Horarios de Recepción Semanales</CardTitle>
              <CardDescription>Vista general de todos los horarios asignados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {diasSemana.map((dia) => (
                  <div key={dia} className="space-y-2">
                    <h3 className="font-semibold text-sm text-primary">{dia}</h3>
                    <div className="space-y-2">
                      {horariosPorDia[dia].length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Sin horarios asignados</p>
                      ) : (
                        horariosPorDia[dia].map((horario) => (
                          <Card key={horario.HorarioRecepcionID} className="bg-red-50 border-red-200">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <UserCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-red-900 truncate">
                                      {horario.Nombre} {horario.Apellido}
                                    </p>
                                    <p className="text-xs text-red-700">{horario.Especialidad}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEliminar(horario.HorarioRecepcionID)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-900 hover:bg-red-100 flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-red-700">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {horario.HoraInicio} - {horario.HoraFin}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
