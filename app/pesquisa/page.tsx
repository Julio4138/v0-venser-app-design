"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  BookOpen,
  BarChart3,
  Brain,
  FileText,
  Diamond,
  ClipboardList,
  ArrowLeft,
  ExternalLink,
  Search,
  Sparkles,
  TrendingUp,
  Award,
  Loader2,
} from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

interface ResearchArticle {
  id: string
  title: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  hoverColor: string
  gradientFrom: string
  gradientTo: string
  link?: string
  stats?: string
}

// Mapeamento de ícones
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  BarChart3,
  Brain,
  FileText,
  Diamond,
  ClipboardList,
}

export default function ResearchPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [researchArticles, setResearchArticles] = useState<ResearchArticle[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    loadArticles()
  }, [language])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("research_articles")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })

      if (error) throw error

      // Converter dados do banco para o formato da interface
      const formattedArticles: ResearchArticle[] = (data || []).map((item) => {
        const IconComponent = ICON_MAP[item.icon_name] || BookOpen
        const lang = language === "pt" ? "pt" : language === "es" ? "es" : "en"
        
        return {
          id: item.id,
          title: item[`title_${lang}` as keyof typeof item] as string,
          description: item[`description_${lang}` as keyof typeof item] as string,
          category: item[`category_${lang}` as keyof typeof item] as string,
          icon: IconComponent,
          iconColor: item.icon_color,
          hoverColor: `group-hover:${item.icon_color.replace("text-", "")}`,
          gradientFrom: item.gradient_from,
          gradientTo: item.gradient_to,
          link: item.external_link || undefined,
          stats: item[`stats_text_${lang}` as keyof typeof item] as string | undefined,
        }
      })

      setResearchArticles(formattedArticles)
    } catch (error: any) {
      console.error("Error loading articles:", error)
      // Fallback para lista vazia em caso de erro
      setResearchArticles([])
    } finally {
      setLoading(false)
    }
  }

  const categories = Array.from(new Set(researchArticles.map((article) => article.category)))

  const filteredArticles = researchArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Animação de contagem para estatísticas
  const [animatedStats, setAnimatedStats] = useState<{ [key: string]: number }>({})
  
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    filteredArticles.forEach((article) => {
      if (article.stats) {
        const match = article.stats.match(/(\d+)/)
        if (match) {
          const target = parseInt(match[1])
          // Se já tem valor animado, não anima novamente
          if (animatedStats[article.id] === target) return
          
          let current = animatedStats[article.id] || 0
          const increment = Math.max(1, target / 30)
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              current = target
              clearInterval(timer)
            }
            setAnimatedStats((prev) => ({ ...prev, [article.id]: Math.floor(current) }))
          }, 30)
          timers.push(timer)
        }
      }
    })
    
    return () => {
      timers.forEach(timer => clearInterval(timer))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredArticles.length])

  return (
    <div className="min-h-screen tools-background relative">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8 relative z-10">
          {/* Header */}
          <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-white/70 hover:text-white hover:bg-white/10 transition-all group"
              >
                <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                {language === "pt" ? "Voltar" : "Back"}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[oklch(0.54_0.18_285)]/30 to-[oklch(0.7_0.15_220)]/30 flex items-center justify-center border border-[oklch(0.54_0.18_285)]/30">
                  <ClipboardList className="h-6 w-6 text-[oklch(0.54_0.18_285)]" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {t.pornResearch}
                  </h1>
                  <p className="text-white/60 text-base md:text-lg">
                    {language === "pt"
                      ? "Artigos e pesquisas científicas sobre os efeitos da pornografia"
                      : "Scientific articles and research on pornography effects"}
                  </p>
                </div>
              </div>
              
              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span>{filteredArticles.length} {language === "pt" ? "artigos disponíveis" : "articles available"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <span>{categories.length} {language === "pt" ? "categorias" : "categories"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>{language === "pt" ? "Pesquisas revisadas por pares" : "Peer-reviewed research"}</span>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Search className="h-5 w-5 text-white/40" />
                </div>
                <input
                  type="text"
                  placeholder={language === "pt" ? "Buscar artigos por título ou descrição..." : "Search articles by title or description..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[oklch(0.54_0.18_285)]/50 focus:border-[oklch(0.54_0.18_285)]/30 transition-all shadow-lg shadow-black/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "transition-all duration-200",
                    selectedCategory === null
                      ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white border-transparent shadow-lg shadow-[oklch(0.54_0.18_285)]/20 hover:shadow-[oklch(0.54_0.18_285)]/30"
                      : "bg-black/20 backdrop-blur-md border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                  )}
                >
                  {language === "pt" ? "Todos" : "All"}
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "transition-all duration-200",
                      selectedCategory === category
                        ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white border-transparent shadow-lg shadow-[oklch(0.54_0.18_285)]/20 hover:shadow-[oklch(0.54_0.18_285)]/30"
                        : "bg-black/20 backdrop-blur-md border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="relative z-10">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-white/60" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <Card className="p-12 text-center bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl animate-in fade-in">
                <div className="flex flex-col items-center gap-3">
                  <Search className="h-12 w-12 text-white/20" />
                  <p className="text-white/60 text-lg font-medium">
                    {language === "pt"
                      ? "Nenhum artigo encontrado com os filtros selecionados."
                      : "No articles found with the selected filters."}
                  </p>
                  <p className="text-white/40 text-sm">
                    {language === "pt"
                      ? "Tente ajustar sua busca ou selecionar outra categoria"
                      : "Try adjusting your search or selecting another category"}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article, index) => {
                  const Icon = article.icon
                  const isHovered = hoveredCard === article.id
                  return (
                    <Card
                      key={article.id}
                      onMouseEnter={() => setHoveredCard(article.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className={cn(
                        "bg-gradient-to-br from-black/30 to-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 cursor-pointer group overflow-hidden relative",
                        "hover:border-white/20 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1",
                        "animate-in fade-in slide-in-from-bottom-4",
                        isHovered && "scale-[1.02]"
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      {/* Gradient overlay on hover */}
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                          article.gradientFrom,
                          article.gradientTo
                        )}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10 flex flex-col gap-4">
                        {/* Icon and Title */}
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                              "bg-gradient-to-br",
                              article.gradientFrom.replace("/20", "/30"),
                              article.gradientTo.replace("/20", "/30"),
                              "border border-white/10 group-hover:border-white/20 shadow-lg"
                            )}
                          >
                            <Icon className={cn("h-7 w-7 transition-all duration-300", article.iconColor, "group-hover:scale-110")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3
                                className={cn(
                                  "font-bold text-white text-lg transition-colors duration-300 leading-tight",
                                  article.hoverColor
                                )}
                              >
                                {article.title}
                              </h3>
                              {article.link && (
                                <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-all duration-300 flex-shrink-0 mt-1 group-hover:translate-x-1 group-hover:-translate-y-1" />
                              )}
                            </div>
                            {article.stats && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <TrendingUp className="h-3 w-3 text-white/50" />
                                <span className="text-xs font-medium text-white/60">
                                  {animatedStats[article.id] || article.stats.match(/(\d+)/)?.[1] || "0"}+ {article.stats.replace(/\d+\+?\s*/, "")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-sm text-white/70 leading-relaxed line-clamp-3 group-hover:text-white/80 transition-colors">
                          {article.description}
                        </p>
                        
                        {/* Category Badge */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/5 text-white/80 border border-white/10 backdrop-blur-sm group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                            <div className={cn("h-2 w-2 rounded-full", article.iconColor.replace("text-", "bg-"))} />
                            {article.category}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-white/40 group-hover:text-white/60 transition-colors">
                            <span>{language === "pt" ? "Ler mais" : "Read more"}</span>
                            <ArrowLeft className="h-3 w-3 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none">
                        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="relative z-10 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-gradient-to-br from-[oklch(0.54_0.18_285)]/30 via-[oklch(0.6_0.16_250)]/20 to-[oklch(0.7_0.15_220)]/30 border-[oklch(0.54_0.18_285)]/40 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-[oklch(0.54_0.18_285)]/10 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }} />
              </div>
              
              <div className="relative z-10 flex items-start gap-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[oklch(0.54_0.18_285)]/40 to-[oklch(0.7_0.15_220)]/40 flex items-center justify-center border border-[oklch(0.54_0.18_285)]/30 shadow-lg flex-shrink-0">
                  <Brain className="h-8 w-8 text-[oklch(0.54_0.18_285)]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-xl mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[oklch(0.7_0.15_220)]" />
                    {language === "pt"
                      ? "Sobre esta pesquisa"
                      : "About this research"}
                  </h3>
                  <p className="text-white/90 text-base leading-relaxed mb-4">
                    {language === "pt"
                      ? "Esta seção apresenta pesquisas científicas revisadas por pares sobre os efeitos da pornografia no cérebro, comportamento e relacionamentos. As informações são baseadas em estudos científicos publicados em revistas acadêmicas respeitadas."
                      : "This section presents peer-reviewed scientific research on the effects of pornography on the brain, behavior, and relationships. The information is based on scientific studies published in respected academic journals."}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <Award className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs text-white/70 font-medium">
                        {language === "pt" ? "Revisado por pares" : "Peer-reviewed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-white/70 font-medium">
                        {language === "pt" ? "Fontes acadêmicas" : "Academic sources"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-white/70 font-medium">
                        {language === "pt" ? "Atualizado regularmente" : "Regularly updated"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
    </div>
  )
}

