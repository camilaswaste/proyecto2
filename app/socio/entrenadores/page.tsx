"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Calendar } from "lucide-react"
import { getUser } from "@/lib/auth-client"

interface Entrenador {
  EntrenadorID: number
  Nombre: string
  Apellido: string
  Email: string
  Especialidad: string
  Certificaciones: string
}

export default function SocioEntrenadoresPage() {
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null)
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [bookingTrainer, setBookingTrainer] = useState<Entrenador | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fechaSesion: "",
    horaInicio: "",
    horaFin: "",
    notas: "",
  })

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch("/api/socio/entrenadores")
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      } else {
        console.error("Failed to fetch entrenadores:", await response.text())
      }
    } catch (error) {
      console.error("Error al cargar entrenadores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBooking = (entrenador: Entrenador) => {
    setBookingTrainer(entrenador)
    setFormData({
      fechaSesion: "",
      horaInicio: "",
      horaFin: "",
      notas: "",
    })
    setShowBookingDialog(true)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = getUser()
      const socioID = user?.socioID || user?.usuarioID

      if (!socioID || !bookingTrainer) {
        alert("Error: No se pudo identificar al socio")
        setSubmitting(false)
        return
      }

      const response = await fetch("/api/socio/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID,
          entrenadorID: bookingTrainer.EntrenadorID,
          ...formData,
        }),
      })

      if (response.ok) {
        alert("Sesión agendada exitosamente")
        setShowBookingDialog(false)
        setFormData({
          fechaSesion: "",
          horaInicio: "",
          horaFin: "",
          notas: "",
        })
      } else {
        const error = await response.json()
        alert(error.error || "Error al agendar sesión")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al agendar sesión")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando entrenadores...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Entrenadores</h1>
          <p className="text-muted-foreground">Conoce a nuestros entrenadores profesionales</p>
        </div>

        <div className="grid gap-6">
          {entrenadores.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No hay entrenadores disponibles</p>
              </CardContent>
            </Card>
          ) : (
            entrenadores.map((entrenador) => (
              <Card key={entrenador.EntrenadorID}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {entrenador.Nombre[0]}
                      {entrenador.Apellido[0]}
                    </div>
                    <div className="flex-1">
                      <CardTitle>
                        {entrenador.Nombre} {entrenador.Apellido}
                      </CardTitle>
                      <CardDescription>{entrenador.Especialidad || "Entrenador Personal"}</CardDescription>
                      {entrenador.Certificaciones && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Certificaciones: {entrenador.Certificaciones}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={selectedTrainer === entrenador.EntrenadorID ? "default" : "outline"}
                      onClick={() =>
                        setSelectedTrainer(selectedTrainer === entrenador.EntrenadorID ? null : entrenador.EntrenadorID)
                      }
                    >
                      {selectedTrainer === entrenador.EntrenadorID ? "Ocultar Info" : "Ver Más"}
                    </Button>
                  </div>
                </CardHeader>

                {selectedTrainer === entrenador.EntrenadorID && (
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Información de Contacto</span>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {entrenador.Email}
                        </p>
                        {entrenador.Especialidad && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Especialidad:</span> {entrenador.Especialidad}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <Button className="w-full md:w-auto" onClick={() => handleOpenBooking(entrenador)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar Sesión con {entrenador.Nombre}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Agendar Sesión con {bookingTrainer?.Nombre} {bookingTrainer?.Apellido}
              </DialogTitle>
              <DialogClose onClose={() => setShowBookingDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div>
                <Label htmlFor="fechaSesion">Fecha de la Sesión *</Label>
                <Input
                  id="fechaSesion"
                  type="date"
                  value={formData.fechaSesion}
                  onChange={(e) => setFormData({ ...formData, fechaSesion: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horaInicio">Hora de Inicio *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="horaFin">Hora de Fin *</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notas">Notas (opcional)</Label>
                <textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[80px]"
                  placeholder="Objetivos, áreas de enfoque, etc."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookingDialog(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Agendando..." : "Agendar Sesión"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
