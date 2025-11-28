"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getUser } from "@/lib/auth-client"

interface Sesion {
  SesionID?: number
  ClaseID?: number
  FechaSesion: string
  HoraInicio: string
  HoraFin: string
  Estado: string
  NombreSocio?: string
  NombreClase?: string
  TipoSesion: string
  CupoDisponible?: number
}

export default function EntrenadorHorarioPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date())
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHorario = async () => {
      try {
        const user = getUser()
        if (!user?.entrenadorID) return

        const fecha = currentWeekStart.toISOString().split("T")[0]
        const response = await fetch(`/api/entrenador/horario?entrenadorID=${user.entrenadorID}&fecha=${fecha}`)
        if (response.ok) {
          const data = await response.json()
          const allSesiones = [...data.sesionesPersonales, ...data.clasesGrupales]
          setSesiones(allSesiones)
        }
      } catch (error) {
        console.error("Error al cargar horario:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHorario()
  }, [currentWeekStart])

  // Helper functions
  const getWeekDates = (startDate: Date) => {
    const dates = []
    const start = new Date(startDate)
    start.setDate(start.getDate() - start.getDay() + 1) // Start from Monday
    for (let i = 0; i < 5; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" })
  }

  const formatWeekRange = (startDate: Date) => {
    const start = new Date(startDate)
    start.setDate(start.getDate() - start.getDay() + 1)
    const endDate = new Date(start)
    endDate.setDate(start.getDate() + 4)
    return `${formatDate(start)} - ${formatDate(endDate)}`
  }

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(currentWeekStart.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(currentWeekStart.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  const weekDates = getWeekDates(currentWeekStart)
  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${7 + i}:00`)

  // Build schedule from sesiones
  const schedule: Record<string, Record<string, Sesion>> = {}
  sesiones.forEach((sesion) => {
    const fecha = new Date(sesion.FechaSesion)
    const dayIndex = fecha.getDay() - 1 // Monday = 0
    if (dayIndex >= 0 && dayIndex < 5) {
      const hora = sesion.HoraInicio.substring(0, 5)
      if (!schedule[dayIndex]) schedule[dayIndex] = {}
      schedule[dayIndex][hora] = sesion
    }
  })

  if (loading) {
    return (
      <DashboardLayout role="Entrenador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando horario...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Entrenador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mi Horario</h1>
            <p className="text-muted-foreground">Visualiza tu agenda semanal</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">{formatWeekRange(currentWeekStart)}</span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Semana del {formatWeekRange(currentWeekStart)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header with days */}
                <div className="grid grid-cols-6 gap-2 mb-2">
                  <div className="font-medium text-sm text-muted-foreground p-2">Hora</div>
                  {dayNames.map((day, index) => (
                    <div key={day} className="font-medium text-sm text-center p-2 bg-muted rounded-lg">
                      <div>{day}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(weekDates[index])}</div>
                    </div>
                  ))}
                </div>

                {/* Time slots grid */}
                <div className="space-y-1">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-6 gap-2">
                      <div className="text-sm font-medium text-muted-foreground p-2 flex items-center">{time}</div>
                      {dayNames.map((_, dayIndex) => {
                        const event = schedule[dayIndex]?.[time]
                        return (
                          <div key={dayIndex} className="min-h-[60px] border rounded-lg p-2 hover:bg-muted/50">
                            {event && (
                              <div
                                className={`h-full rounded p-2 text-xs ${
                                  event.TipoSesion === "Personal"
                                    ? "bg-primary/10 border border-primary/20"
                                    : "bg-blue-50 border border-blue-200"
                                }`}
                              >
                                <div className="font-medium">
                                  {event.TipoSesion === "Personal" ? "Sesión Personal" : event.NombreClase}
                                </div>
                                {event.NombreSocio && (
                                  <div className="text-muted-foreground mt-1">{event.NombreSocio}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/10 border border-primary/20" />
                <span className="text-sm">Sesión Personal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
                <span className="text-sm">Clase Grupal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
