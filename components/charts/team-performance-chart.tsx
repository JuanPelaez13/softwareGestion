"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type TeamPerformanceChartProps = {
  data: { name: string; tareas: number; horas: number }[]
}

export function TeamPerformanceChart({ data }: TeamPerformanceChartProps) {
  // Si no hay datos, mostrar un mensaje
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
        <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="tareas" fill="#3B82F6" name="Tareas Completadas" />
        <Bar yAxisId="right" dataKey="horas" fill="#F59E0B" name="Horas Trabajadas" />
      </BarChart>
    </ResponsiveContainer>
  )
}
