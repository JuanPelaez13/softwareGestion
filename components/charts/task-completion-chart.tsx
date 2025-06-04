"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type TaskCompletionChartProps = {
  data: { name: string; completadas: number; pendientes: number }[]
}

export function TaskCompletionChart({ data }: TaskCompletionChartProps) {
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
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="completadas" stackId="a" fill="#10B981" />
        <Bar dataKey="pendientes" stackId="a" fill="#F59E0B" />
      </BarChart>
    </ResponsiveContainer>
  )
}
