"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react"

interface Producto {
  ProductoID: number
  NombreProducto: string
  NombreCategoria: string
  TipoCategoria: string
  StockActual: number
  PrecioVenta: number
  StockMinimo: number
  Estado: string
}

export default function AdminInventarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    nombreProducto: "",
    descripcion: "",
    categoriaID: "1",
    precioVenta: "",
    stockActual: "",
    stockMinimo: "5",
    unidadMedida: "unidad",
    estado: "Disponible",
  })

  useEffect(() => {
    fetchInventario()
  }, [])

  const fetchInventario = async () => {
    try {
      const response = await fetch("/api/admin/inventario")
      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (producto?: Producto) => {
    if (producto) {
      setEditingProducto(producto)
      setFormData({
        nombreProducto: producto.NombreProducto,
        descripcion: "",
        categoriaID: "1",
        precioVenta: producto.PrecioVenta?.toString() || "",
        stockActual: producto.StockActual.toString(),
        stockMinimo: producto.StockMinimo.toString(),
        unidadMedida: "unidad",
        estado: producto.Estado,
      })
    } else {
      setEditingProducto(null)
      setFormData({
        nombreProducto: "",
        descripcion: "",
        categoriaID: "1",
        precioVenta: "",
        stockActual: "",
        stockMinimo: "5",
        unidadMedida: "unidad",
        estado: "Disponible",
      })
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const body = editingProducto ? { ...formData, productoID: editingProducto.ProductoID } : formData

      const url = "/api/admin/inventario"
      const method = editingProducto ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowDialog(false)
        fetchInventario()
      } else {
        const error = await response.json()
        alert(error.error || "Error al guardar producto")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar producto")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    try {
      const response = await fetch(`/api/admin/inventario?productoID=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchInventario()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  const filteredProductos = productos.filter((producto) =>
    producto.NombreProducto.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <DashboardLayout role="Administrador">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Administrador">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
            <p className="text-muted-foreground">Administra productos y artículos</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
            <CardDescription>Total: {productos.length} productos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Producto</th>
                      <th className="text-left p-3 font-medium">Categoría</th>
                      <th className="text-left p-3 font-medium">Stock</th>
                      <th className="text-left p-3 font-medium">Precio</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProductos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No se encontraron productos
                        </td>
                      </tr>
                    ) : (
                      filteredProductos.map((producto) => (
                        <tr key={producto.ProductoID} className="border-t">
                          <td className="p-3 font-medium">{producto.NombreProducto}</td>
                          <td className="p-3">
                            {producto.NombreCategoria}
                            <span className="text-xs text-muted-foreground ml-2">({producto.TipoCategoria})</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {producto.StockActual < producto.StockMinimo && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                              <span
                                className={
                                  producto.StockActual < producto.StockMinimo ? "text-yellow-600 font-medium" : ""
                                }
                              >
                                {producto.StockActual} unidades
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            {producto.TipoCategoria === "Venta" && producto.PrecioVenta
                              ? `$${producto.PrecioVenta.toLocaleString()}`
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(producto)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(producto.ProductoID)}>
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
              <DialogTitle>{editingProducto ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              <DialogClose onClose={() => setShowDialog(false)} />
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombreProducto">Nombre del Producto *</Label>
                <Input
                  id="nombreProducto"
                  value={formData.nombreProducto}
                  onChange={(e) => setFormData({ ...formData, nombreProducto: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full border rounded-md p-2 min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precioVenta">Precio de Venta</Label>
                  <Input
                    id="precioVenta"
                    type="number"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                  <Input
                    id="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockActual">Stock Actual *</Label>
                  <Input
                    id="stockActual"
                    type="number"
                    value={formData.stockActual}
                    onChange={(e) => setFormData({ ...formData, stockActual: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
                  <Input
                    id="stockMinimo"
                    type="number"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full border rounded-md p-2"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Agotado">Agotado</option>
                  <option value="Descontinuado">Descontinuado</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingProducto ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
