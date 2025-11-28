"use client"

import type React from "react"
import { RefreshCw } from "lucide-react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Package,
  BarChart3,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  Clock,
} from "lucide-react"
import { getUser, logout } from "@/lib/auth-client"
import type { User as UserType } from "@/lib/auth-client"

interface DashboardLayoutProps {
  children: React.ReactNode
  role: "Administrador" | "Entrenador" | "Socio"
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const userData = getUser()
    if (!userData) {
      router.push("/login")
      return
    }
    if (userData.rol !== role) {
      router.push("/login")
      return
    }
    setUser(userData)
  }, [router, role])

  const handleLogout = () => {
    logout()
  }

  const getRolePrefix = () => {
    if (role === "Administrador") return "/admin"
    if (role === "Entrenador") return "/entrenador"
    return "/socio"
  }

  // Navigation items based on role
  const getNavItems = () => {
    const basePrefix = getRolePrefix()

    if (role === "Administrador") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
        { icon: Users, label: "Socios", href: `${basePrefix}/socios` },
        { icon: CreditCard, label: "Membresías", href: `${basePrefix}/membresias` },
        { icon: CreditCard, label: "Pagos", href: `${basePrefix}/pagos` },
        { icon: UserCircle, label: "Entrenadores", href: `${basePrefix}/entrenadores` },
        { icon: Package, label: "Inventario", href: `${basePrefix}/inventario` },
        { icon: Calendar, label: "Clases", href: `${basePrefix}/clases` },
        { icon: Clock, label: "Cronograma", href: `${basePrefix}/cronograma` },
        { icon: RefreshCw, label: "Sincronización", href: `${basePrefix}/sync` },
        { icon: BarChart3, label: "KPIs", href: `${basePrefix}/kpis` },
      ]
    } else if (role === "Entrenador") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
        { icon: Users, label: "Socios", href: `${basePrefix}/socios` },
        { icon: Calendar, label: "Mis Clases", href: `${basePrefix}/clases` },
        { icon: Clock, label: "Horario", href: `${basePrefix}/horario` },
      ]
    } else {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: `${basePrefix}/dashboard` },
        { icon: CreditCard, label: "Mi Membresía", href: `${basePrefix}/membresia` },
        { icon: Calendar, label: "Clases", href: `${basePrefix}/clases` },
        { icon: UserCircle, label: "Entrenadores", href: `${basePrefix}/entrenadores` },
        { icon: CreditCard, label: "Pagos", href: `${basePrefix}/pagos` },
      ]
    }
  }

  const navItems = getNavItems()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-background border-r w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-6 w-6 text-primary" />
                <span className="font-bold">Mundo Fitness</span>
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary" : ""}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t space-y-1">
            <Link href={`${getRolePrefix()}/perfil`}>
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
            </Link>
            <Link href={`${getRolePrefix()}/configuracion`}>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all ${sidebarOpen ? "lg:ml-64" : ""}`}>
        {/* Top bar */}
        <header className="bg-background border-b sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {user.nombre} {user.apellido}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
