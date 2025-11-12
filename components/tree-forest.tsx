"use client"

import { useEffect, useState } from "react"

interface TreeState {
  treeIndex: number // Índice da árvore (0, 1, 2, ...)
  daysCompleted: number // Dias completados nesta árvore (0-7)
  daysFailed: number // Dias falhados nesta árvore
  isComplete: boolean // Se a árvore está completa (7 dias)
  isCurrent: boolean // Se é a árvore atual
}

interface TreeForestProps {
  totalDaysCompleted: number // Total de dias completados
  totalDaysFailed: number // Total de dias falhados
  daysPerTree?: number // Dias necessários para completar uma árvore (padrão: 7)
}

export function TreeForest({ 
  totalDaysCompleted, 
  totalDaysFailed,
  daysPerTree = 7 
}: TreeForestProps) {
  const [trees, setTrees] = useState<TreeState[]>([])

  useEffect(() => {
    // Calcula quantas árvores completas existem
    const completeTrees = Math.floor(totalDaysCompleted / daysPerTree)
    const currentTreeProgress = totalDaysCompleted % daysPerTree
    
    // Calcula quantas árvores mostrar (completas + atual + 1 futura para visualização)
    // Mínimo de 3, máximo de 6 para não sobrecarregar
    const treesToShow = Math.min(Math.max(completeTrees + 2, 3), 6)
    
    const newTrees: TreeState[] = []
    
    for (let i = 0; i < treesToShow; i++) {
      if (i < completeTrees) {
        // Árvore completa
        newTrees.push({
          treeIndex: i,
          daysCompleted: daysPerTree,
          daysFailed: 0,
          isComplete: true,
          isCurrent: false
        })
      } else if (i === completeTrees) {
        // Árvore atual - apenas falhas da árvore atual contam
        // Calcula falhas apenas para a árvore atual (últimos diasPerTree dias)
        const currentTreeStartDay = completeTrees * daysPerTree + 1
        const currentTreeEndDay = completeTrees * daysPerTree + currentTreeProgress
        // Para simplificar, usamos totalDaysFailed apenas na árvore atual
        // Em produção, isso seria calculado mais precisamente
        newTrees.push({
          treeIndex: i,
          daysCompleted: currentTreeProgress,
          daysFailed: currentTreeProgress > 0 ? Math.min(totalDaysFailed, daysPerTree) : 0,
          isComplete: false,
          isCurrent: true
        })
      } else {
        // Árvore futura
        newTrees.push({
          treeIndex: i,
          daysCompleted: 0,
          daysFailed: 0,
          isComplete: false,
          isCurrent: false
        })
      }
    }
    
    setTrees(newTrees)
  }, [totalDaysCompleted, totalDaysFailed, daysPerTree])

  const renderTree = (tree: TreeState) => {
    const growth = tree.isComplete 
      ? 100 
      : Math.min((tree.daysCompleted / daysPerTree) * 100, 100)
    
    // Calcula danificação baseada em falhas
    const damageLevel = tree.daysFailed
    const maxDamage = 7 // Máximo de danos visíveis (igual a daysPerTree)
    const damagePercent = Math.min((damageLevel / maxDamage) * 100, 100)
    
    // Altura da árvore baseada no crescimento
    const treeHeight = 60 + (growth / 100) * 100
    const baseLeafCount = 12
    const leafCount = Math.floor((growth / 100) * baseLeafCount)
    
    // Reduz folhas e galhos baseado em danos
    // Cada falha remove aproximadamente 15% das folhas
    const damageMultiplier = Math.max(0.3, 1 - (damageLevel * 0.15))
    const visibleLeaves = Math.max(0, Math.floor(leafCount * damageMultiplier))
    const visibleBranches = Math.max(1, Math.floor(visibleLeaves / 2))
    
    // Opacidade reduzida para árvores danificadas
    const treeOpacity = tree.isCurrent && damageLevel > 0 
      ? Math.max(0.5, 1 - (damagePercent / 300))
      : 1
    
    // Cor da árvore (mais escura/marrom quando danificada)
    const trunkColor = tree.isCurrent && damageLevel > 0
      ? `oklch(${0.35 - (damagePercent / 500)} 0.08 ${50 - (damagePercent / 10)})`
      : "oklch(0.45 0.1 60)"
    
    const leafColor = tree.isCurrent && damageLevel > 0
      ? `oklch(${0.55 - (damagePercent / 500)} 0.15 ${140 - (damagePercent / 5)})`
      : "oklch(0.65 0.18 150)"

    return (
      <div 
        key={tree.treeIndex} 
        className="relative flex flex-col items-center justify-end"
        style={{ 
          opacity: treeOpacity,
          transition: 'opacity 0.5s ease-in-out'
        }}
      >
        <svg
          width="80"
          height={treeHeight + 20}
          viewBox="0 0 80 200"
          className="transition-all duration-1000 ease-out"
          style={{ height: `${treeHeight + 20}px` }}
        >
          <defs>
            <linearGradient id={`trunkGradient-${tree.treeIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trunkColor} />
              <stop offset="100%" stopColor={trunkColor.replace('0.45', '0.35').replace('0.35', '0.25')} />
            </linearGradient>
            <radialGradient id={`leafGradient-${tree.treeIndex}`}>
              <stop offset="0%" stopColor={leafColor} />
              <stop offset="100%" stopColor={leafColor.replace('0.65', '0.55').replace('0.55', '0.45')} />
            </radialGradient>
          </defs>

          {/* Tree trunk */}
          <path
            d="M 35 200 Q 37 150 38 120 Q 38.5 100 40 80 Q 41.5 100 42 120 Q 43 150 45 200 Z"
            fill={`url(#trunkGradient-${tree.treeIndex})`}
            className="transition-all duration-1000"
          />

          {/* Roots */}
          {growth > 20 && (
            <path
              d="M 35 200 Q 28 210 22 215 M 45 200 Q 52 210 58 215 M 40 200 L 40 220"
              stroke={trunkColor}
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
          )}

          {/* Branches and leaves */}
          {Array.from({ length: visibleLeaves }).map((_, i) => {
            const angle = (i / Math.max(visibleLeaves, 1)) * 360
            const radius = 20 + (i % 3) * 5
            const x = 40 + Math.cos((angle * Math.PI) / 180) * radius
            const y = 80 - Math.sin((angle * Math.PI) / 180) * (radius * 0.8)

            return (
              <g 
                key={i} 
                className="animate-in fade-in zoom-in duration-500" 
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Branch */}
                {i < visibleBranches && (
                  <line 
                    x1="40" 
                    y1="80" 
                    x2={x} 
                    y2={y} 
                    stroke={trunkColor} 
                    strokeWidth="1.5" 
                    opacity="0.5" 
                  />
                )}
                {/* Leaf */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={`url(#leafGradient-${tree.treeIndex})`}
                  className="animate-pulse"
                  style={{ animationDuration: `${2 + (i % 3)}s` }}
                />
              </g>
            )
          })}

          {/* Flowers at milestones (apenas para árvores completas) */}
          {tree.isComplete && (
            <>
              <circle cx="28" cy="60" r="3" fill="oklch(0.7 0.18 320)" className="animate-pulse" />
              <circle cx="52" cy="65" r="3" fill="oklch(0.7 0.18 45)" className="animate-pulse" />
              <circle cx="40" cy="50" r="4" fill="oklch(0.7 0.15 220)" className="animate-pulse" />
            </>
          )}

          {/* Indicador de dano (folhas caindo) */}
          {tree.isCurrent && damageLevel > 0 && (
            <>
              {Array.from({ length: Math.min(damageLevel, 3) }).map((_, i) => {
                const fallX = 40 + (i - 1) * 8
                const fallY = 100 + (i * 5)
                return (
                  <circle
                    key={`damage-${i}`}
                    cx={fallX}
                    cy={fallY}
                    r="2"
                    fill="oklch(0.4 0.1 30)"
                    opacity="0.6"
                    className="animate-pulse"
                  />
                )
              })}
            </>
          )}
        </svg>
        
        {/* Label da árvore */}
        <div className="mt-1 text-xs text-white/60 text-center">
          {tree.isComplete ? (
            <span className="text-green-400">✓</span>
          ) : tree.isCurrent ? (
            <span>{tree.daysCompleted}/{daysPerTree}</span>
          ) : (
            <span className="opacity-30">—</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg min-h-[180px] flex items-end justify-center gap-2 md:gap-4 px-2 py-4">
      {/* Sky/Mist layer - light hazy green at top */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-green-300/40 via-green-400/30 to-transparent" />
      
      {/* Rolling hills/mountains - progressively darker greens from top to bottom */}
      <div className="absolute top-1/3 left-0 right-0 bottom-0">
        {/* Hill 1 - lightest, furthest back */}
        <div className="absolute bottom-0 left-0 right-0 h-4/5 bg-gradient-to-b from-green-500/50 to-green-600/60 rounded-t-[60%]" />
        
        {/* Hill 2 - medium */}
        <div className="absolute bottom-0 left-1/4 right-0 h-3/4 bg-gradient-to-b from-green-600/60 to-green-700/70 rounded-t-[50%]" />
        
        {/* Hill 3 - darker, foreground */}
        <div className="absolute bottom-0 left-1/2 right-0 h-3/5 bg-gradient-to-b from-green-700/70 to-green-800/80 rounded-t-[40%]" />
        
        {/* Hill 4 - darkest, most foreground */}
        <div className="absolute bottom-0 left-2/3 right-0 h-2/5 bg-gradient-to-b from-green-800/80 to-green-900/90 rounded-t-[35%]" />
      </div>

      {/* Árvores */}
      <div className="relative z-10 flex items-end justify-center gap-2 md:gap-4 w-full">
        {trees.map(renderTree)}
      </div>
      
      {/* Bottom vibrant teal-green strip */}
      <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-teal-400/70 via-teal-300/60 to-transparent" />
    </div>
  )
}

