"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getProjectById } from "@/lib/projects"
import { getTaskGroupsByProject, createTask } from "@/lib/tasks"
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
              Descripción\
