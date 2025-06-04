"use server"

import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// Tipo para un proyecto
export type Project = {
  id: number
  name: string
  description: string | null
  status: "active" | "completed" | "on_hold" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  start_date: string | null
  end_date: string | null
  owner_id: number
  created_at: string
  updated_at: string
  total_tasks?: number
  completed_tasks?: number
}

// Modificar el tipo CreateProjectInput para incluir colaboradores
export type CreateProjectInput = {
  name: string
  description?: string
  status?: "active" | "completed" | "on_hold" | "cancelled"
  priority?: "low" | "medium" | "high" | "urgent"
  start_date?: string
  end_date?: string
  collaborators?: number[] // IDs de los usuarios colaboradores
}

// Modificar la función createProject para no usar transacciones explícitas
export async function createProject(data: CreateProjectInput) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para crear un proyecto",
      }
    }

    const { name, description, status, priority, start_date, end_date, collaborators } = data

    // Insertar el proyecto sin usar transacciones explícitas
    const result = (await query(
      `INSERT INTO projects 
       (name, description, status, priority, start_date, end_date, owner_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        status || "active",
        priority || "medium",
        start_date || null,
        end_date || null,
        user.id,
      ],
    )) as any

    const projectId = result.insertId

    // Añadir colaboradores si existen
    if (collaborators && collaborators.length > 0) {
      for (const collaboratorId of collaborators) {
        try {
          await query(`INSERT INTO project_collaborators (project_id, user_id) VALUES (?, ?)`, [
            projectId,
            collaboratorId,
          ])
        } catch (error) {
          console.error(`Error al añadir colaborador ${collaboratorId}:`, error)
          // Continuamos con el siguiente colaborador aunque falle uno
        }
      }
    }

    return {
      success: true,
      projectId: projectId,
    }
  } catch (error) {
    console.error("Error al crear proyecto:", error)
    return {
      success: false,
      error: "Error al crear el proyecto: " + (error as Error).message,
    }
  }
}

// Modificar la función getUserProjects para incluir proyectos donde el usuario es colaborador
// y añadir conteo de tareas
export async function getUserProjects(userId?: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver tus proyectos",
      }
    }

    // Si no se proporciona un userId, usar el usuario actual
    const targetUserId = userId || currentUser.id

    // Obtener proyectos donde el usuario es propietario o colaborador
    const projects = (await query(
      `
      SELECT p.*, 
             CASE WHEN p.owner_id = ? THEN true ELSE false END as is_owner,
             u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? 
      OR p.id IN (SELECT project_id FROM project_collaborators WHERE user_id = ?)
      ORDER BY p.created_at DESC
    `,
      [targetUserId, targetUserId, targetUserId],
    )) as (Project & { is_owner: boolean; owner_name: string })[]

    // Para cada proyecto, obtener el conteo de tareas
    for (const project of projects) {
      try {
        // Obtener el total de tareas
        const totalTasksResult = await query(
          `
          SELECT COUNT(*) as total
          FROM tasks
          WHERE project_id = ?
        `,
          [project.id],
        )

        // Obtener el total de tareas completadas
        const completedTasksResult = await query(
          `
          SELECT COUNT(*) as completed
          FROM tasks
          WHERE project_id = ? AND status = 'completed'
        `,
          [project.id],
        )

        project.total_tasks = totalTasksResult[0].total || 0
        project.completed_tasks = completedTasksResult[0].completed || 0

        console.log(`Proyecto ${project.id}: ${project.completed_tasks}/${project.total_tasks} tareas completadas`)
      } catch (error) {
        console.error(`Error al obtener tareas para el proyecto ${project.id}:`, error)
        project.total_tasks = 0
        project.completed_tasks = 0
      }
    }

    return {
      success: true,
      projects,
    }
  } catch (error) {
    console.error("Error al obtener proyectos:", error)
    return {
      success: false,
      error: "Error al obtener los proyectos: " + (error as Error).message,
    }
  }
}

// Modificar la función getProjectById para permitir acceso a colaboradores
export async function getProjectById(id: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesi��n para ver este proyecto",
      }
    }

    // Verificar si el usuario es propietario o colaborador del proyecto
    const projects = (await query(
      `
      SELECT p.*, u.name as owner_name,
             CASE WHEN p.owner_id = ? THEN true ELSE false END as is_owner
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ? AND (p.owner_id = ? OR 
            EXISTS (SELECT 1 FROM project_collaborators WHERE project_id = p.id AND user_id = ?))
    `,
      [user.id, id, user.id, user.id],
    )) as (Project & { is_owner: boolean; owner_name: string })[]

    if (projects.length === 0) {
      return {
        success: false,
        error: "Proyecto no encontrado o no tienes acceso",
      }
    }

    // Obtener los colaboradores del proyecto
    const collaborators = (await query(
      `
      SELECT u.id, u.name, u.email
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
    `,
      [id],
    )) as { id: number; name: string; email: string }[]

    // Obtener el conteo de tareas
    const totalTasksResult = await query(
      `
      SELECT COUNT(*) as total
      FROM tasks
      WHERE project_id = ?
    `,
      [id],
    )

    const completedTasksResult = await query(
      `
      SELECT COUNT(*) as completed
      FROM tasks
      WHERE project_id = ? AND status = 'completed'
    `,
      [id],
    )

    const project = {
      ...projects[0],
      collaborators,
      total_tasks: totalTasksResult[0].total || 0,
      completed_tasks: completedTasksResult[0].completed || 0,
    }

    return {
      success: true,
      project,
    }
  } catch (error) {
    console.error("Error al obtener proyecto:", error)
    return {
      success: false,
      error: "Error al obtener el proyecto",
    }
  }
}

// Función para actualizar un proyecto
export async function updateProject(id: number, data: Partial<CreateProjectInput>) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para actualizar este proyecto",
      }
    }

    // Verificar que el proyecto pertenece al usuario
    const projectCheck = await getProjectById(id)
    if (!projectCheck.success) {
      return projectCheck
    }

    // Construir la consulta dinámicamente basada en los campos proporcionados
    const updateFields: string[] = []
    const values: any[] = []

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (updateFields.length === 0) {
      return {
        success: false,
        error: "No se proporcionaron campos para actualizar",
      }
    }

    // Añadir el ID del proyecto y del usuario al final de los valores
    values.push(id)
    values.push(user.id)

    await query(`UPDATE projects SET ${updateFields.join(", ")} WHERE id = ? AND owner_id = ?`, values)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error al actualizar proyecto:", error)
    return {
      success: false,
      error: "Error al actualizar el proyecto",
    }
  }
}

// Función para eliminar un proyecto
export async function deleteProject(id: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para eliminar este proyecto",
      }
    }

    await query(`DELETE FROM projects WHERE id = ? AND owner_id = ?`, [id, user.id])

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error al eliminar proyecto:", error)
    return {
      success: false,
      error: "Error al eliminar el proyecto",
    }
  }
}

// Añadir función para gestionar colaboradores
export async function addProjectCollaborator(projectId: number, userId: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para añadir colaboradores",
      }
    }

    // Verificar que el usuario es propietario del proyecto
    const projectCheck = await getProjectById(projectId)
    if (!projectCheck.success || !projectCheck.project.is_owner) {
      return {
        success: false,
        error: "No tienes permisos para añadir colaboradores a este proyecto",
      }
    }

    // Añadir colaborador
    await query(
      `INSERT INTO project_collaborators (project_id, user_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id = id`, // No hacer nada si ya existe
      [projectId, userId],
    )

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error al añadir colaborador:", error)
    return {
      success: false,
      error: "Error al añadir colaborador",
    }
  }
}

export async function removeProjectCollaborator(projectId: number, userId: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para eliminar colaboradores",
      }
    }

    // Verificar que el usuario es propietario del proyecto
    const projectCheck = await getProjectById(projectId)
    if (!projectCheck.success || !projectCheck.project.is_owner) {
      return {
        success: false,
        error: "No tienes permisos para eliminar colaboradores de este proyecto",
      }
    }

    // Eliminar colaborador
    await query(`DELETE FROM project_collaborators WHERE project_id = ? AND user_id = ?`, [projectId, userId])

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error al eliminar colaborador:", error)
    return {
      success: false,
      error: "Error al eliminar colaborador",
    }
  }
}

// Nueva función para obtener los proyectos de un usuario específico
export async function getUserProjectCount(userId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver los proyectos",
      }
    }

    // Contar proyectos donde el usuario es propietario o colaborador
    const result = await query(
      `
      SELECT COUNT(*) as count
      FROM (
        SELECT p.id
        FROM projects p
        WHERE p.owner_id = ?
        UNION
        SELECT pc.project_id
        FROM project_collaborators pc
        WHERE pc.user_id = ?
      ) as user_projects
    `,
      [userId, userId],
    )

    return {
      success: true,
      count: result[0].count || 0,
    }
  } catch (error) {
    console.error("Error al obtener conteo de proyectos:", error)
    return {
      success: false,
      error: "Error al obtener conteo de proyectos",
      count: 0,
    }
  }
}
