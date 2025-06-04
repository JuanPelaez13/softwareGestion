"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getProjectById } from "@/lib/projects"
import { getTaskGroupsByProject, createTask, getProjectCollaborators } from "@/lib/tasks"
import { ArrowLeft } from "lucide-react"
import { use } from "react"

export default function NewTaskPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const unwrappedParams = use(params)
  const projectId = Number.parseInt(unwrappedParams.id)

  const [project, setProject] = useState<any>(null)
  const [taskGroups, setTaskGroups] = useState<any[]>([])
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [groupId, setGroupId] = useState<number | null>(null)
  const [status, setStatus] = useState("to_do")
  const [priority, setPriority] = useState("medium")
  const [startDate, setStartDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState<number | null>(null)

  useEffect(() => {
    if (isNaN(projectId)) {
      router.push("/dashboard/projects")
      return
    }

    async function loadProjectAndGroups() {
      try {
        const projectResult = await getProjectById(projectId)

        if (!projectResult.success) {
          router.push("/dashboard/projects")
          return
        }

        setProject(projectResult.project)

        const groupsResult = await getTaskGroupsByProject(projectId)

        if (groupsResult.success) {
          setTaskGroups(groupsResult.groups)
          // Set default group if available
          if (groupsResult.groups.length > 0) {
            setGroupId(groupsResult.groups[0].id)
          }
        } else {
          setError(groupsResult.error || "Error al cargar los grupos de tareas")
        }

        // Cargar colaboradores del proyecto
        const collaboratorsResult = await getProjectCollaborators(projectId)
        console.log("Resultado de colaboradores:", collaboratorsResult)

        if (collaboratorsResult.success) {
          setCollaborators(collaboratorsResult.users)
          console.log("Colaboradores establecidos:", collaboratorsResult.users)
        } else {
          console.error("Error al cargar colaboradores:", collaboratorsResult.error)
          setError(collaboratorsResult.error || "Error al cargar los colaboradores")
        }
      } catch (error) {
        console.error("Error loading project and groups:", error)
        setError("Error al cargar el proyecto y los grupos de tareas")
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectAndGroups()
  }, [projectId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const result = await createTask({
        project_id: projectId,
        group_id: groupId,
        title,
        description,
        status: status as any,
        priority: priority as any,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
        assigned_to: assignedTo || undefined,
      })

      if (result.success) {
        router.push(`/dashboard/projects/${projectId}/tasks`)
      } else {
        setError(result.error || "Error al crear la tarea")
        setIsSaving(false)
      }
    } catch (error) {
      console.error("Error creating task:", error)
      setError("Error al crear la tarea")
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }

  console.log("Renderizando con colaboradores:", collaborators)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/projects/${projectId}/tasks`} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Nueva Tarea</h1>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Título de la tarea"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Descripción detallada de la tarea"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-700">
                Grupo
              </label>
              <select
                id="group"
                value={groupId || ""}
                onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                {taskGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                <option value="to_do">Por hacer</option>
                <option value="in_progress">En progreso</option>
                <option value="review">En revisión</option>
                <option value="completed">Completada</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Prioridad
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                Asignado a
              </label>
              <select
                id="assigned_to"
                value={assignedTo || ""}
                onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              >
                <option value="">Sin asignar</option>
                {collaborators && collaborators.length > 0 ? (
                  collaborators.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.role === "owner" ? "(Propietario)" : ""}
                    </option>
                  ))
                ) : (
                  <option disabled>No hay colaboradores disponibles</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                Fecha de vencimiento
              </label>
              <input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              />
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end space-x-3">
            <Link
              href={`/dashboard/projects/${projectId}/tasks`}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
