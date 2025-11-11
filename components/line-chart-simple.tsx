"use client"

interface LineChartSimpleProps {
  data: number[]
  color: string
  label: string
}

export function LineChartSimple({ data, color, label }: LineChartSimpleProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 80
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <svg width="100%" height="120" viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill={`url(#gradient-${label})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}
