"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  ArrowLeft,
  Loader2,
  Save,
  X,
  EyeOff
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface Illusion {
  id: string
  title_pt: string
  title_en: string
  title_es: string
  description_pt: string
  description_en: string
  description_es: string
  reality_pt: string
  reality_en: string
  reality_es: string
  category_pt: string
  category_en: string
  category_es: string
  xp_reward: number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminIllusionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [illusions, setIllusions] = useState<Illusion[]>([])
  const [selectedIllusion, setSelectedIllusion] = useState<Illusion | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    loadIllusions()
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

  const loadIllusions = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("illusions")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error

      setIllusions(data || [])
    } catch (error: any) {
      console.error("Error loading illusions:", error)
      toast.error(error.message || "Erro ao carregar ilusões")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedIllusion({
      id: "",
      title_pt: "",
      title_en: "",
      title_es: "",
      description_pt: "",
      description_en: "",
      description_es: "",
      reality_pt: "",
      reality_en: "",
      reality_es: "",
      category_pt: "",
      category_en: "",
      category_es: "",
      xp_reward: 50,
      display_order: illusions.length + 1,
      is_active: true,
      created_at: "",
      updated_at: ""
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (illusion: Illusion) => {
    setSelectedIllusion({ ...illusion })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (illusionId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta ilusão? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("illusions")
        .delete()
        .eq("id", illusionId)

      if (error) throw error

      toast.success("Ilusão deletada com sucesso!")
      await loadIllusions()
    } catch (error: any) {
      console.error("Error deleting illusion:", error)
      toast.error(error.message || "Erro ao deletar ilusão")
    }
  }

  const handleSave = async () => {
    if (!selectedIllusion) return

    // Validação básica
    if (!selectedIllusion.title_pt || !selectedIllusion.title_en || !selectedIllusion.title_es) {
      toast.error("Preencha todos os títulos (PT, EN, ES)")
      return
    }

    if (!selectedIllusion.description_pt || !selectedIllusion.description_en || !selectedIllusion.description_es) {
      toast.error("Preencha todas as descrições (PT, EN, ES)")
      return
    }

    if (!selectedIllusion.reality_pt || !selectedIllusion.reality_en || !selectedIllusion.reality_es) {
      toast.error("Preencha todos os textos de realidade (PT, EN, ES)")
      return
    }

    if (!selectedIllusion.category_pt || !selectedIllusion.category_en || !selectedIllusion.category_es) {
      toast.error("Preencha todas as categorias (PT, EN, ES)")
      return
    }

    try {
      setIsSaving(true)

      if (isEditing && selectedIllusion.id) {
        // Atualizar ilusão existente
        const { error } = await supabase
          .from("illusions")
          .update({
            title_pt: selectedIllusion.title_pt,
            title_en: selectedIllusion.title_en,
            title_es: selectedIllusion.title_es,
            description_pt: selectedIllusion.description_pt,
            description_en: selectedIllusion.description_en,
            description_es: selectedIllusion.description_es,
            reality_pt: selectedIllusion.reality_pt,
            reality_en: selectedIllusion.reality_en,
            reality_es: selectedIllusion.reality_es,
            category_pt: selectedIllusion.category_pt,
            category_en: selectedIllusion.category_en,
            category_es: selectedIllusion.category_es,
            xp_reward: selectedIllusion.xp_reward,
            display_order: selectedIllusion.display_order,
            is_active: selectedIllusion.is_active
          })
          .eq("id", selectedIllusion.id)

        if (error) throw error
        toast.success("Ilusão atualizada com sucesso!")
      } else {
        // Criar nova ilusão
        const { error } = await supabase
          .from("illusions")
          .insert({
            title_pt: selectedIllusion.title_pt,
            title_en: selectedIllusion.title_en,
            title_es: selectedIllusion.title_es,
            description_pt: selectedIllusion.description_pt,
            description_en: selectedIllusion.description_en,
            description_es: selectedIllusion.description_es,
            reality_pt: selectedIllusion.reality_pt,
            reality_en: selectedIllusion.reality_en,
            reality_es: selectedIllusion.reality_es,
            category_pt: selectedIllusion.category_pt,
            category_en: selectedIllusion.category_en,
            category_es: selectedIllusion.category_es,
            xp_reward: selectedIllusion.xp_reward,
            display_order: selectedIllusion.display_order,
            is_active: selectedIllusion.is_active
          })

        if (error) throw error
        toast.success("Ilusão criada com sucesso!")
      }

      setIsDialogOpen(false)
      setSelectedIllusion(null)
      await loadIllusions()
    } catch (error: any) {
      console.error("Error saving illusion:", error)
      toast.error(error.message || "Erro ao salvar ilusão")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (illusion: Illusion) => {
    try {
      const { error } = await supabase
        .from("illusions")
        .update({ is_active: !illusion.is_active })
        .eq("id", illusion.id)

      if (error) throw error

      toast.success(`Ilusão ${!illusion.is_active ? "ativada" : "desativada"} com sucesso!`)
      await loadIllusions()
    } catch (error: any) {
      console.error("Error toggling illusion:", error)
      toast.error(error.message || "Erro ao atualizar ilusão")
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Controle": "bg-pink-500/20 text-pink-400 border-pink-400/30",
      "Control": "bg-pink-500/20 text-pink-400 border-pink-400/30",
      "Bem-estar": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Wellbeing": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Bienestar": "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "Realidade": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Reality": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Realidad": "bg-orange-500/20 text-orange-400 border-orange-400/30",
      "Dependência": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Dependence": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Dependencia": "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "Social": "bg-green-500/20 text-green-400 border-green-400/30",
      "Mudança": "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
      "Change": "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
      "Cambio": "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
    }
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-400/30"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <h1 className="text-3xl font-bold">Gerenciar Ilusões</h1>
              <p className="text-muted-foreground mt-1">
                Adicione, edite ou remova ilusões do Illusion Buster
              </p>
            </div>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ilusão
          </Button>
        </div>

        {/* Ilusões List */}
        <div className="grid gap-4">
          {illusions.length === 0 ? (
            <Card className="p-8 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ilusão encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira ilusão
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Ilusão
              </Button>
            </Card>
          ) : (
            illusions.map((illusion) => (
              <Card key={illusion.id} className={`p-6 ${!illusion.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className={getCategoryColor(illusion.category_pt)}>
                        {illusion.category_pt}
                      </Badge>
                      {!illusion.is_active && (
                        <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-400/30">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                        {illusion.xp_reward} XP
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                        Ordem: {illusion.display_order}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{illusion.title_pt}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{illusion.description_pt}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>EN:</strong> {illusion.title_en}</p>
                        <p><strong>ES:</strong> {illusion.title_es}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(illusion)}
                      title={illusion.is_active ? "Desativar" : "Ativar"}
                    >
                      {illusion.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(illusion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(illusion.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Ilusão" : "Nova Ilusão"}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? "Edite os dados da ilusão abaixo" : "Preencha os dados da nova ilusão"}
              </DialogDescription>
            </DialogHeader>

            {selectedIllusion && (
              <div className="space-y-6 py-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="xp_reward">XP Recompensa</Label>
                    <Input
                      id="xp_reward"
                      type="number"
                      value={selectedIllusion.xp_reward}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        xp_reward: parseInt(e.target.value) || 50
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Ordem de Exibição</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={selectedIllusion.display_order}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        display_order: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="is_active"
                        checked={selectedIllusion.is_active}
                        onCheckedChange={(checked) => setSelectedIllusion({
                          ...selectedIllusion,
                          is_active: checked
                        })}
                      />
                      <Label htmlFor="is_active">Ativa</Label>
                    </div>
                  </div>
                </div>

                {/* Português */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Português (PT)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="category_pt">Categoria</Label>
                    <Input
                      id="category_pt"
                      value={selectedIllusion.category_pt}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        category_pt: e.target.value
                      })}
                      placeholder="Ex: Controle, Bem-estar, Realidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_pt">Título</Label>
                    <Input
                      id="title_pt"
                      value={selectedIllusion.title_pt}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        title_pt: e.target.value
                      })}
                      placeholder="Ex: Vou usar apenas uma vez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_pt">Descrição</Label>
                    <Textarea
                      id="description_pt"
                      value={selectedIllusion.description_pt}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        description_pt: e.target.value
                      })}
                      placeholder="Descrição curta da ilusão"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reality_pt">Realidade</Label>
                    <Textarea
                      id="reality_pt"
                      value={selectedIllusion.reality_pt}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        reality_pt: e.target.value
                      })}
                      placeholder="Texto explicando a verdade sobre esta ilusão"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Inglês */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">English (EN)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="category_en">Category</Label>
                    <Input
                      id="category_en"
                      value={selectedIllusion.category_en}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        category_en: e.target.value
                      })}
                      placeholder="Ex: Control, Wellbeing, Reality"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_en">Title</Label>
                    <Input
                      id="title_en"
                      value={selectedIllusion.title_en}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        title_en: e.target.value
                      })}
                      placeholder="Ex: I'll just use it once"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description</Label>
                    <Textarea
                      id="description_en"
                      value={selectedIllusion.description_en}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        description_en: e.target.value
                      })}
                      placeholder="Short description of the illusion"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reality_en">Reality</Label>
                    <Textarea
                      id="reality_en"
                      value={selectedIllusion.reality_en}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        reality_en: e.target.value
                      })}
                      placeholder="Text explaining the truth about this illusion"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Espanhol */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Español (ES)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="category_es">Categoría</Label>
                    <Input
                      id="category_es"
                      value={selectedIllusion.category_es}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        category_es: e.target.value
                      })}
                      placeholder="Ex: Control, Bienestar, Realidad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_es">Título</Label>
                    <Input
                      id="title_es"
                      value={selectedIllusion.title_es}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        title_es: e.target.value
                      })}
                      placeholder="Ex: Lo usaré solo una vez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_es">Descripción</Label>
                    <Textarea
                      id="description_es"
                      value={selectedIllusion.description_es}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        description_es: e.target.value
                      })}
                      placeholder="Descripción corta de la ilusión"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reality_es">Realidad</Label>
                    <Textarea
                      id="reality_es"
                      value={selectedIllusion.reality_es}
                      onChange={(e) => setSelectedIllusion({
                        ...selectedIllusion,
                        reality_es: e.target.value
                      })}
                      placeholder="Texto explicando la verdad sobre esta ilusión"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

