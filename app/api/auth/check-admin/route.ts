import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    // Verificar si el usuario es administrador
    const isAdmin = session?.user?.email === "admin@edusqa.com"

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
