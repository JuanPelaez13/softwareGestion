import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { LogOut } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <h2 className="text-sm font-medium text-gray-600">
              Hola, <span className="font-semibold text-gray-800">{session.user.name}</span>
            </h2>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center text-sm font-medium text-gray-600 hover:text-green-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>
        <div className="container mx-auto p-6">{children}</div>
      </div>
    </div>
  )
}
