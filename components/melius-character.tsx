"use client"

export function TonyCharacter() {
  return (
    <div className="relative w-36 h-44 md:w-44 md:h-52 flex items-end justify-end pr-4">
      {/* Character body */}
      <div className="relative z-10">
        {/* Professional head with calm expression */}
        <div className="relative mb-2">
          {/* Hair - professional style, subtle waves */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-full opacity-90" />
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-amber-700 rounded-t-full opacity-80" />
          
          {/* Main head - professional skin tone */}
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-b from-amber-100 to-amber-200 rounded-full relative shadow-lg border-2 border-amber-300/30">
            {/* Glasses - professional touch */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-8 border-2 border-slate-600 rounded-full">
              <div className="absolute left-0 top-0 w-7 h-7 border-2 border-slate-600 rounded-full bg-slate-200/20" />
              <div className="absolute right-0 top-0 w-7 h-7 border-2 border-slate-600 rounded-full bg-slate-200/20" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-slate-600 rounded-full" />
            </div>
            
            {/* Eyes - calm and professional behind glasses */}
            <div className="absolute top-7 left-1/2 transform -translate-x-1/2 flex gap-4">
              <div className="w-2 h-2 bg-slate-700 rounded-full" />
              <div className="w-2 h-2 bg-slate-700 rounded-full" />
            </div>
            
            {/* Nose - subtle */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-amber-300/50 rounded-full" />
            
            {/* Mouth - calm, professional smile */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-amber-400 rounded-full" />
            
            {/* Professional beard/stubble */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-amber-300/30 rounded-full" />
          </div>
        </div>
        
        {/* Professional body - shirt and tie */}
        <div className="relative">
          {/* Shirt - professional blue/white */}
          <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-blue-50 to-blue-100 rounded-b-2xl mx-auto relative shadow-lg border-2 border-blue-200/50">
            {/* Tie - professional detail */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-12 bg-gradient-to-b from-blue-600 to-blue-700 rounded-sm shadow-md" />
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-blue-600 rounded-t-sm" />
            
            {/* Left arm - professional pose */}
            <div className="absolute -left-1 top-6 w-5 h-10 bg-gradient-to-b from-blue-50 to-blue-100 rounded-full transform rotate-[15deg] shadow-md border border-blue-200/50" />
            
            {/* Right arm - holding notebook/tablet */}
            <div className="absolute -right-1 top-6 w-5 h-10 bg-gradient-to-b from-blue-50 to-blue-100 rounded-full transform -rotate-[15deg] shadow-md border border-blue-200/50" />
            
            {/* Professional tablet/notebook - held in front */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-10 bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg flex flex-col items-center justify-center shadow-xl z-10 border-2 border-slate-300">
              <div className="w-6 h-1 bg-slate-300 rounded mb-1" />
              <div className="w-5 h-1 bg-slate-300 rounded mb-1" />
              <div className="w-4 h-1 bg-blue-400 rounded" />
            </div>
            
            {/* Shirt collar */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-4 bg-blue-200 rounded-t-lg border-t-2 border-blue-300" />
          </div>
        </div>
      </div>
    </div>
  )
}

