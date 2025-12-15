"use client"

import { useEffect, useRef } from "react"
import { toast } from "@/hooks/use-toast"

interface Notificacion {
  NotificacionID: number
  Titulo: string
  Mensaje: string
  Leida: boolean
}

interface Params {
  tipoUsuario: "Admin" | "Socio" | "Entrenador"
  usuarioID?: number
}

export function useNotificationToast({ tipoUsuario, usuarioID }: Params) {
  const lastShownId = useRef<number | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout

    const fetchNotificaciones = async () => {
      const params = new URLSearchParams({ tipoUsuario })
      if (usuarioID) params.append("usuarioID", String(usuarioID))

      const res = await fetch(`/api/notificaciones?${params.toString()}`)
      const data = await res.json()

      const notificaciones: Notificacion[] = data.notificaciones ?? []
      if (notificaciones.length === 0) return

      const ultima = notificaciones[0]

      // 👉 Solo mostrar si:
      // - no está leída
      // - no es la misma que ya mostramos
      if (
        !ultima.Leida &&
        ultima.NotificacionID !== lastShownId.current
      ) {
        lastShownId.current = ultima.NotificacionID

        toast({
          title: ultima.Titulo,
          description: ultima.Mensaje,
          duration: 5000,
          className: "rounded-xl shadow-lg border bg-background",
        })
      }
    }

    fetchNotificaciones()
    interval = setInterval(fetchNotificaciones, 5000) // cada 5s

    return () => clearInterval(interval)
  }, [tipoUsuario, usuarioID])
}
