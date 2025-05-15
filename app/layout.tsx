import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { initializeDatabase } from "@/lib/db"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EDU SQA - Sistema de Gestión de Proyectos",
  description: "Sistema de gestión de proyectos para EDU SQA SAS",
}

// Inicializar la base de datos al cargar la aplicación
initializeDatabase().catch(console.error)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
