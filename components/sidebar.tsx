"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Shield,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Verificar si el usuario es administrador
    const checkAdmin = async () => {
      try {
        // Intentar obtener la sesión del localStorage
        const sessionStr = localStorage.getItem("session")
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr)
            if (session && session.user && session.user.email === "admin@edusqa.com") {
              setIsAdmin(true)
              return
            }
          } catch (e) {
            console.error("Error parsing session from localStorage:", e)
          }
        }

        // Si no hay sesión en localStorage o no es admin, verificar con el servidor
        // Nota: Comentamos esta parte para evitar el error de parsing JSON
        /*
        const response = await fetch("/api/auth/check-admin")
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        }
        */
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }

    checkAdmin()
  }, [])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const menuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      title: "Proyectos",
      icon: <FolderKanban className="h-5 w-5" />,
      href: "/dashboard/projects",
    },
    {
      title: "Tareas",
      icon: <CheckSquare className="h-5 w-5" />,
      href: "/dashboard/tasks",
    },
    {
      title: "Informes",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/dashboard/reports",
    },
    {
      title: "Equipo",
      icon: <Users className="h-5 w-5" />,
      href: "/dashboard/team",
    },
    {
      title: "Configuración",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/settings",
    },
  ]

  // Agregar elementos de menú solo para administradores
  if (isAdmin) {
    menuItems.push({
      title: "Admin",
      icon: <Shield className="h-5 w-5 text-green-600" />,
      href: "/dashboard/admin",
    })
  }

  return (
    <div className="relative flex h-screen">
      <div className={`bg-white border-r transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
        <div className="flex h-16 items-center justify-center border-b">
          {collapsed ? (
            <Image src="/edusqa-logo.png" alt="EDU SQA Logo" width={40} height={40} className="rounded-md" />
          ) : (
            <div className="flex flex-col items-center">
              <Image src="/edusqa-logo.png" alt="EDU SQA Logo" width={120} height={50} />
              {isAdmin && (
                <span className="mt-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Administrador
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-4">
          <Link
            href="/dashboard/projects/new"
            className={`flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 ${
              collapsed ? "px-2" : ""
            }`}
          >
            <PlusCircle className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Nuevo Proyecto</span>}
          </Link>
        </div>

        <nav className="mt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                    pathname === item.href ? "bg-gray-100 text-green-600 font-medium" : ""
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  )
}
