"use client"

import { ReportsDashboard } from "@/components/reports-dashboard"
import { Suspense } from "react"

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Reportes y Estadísticas</h1>
      <Suspense fallback={<div>Cargando reportes...</div>}>
        <ReportsDashboard />
      </Suspense>
    </div>
  )
}
