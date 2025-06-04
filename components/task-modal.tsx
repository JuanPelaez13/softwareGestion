"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createTask, getProjectCollaborators } from "@/lib/tasks"
import { useRouter } from "next/navigation"

type TaskModalProps = {
  projectId: number
  groupId?: number | null
  onClose: () => void
  onSuccess?: () => void
}

export function TaskModal({ projectId, groupId, onClose, onSuccess }: TaskModalProps) {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [assignedTo, setAssignedTo] = useState<number | null>(null)
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Cargar colaboradores del proyecto
  useEffect(() => {
    async function loadCollaborators() {
      try {
        console.log("Cargando colaboradores para el proyecto:", projectId)
        const result = await getProjectCollaborators(projectId)

        if (result.success) {
          console.log("Colaboradores cargados:", result.users)
          setCollaborators(result.users)
        } else {
          console.error("Error al cargar colaboradores:", result.error)
        }
      } catch (error) {
        console.error("Error al cargar colaboradores:", error)
      }
    }

    loadCollaborators()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await createTask({
        project_id: projectId,
        group_id: groupId,
        title,
        description,
        priority: priority as any,
        due_date: dueDate || undefined,
        assigned_to: assignedTo || undefined,
      })

      if (result.success) {
        setTitle("")
        setDescription("")
        setPriority("medium")
        setDueDate("")
        setAssignedTo(null)

        if (onSuccess) {
          onSuccess()
        }

        router.refresh()
        onClose()
      } else {
        setError(result.error || "Error al crear la tarea")
      }
    } catch (error) {
      console.error("Error al crear tarea:", error)
      setError("Error al crear la tarea")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nueva Tarea</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 p-2 focus:border-green-500 focus:outline-none"
              placeholder="Título de la tarea"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-green-500 focus:outline-none"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Fecha límite</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Responsable</label>
            <select
              value={assignedTo || ""}
              onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-green-500 focus:outline-none"
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

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-green-500 focus:outline-none"
              placeholder="Descripción de la tarea"
            />
          </div>

          {error && <div className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
