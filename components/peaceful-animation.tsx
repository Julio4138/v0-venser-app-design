"use client"

export function PeacefulAnimation() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative w-[200px] h-[200px] flex items-center justify-center">
        {/* Outermost pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/20 to-[oklch(0.54_0.18_285)]/20"
          style={{ 
            width: '200px', 
            height: '200px',
            animation: 'peaceful-pulse 4s ease-in-out infinite'
          }} 
        />
        
        {/* Fourth pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/30 to-[oklch(0.54_0.18_285)]/30"
          style={{ 
            width: '160px', 
            height: '160px',
            animation: 'peaceful-pulse 3.5s ease-in-out infinite',
            animationDelay: '0.2s'
          }} 
        />
        
        {/* Third pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/40 to-[oklch(0.54_0.18_285)]/40"
          style={{ 
            width: '120px', 
            height: '120px',
            animation: 'peaceful-pulse 3s ease-in-out infinite',
            animationDelay: '0.4s'
          }} 
        />
        
        {/* Second pulsing circle */}
        <div 
          className="absolute rounded-full bg-gradient-to-r from-[oklch(0.7_0.15_220)]/50 to-[oklch(0.54_0.18_285)]/50"
          style={{ 
            width: '80px', 
            height: '80px',
            animation: 'peaceful-pulse 2.5s ease-in-out infinite',
            animationDelay: '0.6s'
          }} 
        />
        
        {/* Inner circle with breathing effect */}
        <div 
          className="relative rounded-full bg-gradient-to-br from-[oklch(0.7_0.15_220)] to-[oklch(0.54_0.18_285)] flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)]"
          style={{
            width: '50px',
            height: '50px',
            animation: 'peaceful-breathe 4s ease-in-out infinite'
          }}
        >
          {/* Center dot */}
          <div className="w-3 h-3 rounded-full bg-white/90 animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>
        
        {/* Floating particles around center */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180)
          const radius = 30
          return (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full bg-white/60"
              style={{
                width: '4px',
                height: '4px',
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
              className="absolute rounded-full bg-gradient-to-br from-[oklch(0.7_0.15_220)]/40 to-[oklch(0.54_0.18_285)]/40"
              style={{
                width: '12px',
                height: '12px',
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

