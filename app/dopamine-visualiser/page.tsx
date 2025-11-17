"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Diamond, ArrowLeft, Brain, TrendingUp, Zap, Target, Loader2, Sparkles, Info, X } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import * as LucideIcons from "lucide-react"

interface DopamineActivity {
  id: string
  title: string
  description: string
  category: string
  dopamine_level: number
  icon_name: string | null
  color_hex: string
}

export default function DopamineVisualiserPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()

  const [activities, setActivities] = useState<DopamineActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<DopamineActivity | null>(null)

  useEffect(() => {
    loadActivities()
  }, [language])

  const loadActivities = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("dopamine_activities")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        const formattedActivities: DopamineActivity[] = data.map((item) => ({
          id: item.id,
          title: language === "pt" ? item.title_pt : language === "es" ? item.title_es : item.title_en,
          description: language === "pt" ? item.description_pt : language === "es" ? item.description_es : item.description_en,
          category: language === "pt" ? item.category_pt : language === "es" ? item.category_es : item.category_en,
          dopamine_level: item.dopamine_level,
          icon_name: item.icon_name,
          color_hex: item.color_hex || "#f59e0b"
        }))
        setActivities(formattedActivities)
      }
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(activities.map(a => a.category)))
    return uniqueCategories
  }, [activities])

  // Filter activities by category
  const filteredActivities = useMemo(() => {
    if (!selectedCategory) return activities
    return activities.filter(a => a.category === selectedCategory)
  }, [activities, selectedCategory])

  // Get icon component
  const getIcon = (iconName: string | null) => {
    if (!iconName) return Diamond
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent || Diamond
  }

  // Calculate average dopamine level
  const averageDopamine = useMemo(() => {
    if (filteredActivities.length === 0) return 0
    const sum = filteredActivities.reduce((acc, a) => acc + a.dopamine_level, 0)
    return Math.round(sum / filteredActivities.length)
  }, [filteredActivities])

  // Get dopamine level color
  const getDopamineColor = (level: number) => {
    if (level >= 8) return "from-red-500 to-orange-500"
    if (level >= 6) return "from-orange-500 to-yellow-500"
    if (level >= 4) return "from-yellow-500 to-green-500"
    return "from-green-500 to-emerald-500"
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Exercício": "from-green-500 to-emerald-500",
      "Exercise": "from-green-500 to-emerald-500",
      "Ejercicio": "from-green-500 to-emerald-500",
      "Bem-estar": "from-purple-500 to-indigo-500",
      "Wellbeing": "from-purple-500 to-indigo-500",
      "Bienestar": "from-purple-500 to-indigo-500",
      "Aprendizado": "from-blue-500 to-cyan-500",
      "Learning": "from-blue-500 to-cyan-500",
      "Aprendizaje": "from-blue-500 to-cyan-500",
      "Social": "from-pink-500 to-rose-500",
      "Criatividade": "from-orange-500 to-amber-500",
      "Creativity": "from-orange-500 to-amber-500",
      "Creatividad": "from-orange-500 to-amber-500",
      "Natureza": "from-emerald-500 to-green-500",
      "Nature": "from-emerald-500 to-green-500",
      "Produtividade": "from-cyan-500 to-blue-500",
      "Productivity": "from-cyan-500 to-blue-500",
      "Productividad": "from-cyan-500 to-blue-500"
    }
    return colors[category] || "from-gray-500 to-gray-600"
  }

  return (
    <div className="min-h-screen tools-background relative pb-24 overflow-hidden">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(
        collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64",
        "transition-all duration-300"
      )}>
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 pb-20 md:pb-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <Link href="/tools">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.tools}
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-400/30 shrink-0">
                  <Diamond className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-orange-400" />
                </div>
                <span className="leading-tight">
                  {language === "pt" ? "Dopamine Visualiser" : language === "es" ? "Visualizador de Dopamina" : "Dopamine Visualiser"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/70">
                {language === "pt"
                  ? "Visualize atividades saudáveis que geram dopamina natural. Descubra alternativas positivas para reequilibrar seu sistema de recompensa."
                  : language === "es"
                  ? "Visualiza actividades saludables que generan dopamina natural. Descubre alternativas positivas para reequilibrar tu sistema de recompensa."
                  : "Visualize healthy activities that generate natural dopamine. Discover positive alternatives to rebalance your reward system."}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-white/60">
                  {language === "pt" ? "Atividades" : language === "es" ? "Actividades" : "Activities"}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{activities.length}</div>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-white/60">
                  {language === "pt" ? "Média Dopamina" : language === "es" ? "Promedio Dopamina" : "Avg Dopamine"}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{averageDopamine}/10</div>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-white/60">
                  {language === "pt" ? "Categorias" : language === "es" ? "Categorías" : "Categories"}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{categories.length}</div>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-green-400" />
                <span className="text-xs text-white/60">
                  {language === "pt" ? "Filtradas" : language === "es" ? "Filtradas" : "Filtered"}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{filteredActivities.length}</div>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-orange-500/20 via-amber-500/20 to-orange-500/20 border-orange-400/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-orange-500/20 shrink-0">
                <Info className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === "pt" ? "Sobre o Dopamine Visualiser" : language === "es" ? "Sobre el Visualizador de Dopamina" : "About Dopamine Visualiser"}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {language === "pt"
                    ? "Este visualizador mostra atividades saudáveis que geram dopamina natural. Ao contrário da pornografia que causa picos artificiais e crashes, essas atividades ajudam a reequilibrar seu sistema de recompensa de forma sustentável. Explore diferentes categorias e descubra novas formas de obter prazer e satisfação."
                    : language === "es"
                    ? "Este visualizador muestra actividades saludables que generan dopamina natural. A diferencia de la pornografía que causa picos artificiales y caídas, estas actividades ayudan a reequilibrar tu sistema de recompensa de forma sostenible. Explora diferentes categorías y descubre nuevas formas de obtener placer y satisfacción."
                    : "This visualizer shows healthy activities that generate natural dopamine. Unlike pornography which causes artificial spikes and crashes, these activities help rebalance your reward system sustainably. Explore different categories and discover new ways to get pleasure and satisfaction."}
                </p>
              </div>
            </div>
          </Card>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {language === "pt" ? "Filtrar por Categoria" : language === "es" ? "Filtrar por Categoría" : "Filter by Category"}
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    selectedCategory === null
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0"
                      : "bg-black/20 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  {language === "pt" ? "Todas" : language === "es" ? "Todas" : "All"}
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      selectedCategory === category
                        ? `bg-gradient-to-r ${getCategoryColor(category)} text-white border-0`
                        : "bg-black/20 border-white/10 text-white hover:bg-white/10"
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Activities Grid */}
          {isLoading ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  {language === "pt" ? "Carregando atividades..." : language === "es" ? "Cargando actividades..." : "Loading activities..."}
                </p>
              </div>
            </Card>
          ) : filteredActivities.length === 0 ? (
            <Card className="p-8 text-center">
              <Diamond className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {language === "pt" ? "Nenhuma atividade encontrada" : language === "es" ? "No se encontraron actividades" : "No activities found"}
              </h3>
              <p className="text-muted-foreground">
                {language === "pt" ? "Tente selecionar outra categoria ou verifique novamente mais tarde." : language === "es" ? "Intenta seleccionar otra categoría o vuelve a verificar más tarde." : "Try selecting another category or check back later."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredActivities.map((activity) => {
                const IconComponent = getIcon(activity.icon_name)
                const dopamineColor = getDopamineColor(activity.dopamine_level)
                const categoryColor = getCategoryColor(activity.category)

                return (
                  <Card
                    key={activity.id}
                    onClick={() => setSelectedActivity(activity)}
                    className={cn(
                      "p-4 sm:p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group",
                      "bg-black/20 backdrop-blur-md border border-white/10",
                      "hover:scale-105 hover:bg-black/30 hover:border-orange-400/30 hover:shadow-lg hover:shadow-orange-500/20"
                    )}
                  >
                    {/* Gradient overlay based on dopamine level */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity",
                      dopamineColor
                    )} />

                    <div className="relative z-10 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className={cn(
                          "p-2.5 sm:p-3 rounded-lg bg-gradient-to-br shrink-0",
                          categoryColor
                        )}>
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className={cn(
                            "text-xs font-bold border-2",
                            `bg-gradient-to-r ${dopamineColor} text-white border-transparent`
                          )}>
                            {activity.dopamine_level}/10
                          </Badge>
                          <span className="text-xs text-white/60">{activity.category}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-white/70 line-clamp-3 leading-relaxed">
                          {activity.description}
                        </p>
                      </div>

                      {/* Dopamine Level Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">
                            {language === "pt" ? "Nível de Dopamina" : language === "es" ? "Nivel de Dopamina" : "Dopamine Level"}
                          </span>
                          <span className="text-white font-semibold">{activity.dopamine_level}/10</span>
                        </div>
                        <Progress 
                          value={(activity.dopamine_level / 10) * 100} 
                          className="h-2 bg-white/10"
                        />
                      </div>

                      {/* Click hint */}
                      <div className="flex items-center gap-2 text-xs text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles className="h-3 w-3" />
                        <span>
                          {language === "pt" ? "Clique para ver detalhes" : language === "es" ? "Haz clic para ver detalles" : "Click for details"}
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Activity Detail Modal */}
          {selectedActivity && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setSelectedActivity(null)}
            >
              <Card 
                className={cn(
                  "max-w-2xl w-full p-6 sm:p-8 bg-gradient-to-br border-2 backdrop-blur-xl relative animate-in zoom-in-95 duration-300",
                  `from-orange-950/95 via-amber-950/95 to-orange-950/95 border-orange-400/30`
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedActivity(null)}
                  className="absolute top-4 right-4 text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="space-y-4 sm:space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-4 rounded-xl bg-gradient-to-br shrink-0",
                      getCategoryColor(selectedActivity.category)
                    )}>
                      {(() => {
                        const IconComponent = getIcon(selectedActivity.icon_name)
                        return <IconComponent className="h-8 w-8 text-white" />
                      })()}
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className={cn(
                        "mb-2 text-xs font-semibold",
                        `bg-gradient-to-r ${getCategoryColor(selectedActivity.category)} text-white border-transparent`
                      )}>
                        {selectedActivity.category}
                      </Badge>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                        {selectedActivity.title}
                      </h2>
                      <p className="text-sm sm:text-base text-white/70">
                        {selectedActivity.description}
                      </p>
                    </div>
                  </div>

                  {/* Dopamine Level Section */}
                  <div className={cn(
                    "p-4 sm:p-6 rounded-xl border-2 animate-in slide-in-from-bottom-4 duration-500",
                    `bg-gradient-to-br ${getDopamineColor(selectedActivity.dopamine_level)}/20 border-white/20`
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Brain className="h-6 w-6 text-white" />
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {language === "pt" ? "Nível de Dopamina" : language === "es" ? "Nivel de Dopamina" : "Dopamine Level"}
                        </h3>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-lg bg-gradient-to-r text-white font-bold text-xl",
                        getDopamineColor(selectedActivity.dopamine_level)
                      )}>
                        {selectedActivity.dopamine_level}/10
                      </div>
                    </div>
                    <Progress 
                      value={(selectedActivity.dopamine_level / 10) * 100} 
                      className="h-3 bg-white/20"
                    />
                    <p className="text-white/80 text-sm mt-3">
                      {language === "pt"
                        ? "Esta atividade gera um nível saudável de dopamina natural, ajudando a reequilibrar seu sistema de recompensa sem os picos artificiais e crashes da pornografia."
                        : language === "es"
                        ? "Esta actividad genera un nivel saludable de dopamina natural, ayudando a reequilibrar tu sistema de recompensa sin los picos artificiales y caídas de la pornografía."
                        : "This activity generates a healthy level of natural dopamine, helping to rebalance your reward system without the artificial spikes and crashes of pornography."}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={() => setSelectedActivity(null)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {language === "pt" ? "Fechar" : language === "es" ? "Cerrar" : "Close"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}

