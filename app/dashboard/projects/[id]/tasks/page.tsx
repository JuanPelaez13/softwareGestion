"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getProjectById } from "@/lib/projects"
import {
  getTaskGroupsByProject,
  createTask,
  updateTaskStatus,
  deleteTask,
  updateTask,
  getAllUsers,
  createSubtask,
} from "@/lib/tasks"
import type { TaskStatus, Task } from "@/lib/tasks"
import { ArrowLeft, Plus, Calendar, X, AlertTriangle, Users, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

const statusColors: Record<TaskStatus, string> = {
  to_do: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
}

const statusLabels: Record<TaskStatus, string> = {
  to_do: "Por hacer",
  in_progress: "En progreso",
  review: "En revisión",
  completed: "Completado",
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100",
  medium: "bg-blue-100",
  high: "bg-orange-100",
  urgent: "bg-red-100",
}

const priorityLabels: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
}

const groupColors: Record<string, string> = {
  blue: "border-l-4 border-blue-500",
  green: "border-l-4 border-green-500",
  yellow: "border-l-4 border-yellow-500",
  red: "border-l-4 border-red-500",
  purple: "border-l-4 border-purple-500",
  pink: "border-l-4 border-pink-500",
  indigo: "border-l-4 border-indigo-500",
  teal: "border-l-4 border-teal-500",
}

export default function ProjectTasksPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<number | null>(null)

  const [project, setProject] = useState<any>(null)
  const [columns, setColumns] = useState<Record<string, any>>({
    to_do: {
      id: "to_do",
      title: "Por hacer",
      tasks: [],
    },
    in_progress: {
      id: "in_progress",
      title: "En progreso",
      tasks: [],
    },
    review: {
      id: "review",
      title: "En revisión",
      tasks: [],
    },
    completed: {
      id: "completed",
      title: "Completado",
      tasks: [],
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
  })
  const [fixingDatabase, setFixingDatabase] = useState(false)
  const [needsRecreate, setNeedsRecreate] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [showSubtaskForm, setShowSubtaskForm] = useState<number | null>(null)
  const [newSubtaskData, setNewSubtaskData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
  })
  const [showSubtasks, setShowSubtasks] = useState(true)
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({})

  // Extraer el ID del proyecto de manera segura
  useEffect(() => {
    if (params && params.id) {
      const id = Number.parseInt(params.id, 10)
      if (!isNaN(id)) {
        setProjectId(id)
      } else {
        router.push("/dashboard/projects")
      }
    }
  }, [params, router])

  // Cargar usuarios
  useEffect(() => {
    async function loadUsers() {
      try {
        const result = await getAllUsers()
        if (result.success) {
          setUsers(result.users)
        }
      } catch (error) {
        console.error("Error loading users:", error)
      }
    }

    loadUsers()
  }, [])

  // Función para corregir la base de datos
  const fixDatabase = async (recreate = false) => {
    setFixingDatabase(true)
    try {
      const url = recreate ? "/api/fix-database?recreate=true" : "/api/fix-database"
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        // Recargar la página después de corregir la base de datos
        window.location.reload()
      } else {
        setError(data.error || "Error al corregir la base de datos")
        setFixingDatabase(false)
      }
    } catch (error) {
      console.error("Error al corregir la base de datos:", error)
      setError("Error al corregir la base de datos")
      setFixingDatabase(false)
    }
  }

  // Cargar el proyecto y las tareas
  useEffect(() => {
    if (!projectId) return

    async function loadProjectAndTasks() {
      try {
        const projectResult = await getProjectById(projectId)

        if (!projectResult.success) {
          router.push("/dashboard/projects")
          return
        }

        setProject(projectResult.project)

        const groupsResult = await getTaskGroupsByProject(projectId)

        if (groupsResult.success) {
          // Organizar tareas por estado
          const newColumns = {
            to_do: {
              id: "to_do",
              title: "Por hacer",
              tasks: [],
            },
            in_progress: {
              id: "in_progress",
              title: "En progreso",
              tasks: [],
            },
            review: {
              id: "review",
              title: "En revisión",
              tasks: [],
            },
            completed: {
              id: "completed",
              title: "Completado",
              tasks: [],
            },
          }

          // Aplanar todas las tareas de todos los grupos
          const allTasks: Task[] = []
          groupsResult.groups.forEach((group) => {
            if (group.tasks) {
              group.tasks.forEach((task) => {
                // Añadir el nombre del grupo a la tarea
                const taskWithGroup = {
                  ...task,
                  groupName: group.name,
                  groupColor: group.color,
                  hasSubtasks: task.subtasks && task.subtasks.length > 0,
                }
                allTasks.push(taskWithGroup)

                // También añadir subtareas si existen
                if (task.subtasks) {
                  task.subtasks.forEach((subtask) => {
                    const subtaskWithGroup = {
                      ...subtask,
                      groupName: group.name,
                      groupColor: group.color,
                      isSubtask: true,
                      parentTitle: task.title,
                      parentId: task.id,
                    }
                    allTasks.push(subtaskWithGroup)
                  })
                }
              })
            }
          })

          // Distribuir tareas en columnas según su estado
          allTasks.forEach((task) => {
            if (newColumns[task.status]) {
              newColumns[task.status].tasks.push(task)
            }
          })

          setColumns(newColumns)
        } else {
          setError(groupsResult.error || "Error al cargar las tareas")

          // Verificar si el error sugiere que necesitamos recrear las tablas
          if (
            groupsResult.error &&
            (groupsResult.error.includes("Unknown column") || groupsResult.error.includes("doesn't exist"))
          ) {
            setNeedsRecreate(true)
          }
        }
      } catch (error) {
        console.error("Error loading project and tasks:", error)
        setError("Error al cargar el proyecto y las tareas")
        setNeedsRecreate(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectAndTasks()
  }, [projectId, router])

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    // Si no hay destino o el destino es el mismo que el origen, no hacer nada
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    // Obtener la tarea que se está moviendo
    const taskId = Number.parseInt(draggableId.replace("task-", ""), 10)
    const newStatus = destination.droppableId as TaskStatus

    try {
      // Actualizar el estado de la tarea en la base de datos
      const result = await updateTaskStatus(taskId, newStatus)

      if (result.success) {
        // Actualizar el estado local
        const sourceColumn = columns[source.droppableId]
        const destColumn = columns[destination.droppableId]

        // Crear copias de los arrays de tareas
        const sourceTasks = [...sourceColumn.tasks]
        const destTasks = [...destColumn.tasks]

        // Eliminar la tarea del origen
        const [movedTask] = sourceTasks.splice(source.index, 1)

        // Actualizar el estado de la tarea
        movedTask.status = newStatus

        // Insertar la tarea en el destino
        destTasks.splice(destination.index, 0, movedTask)

        // Actualizar el estado
        setColumns({
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            tasks: sourceTasks,
          },
          [destination.droppableId]: {
            ...destColumn,
            tasks: destTasks,
          },
        })
      } else {
        setError(result.error || "Error al actualizar el estado de la tarea")
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      setError("Error al actualizar el estado de la tarea")
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskData.title.trim()) {
      setError("El título de la tarea es obligatorio")
      return
    }

    try {
      const result = await createTask({
        project_id: projectId!,
        title: newTaskData.title,
        description: newTaskData.description,
        priority: newTaskData.priority as any,
        due_date: newTaskData.due_date || undefined,
        assigned_to: newTaskData.assigned_to ? Number.parseInt(newTaskData.assigned_to) : undefined,
        status: "to_do",
      })

      if (result.success) {
        // Recargar las tareas
        if (projectId) {
          const groupsResult = await getTaskGroupsByProject(projectId)
          if (groupsResult.success) {
            // Reinicializar columnas
            const newColumns = {
              to_do: { ...columns.to_do, tasks: [] },
              in_progress: { ...columns.in_progress, tasks: [] },
              review: { ...columns.review, tasks: [] },
              completed: { ...columns.completed, tasks: [] },
            }

            // Aplanar todas las tareas de todos los grupos
            const allTasks: Task[] = []
            groupsResult.groups.forEach((group) => {
              if (group.tasks) {
                group.tasks.forEach((task) => {
                  const taskWithGroup = {
                    ...task,
                    groupName: group.name,
                    groupColor: group.color,
                    hasSubtasks: task.subtasks && task.subtasks.length > 0,
                  }
                  allTasks.push(taskWithGroup)

                  if (task.subtasks) {
                    task.subtasks.forEach((subtask) => {
                      const subtaskWithGroup = {
                        ...subtask,
                        groupName: group.name,
                        groupColor: group.color,
                        isSubtask: true,
                        parentTitle: task.title,
                        parentId: task.id,
                      }
                      allTasks.push(subtaskWithGroup)
                    })
                  }
                })
              }
            })

            // Distribuir tareas en columnas según su estado
            allTasks.forEach((task) => {
              if (newColumns[task.status]) {
                newColumns[task.status].tasks.push(task)
              }
            })

            setColumns(newColumns)
          }
        }

        // Limpiar el formulario
        setNewTaskData({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
          assigned_to: "",
        })
        setShowNewTaskForm(false)
        setError("")
      } else {
        setError(result.error || "Error al crear la tarea")

        // Verificar si el error sugiere que necesitamos recrear las tablas
        if (result.error && (result.error.includes("Unknown column") || result.error.includes("doesn't exist"))) {
          setNeedsRecreate(true)
        }
      }
    } catch (error) {
      console.error("Error creating task:", error)
      setError("Error al crear la tarea")
      setNeedsRecreate(true)
    }
  }

  const handleCreateSubtask = async (parentTaskId: number) => {
    if (!newSubtaskData.title.trim()) {
      setError("El título de la subtarea es obligatorio")
      return
    }

    try {
      const result = await createSubtask(parentTaskId, {
        project_id: projectId!,
        title: newSubtaskData.title,
        description: newSubtaskData.description,
        priority: newSubtaskData.priority as any,
        due_date: newSubtaskData.due_date || undefined,
        assigned_to: newSubtaskData.assigned_to ? Number.parseInt(newSubtaskData.assigned_to) : undefined,
        status: "to_do",
      })

      if (result.success) {
        // Recargar las tareas
        if (projectId) {
          const groupsResult = await getTaskGroupsByProject(projectId)
          if (groupsResult.success) {
            // Reinicializar columnas
            const newColumns = {
              to_do: { ...columns.to_do, tasks: [] },
              in_progress: { ...columns.in_progress, tasks: [] },
              review: { ...columns.review, tasks: [] },
              completed: { ...columns.completed, tasks: [] },
            }

            // Aplanar todas las tareas de todos los grupos
            const allTasks: Task[] = []
            groupsResult.groups.forEach((group) => {
              if (group.tasks) {
                group.tasks.forEach((task) => {
                  const taskWithGroup = {
                    ...task,
                    groupName: group.name,
                    groupColor: group.color,
                    hasSubtasks: task.subtasks && task.subtasks.length > 0,
                  }
                  allTasks.push(taskWithGroup)

                  if (task.subtasks) {
                    task.subtasks.forEach((subtask) => {
                      const subtaskWithGroup = {
                        ...subtask,
                        groupName: group.name,
                        groupColor: group.color,
                        isSubtask: true,
                        parentTitle: task.title,
                        parentId: task.id,
                      }
                      allTasks.push(subtaskWithGroup)
                    })
                  }
                })
              }
            })

            // Distribuir tareas en columnas según su estado
            allTasks.forEach((task) => {
              if (newColumns[task.status]) {
                newColumns[task.status].tasks.push(task)
              }
            })

            setColumns(newColumns)
          }
        }

        // Limpiar el formulario
        setNewSubtaskData({
          title: "",
          description: "",
          priority: "medium",
          due_date: "",
          assigned_to: "",
        })
        setShowSubtaskForm(null)
        setError("")
      } else {
        setError(result.error || "Error al crear la subtarea")
      }
    } catch (error) {
      console.error("Error creating subtask:", error)
      setError("Error al crear la subtarea")
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const result = await deleteTask(taskId)

      if (result.success) {
        // Actualizar el estado local
        const newColumns = { ...columns }

        // Buscar y eliminar la tarea de la columna correspondiente
        Object.keys(newColumns).forEach((columnId) => {
          newColumns[columnId].tasks = newColumns[columnId].tasks.filter((task: Task) => task.id !== taskId)
        })

        setColumns(newColumns)
      } else {
        setError(result.error || "Error al eliminar la tarea")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      setError("Error al eliminar la tarea")
    }
  }

  const handleUpdateTaskPriority = async (taskId: number, priority: string) => {
    try {
      const result = await updateTask(taskId, { priority: priority as any })

      if (result.success) {
        // Actualizar el estado local
        const newColumns = { ...columns }

        // Buscar y actualizar la tarea en la columna correspondiente
        Object.keys(newColumns).forEach((columnId) => {
          newColumns[columnId].tasks = newColumns[columnId].tasks.map((task: Task) => {
            if (task.id === taskId) {
              return { ...task, priority }
            }
            return task
          })
        })

        setColumns(newColumns)
      } else {
        setError(result.error || "Error al actualizar la prioridad de la tarea")
      }
    } catch (error) {
      console.error("Error updating task priority:", error)
      setError("Error al actualizar la prioridad de la tarea")
    }
  }

  const handleUpdateTaskAssignee = async (taskId: number, assignedTo: string) => {
    try {
      const result = await updateTask(taskId, { assigned_to: assignedTo ? Number.parseInt(assignedTo) : null })

      if (result.success) {
        // Actualizar el estado local
        const newColumns = { ...columns }

        // Buscar y actualizar la tarea en la columna correspondiente
        Object.keys(newColumns).forEach((columnId) => {
          newColumns[columnId].tasks = newColumns[columnId].tasks.map((task: Task) => {
            if (task.id === taskId) {
              // Encontrar el nombre del usuario asignado
              const assignedUser = users.find((user) => user.id === Number.parseInt(assignedTo))
              return {
                ...task,
                assigned_to: assignedTo ? Number.parseInt(assignedTo) : null,
                assignee_name: assignedUser ? assignedUser.name : null,
              }
            }
            return task
          })
        })

        setColumns(newColumns)
      } else {
        setError(result.error || "Error al actualizar el responsable de la tarea")
      }
    } catch (error) {
      console.error("Error updating task assignee:", error)
      setError("Error al actualizar el responsable de la tarea")
    }
  }

  const toggleExpandTask = (taskId: number) => {
    setExpandedTasks((prev) => {
      const newState = { ...prev }
      newState[taskId] = !prev[taskId]
      return newState
    })
  }

  // Filtrar tareas para mostrar u ocultar subtareas
  const getFilteredTasks = (tasks: any[]) => {
    if (!showSubtasks) {
      return tasks.filter((task) => !task.isSubtask)
    } else {
      return tasks.filter((task) => {
        // Si no es subtarea, siempre mostrarla
        if (!task.isSubtask) return true

        // Si es subtarea, mostrarla solo si su tarea padre está expandida
        return expandedTasks[task.parentId] === true
      })
    }
  }

  // Contar tareas principales (sin contar subtareas)
  const countMainTasks = (columnId: string) => {
    return columns[columnId].tasks.filter((task: any) => !task.isSubtask).length
  }

  // Asegurarse de que cuando se carga la página, todas las tareas estén colapsadas
  useEffect(() => {
    if (projectId) {
      // Inicializar todas las tareas como colapsadas
      const initialExpandedState: Record<number, boolean> = {}
      Object.values(columns).forEach((column) => {
        column.tasks.forEach((task: any) => {
          if (!task.isSubtask && task.hasSubtasks) {
            initialExpandedState[task.id] = false
          }
        })
      })
      setExpandedTasks(initialExpandedState)
    }
  }, [columns, projectId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/projects/${projectId}`} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {project?.name} <span className="text-lg font-normal text-gray-500">/ Tareas</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showSubtasks ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar subtareas
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Mostrar subtareas
              </>
            )}
          </button>
          <button
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              <div>{error}</div>
            </div>
            <div className="flex space-x-2">
              {needsRecreate ? (
                <button
                  onClick={() => fixDatabase(true)}
                  disabled={fixingDatabase}
                  className="ml-4 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {fixingDatabase ? "Recreando tablas..." : "Recrear tablas"}
                </button>
              ) : (
                <button
                  onClick={() => fixDatabase(false)}
                  disabled={fixingDatabase}
                  className="ml-4 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {fixingDatabase ? "Corrigiendo..." : "Corregir Base de Datos"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewTaskForm && (
        <div className="mb-6 rounded-md border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Nueva Tarea</h2>
            <button
              onClick={() => setShowNewTaskForm(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                id="title"
                type="text"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Título de la tarea"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Prioridad
                </label>
                <select
                  id="priority"
                  value={newTaskData.priority}
                  onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Fecha límite
                </label>
                <input
                  id="due_date"
                  type="date"
                  value={newTaskData.due_date}
                  onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                  Responsable
                </label>
                <select
                  id="assigned_to"
                  value={newTaskData.assigned_to}
                  onChange={(e) => setNewTaskData({ ...newTaskData, assigned_to: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                >
                  <option value="">Sin asignar</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Descripción de la tarea"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowNewTaskForm(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateTask}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Crear Tarea
            </button>
          </div>
        </div>
      )}

      <div className="flex h-full overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4">
            {Object.values(columns).map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-medium text-gray-800">
                    {column.title}{" "}
                    <span className="ml-1 text-sm font-normal text-gray-500">({countMainTasks(column.id)})</span>
                  </h2>
                  {column.id === "to_do" && (
                    <button
                      onClick={() => setShowNewTaskForm(true)}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[200px] rounded-md bg-gray-50 p-2"
                    >
                      {getFilteredTasks(column.tasks).map((task: any, index: number) => (
                        <Draggable key={`task-${task.id}`} draggableId={`task-${task.id}`} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 rounded-md border ${
                                task.isSubtask ? "ml-4 border-dashed" : ""
                              } bg-white p-3 shadow-sm`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className={`h-2 w-16 rounded-full ${priorityColors[task.priority]}`}></div>
                                <div className="flex items-center space-x-1">
                                  <select
                                    value={task.priority}
                                    onChange={(e) => handleUpdateTaskPriority(task.id, e.target.value)}
                                    className="text-xs border-none bg-transparent"
                                  >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente</option>
                                  </select>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <h3 className="font-medium text-gray-800">{task.title}</h3>
                              {task.description && (
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.description}</p>
                              )}

                              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                  <span
                                    className={`mr-2 inline-block h-2 w-2 rounded-full ${
                                      task.groupColor === "blue"
                                        ? "bg-blue-500"
                                        : task.groupColor === "green"
                                          ? "bg-green-500"
                                          : task.groupColor === "yellow"
                                            ? "bg-yellow-500"
                                            : task.groupColor === "red"
                                              ? "bg-red-500"
                                              : task.groupColor === "purple"
                                                ? "bg-purple-500"
                                                : "bg-gray-500"
                                    }`}
                                  ></span>
                                  {task.groupName}
                                </div>
                                {task.due_date && (
                                  <div className="flex items-center">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center">
                                  <Users className="mr-1 h-3 w-3 text-gray-400" />
                                  <select
                                    value={task.assigned_to || ""}
                                    onChange={(e) => handleUpdateTaskAssignee(task.id, e.target.value)}
                                    className="text-xs border-none bg-transparent text-gray-600"
                                  >
                                    <option value="">Sin asignar</option>
                                    {users.map((user) => (
                                      <option key={user.id} value={user.id}>
                                        {user.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {!task.isSubtask && (
                                  <div className="flex items-center space-x-2">
                                    {task.hasSubtasks && (
                                      <button
                                        onClick={() => toggleExpandTask(task.id)}
                                        className="flex items-center text-xs text-gray-500 hover:text-green-600"
                                      >
                                        {expandedTasks[task.id] ? (
                                          <>
                                            <ChevronUp className="mr-1 h-3 w-3" />
                                            Ocultar
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="mr-1 h-3 w-3" />
                                            Expandir
                                          </>
                                        )}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setShowSubtaskForm(showSubtaskForm === task.id ? null : task.id)}
                                      className="flex items-center text-xs text-gray-500 hover:text-green-600"
                                    >
                                      {showSubtaskForm === task.id ? (
                                        <>
                                          <ChevronUp className="mr-1 h-3 w-3" />
                                          Ocultar
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="mr-1 h-3 w-3" />
                                          Subtarea
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {showSubtaskForm === task.id && (
                                <div className="mt-3 border-t pt-3">
                                  <div className="space-y-3">
                                    <div>
                                      <input
                                        type="text"
                                        value={newSubtaskData.title}
                                        onChange={(e) =>
                                          setNewSubtaskData({ ...newSubtaskData, title: e.target.value })
                                        }
                                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                                        placeholder="Título de la subtarea"
                                      />
                                    </div>
                                    <div className="flex space-x-2">
                                      <select
                                        value={newSubtaskData.priority}
                                        onChange={(e) =>
                                          setNewSubtaskData({ ...newSubtaskData, priority: e.target.value })
                                        }
                                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                                      >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                      </select>
                                      <select
                                        value={newSubtaskData.assigned_to}
                                        onChange={(e) =>
                                          setNewSubtaskData({ ...newSubtaskData, assigned_to: e.target.value })
                                        }
                                        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                                      >
                                        <option value="">Sin asignar</option>
                                        {users.map((user) => (
                                          <option key={user.id} value={user.id}>
                                            {user.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => handleCreateSubtask(task.id)}
                                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                      >
                                        Añadir
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {getFilteredTasks(column.tasks).length === 0 && (
                        <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-4">
                          <p className="text-center text-sm text-gray-500">
                            {column.id === "to_do" ? (
                              <button
                                onClick={() => setShowNewTaskForm(true)}
                                className="text-green-600 hover:text-green-700"
                              >
                                + Añadir tarea
                              </button>
                            ) : (
                              "Arrastra tareas aquí"
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
