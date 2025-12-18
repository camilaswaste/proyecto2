"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"
type FontSize = "small" | "normal" | "large" | "xlarge"

interface ThemeContextType {
  theme: Theme
  fontSize: FontSize
  toggleTheme: () => void
  setFontSize: (size: FontSize) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [fontSize, setFontSizeState] = useState<FontSize>("normal")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("app-theme") as Theme | null
    const savedFontSize = localStorage.getItem("app-font-size") as FontSize | null

    if (savedTheme) setTheme(savedTheme)
    if (savedFontSize) setFontSizeState(savedFontSize)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem("app-theme", theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const fontSizes = {
      small: "90%",
      normal: "100%",
      large: "110%",
      xlarge: "120%",
    }
    root.style.fontSize = fontSizes[fontSize]
    localStorage.setItem("app-font-size", fontSize)
  }, [fontSize, mounted])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return <ThemeContext.Provider value={{ theme, fontSize, toggleTheme, setFontSize }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
