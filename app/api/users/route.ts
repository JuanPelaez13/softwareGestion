import { NextResponse } from "next/server"
import { getAllUsers } from "@/lib/tasks"

export async function GET() {
  try {
    const result = await getAllUsers()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ success: false, error: "Error al obtener usuarios" }, { status: 500 })
  }
}
