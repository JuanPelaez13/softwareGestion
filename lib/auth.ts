import { cookies } from "next/headers"
import { query } from "@/lib/db"

// Tipo para el usuario en sesión
type SessionUser = {
  id: number
  name: string
  email: string
  isAdmin?: boolean
}

// Tipo para la sesión
type Session = {
  user: SessionUser
}

// Función para obtener la sesión actual
export async function getSession(): Promise<Session | null> {
  // Usar await con cookies() antes de llamar a .get()
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session

    // Verificar si el usuario es administrador
    if (session.user.email === "admin@edusqa.com") {
      session.user.isAdmin = true
    }

    return session
  } catch {
    return null
  }
}

// Función para obtener el usuario actual
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session?.user || null
}

// Función para verificar si existe el usuario administrador y crearlo si no existe
export async function ensureAdminUser() {
  try {
    // Verificar si el usuario admin ya existe
    const adminUsers = (await query("SELECT * FROM users WHERE email = ?", ["admin@edusqa.com"])) as any[]

    if (adminUsers.length === 0) {
      // Crear usuario admin si no existe
      await query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        ["Administrador", "admin@edusqa.com", "$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC"], // password: admin
      )
      console.log("Usuario administrador creado")
    }
  } catch (error) {
    console.error("Error al verificar/crear usuario admin:", error)
  }
}
