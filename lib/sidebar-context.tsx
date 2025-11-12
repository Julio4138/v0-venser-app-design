"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type SidebarContextValue = {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("venser.sidebar.collapsed")
      if (saved != null) setCollapsed(saved === "true")
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("venser.sidebar.collapsed", String(collapsed))
    } catch {}
  }, [collapsed])

  const toggle = () => setCollapsed((c) => !c)

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider")
  return ctx
}


