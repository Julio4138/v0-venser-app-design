"use client"

import { useEffect, useState } from "react"

interface TreeOfLifeProps {
  days: number
}

export function TreeOfLife({ days }: TreeOfLifeProps) {
  const [growth, setGrowth] = useState(0)

  useEffect(() => {
    setGrowth(Math.min((days / 90) * 100, 100))
  }, [days])

  const treeHeight = 120 + (growth / 100) * 80
  const leafCount = Math.floor((growth / 100) * 12)

  return (
    <div className="relative w-full h-64 flex items-end justify-center overflow-hidden">
      <svg
        width="200"
        height={treeHeight}
        viewBox="0 0 200 200"
        className="transition-all duration-1000 ease-out"
        style={{ height: `${treeHeight}px` }}
      >
        <defs>
          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.45 0.1 60)" />
            <stop offset="100%" stopColor="oklch(0.35 0.08 50)" />
          </linearGradient>
          <radialGradient id="leafGradient">
            <stop offset="0%" stopColor="oklch(0.65 0.18 150)" />
            <stop offset="100%" stopColor="oklch(0.55 0.15 140)" />
          </radialGradient>
        </defs>

        {/* Tree trunk */}
        <path
          d="M 85 200 Q 90 150 95 120 Q 97 100 100 80 Q 103 100 105 120 Q 110 150 115 200 Z"
          fill="url(#trunkGradient)"
          className="transition-all duration-1000"
        />

        {/* Roots */}
        <path
          d="M 85 200 Q 70 210 60 215 M 115 200 Q 130 210 140 215 M 100 200 L 100 220"
          stroke="url(#trunkGradient)"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />

        {/* Branches and leaves */}
        {Array.from({ length: leafCount }).map((_, i) => {
          const angle = (i / leafCount) * 360
          const radius = 40 + (i % 3) * 10
          const x = 100 + Math.cos((angle * Math.PI) / 180) * radius
          const y = 80 - Math.sin((angle * Math.PI) / 180) * (radius * 0.8)

          return (
            <g key={i} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Branch */}
              <line x1="100" y1="80" x2={x} y2={y} stroke="oklch(0.4 0.08 55)" strokeWidth="2" opacity="0.5" />
              {/* Leaf */}
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="url(#leafGradient)"
                className="animate-pulse"
                style={{ animationDuration: `${2 + (i % 3)}s` }}
              />
            </g>
          )
        })}

        {/* Flowers at certain milestones */}
        {days >= 7 && <circle cx="70" cy="60" r="4" fill="oklch(0.7 0.18 320)" className="animate-pulse" />}
        {days >= 14 && <circle cx="130" cy="65" r="4" fill="oklch(0.7 0.18 45)" className="animate-pulse" />}
        {days >= 30 && <circle cx="100" cy="50" r="5" fill="oklch(0.7 0.15 220)" className="animate-pulse" />}
      </svg>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
    </div>
  )
}
