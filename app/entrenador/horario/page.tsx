"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { getUser } from "@/lib/auth-client"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

interface Clase {
  ClaseID: number
  NombreClase: string
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  Inscritos: number
  TipoSesion: string
}

interface Sesion {
  SesionID: number
  FechaSesion: string
  HoraInicio: string
  HoraFin: string
  Estado: string
  NombreSocio: string
  TipoSesion: string
}

interface Recepcion {
  HorarioRecepcionID: number
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
}

export default function EntrenadorHorarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [clases, setClases] = useState<Clase[]>([])
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [recepcion, setRecepcion] = useState<Recepcion[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarClases, setMostrarClases] = useState(true)
  const [mostrarSesiones, setMostrarSesiones] = useState(true)
  const [mostrarRecepcion, setMostrarRecepcion] = useState(true)

  useEffect(() => {
    fetchHorario()
  }, [currentDate])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchHorario()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [currentDate])

  const fetchHorario = async () => {
    try {
      const user = getUser()
      if (!user?.entrenadorID) {
        console.error("No hay entrenadorID en el usuario")
        return
      }

      const fecha = currentDate.toISOString().split("T")[0]

      const response = await fetch(`/api/entrenador/horario?entrenadorId=${user.entrenadorID}&startDate=${fecha}`)

      if (response.ok) {
        const data = await response.json()
        setClases(data.clases || [])
        setSesiones(data.sesiones || [])
        setRecepcion(data.recepcion || [])
      }
    } catch (error) {
      console.error("Error al cargar horario:", error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekDates = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay() + 1)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const getEventosForDay = (dia: string, diaIndex: number) => {
    const eventos: Array<{
      tipo: string
      nombre: string
      detalles: string
      horaInicio: string
      horaFin: string
    }> = []

    if (mostrarRecepcion) {
      const recepcionDelDia = recepcion.filter((r) => r.DiaSemana === dia)

      recepcionDelDia.forEach((r) => {
        eventos.push({
          tipo: "recepcion",
          nombre: "Recepción",
          detalles: "Atención en recepción",
          horaInicio: r.HoraInicio,
          horaFin: r.HoraFin,
        })
      })
    }

    if (mostrarClases) {
      const clasesDelDia = clases.filter((clase) => clase.DiaSemana === dia)

      clasesDelDia.forEach((clase) => {
        eventos.push({
          tipo: "clase",
          nombre: clase.NombreClase,
          detalles: `${clase.Inscritos}/${clase.CupoMaximo} inscritos`,
          horaInicio: clase.HoraInicio,
          horaFin: clase.HoraFin,
        })
      })
    }

    const fechaDia = weekDates[diaIndex]
    const fechaDiaStr = `${fechaDia.getFullYear()}-${String(fechaDia.getMonth() + 1).padStart(2, "0")}-${String(fechaDia.getDate()).padStart(2, "0")}`

    if (mostrarSesiones) {
      const sesionesDelDia = sesiones.filter((sesion) => {
        const fechaSesionStr = sesion.FechaSesion.split("T")[0]
        return fechaSesionStr === fechaDiaStr
      })

      sesionesDelDia.forEach((sesion) => {
        eventos.push({
          tipo: "sesion",
          nombre: "Sesión Personal",
          detalles: sesion.NombreSocio,
          horaInicio: sesion.HoraInicio,
          horaFin: sesion.HoraFin,
        })
      })
    }

    return eventos.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatWeekRange = () => {
    const start = weekDates[0]
    const end = weekDates[weekDates.length - 1]
    return `${start.getDate()} ${start.toLocaleDateString("es-ES", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`
  }

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
          <Button onClick={goToToday} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Hoy
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Semana del {formatWeekRange()}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-3">
                {diasSemana.map((dia, index) => {
                  const eventos = getEventosForDay(dia, index)
                  const isToday = weekDates[index].toDateString() === new Date().toDateString()

                  return (
                    <div key={dia} className={`border rounded-lg ${isToday ? "border-blue-500 border-2" : ""}`}>
                      <div className={`p-3 text-center border-b ${isToday ? "bg-blue-50" : "bg-muted"}`}>
                        <div className="font-medium">{dia}</div>
                        <div className="text-sm text-muted-foreground">
                          {weekDates[index].getDate()}{" "}
                          {weekDates[index].toLocaleDateString("es-ES", { month: "short" })}
                        </div>
                      </div>
                      <div className="p-2 space-y-2 min-h-[400px]">
                        {eventos.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">Sin eventos</p>
                        ) : (
                          eventos.map((evento, idx) => (
                            <div
                              key={idx}
                              className={`text-xs p-2 rounded border ${
                                evento.tipo === "recepcion"
                                  ? "bg-red-50 border-red-300"
                                  : evento.tipo === "clase"
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-green-50 border-green-200"
                              }`}
                            >
                              <div className="font-semibold text-sm mb-1">{evento.nombre}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <span className="font-medium">{evento.horaInicio}</span>
                                <span>-</span>
                                <span className="font-medium">{evento.horaFin}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">{evento.detalles}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recepcion-entrenador"
                  checked={mostrarRecepcion}
                  onCheckedChange={(checked) => setMostrarRecepcion(checked === true)}
                />
                <label htmlFor="recepcion-entrenador" className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
                  <span className="text-sm">Recepción</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="clases-grupales-entrenador"
                  checked={mostrarClases}
                  onCheckedChange={(checked) => setMostrarClases(checked === true)}
                />
                <label htmlFor="clases-grupales-entrenador" className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                  <span className="text-sm">Clases Grupales</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sesiones-personales-entrenador"
                  checked={mostrarSesiones}
                  onCheckedChange={(checked) => setMostrarSesiones(checked === true)}
                />
                <label htmlFor="sesiones-personales-entrenador" className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                  <span className="text-sm">Sesiones Personales</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
