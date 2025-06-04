import { Suspense } from "react"
import { CalendarView } from "@/components/calendar-view"
import { getUserProjects } from "@/lib/projects"

export const metadata = {
  title: "Calendario de Proyectos | EDU SQA",
}

export default async function CalendarPage() {
  // Obtener los proyectos del usuario actual
  const projectsResult = await getUserProjects()
  const projects = projectsResult.success ? projectsResult.projects : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Calendario de Proyectos</h1>
      </div>

      <div className="rounded-lg border bg-white shadow">
        <Suspense fallback={<div className="p-8 text-center">Cargando calendario...</div>}>
          <CalendarView projects={projects} />
        </Suspense>
      </div>
    </div>
  )
}
