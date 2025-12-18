"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Clase {
  ClaseID: number
  NombreClase: string
  Descripcion: string
  DiaSemana: string
  HoraInicio: string
  HoraFin: string
  CupoMaximo: number
  NombreEntrenador: string
  Especialidad: string
  ReservasActuales: number
}

interface Reservacion {
  ClaseID: number
  FechaClase: string
  Estado: string
}

export default function SocioClasesPage() {
  const [clases, setClases] = useState<Clase[]>([])
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [fechaClase, setFechaClase] = useState("")

  useEffect(() => {
    fetchClases()
  }, [])

  const fetchClases = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const socioID = user.socioID || user.usuarioID

      const response = await fetch(`/api/socio/clases?socioID=${socioID}`)
      if (response.ok) {
        const data = await response.json()
        setClases(data.clases)
        setReservaciones(data.reservaciones)
      }
    } catch (error) {
      console.error("Error al cargar clases:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReservar = (clase: Clase) => {
    setSelectedClase(clase)
    // Set default date to next occurrence of the class day
    const today = new Date()
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const targetDay = daysOfWeek.indexOf(clase.DiaSemana)
    const currentDay = today.getDay()
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0) daysToAdd += 7
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + daysToAdd)
    setFechaClase(nextDate.toISOString().split("T")[0])
    setShowDialog(true)
  }

  const handleSubmitReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClase) return

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const socioID = user.socioID || user.usuarioID

      const response = await fetch("/api/socio/clases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID,
          claseID: selectedClase.ClaseID,
          fechaClase,
        }),
      })

      if (response.ok) {
        alert("Clase reservada exitosamente")
        setShowDialog(false)
        fetchClases()
      } else {
        const error = await response.json()
        alert(error.error || "Error al reservar clase")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al reservar clase")
    }
  }

  const isClaseReservada = (claseID: number, fecha: string) => {
    return reservaciones.some((r) => r.ClaseID === claseID && r.FechaClase === fecha && r.Estado === "Reservada")
  }

  const getCuposDisponibles = (clase: Clase) => {
    return clase.CupoMaximo - clase.ReservasActuales
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando clases...</p>
        </div>
      </DashboardLayout>
    )
  }

  const diasOrdenados = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const clasesPorDia = diasOrdenados.reduce(
    (acc, dia) => {
      acc[dia] = clases.filter((c) => c.DiaSemana === dia)
      return acc
    },
    {} as Record<string, Clase[]>,
  )

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clases Grupales</h1>
          <p className="text-muted-foreground">Reserva tu lugar en las clases disponibles</p>
        </div>

        <div className="space-y-6">
          {diasOrdenados.map((dia) => {
            const clasesDelDia = clasesPorDia[dia]
            if (clasesDelDia.length === 0) return null

            return (
              <div key={dia}>
                <h2 className="text-xl font-semibold mb-4">{dia}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clasesDelDia.map((clase) => {
                    const cuposDisponibles = getCuposDisponibles(clase)
                    const estaLlena = cuposDisponibles === 0

                    return (
                      <Card key={clase.ClaseID}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{clase.NombreClase}</CardTitle>
                              <CardDescription className="mt-1">{clase.Descripcion}</CardDescription>
                            </div>
                            {estaLlena && (
                              <Badge variant="destructive" className="ml-2">
                                Llena
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {clase.HoraInicio} - {clase.HoraFin}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{clase.NombreEntrenador}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {cuposDisponibles} de {clase.CupoMaximo} cupos disponibles
                            </span>
                          </div>
                          <Button onClick={() => handleReservar(clase)} disabled={estaLlena} className="w-full">
                            Reservar
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reservar Clase: {selectedClase?.NombreClase}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitReserva} className="space-y-4">
              <div>
                <Label htmlFor="fechaClase">Fecha de la Clase</Label>
                <Input
                  id="fechaClase"
                  type="date"
                  value={fechaClase}
                  onChange={(e) => setFechaClase(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Esta clase se imparte los {selectedClase?.DiaSemana}s
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Confirmar Reserva</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
