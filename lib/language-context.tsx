"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Language } from "./translations"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getDefaultLanguage(): Language {
  if (typeof window === "undefined") return "pt"

  const stored = localStorage.getItem("venser-language")
  if (stored === "pt" || stored === "en" || stored === "es") {
    return stored as Language
  }

  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith("pt")) return "pt"
  if (browserLang.startsWith("es")) return "es"
  if (browserLang.startsWith("en")) return "en"

  return "pt" // Padrão para português
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt")

  useEffect(() => {
    const detectedLanguage = getDefaultLanguage()
    if (detectedLanguage !== language) {
      setLanguageState(detectedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("venser-language", lang)
  }

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
