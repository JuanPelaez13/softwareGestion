"use server"

import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// Tipos para las estadísticas
export type ProjectStats = {
  totalProjects: number
  projectsByStatus: { name: string; value: number }[]
  projectsByPriority: { name: string; value: number }[]
  projectTimeline: {
    name: string
    inicio: number
    fin: number
    status: string
    priority: string
  }[]
}

export type TaskStats = {
  totalTasks: number
  completedTasks: number
  tasksByStatus: { name: string; value: number }[]
  tasksByPriority: { name: string; value: number }[]
  taskCompletionByProject: { name: string; completadas: number; pendientes: number }[]
  averageCompletionTime: number // en días
}

export type TeamStats = {
  teamPerformance: { name: string; tareas: number; horas: number }[]
  userTaskDistribution: { name: string; value: number }[]
}

// Función para obtener estadísticas de proyectos
export async function getProjectStatistics(timeFilter = "all") {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver las estadísticas",
      }
    }

    // Construir la condición de fecha según el filtro
    let dateCondition = ""
    const now = new Date()

    if (timeFilter === "month") {
      const lastMonth = new Date(now)
      lastMonth.setMonth(now.getMonth() - 1)
      dateCondition = `AND p.created_at >= '${lastMonth.toISOString()}'`
    } else if (timeFilter === "quarter") {
      const lastQuarter = new Date(now)
      lastQuarter.setMonth(now.getMonth() - 3)
      dateCondition = `AND p.created_at >= '${lastQuarter.toISOString()}'`
    } else if (timeFilter === "year") {
      const lastYear = new Date(now)
      lastYear.setFullYear(now.getFullYear() - 1)
      dateCondition = `AND p.created_at >= '${lastYear.toISOString()}'`
    }

    // Obtener el total de proyectos
    const totalProjectsResult = await query(
      `SELECT COUNT(*) as total
       FROM projects p
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}`,
      [user.id, user.id],
    )

    const totalProjects = totalProjectsResult[0]?.total || 0

    // Obtener proyectos por estado
    const projectsByStatusResult = await query(
      `SELECT p.status, COUNT(*) as count
       FROM projects p
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}
       GROUP BY p.status`,
      [user.id, user.id],
    )

    const projectsByStatus = projectsByStatusResult.map((row: any) => ({
      name: formatStatus(row.status),
      value: row.count,
    }))

    // Obtener proyectos por prioridad
    const projectsByPriorityResult = await query(
      `SELECT p.priority, COUNT(*) as count
       FROM projects p
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}
       GROUP BY p.priority`,
      [user.id, user.id],
    )

    const projectsByPriority = projectsByPriorityResult.map((row: any) => ({
      name: formatPriority(row.priority),
      value: row.count,
    }))

    // Obtener línea de tiempo de proyectos
    const projectTimelineResult = await query(
      `SELECT p.id, p.name, p.start_date, p.end_date, p.status, p.priority
       FROM projects p
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}
       ORDER BY p.start_date ASC`,
      [user.id, user.id],
    )

    const projectTimeline = projectTimelineResult.map((project: any) => ({
      name: project.name,
      inicio: project.start_date ? new Date(project.start_date).getTime() : new Date().getTime(),
      fin: project.end_date ? new Date(project.end_date).getTime() : new Date().getTime() + 30 * 24 * 60 * 60 * 1000,
      status: project.status,
      priority: project.priority,
    }))

    return {
      success: true,
      stats: {
        totalProjects,
        projectsByStatus,
        projectsByPriority,
        projectTimeline,
      } as ProjectStats,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas de proyectos:", error)
    return {
      success: false,
      error: "Error al obtener estadísticas de proyectos",
    }
  }
}

// Función para obtener estadísticas de tareas
export async function getTaskStatistics(timeFilter = "all") {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver las estadísticas",
      }
    }

    // Construir la condición de fecha según el filtro
    let dateCondition = ""
    const now = new Date()

    if (timeFilter === "month") {
      const lastMonth = new Date(now)
      lastMonth.setMonth(now.getMonth() - 1)
      dateCondition = `AND t.created_at >= '${lastMonth.toISOString()}'`
    } else if (timeFilter === "quarter") {
      const lastQuarter = new Date(now)
      lastQuarter.setMonth(now.getMonth() - 3)
      dateCondition = `AND t.created_at >= '${lastQuarter.toISOString()}'`
    } else if (timeFilter === "year") {
      const lastYear = new Date(now)
      lastYear.setFullYear(now.getFullYear() - 1)
      dateCondition = `AND t.created_at >= '${lastYear.toISOString()}'`
    }

    // Obtener el total de tareas
    const totalTasksResult = await query(
      `SELECT COUNT(*) as total
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}`,
      [user.id, user.id],
    )

    const totalTasks = totalTasksResult[0]?.total || 0

    // Obtener tareas completadas
    const completedTasksResult = await query(
      `SELECT COUNT(*) as total
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) AND t.status = 'completed' ${dateCondition}`,
      [user.id, user.id],
    )

    const completedTasks = completedTasksResult[0]?.total || 0

    // Obtener tareas por estado
    const tasksByStatusResult = await query(
      `SELECT t.status, COUNT(*) as count
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}
       GROUP BY t.status`,
      [user.id, user.id],
    )

    const tasksByStatus = tasksByStatusResult.map((row: any) => ({
      name: formatTaskStatus(row.status),
      value: row.count,
    }))

    // Obtener tareas por prioridad
    const tasksByPriorityResult = await query(
      `SELECT t.priority, COUNT(*) as count
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}
       GROUP BY t.priority`,
      [user.id, user.id],
    )

    const tasksByPriority = tasksByPriorityResult.map((row: any) => ({
      name: formatTaskPriority(row.priority),
      value: row.count,
    }))

    // Obtener completitud de tareas por proyecto
    const taskCompletionByProjectResult = await query(
      `SELECT p.name,
              SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN t.status != 'completed' THEN 1 ELSE 0 END) as pending
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}
       GROUP BY p.id, p.name
       LIMIT 10`,
      [user.id, user.id],
    )

    const taskCompletionByProject = taskCompletionByProjectResult.map((row: any) => ({
      name: row.name,
      completadas: row.completed,
      pendientes: row.pending,
    }))

    // Calcular tiempo promedio de completitud (simulado)
    const averageCompletionTime = 3.5 // En días (esto debería calcularse realmente)

    return {
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        tasksByStatus,
        tasksByPriority,
        taskCompletionByProject,
        averageCompletionTime,
      } as TaskStats,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas de tareas:", error)
    return {
      success: false,
      error: "Error al obtener estadísticas de tareas",
    }
  }
}

// Función para obtener estadísticas del equipo
export async function getTeamStatistics(timeFilter = "all") {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver las estadísticas",
      }
    }

    // Construir la condición de fecha según el filtro
    let dateCondition = ""
    const now = new Date()

    if (timeFilter === "month") {
      const lastMonth = new Date(now)
      lastMonth.setMonth(now.getMonth() - 1)
      dateCondition = `AND t.created_at >= '${lastMonth.toISOString()}'`
    } else if (timeFilter === "quarter") {
      const lastQuarter = new Date(now)
      lastQuarter.setMonth(now.getMonth() - 3)
      dateCondition = `AND t.created_at >= '${lastQuarter.toISOString()}'`
    } else if (timeFilter === "year") {
      const lastYear = new Date(now)
      lastYear.setFullYear(now.getFullYear() - 1)
      dateCondition = `AND t.created_at >= '${lastYear.toISOString()}'`
    }

    // Obtener rendimiento del equipo (tareas completadas por usuario)
    const teamPerformanceResult = await query(
      `SELECT u.name, COUNT(*) as tasks_count, 0 as hours
       FROM tasks t
       JOIN users u ON t.assigned_to = u.id
       JOIN projects p ON t.project_id = p.id
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) 
       AND t.status = 'completed' ${dateCondition}
       GROUP BY u.id, u.name
       ORDER BY tasks_count DESC
       LIMIT 10`,
      [user.id, user.id],
    )

    // Simular horas trabajadas (esto debería venir de una tabla real de registro de horas)
    const teamPerformance = teamPerformanceResult.map((row: any) => ({
      name: row.name,
      tareas: row.tasks_count,
      horas: row.tasks_count * 4 + Math.floor(Math.random() * 10), // Simulación simple
    }))

    // Obtener distribución de tareas por usuario
    const userTaskDistributionResult = await query(
      `SELECT u.name, COUNT(*) as count
       FROM tasks t
       JOIN users u ON t.assigned_to = u.id
       JOIN projects p ON t.project_id = p.id
       WHERE (p.owner_id = ? OR EXISTS (
         SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?
       )) ${dateCondition}
       GROUP BY u.id, u.name
       ORDER BY count DESC
       LIMIT 10`,
      [user.id, user.id],
    )

    const userTaskDistribution = userTaskDistributionResult.map((row: any) => ({
      name: row.name,
      value: row.count,
    }))

    return {
      success: true,
      stats: {
        teamPerformance,
        userTaskDistribution,
      } as TeamStats,
    }
  } catch (error) {
    console.error("Error al obtener estadísticas del equipo:", error)
    return {
      success: false,
      error: "Error al obtener estadísticas del equipo",
    }
  }
}

// Funciones auxiliares para formatear estados y prioridades
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Activo",
    completed: "Completado",
    on_hold: "En Espera",
    cancelled: "Cancelado",
  }
  return statusMap[status] || status
}

function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  }
  return priorityMap[priority] || priority
}

function formatTaskStatus(status: string): string {
  const statusMap: Record<string, string> = {
    to_do: "Por Hacer",
    in_progress: "En Progreso",
    review: "En Revisión",
    completed: "Completado",
  }
  return statusMap[status] || status
}

function formatTaskPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  }
  return priorityMap[priority] || priority
}
