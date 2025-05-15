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
}

// Tipo para crear un proyecto
export type CreateProjectInput = {
  name: string
  description?: string
  status?: "active" | "completed" | "on_hold" | "cancelled"
  priority?: "low" | "medium" | "high" | "urgent"
  start_date?: string
  end_date?: string
}

// Función para crear un nuevo proyecto
export async function createProject(data: CreateProjectInput) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para crear un proyecto",
      }
    }

    const { name, description, status, priority, start_date, end_date } = data

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

    return {
      success: true,
      projectId: result.insertId,
    }
  } catch (error) {
    console.error("Error al crear proyecto:", error)
    return {
      success: false,
      error: "Error al crear el proyecto",
    }
  }
}

// Función para obtener todos los proyectos del usuario actual
export async function getUserProjects() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver tus proyectos",
      }
    }

    const projects = (await query(`SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC`, [
      user.id,
    ])) as Project[]

    return {
      success: true,
      projects,
    }
  } catch (error) {
    console.error("Error al obtener proyectos:", error)
    return {
      success: false,
      error: "Error al obtener los proyectos",
    }
  }
}

// Función para obtener un proyecto por ID
export async function getProjectById(id: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver este proyecto",
      }
    }

    const projects = (await query(`SELECT * FROM projects WHERE id = ? AND owner_id = ?`, [id, user.id])) as Project[]

    if (projects.length === 0) {
      return {
        success: false,
        error: "Proyecto no encontrado",
      }
    }

    return {
      success: true,
      project: projects[0],
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
