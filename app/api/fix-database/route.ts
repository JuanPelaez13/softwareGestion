import { NextResponse } from "next/server"
import { fixDatabaseSchema, recreateTaskTables } from "@/lib/db-fix"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const recreate = url.searchParams.get("recreate") === "true"

    let result
    if (recreate) {
      result = await recreateTaskTables()
    } else {
      result = await fixDatabaseSchema()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al corregir la base de datos:", error)
    return NextResponse.json({ success: false, error: "Error al corregir la base de datos" }, { status: 500 })
  }
}
