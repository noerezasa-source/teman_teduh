"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "tt-dark-mode"

/**
 * Manages dark mode state, syncs with localStorage, and toggles
 * the "dark" class on <html> for Tailwind class-based dark mode.
 * Defaults to OS preference on first visit.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = stored !== null ? stored === "true" : prefersDark
    setIsDark(initial)
    document.documentElement.classList.toggle("dark", initial)
    setMounted(true)
  }, [])

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      document.documentElement.classList.toggle("dark", next)
      return next
    })
  }

  // `mounted` prevents hydration mismatch for the icon rendering
  return { isDark, toggle, mounted }
}
