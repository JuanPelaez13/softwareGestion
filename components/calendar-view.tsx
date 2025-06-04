"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import "moment/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useRouter } from "next/navigation"
import type { Project } from "@/lib/projects"

// Configurar moment en español
moment.locale("es")
const localizer = momentLocalizer(moment)

// Paleta de colores para proyectos
const PROJECT_COLORS = [
  "#3B82F6", // Azul
  "#EF4444", // Rojo
  "#10B981", // Verde
  "#F59E0B", // Ámbar
  "#8B5CF6", // Violeta
  "#EC4899", // Rosa
  "#06B6D4", // Cyan
  "#F97316", // Naranja
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#D946EF", // Fucsia
  "#0EA5E9", // Celeste
  "#84CC16", // Lima
  "#A855F7", // Púrpura
  "#22C55E", // Esmeralda
]

// Función para generar un color único basado en el ID del proyecto
function getProjectColor(projectId: number): string {
  // Usar el ID del proyecto para seleccionar un color de la paleta
  return PROJECT_COLORS[projectId % PROJECT_COLORS.length]
}

interface CalendarViewProps {
  projects: Project[]
}

export function CalendarView({ projects }: CalendarViewProps) {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [colorMode, setColorMode] = useState<"unique" | "priority">("unique")
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState(Views.MONTH)

  useEffect(() => {
    // Convertir proyectos a eventos del calendario
    const projectEvents = projects
      .filter((project) => project.start_date || project.end_date) // Solo proyectos con fechas
      .map((project) => {
        const startDate = project.start_date ? new Date(project.start_date) : new Date()
        const endDate = project.end_date ? new Date(project.end_date) : new Date(startDate)

        // Si solo hay fecha de fin, usar esa como fecha de inicio también
        if (!project.start_date && project.end_date) {
          startDate.setTime(endDate.getTime())
        }

        // Si las fechas son iguales, añadir un día a la fecha de fin para visualización
        if (startDate.getTime() === endDate.getTime()) {
          endDate.setDate(endDate.getDate() + 1)
        }

        // Determinar el color según el modo seleccionado
        let backgroundColor

        if (colorMode === "priority") {
          // Color basado en prioridad
          backgroundColor = "#3B82F6" // Azul por defecto (medium)
          if (project.priority === "high") backgroundColor = "#EF4444" // Rojo
          if (project.priority === "urgent") backgroundColor = "#7C3AED" // Púrpura
          if (project.priority === "low") backgroundColor = "#10B981" // Verde
        } else {
          // Color único para cada proyecto
          backgroundColor = getProjectColor(project.id)
        }

        return {
          id: project.id,
          title: project.name,
          start: startDate,
          end: endDate,
          allDay: true,
          backgroundColor,
          borderColor: backgroundColor,
          status: project.status,
          priority: project.priority,
          description: project.description,
        }
      })

    setEvents(projectEvents)
  }, [projects, colorMode])

  // Personalizar la apariencia de los eventos
  const eventStyleGetter = (event: any) => {
    const style = {
      backgroundColor: event.backgroundColor,
      borderRadius: "4px",
      opacity: 0.8,
      color: "white",
      border: `1px solid ${event.borderColor}`,
      display: "block",
    }
    return {
      style,
    }
  }

  // Manejar clic en un evento
  const handleSelectEvent = (event: any) => {
    router.push(`/dashboard/projects/${event.id}`)
  }

  // Manejar cambio de fecha
  const handleNavigate = useCallback((newDate: Date, view: any) => {
    setDate(newDate)
  }, [])

  // Manejar cambio de vista
  const handleViewChange = useCallback((newView: any) => {
    setView(newView)
  }, [])

  return (
    <div className="flex flex-col h-[700px] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario de Proyectos</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Colorear por:</span>
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setColorMode("unique")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                colorMode === "unique" ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Proyecto
            </button>
            <button
              onClick={() => setColorMode("priority")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                colorMode === "priority" ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Prioridad
            </button>
          </div>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        views={["month", "week", "day", "agenda"]}
        date={date}
        view={view}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "No hay proyectos en este rango de fechas",
        }}
        popup
        tooltipAccessor={(event) => `${event.title} - ${event.description || "Sin descripción"}`}
      />
    </div>
  )
}
