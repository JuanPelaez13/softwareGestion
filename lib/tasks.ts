"use server"

import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// Tipos para tareas y grupos
export type TaskStatus = "to_do" | "in_progress" | "review" | "completed"
export type TaskPriority = "low" | "medium" | "high" | "urgent"

export type TaskGroup = {
  id: number
  project_id: number
  name: string
  color: string
  position: number
  created_at: string
  updated_at: string
  tasks?: Task[]
}

export type Task = {
  id: number
  project_id: number
  group_id: number | null
  parent_id: number | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  assigned_to: number | null
  created_by: number
  created_at: string
  updated_at: string
  subtasks?: Task[]
  assignee_name?: string
}

export type CreateTaskGroupInput = {
  project_id: number
  name: string
  color?: string
}

export type CreateTaskInput = {
  project_id: number
  group_id?: number | null
  parent_id?: number | null
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
  assigned_to?: number
}

// Función para crear un nuevo grupo de tareas
export async function createTaskGroup(data: CreateTaskGroupInput) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para crear un grupo de tareas",
      }
    }

    // Obtener la posición más alta actual para el proyecto
    const positions = (await query(`SELECT MAX(position) as maxPosition FROM task_groups WHERE project_id = ?`, [
      data.project_id,
    ])) as any[]

    const position = positions[0]?.maxPosition ? positions[0].maxPosition + 1 : 0

    const result = (await query(`INSERT INTO task_groups (project_id, name, color, position) VALUES (?, ?, ?, ?)`, [
      data.project_id,
      data.name,
      data.color || "blue",
      position,
    ])) as any

    return {
      success: true,
      groupId: result.insertId,
    }
  } catch (error) {
    console.error("Error al crear grupo de tareas:", error)
    return {
      success: false,
      error: "Error al crear el grupo de tareas",
    }
  }
}

// Función para obtener todos los grupos de tareas de un proyecto
export async function getTaskGroupsByProject(projectId: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver los grupos de tareas",
      }
    }

    // Verificar que el usuario tiene acceso al proyecto
    const projects = (await query(`SELECT * FROM projects WHERE id = ? AND owner_id = ?`, [
      projectId,
      user.id,
    ])) as any[]

    if (projects.length === 0) {
      return {
        success: false,
        error: "Proyecto no encontrado o no tienes acceso",
      }
    }

    const groups = (await query(`SELECT * FROM task_groups WHERE project_id = ? ORDER BY position ASC`, [
      projectId,
    ])) as TaskGroup[]

    // Si no hay grupos, crear uno por defecto
    if (groups.length === 0) {
      const defaultGroup = await createTaskGroup({
        project_id: projectId,
        name: "Tareas",
        color: "blue",
      })

      if (defaultGroup.success) {
        const newGroups = (await query(`SELECT * FROM task_groups WHERE id = ?`, [defaultGroup.groupId])) as TaskGroup[]
        if (newGroups.length > 0) {
          groups.push(newGroups[0])
        }
      }
    }

    // Para cada grupo, obtener sus tareas
    for (const group of groups) {
      try {
        // Obtener tareas principales (sin parent_id)
        const tasks = (await query(
          `
          SELECT t.*, u.name as assignee_name
          FROM tasks t
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE t.group_id = ? AND (t.parent_id IS NULL OR t.parent_id = 0)
          ORDER BY t.id DESC
          `,
          [group.id],
        )) as Task[]

        // Para cada tarea principal, obtener sus subtareas
        for (const task of tasks) {
          try {
            const subtasks = (await query(
              `
              SELECT t.*, u.name as assignee_name
              FROM tasks t
              LEFT JOIN users u ON t.assigned_to = u.id
              WHERE t.parent_id = ?
              ORDER BY t.id DESC
              `,
              [task.id],
            )) as Task[]

            task.subtasks = subtasks
          } catch (error) {
            console.error(`Error al obtener subtareas para la tarea ${task.id}:`, error)
            task.subtasks = []
          }
        }

        group.tasks = tasks
      } catch (error) {
        console.error(`Error al obtener tareas para el grupo ${group.id}:`, error)
        group.tasks = []
      }
    }

    return {
      success: true,
      groups,
    }
  } catch (error) {
    console.error("Error al obtener grupos de tareas:", error)
    return {
      success: false,
      error: "Error al obtener los grupos de tareas",
    }
  }
}

// Función para obtener todos los usuarios
export async function getAllUsers() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return {
        success: false,
        error: "Debes iniciar sesión para ver los usuarios",
      }
    }

    const users = (await query(`SELECT id, name, email FROM users ORDER BY name ASC`)) as any[]

    return {
      success: true,
      users,
    }
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return {
      success: false,
      error: "Error al obtener los usuarios",
    }
  }
}

// Función simplificada para crear una nueva tarea
export async function createTask(data: CreateTaskInput) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para crear una tarea",
      }
    }

    // Si no se proporciona un grupo, obtener el primer grupo del proyecto
    let groupId = data.group_id
    if (!groupId) {
      const groups = (await query(`SELECT id FROM task_groups WHERE project_id = ? ORDER BY position ASC LIMIT 1`, [
        data.project_id,
      ])) as any[]

      if (groups.length > 0) {
        groupId = groups[0].id
      } else {
        // Crear un grupo por defecto si no existe ninguno
        const defaultGroup = await createTaskGroup({
          project_id: data.project_id,
          name: "Tareas",
          color: "blue",
        })

        if (defaultGroup.success) {
          groupId = defaultGroup.groupId
        }
      }
    }

    // Versión simplificada de la consulta sin usar start_date
    const result = (await query(
      `INSERT INTO tasks 
       (project_id, group_id, parent_id, title, description, status, priority, due_date, assigned_to, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        groupId,
        data.parent_id || null,
        data.title,
        data.description || null,
        data.status || "to_do",
        data.priority || "medium",
        data.due_date || null,
        data.assigned_to || null,
        user.id,
      ],
    )) as any

    return {
      success: true,
      taskId: result.insertId,
    }
  } catch (error) {
    console.error("Error al crear tarea:", error)
    return {
      success: false,
      error: "Error al crear la tarea: " + (error as Error).message,
    }
  }
}

// Función para actualizar una tarea
export async function updateTask(taskId: number, data: Partial<CreateTaskInput>) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para actualizar una tarea",
      }
    }

    // Verificar que la tarea existe y pertenece a un proyecto del usuario
    const tasks = (await query(
      `
      SELECT t.* FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.owner_id = ?
    `,
      [taskId, user.id],
    )) as any[]

    if (tasks.length === 0) {
      return {
        success: false,
        error: "Tarea no encontrada o no tienes acceso",
      }
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

    // Añadir el ID de la tarea al final de los valores
    values.push(taskId)

    await query(`UPDATE tasks SET ${updateFields.join(", ")} WHERE id = ?`, values)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error al actualizar tarea:", error)
    return {
      success: false,
      error: "Error al actualizar la tarea",
    }
  }
}

// Función para eliminar una tarea
export async function deleteTask(taskId: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para eliminar una tarea",
      }
    }

    // Verificar que la tarea existe y pertenece a un proyecto del usuario
    const tasks = (await query(
      `
      SELECT t.* FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.owner_id = ?
    `,
      [taskId, user.id],
    )) as any[]

    if (tasks.length === 0) {
      return {
        success: false,
        error: "Tarea no encontrada o no tienes acceso",
      }
    }

    await query(`DELETE FROM tasks WHERE id = ?`, [taskId])

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error al eliminar tarea:", error)
    return {
      success: false,
      error: "Error al eliminar la tarea",
    }
  }
}

// Función para actualizar el estado de una tarea
export async function updateTaskStatus(taskId: number, status: TaskStatus) {
  return updateTask(taskId, { status })
}

// Función para mover una tarea a otro grupo
export async function moveTaskToGroup(taskId: number, groupId: number | null) {
  return updateTask(taskId, { group_id: groupId })
}

// Función para crear una subtarea
export async function createSubtask(parentTaskId: number, data: Omit<CreateTaskInput, "parent_id">) {
  try {
    // Obtener la tarea padre para verificar que existe y obtener su proyecto_id
    const parentTasks = (await query(`SELECT * FROM tasks WHERE id = ?`, [parentTaskId])) as Task[]

    if (parentTasks.length === 0) {
      return {
        success: false,
        error: "Tarea padre no encontrada",
      }
    }

    const parentTask = parentTasks[0]

    // Crear la subtarea con el parent_id establecido
    return createTask({
      ...data,
      project_id: parentTask.project_id,
      group_id: parentTask.group_id,
      parent_id: parentTaskId,
    })
  } catch (error) {
    console.error("Error al crear subtarea:", error)
    return {
      success: false,
      error: "Error al crear la subtarea",
    }
  }
}
