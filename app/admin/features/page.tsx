"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Settings, 
  ToggleLeft, 
  ToggleRight,
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Check,
  X
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Feature {
  id: string
  name: string
  description: string
  is_enabled: boolean
  category: string
  config?: Record<string, any>
  created_at: string
  updated_at: string
}

// Features padrão (fallback caso a tabela ainda não exista)
const DEFAULT_FEATURES: Feature[] = [
  {
    id: "1",
    name: "Programa de 90 Dias",
    description: "Habilita o programa completo de 90 dias de recuperação",
    is_enabled: true,
    category: "Programa",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Missões Diárias",
    description: "Sistema de missões diárias para ganhar XP",
    is_enabled: true,
    category: "Gamificação",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Comunidade",
    description: "Acesso à comunidade e fórum de usuários",
    is_enabled: true,
    category: "Social",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Analytics",
    description: "Dashboard de analytics e métricas pessoais",
    is_enabled: true,
    category: "Analytics",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Chat com IA",
    description: "Conversas com assistente virtual Melius",
    is_enabled: true,
    category: "IA",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Notificações Push",
    description: "Envio de notificações push para dispositivos móveis",
    is_enabled: false,
    category: "Notificações",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function AdminFeaturesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Feature>>({
    name: "",
    description: "",
    is_enabled: true,
    category: "",
  })

  useEffect(() => {
    checkAdminAccess()
    loadFeatures()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Acesso negado. Faça login como administrador.")
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single()

      if (!profile?.is_pro) {
        toast.error("Acesso negado. Você precisa ser um administrador.")
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      toast.error("Erro ao verificar acesso")
      router.push("/dashboard")
    }
  }

  const loadFeatures = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .order("category", { ascending: true })
      
      if (error) throw error
      setFeatures(data || [])
    } catch (error) {
      console.error("Error loading features:", error)
      toast.error("Erro ao carregar funcionalidades")
      // Fallback para features padrão se a tabela não existir ainda
      setFeatures(DEFAULT_FEATURES)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFeature = async (featureId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("features")
        .update({ is_enabled: !currentStatus })
        .eq("id", featureId)

      if (error) throw error

      // Log da atividade
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'feature_toggled',
        p_entity_type: 'feature',
        p_entity_id: featureId,
        p_details: { 
          enabled: !currentStatus,
          previous_status: currentStatus 
        }
      })

      // Atualizar estado local
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId ? { ...f, is_enabled: !currentStatus } : f
        )
      )

      toast.success(
        currentStatus
          ? "Funcionalidade desabilitada"
          : "Funcionalidade habilitada"
      )
    } catch (error: any) {
      console.error("Error toggling feature:", error)
      toast.error(error.message || "Erro ao atualizar funcionalidade")
      // Reverter mudança em caso de erro
      loadFeatures()
    }
  }

  const handleCreateNew = () => {
    setFormData({
      name: "",
      description: "",
      is_enabled: true,
      category: "",
    })
    setSelectedFeature(null)
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (feature: Feature) => {
    setFormData(feature)
    setSelectedFeature(feature)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.description || !formData.category) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }

      if (isEditing && selectedFeature) {
        const { data, error } = await supabase
          .from("features")
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            is_enabled: formData.is_enabled,
            config: formData.config || {},
          })
          .eq("id", selectedFeature.id)
          .select()
          .single()

        if (error) throw error

        // Log da atividade
        await supabase.rpc('log_admin_activity', {
          p_action_type: 'feature_updated',
          p_entity_type: 'feature',
          p_entity_id: selectedFeature.id,
          p_details: { name: formData.name }
        })

        toast.success("Funcionalidade atualizada com sucesso!")
      } else {
        const { data, error } = await supabase
          .from("features")
          .insert({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            is_enabled: formData.is_enabled ?? true,
            config: formData.config || {},
          })
          .select()
          .single()

        if (error) throw error

        // Log da atividade
        await supabase.rpc('log_admin_activity', {
          p_action_type: 'feature_created',
          p_entity_type: 'feature',
          p_entity_id: data.id,
          p_details: { name: formData.name }
        })

        toast.success("Funcionalidade criada com sucesso!")
      }

      setIsDialogOpen(false)
      setSelectedFeature(null)
      await loadFeatures()
    } catch (error: any) {
      console.error("Error saving feature:", error)
      toast.error(error.message || "Erro ao salvar funcionalidade")
    }
  }

  const handleDelete = async (featureId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta funcionalidade?")) return

    try {
      // Log antes de deletar
      const featureToDelete = features.find(f => f.id === featureId)
      
      const { error } = await supabase
        .from("features")
        .delete()
        .eq("id", featureId)

      if (error) throw error

      // Log da atividade
      await supabase.rpc('log_admin_activity', {
        p_action_type: 'feature_deleted',
        p_entity_type: 'feature',
        p_entity_id: featureId,
        p_details: { name: featureToDelete?.name || 'Unknown' }
      })

      toast.success("Funcionalidade excluída com sucesso!")
      await loadFeatures()
    } catch (error: any) {
      console.error("Error deleting feature:", error)
      toast.error(error.message || "Erro ao excluir funcionalidade")
    }
  }

  const categories = Array.from(new Set(features.map((f) => f.category)))

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando funcionalidades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Controle de Funcionalidades</h1>
              <p className="text-muted-foreground mt-1">
                Habilite ou desabilite funcionalidades do aplicativo
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Funcionalidade
          </Button>
        </div>

        {/* Features by Category */}
        {categories.map((category) => {
          const categoryFeatures = features.filter((f) => f.category === category)
          return (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-semibold">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryFeatures.map((feature) => (
                  <Card key={feature.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{feature.name}</h3>
                          {feature.is_enabled ? (
                            <Badge variant="default" className="bg-green-500">
                              <Check className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <X className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(feature)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(feature.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant={feature.is_enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleFeature(feature.id, feature.is_enabled)}
                        className="gap-2"
                      >
                        {feature.is_enabled ? (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            Desabilitar
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            Habilitar
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Funcionalidade" : "Nova Funcionalidade"}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes da funcionalidade
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="Ex: Programa de 90 Dias"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição *</label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Descreva a funcionalidade..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoria *</label>
                <Input
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Ex: Programa, Gamificação, Social..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled || false}
                  onChange={(e) =>
                    setFormData({ ...formData, is_enabled: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="is_enabled" className="text-sm font-medium">
                  Habilitado
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

