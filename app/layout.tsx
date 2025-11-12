import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LanguageProvider } from "@/lib/language-context"
import { SidebarProvider } from "@/lib/sidebar-context"
import { ToasterProvider } from "@/components/toaster"
import { ForceReload } from "@/components/force-reload"
import { TonyNotificationsProvider } from "@/lib/use-tony-notifications"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VENSER - Mental Reprogramming",
  description: "Post-pornography recovery and mental reprogramming based on neuroscience",
  generator: "v0.app",
  // Adiciona versão para forçar atualização do cache do navegador
  other: {
    'version': process.env.NEXT_PUBLIC_APP_VERSION || new Date().toISOString(),
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <SidebarProvider>
          <LanguageProvider>
            <TonyNotificationsProvider>
              {children}
            </TonyNotificationsProvider>
          </LanguageProvider>
        </SidebarProvider>
        <ToasterProvider />
        <Analytics />
        <ForceReload />
      </body>
    </html>
  )
}
