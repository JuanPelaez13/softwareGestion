import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="rounded-lg border bg-white p-6 shadow">
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  )
}
