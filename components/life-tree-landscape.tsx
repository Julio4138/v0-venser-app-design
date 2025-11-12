"use client"

export function LifeTreeLandscape() {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg min-h-[180px]">
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
        
        {/* Trees - positioned on hills */}
        {/* Tree 1 - left side, medium */}
        <div className="absolute bottom-[35%] left-[15%] w-6 h-10">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-green-900" />
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-green-900" />
        </div>
        
        {/* Tree 2 - center-left */}
        <div className="absolute bottom-[30%] left-[30%] w-7 h-12">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-green-900" />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-green-900" />
        </div>
        
        {/* Tree 3 - center */}
        <div className="absolute bottom-[25%] left-[45%] w-8 h-14">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-green-900" />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[18px] border-b-green-900" />
        </div>
        
        {/* Tree 4 - center-right */}
        <div className="absolute bottom-[28%] left-[60%] w-6 h-11">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-green-900" />
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-b-[15px] border-b-green-900" />
        </div>
        
        {/* Tree 5 - right side, smaller */}
        <div className="absolute bottom-[32%] left-[75%] w-5 h-9">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-green-900" />
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[13px] border-b-green-900" />
        </div>
        
        {/* Tree 6 - far right */}
        <div className="absolute bottom-[35%] left-[85%] w-4 h-7">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-green-900" />
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[11px] border-b-green-900" />
        </div>
      </div>
      
      {/* Bottom vibrant teal-green strip */}
      <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-teal-400/70 via-teal-300/60 to-transparent" />
    </div>
  )
}

