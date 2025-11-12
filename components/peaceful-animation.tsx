"use client"

export function PeacefulAnimation() {
  return (
    <div className="flex items-center justify-center py-4 md:py-6 lg:py-8">
      <div className="relative w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] md:w-[220px] md:h-[220px] lg:w-[250px] lg:h-[250px] flex items-center justify-center">
        {/* Outermost pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/20 to-[oklch(0.54_0.18_285)]/20"
          style={{ 
            width: '100%', 
            height: '100%',
            animation: 'peaceful-pulse 4s ease-in-out infinite'
          }} 
        />
        
        {/* Fourth pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/30 to-[oklch(0.54_0.18_285)]/30"
          style={{ 
            width: '80%', 
            height: '80%',
            animation: 'peaceful-pulse 3.5s ease-in-out infinite',
            animationDelay: '0.2s'
          }} 
        />
        
        {/* Third pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/40 to-[oklch(0.54_0.18_285)]/40"
          style={{ 
            width: '60%', 
            height: '60%',
            animation: 'peaceful-pulse 3s ease-in-out infinite',
            animationDelay: '0.4s'
          }} 
        />
        
        {/* Second pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/50 to-[oklch(0.54_0.18_285)]/50"
          style={{ 
            width: '40%', 
            height: '40%',
            animation: 'peaceful-pulse 2.5s ease-in-out infinite',
            animationDelay: '0.6s'
          }} 
        />
        
        {/* Inner circle with breathing effect */}
        <div 
          className="relative rounded-full bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.54_0.18_285)] flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)] w-[25%] h-[25%] md:w-[30%] md:h-[30%]"
          style={{
            animation: 'peaceful-breathe 4s ease-in-out infinite'
          }}
        >
          {/* Center dot */}
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white/90 animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>
        
        {/* Floating particles around center */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180)
          const radius = 30
          return (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full bg-white/60 w-1 h-1 md:w-[4px] md:h-[4px]"
              style={{
                top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                transform: 'translate(-50%, -50%)',
                animation: `peaceful-float 3s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          )
        })}
        
        {/* Floating orbs around the main circle */}
        {[...Array(8)].map((_, i) => {
          const initialAngle = (i * 45) * (Math.PI / 180)
          const radius = 100
          return (
            <div
              key={`orb-${i}`}
              className="absolute rounded-full bg-gradient-to-br from-[oklch(0.7_0.15_220)]/40 to-[oklch(0.54_0.18_285)]/40 w-2 h-2 md:w-3 md:h-3"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateX(${radius}px)`,
                transformOrigin: '0 0',
                animation: `peaceful-orbit 8s linear infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

