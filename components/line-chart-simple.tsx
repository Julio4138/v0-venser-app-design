"use client"

interface LineChartSimpleProps {
  data: number[]
  color: string
  label: string
  labels?: string[]
  showLabels?: boolean
}

export function LineChartSimple({ data, color, label, labels, showLabels = false }: LineChartSimpleProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Sem dados disponíveis
      </div>
    )
  }

  // Filter out zero values for better visualization, but keep them for spacing
  const validData = data.filter(v => v > 0)
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Sem dados disponíveis
      </div>
    )
  }

  const max = Math.max(...data)
  const min = Math.min(...data, 0) // Allow negative values but default to 0
  const range = max - min || 1
  const padding = 10 // Padding para não colar nas bordas
  const chartHeight = showLabels ? 85 : 100
  const labelY = showLabels ? 95 : 100
  const chartAreaHeight = chartHeight - 2 * padding

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (100 - 2 * padding)
      const y = padding + chartAreaHeight - ((value - min) / range) * chartAreaHeight
      return `${x},${y}`
    })
    .join(" ")

  // Criar um ID único baseado na cor para evitar conflitos
  const gradientId = `gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}-${label.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div className="w-full h-full">
      {label && <p className="text-sm font-medium mb-2">{label}</p>}
      <div className="relative w-full h-full">
        <svg width="100%" height="100%" viewBox={`0 0 100 ${showLabels ? 100 : 100}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="50%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          <line x1={padding} y1={chartHeight - padding} x2={100 - padding} y2={chartHeight - padding} stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          {/* Area fill */}
          <polyline 
            points={`${padding},${chartHeight - padding} ${points} ${100 - padding},${chartHeight - padding}`} 
            fill={`url(#${gradientId})`} 
          />
          {/* Main line */}
          <polyline 
            points={points} 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-sm"
          />
          {/* Data points */}
          {data.map((value, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * (100 - 2 * padding)
            const y = padding + (chartHeight - 2 * padding) - ((value - min) / range) * (chartHeight - 2 * padding)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
                stroke="white"
                strokeWidth="0.5"
                className="drop-shadow-sm"
              />
            )
          })}
          {/* Date labels */}
          {showLabels && labels && labels.length > 0 && data.map((_, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * (100 - 2 * padding)
            const labelText = labels[index]?.split(' ')[0] || ''
            return (
              <text
                key={index}
                x={x}
                y={labelY}
                textAnchor="middle"
                fontSize="2.2"
                fill="currentColor"
                opacity="0.7"
                className="text-[10px]"
              >
                {labelText}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
