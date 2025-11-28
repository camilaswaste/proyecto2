"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, CreditCard } from "lucide-react"
import { getUser } from "@/lib/auth-client"

interface Membresia {
  MembresíaID: number
  FechaInicio: string
  FechaFin: string
  Estado: string
  NombrePlan: string
  Descripcion: string
  Precio: number
  DuracionDias: number
  Beneficios: string
}

interface Plan {
  PlanID: number
  NombrePlan: string
  Descripcion: string
  Precio: number
  DuracionDias: number
  TipoPlan: string
  Beneficios: string
  Activo: boolean
}

export default function SocioMembresiaPage() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [currentMembership, setCurrentMembership] = useState<Membresia | null>(null)
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = getUser()
        if (!user?.socioID && !user?.usuarioID) return

        const socioID = user.socioID || user.usuarioID

        // Fetch current membership
        const membresiaResponse = await fetch(`/api/socio/membresia?socioID=${socioID}`)
        if (membresiaResponse.ok) {
          const membresiaData = await membresiaResponse.json()
          setCurrentMembership(membresiaData)
        }

        // Fetch available plans
        const planesResponse = await fetch("/api/admin/membresias")
        if (planesResponse.ok) {
          const planesData = await planesResponse.json()
          setPlanes(planesData.filter((p: Plan) => p.Activo))
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAcquirePlan = async () => {
    if (!selectedPlan) return

    try {
      const user = getUser()
      if (!user?.socioID && !user?.usuarioID) {
        alert("Error: No se pudo identificar al socio")
        return
      }

      const socioID = user.socioID || user.usuarioID
      const plan = planes.find((p) => p.PlanID === selectedPlan)
      if (!plan) return

      const response = await fetch("/api/socio/membresia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socioID,
          planID: selectedPlan,
        }),
      })

      if (response.ok) {
        alert(`Membresía ${plan.NombrePlan} adquirida exitosamente!`)
        // Reload data
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Error al adquirir membresía")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al adquirir membresía")
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Socio">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando membresía...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Membresía</h1>
          <p className="text-muted-foreground">Gestiona tu plan de membresía</p>
        </div>

        {/* Current Membership */}
        {currentMembership ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Membresía Actual</CardTitle>
              <CardDescription>Tu plan vigente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-xl font-bold">{currentMembership.NombrePlan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Precio Pagado</p>
                  <p className="text-xl font-bold">${currentMembership.Precio.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                  <p className="font-medium">{new Date(currentMembership.FechaInicio).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                  <p className="font-medium">{new Date(currentMembership.FechaFin).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No tienes una membresía activa</p>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Planes Disponibles</h2>
          <p className="text-muted-foreground mb-6">
            {currentMembership ? "Selecciona un nuevo plan para actualizar tu membresía" : "Selecciona un plan"}
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planes.map((plan) => {
              const beneficios = plan.Beneficios ? plan.Beneficios.split(",") : []
              const isCurrentPlan = currentMembership?.NombrePlan === plan.NombrePlan

              return (
                <Card
                  key={plan.PlanID}
                  className={`relative cursor-pointer transition-all ${
                    selectedPlan === plan.PlanID ? "border-primary shadow-lg" : ""
                  } ${isCurrentPlan ? "opacity-60" : ""}`}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan.PlanID)}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-full">ACTUAL</span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-center">{plan.NombrePlan}</CardTitle>
                    <CardDescription className="text-center">{plan.DuracionDias} días</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold">${plan.Precio.toLocaleString()}</p>
                    </div>
                    {beneficios.length > 0 && (
                      <ul className="space-y-2">
                        {beneficios.map((beneficio, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{beneficio.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedPlan && (
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleAcquirePlan}>
                <CreditCard className="h-4 w-4 mr-2" />
                {currentMembership ? "Cambiar a" : "Adquirir"}{" "}
                {planes.find((p) => p.PlanID === selectedPlan)?.NombrePlan}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
