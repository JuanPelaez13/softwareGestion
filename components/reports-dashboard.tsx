"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectStatusChart } from "./charts/project-status-chart"
import { TaskCompletionChart } from "./charts/task-completion-chart"
import { PriorityDistributionChart } from "./charts/priority-distribution-chart"
import { TeamPerformanceChart } from "./charts/team-performance-chart"
import { ProjectTimelineChart } from "./charts/project-timeline-chart"
import { Button } from "./ui/button"
import { getProjectStatistics, getTaskStatistics, getTeamStatistics } from "@/lib/statistics"
import type { ProjectStats, TaskStats, TeamStats } from "@/lib/statistics"

export function ReportsDashboard() {
  const [timeFilter, setTimeFilter] = useState("month")
  const [isLoading, setIsLoading] = useState(true)
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null)
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStatistics() {
      setIsLoading(true)
      setError(null)

      try {
        // Cargar estadísticas de proyectos
        const projectResult = await getProjectStatistics(timeFilter)
        if (projectResult.success) {
          setProjectStats(projectResult.stats)
        } else {
          console.error("Error al cargar estadísticas de proyectos:", projectResult.error)
          setError(projectResult.error || "Error al cargar estadísticas de proyectos")
        }

        // Cargar estadísticas de tareas
        const taskResult = await getTaskStatistics(timeFilter)
        if (taskResult.success) {
          setTaskStats(taskResult.stats)
        } else {
          console.error("Error al cargar estadísticas de tareas:", taskResult.error)
          setError(taskResult.error || "Error al cargar estadísticas de tareas")
        }

        // Cargar estadísticas del equipo
        const teamResult = await getTeamStatistics(timeFilter)
        if (teamResult.success) {
          setTeamStats(teamResult.stats)
        } else {
          console.error("Error al cargar estadísticas del equipo:", teamResult.error)
          setError(teamResult.error || "Error al cargar estadísticas del equipo")
        }
      } catch (err) {
        console.error("Error al cargar estadísticas:", err)
        setError("Error al cargar estadísticas. Por favor, inténtalo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }

    loadStatistics()
  }, [timeFilter])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Mostrando datos del:
          <span className="font-medium ml-1">
            {timeFilter === "month" && "Último mes"}
            {timeFilter === "quarter" && "Último trimestre"}
            {timeFilter === "year" && "Último año"}
            {timeFilter === "all" && "Todo el tiempo"}
          </span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={timeFilter === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("month")}
          >
            Mes
          </Button>
          <Button
            variant={timeFilter === "quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("quarter")}
          >
            Trimestre
          </Button>
          <Button
            variant={timeFilter === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter("year")}
          >
            Año
          </Button>
          <Button variant={timeFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setTimeFilter("all")}>
            Todo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.totalProjects || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {projectStats?.projectsByStatus.find((s) => s.name === "Activo")?.value || 0} activos,
              {projectStats?.projectsByStatus.find((s) => s.name === "Completado")?.value || 0} completados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taskStats?.completedTasks || 0}/{taskStats?.totalTasks || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {taskStats && taskStats.totalTasks > 0
                ? Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)
                : 0}
              % completado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.averageCompletionTime.toFixed(1) || "0"} días</div>
            <p className="text-xs text-gray-500 mt-1">Por tarea completada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia del Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamStats && teamStats.teamPerformance.length > 0
                ? Math.round(
                    (teamStats.teamPerformance.reduce((sum, user) => sum + user.tareas, 0) /
                      teamStats.teamPerformance.reduce((sum, user) => sum + user.horas, 0)) *
                      100,
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">Tareas por hora de trabajo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Proyectos</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ProjectStatusChart data={projectStats?.projectsByStatus || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completitud de Tareas</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <TaskCompletionChart data={taskStats?.taskCompletionByProject || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Prioridades</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <PriorityDistributionChart data={taskStats?.tasksByPriority || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento del Equipo</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <TeamPerformanceChart data={teamStats?.teamPerformance || []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Línea de Tiempo de Proyectos</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ProjectTimelineChart data={projectStats?.projectTimeline || []} />
        </CardContent>
      </Card>
    </div>
  )
}
