"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, CheckCircle2 } from "lucide-react"
import { getUser } from "@/lib/auth-client"

interface Pago {
  PagoID: number
  Monto: number
  FechaPago: string
  MetodoPago: string
  Estado: string
  Concepto: string
  NombrePlan: string | null
}

export default function SocioPagosPage() {
  const [paymentMethod, setPaymentMethod] = useState("")
  const [amount, setAmount] = useState("")
  const [success, setSuccess] = useState(false)
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const user = getUser()
        if (!user?.socioID) return

        const response = await fetch(`/api/socio/pagos?socioID=${user.socioID}`)
        if (response.ok) {
          const data = await response.json()
          setHistorialPagos(data)
        }
      } catch (error) {
        console.error("Error al cargar pagos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPagos()
  }, [])

  const handlePayment = () => {
    // Symbolic payment - just show success message
    setSuccess(true)
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <DashboardLayout role="Socio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pagos</h1>
          <p className="text-muted-foreground">Gestiona tus pagos y consulta tu historial</p>
        </div>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Realizar Pago</CardTitle>
            <CardDescription>Pago simbólico - Funcionalidad de demostración</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Pago procesado exitosamente. Este es un pago simbólico de demostración.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="digital">Pago Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handlePayment} disabled={!amount || !paymentMethod} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Procesar Pago Simbólico
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Nota: Esta es una funcionalidad de demostración. No se procesarán pagos reales.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
            <CardDescription>Tus pagos anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Cargando historial...</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Fecha</th>
                      <th className="text-left p-3 font-medium">Concepto</th>
                      <th className="text-left p-3 font-medium">Monto</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No hay pagos registrados
                        </td>
                      </tr>
                    ) : (
                      historialPagos.map((pago) => (
                        <tr key={pago.PagoID} className="border-t">
                          <td className="p-3">{new Date(pago.FechaPago).toLocaleDateString()}</td>
                          <td className="p-3">{pago.Concepto || pago.NombrePlan || "N/A"}</td>
                          <td className="p-3 font-medium">${pago.Monto.toLocaleString()}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                pago.Estado === "Completado"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {pago.Estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Mi Código QR
            </CardTitle>
            <CardDescription>Código de acceso al gimnasio (simbólico)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg">
              <div className="w-48 h-48 bg-white border-2 border-primary rounded-lg flex items-center justify-center mb-4">
                <div className="text-6xl">🏋️</div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Presenta este código QR en la recepción para registrar tu ingreso
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Nota: Funcionalidad simbólica de demostración
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
