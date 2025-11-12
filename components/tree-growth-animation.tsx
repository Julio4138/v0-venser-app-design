"use client"

import { useEffect, useState } from "react"

interface TreeGrowthAnimationProps {
  daysCompleted: number
  daysFailed: number
  daysPerTree?: number
  onAnimationComplete?: () => void
}

export function TreeGrowthAnimation({
  daysCompleted,
  daysFailed,
  daysPerTree = 7,
  onAnimationComplete
}: TreeGrowthAnimationProps) {
  const [animationProgress, setAnimationProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (!isAnimating) return

    const targetProgress = Math.min((daysCompleted / daysPerTree) * 100, 100)
    const duration = 4000 // 4 segundos para a animação completa (mais suave)
    const steps = 120 // 120 frames para animação mais fluida
    const stepDuration = duration / steps
    const progressIncrement = targetProgress / steps

    // Função de easing para animação mais suave (ease-out)
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    let currentStep = 0
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const normalizedTime = Math.min(elapsed / duration, 1)
      const easedTime = easeOut(normalizedTime)
      const newProgress = targetProgress * easedTime
      
      setAnimationProgress(newProgress)

      if (normalizedTime < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setTimeout(() => {
          onAnimationComplete?.()
        }, 500)
      }
    }

    requestAnimationFrame(animate)
  }, [daysCompleted, daysPerTree, isAnimating, onAnimationComplete])

  // Calcula danificação baseada em falhas
  const damageLevel = daysFailed
  const damageMultiplier = Math.max(0.3, 1 - (damageLevel * 0.15))
  
  // Altura da árvore baseada no crescimento
  const treeHeight = 80 + (animationProgress / 100) * 120
  const baseLeafCount = 12
  const leafCount = Math.floor((animationProgress / 100) * baseLeafCount)
  const visibleLeaves = Math.max(0, Math.floor(leafCount * damageMultiplier))
  const visibleBranches = Math.max(1, Math.floor(visibleLeaves / 2))
  
  // Opacidade reduzida para árvores danificadas
  const treeOpacity = damageLevel > 0 
    ? Math.max(0.5, 1 - ((damageLevel / daysPerTree) * 100 / 300))
    : 1
  
  // Cor da árvore (mais escura/marrom quando danificada)
  const trunkColor = damageLevel > 0
    ? `oklch(${0.35 - ((damageLevel / daysPerTree) * 100 / 500)} 0.08 ${50 - ((damageLevel / daysPerTree) * 100 / 10)})`
    : "oklch(0.45 0.1 60)"
  
  const leafColor = damageLevel > 0
    ? `oklch(${0.55 - ((damageLevel / daysPerTree) * 100 / 500)} 0.15 ${140 - ((damageLevel / daysPerTree) * 100 / 5)})`
    : "oklch(0.65 0.18 150)"

  const isComplete = daysCompleted >= daysPerTree

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-green-50/10 via-teal-50/5 to-transparent rounded-lg overflow-hidden">
      {/* Sky/Mist layer */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-green-300/40 via-green-400/30 to-transparent" />
      
      {/* Rolling hills */}
      <div className="absolute top-1/3 left-0 right-0 bottom-0">
        <div className="absolute bottom-0 left-0 right-0 h-4/5 bg-gradient-to-b from-green-500/50 to-green-600/60 rounded-t-[60%]" />
        <div className="absolute bottom-0 left-1/4 right-0 h-3/4 bg-gradient-to-b from-green-600/60 to-green-700/70 rounded-t-[50%]" />
        <div className="absolute bottom-0 left-1/2 right-0 h-3/5 bg-gradient-to-b from-green-700/70 to-green-800/80 rounded-t-[40%]" />
      </div>

      {/* Árvore animada */}
      <div 
        className="relative z-10 flex flex-col items-center justify-end transition-opacity duration-500"
        style={{ opacity: treeOpacity }}
      >
        <svg
          width="200"
          height={treeHeight + 40}
          viewBox="0 0 200 300"
          className="transition-all duration-300 ease-out"
          style={{ height: `${treeHeight + 40}px` }}
        >
          <defs>
            <linearGradient id="animatedTrunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={trunkColor} />
              <stop offset="100%" stopColor={trunkColor.replace('0.45', '0.35').replace('0.35', '0.25')} />
            </linearGradient>
            <radialGradient id="animatedLeafGradient">
              <stop offset="0%" stopColor={leafColor} />
              <stop offset="100%" stopColor={leafColor.replace('0.65', '0.55').replace('0.55', '0.45')} />
            </radialGradient>
          </defs>

          {/* Tree trunk - aparece gradualmente */}
          {animationProgress > 10 && (
            <path
              d="M 85 300 Q 90 200 95 150 Q 97 120 100 100 Q 103 120 105 150 Q 110 200 115 300 Z"
              fill="url(#animatedTrunkGradient)"
              className="transition-all duration-500"
              style={{
                opacity: Math.min((animationProgress - 10) / 20, 1)
              }}
            />
          )}

          {/* Roots - aparecem após o tronco */}
          {animationProgress > 20 && (
            <path
              d="M 85 300 Q 70 310 60 315 M 115 300 Q 130 310 140 315 M 100 300 L 100 320"
              stroke={trunkColor}
              strokeWidth="3"
              fill="none"
              opacity="0.6"
              className="transition-all duration-500"
              style={{
                opacity: 0.6 * Math.min((animationProgress - 20) / 20, 1)
              }}
            />
          )}

          {/* Branches and leaves - aparecem progressivamente */}
          {Array.from({ length: visibleLeaves }).map((_, i) => {
            const angle = (i / Math.max(visibleLeaves, 1)) * 360
            const radius = 40 + (i % 3) * 10
            const x = 100 + Math.cos((angle * Math.PI) / 180) * radius
            const y = 100 - Math.sin((angle * Math.PI) / 180) * (radius * 0.8)
            
            // Cada folha aparece em um momento diferente para efeito cascata
            const leafAppearProgress = (animationProgress - 30) / 70 // Folhas aparecem entre 30% e 100%
            const leafDelay = i / visibleLeaves
            const leafOpacity = leafAppearProgress > leafDelay 
              ? Math.min((leafAppearProgress - leafDelay) * 2, 1)
              : 0

            return (
              <g 
                key={i}
                style={{
                  opacity: leafOpacity,
                  transition: 'opacity 0.3s ease-in'
                }}
              >
                {/* Branch */}
                {i < visibleBranches && (
                  <line 
                    x1="100" 
                    y1="100" 
                    x2={x} 
                    y2={y} 
                    stroke={trunkColor} 
                    strokeWidth="2" 
                    opacity="0.5"
                  />
                )}
                {/* Leaf */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="url(#animatedLeafGradient)"
                  className="animate-pulse"
                  style={{ 
                    animationDuration: `${2 + (i % 3)}s`,
                    transformOrigin: `${x}px ${y}px`
                  }}
                />
              </g>
            )
          })}

          {/* Flowers at milestones - aparecem quando completa */}
          {isComplete && animationProgress >= 100 && (
            <>
              <circle 
                cx="70" 
                cy="80" 
                r="4" 
                fill="oklch(0.7 0.18 320)" 
                className="animate-pulse"
                style={{
                  animationDelay: '0s',
                  opacity: Math.min((animationProgress - 95) / 5, 1)
                }}
              />
              <circle 
                cx="130" 
                cy="85" 
                r="4" 
                fill="oklch(0.7 0.18 45)" 
                className="animate-pulse"
                style={{
                  animationDelay: '0.2s',
                  opacity: Math.min((animationProgress - 95) / 5, 1)
                }}
              />
              <circle 
                cx="100" 
                cy="70" 
                r="5" 
                fill="oklch(0.7 0.15 220)" 
                className="animate-pulse"
                style={{
                  animationDelay: '0.4s',
                  opacity: Math.min((animationProgress - 95) / 5, 1)
                }}
              />
            </>
          )}

          {/* Indicador de dano (folhas caindo) */}
          {damageLevel > 0 && animationProgress > 50 && (
            <>
              {Array.from({ length: Math.min(damageLevel, 3) }).map((_, i) => {
                const fallX = 100 + (i - 1) * 12
                const fallY = 120 + (i * 8) + (animationProgress / 10)
                return (
                  <circle
                    key={`damage-${i}`}
                    cx={fallX}
                    cy={fallY}
                    r="2"
                    fill="oklch(0.4 0.1 30)"
                    opacity="0.6"
                    className="animate-pulse"
                    style={{
                      opacity: 0.6 * Math.min((animationProgress - 50) / 20, 1)
                    }}
                  />
                )
              })}
            </>
          )}
        </svg>

        {/* Progress indicator */}
        <div className="mt-6 text-center space-y-3">
          <div className="text-3xl font-bold text-white">
            {Math.floor(animationProgress / 100 * daysCompleted)}/{daysPerTree}
          </div>
          <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] rounded-full transition-all duration-200 relative overflow-hidden"
              style={{ width: `${animationProgress}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          {isComplete && animationProgress >= 100 && (
            <div className="text-green-400 font-semibold text-lg animate-pulse flex items-center justify-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Árvore Completa!</span>
            </div>
          )}
          {!isComplete && animationProgress >= 90 && (
            <div className="text-white/70 text-sm">
              Continue sua jornada para completar esta árvore!
            </div>
          )}
        </div>
      </div>

      {/* Bottom vibrant teal-green strip */}
      <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-teal-400/70 via-teal-300/60 to-transparent" />
    </div>
  )
}

