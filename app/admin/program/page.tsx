"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Save, X, BookOpen, Play, Volume2, Video, Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface ProgramDayTemplate {
  id: string
  day_number: number
  title_pt: string
  title_en?: string
  title_es?: string
  content_text_pt?: string
  content_text_en?: string
  content_text_es?: string
  content_audio_url?: string
  content_video_url?: string
  motivational_quote_pt?: string
  motivational_quote_en?: string
  motivational_quote_es?: string
  xp_reward: number
  is_active: boolean
}

interface Task {
  id?: string
  template_id?: string
  task_order: number
  title_pt: string
  title_en?: string
  title_es?: string
  description_pt?: string
  description_en?: string
  description_es?: string
  task_type: "checklist" | "reflection" | "meditation" | "reading"
  xp_reward: number
  is_required: boolean
}

export default function AdminProgramPage() {
  const { language } = useLanguage()
  const [templates, setTemplates] = useState<ProgramDayTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramDayTemplate | null>(null)
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pt" | "en" | "es">("pt")

  // Form state
  const [formData, setFormData] = useState<Partial<ProgramDayTemplate>>({
    day_number: 1,
    title_pt: "",
    title_en: "",
    title_es: "",
    content_text_pt: "",
    content_text_en: "",
    content_text_es: "",
    content_audio_url: "",
    content_video_url: "",
    motivational_quote_pt: "",
    motivational_quote_en: "",
    motivational_quote_es: "",
    xp_reward: 50,
    is_active: true,
  })

  useEffect(() => {
    checkAdminAccess()
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateTasks(selectedTemplate.id)
    }
  }, [selectedTemplate])

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Acesso negado. Faça login como administrador.")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single()

      if (!profile?.is_pro) {
        toast.error("Acesso negado. Você precisa ser um administrador.")
        return
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      toast.error("Erro ao verificar acesso")
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("program_day_templates")
        .select("*")
        .order("day_number", { ascending: true })

      if (error) throw error

      setTemplates(data || [])
    } catch (error) {
      console.error("Error loading templates:", error)
      toast.error("Erro ao carregar templates")
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplateTasks = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from("program_day_tasks")
        .select("*")
        .eq("template_id", templateId)
        .order("task_order", { ascending: true })

      if (error) throw error

      setSelectedDayTasks(data || [])
    } catch (error) {
      console.error("Error loading tasks:", error)
      toast.error("Erro ao carregar tarefas")
    }
  }

  const handleCreateNew = () => {
    setFormData({
      day_number: templates.length + 1,
      title_pt: "",
      title_en: "",
      title_es: "",
      content_text_pt: "",
      content_text_en: "",
      content_text_es: "",
      content_audio_url: "",
      content_video_url: "",
      motivational_quote_pt: "",
      motivational_quote_en: "",
      motivational_quote_es: "",
      xp_reward: 50,
      is_active: true,
    })
    setSelectedDayTasks([])
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (template: ProgramDayTemplate) => {
    setFormData(template)
    setSelectedTemplate(template)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.day_number || !formData.title_pt) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }

      let templateId: string

      if (isEditing && selectedTemplate) {
        // Update existing
        const { data, error } = await supabase
          .from("program_day_templates")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedTemplate.id)
          .select()
          .single()

        if (error) throw error
        templateId = data.id
        toast.success("Template atualizado com sucesso!")
      } else {
        // Create new
        const { data, error } = await supabase
          .from("program_day_templates")
          .insert({
            ...formData,
          })
          .select()
          .single()

        if (error) throw error
        templateId = data.id
        toast.success("Template criado com sucesso!")
      }

      // Save tasks
      if (selectedDayTasks.length > 0) {
        const tasksToSave = selectedDayTasks.map((task, index) => ({
          ...task,
          template_id: templateId,
          task_order: index + 1,
        }))

        // Delete old tasks if editing
        if (isEditing) {
          await supabase.from("program_day_tasks").delete().eq("template_id", templateId)
        }

        // Insert new tasks
        const { error: tasksError } = await supabase
          .from("program_day_tasks")
          .insert(tasksToSave)

        if (tasksError) throw tasksError
      }

      await loadTemplates()
      setIsDialogOpen(false)
      setSelectedTemplate(null)
      setSelectedDayTasks([])
    } catch (error: any) {
      console.error("Error saving template:", error)
      toast.error(error.message || "Erro ao salvar template")
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return

    try {
      const { error } = await supabase
        .from("program_day_templates")
        .delete()
        .eq("id", templateId)

      if (error) throw error

      toast.success("Template excluído com sucesso!")
      await loadTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Erro ao excluir template")
    }
  }

  const handleAddTask = () => {
    setSelectedDayTasks([
      ...selectedDayTasks,
      {
        task_order: selectedDayTasks.length + 1,
        title_pt: "",
        title_en: "",
        title_es: "",
        description_pt: "",
        description_en: "",
        description_es: "",
        task_type: "checklist",
        xp_reward: 10,
        is_required: true,
      },
    ])
  }

  const handleUpdateTask = (index: number, field: keyof Task, value: any) => {
    const updated = [...selectedDayTasks]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedDayTasks(updated)
  }

  const handleRemoveTask = (index: number) => {
    setSelectedDayTasks(selectedDayTasks.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Programa de 90 Dias</h1>
            <p className="text-muted-foreground mt-1">
              Crie e edite os templates dos dias do programa
            </p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Dia
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">Dia {template.day_number}</span>
                      {!template.is_active && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">Inativo</span>
                      )}
                    </div>
                    <h3 className="font-semibold mt-1">{template.title_pt}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>+{template.xp_reward} XP</span>
                  {template.content_audio_url && <Volume2 className="h-4 w-4" />}
                  {template.content_video_url && <Video className="h-4 w-4" />}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Template" : "Criar Novo Template"}
              </DialogTitle>
              <DialogDescription>
                Configure o conteúdo do dia do programa
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Número do Dia *</label>
                  <Input
                    type="number"
                    value={formData.day_number || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, day_number: parseInt(e.target.value) })
                    }
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">XP de Recompensa</label>
                  <Input
                    type="number"
                    value={formData.xp_reward || 50}
                    onChange={(e) =>
                      setFormData({ ...formData, xp_reward: parseInt(e.target.value) })
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Multi-language Content */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pt" | "en" | "es")}>
                <TabsList>
                  <TabsTrigger value="pt">Português</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="es">Español</TabsTrigger>
                </TabsList>

                {(["pt", "en", "es"] as const).map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Título {lang === "pt" ? "(Obrigatório)" : ""} *
                      </label>
                      <Input
                        value={formData[`title_${lang}` as keyof typeof formData] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [`title_${lang}`]: e.target.value })
                        }
                        placeholder={`Título em ${lang === "pt" ? "Português" : lang === "en" ? "English" : "Español"}`}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Conteúdo de Texto</label>
                      <Textarea
                        value={formData[`content_text_${lang}` as keyof typeof formData] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [`content_text_${lang}`]: e.target.value,
                          })
                        }
                        placeholder={`Conteúdo em ${lang === "pt" ? "Português" : lang === "en" ? "English" : "Español"}`}
                        rows={6}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Citação Motivacional</label>
                      <Input
                        value={formData[`motivational_quote_${lang}` as keyof typeof formData] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [`motivational_quote_${lang}`]: e.target.value,
                          })
                        }
                        placeholder="Citação inspiradora..."
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Media URLs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">URL do Áudio</label>
                  <Input
                    value={formData.content_audio_url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, content_audio_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL do Vídeo</label>
                  <Input
                    value={formData.content_video_url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, content_video_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Tarefas do Dia</h3>
                  <Button variant="outline" size="sm" onClick={handleAddTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedDayTasks.map((task, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Tarefa {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTask(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Título PT *</label>
                            <Input
                              value={task.title_pt}
                              onChange={(e) =>
                                handleUpdateTask(index, "title_pt", e.target.value)
                              }
                              size="sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Tipo</label>
                            <select
                              value={task.task_type}
                              onChange={(e) =>
                                handleUpdateTask(index, "task_type", e.target.value)
                              }
                              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              <option value="checklist">Checklist</option>
                              <option value="reflection">Reflexão</option>
                              <option value="meditation">Meditação</option>
                              <option value="reading">Leitura</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">XP</label>
                            <Input
                              type="number"
                              value={task.xp_reward}
                              onChange={(e) =>
                                handleUpdateTask(index, "xp_reward", parseInt(e.target.value))
                              }
                              size="sm"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              checked={task.is_required}
                              onChange={(e) =>
                                handleUpdateTask(index, "is_required", e.target.checked)
                              }
                              className="h-4 w-4"
                            />
                            <label className="text-xs">Obrigatória</label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 border-t pt-4">
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





