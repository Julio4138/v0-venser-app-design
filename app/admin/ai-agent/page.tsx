"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Bot, 
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Trash2,
  Edit,
  Plus,
  Loader2,
  Settings,
  Brain,
  MessageSquare,
  File,
  X,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface AgentConfig {
  id: string
  agent_name: string
  system_prompt: string
  personality_traits: {
    empathy?: number
    patience?: number
    motivation?: number
    professionalism?: number
    warmth?: number
  }
  behavior_rules: string[]
  temperature: number
  max_tokens: number
  model_name: string
  is_active: boolean
}

interface KnowledgeItem {
  id: string
  title: string
  content: string
  content_type: "text" | "document" | "faq" | "guideline"
  file_url?: string
  file_name?: string
  file_type?: string
  category?: string
  priority: number
  is_active: boolean
  created_at: string
}

export default function AdminAIAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<AgentConfig | null>(null)
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([])
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [activeTab, setActiveTab] = useState<"config" | "knowledge" | "conversations">("config")

  // Form states
  const [systemPrompt, setSystemPrompt] = useState("")
  const [personalityTraits, setPersonalityTraits] = useState({
    empathy: 9,
    patience: 10,
    motivation: 9,
    professionalism: 8,
    warmth: 9,
  })
  const [behaviorRules, setBehaviorRules] = useState<string[]>([""])
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [modelName, setModelName] = useState("gpt-4")

  // Knowledge base form
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: "",
    content: "",
    content_type: "text" as const,
    category: "",
    priority: 0,
    file: null as File | null,
  })

  useEffect(() => {
    checkAdminAccess()
    loadAgentConfig()
    loadKnowledgeBase()
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

  const loadAgentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_agent_config")
        .select("*")
        .eq("agent_name", "Tony")
        .single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setConfig(data)
        setSystemPrompt(data.system_prompt)
        setPersonalityTraits(data.personality_traits || personalityTraits)
        setBehaviorRules(data.behavior_rules || [""])
        setTemperature(data.temperature || 0.7)
        setMaxTokens(data.max_tokens || 2000)
        setModelName(data.model_name || "gpt-4")
      }
    } catch (error) {
      console.error("Error loading agent config:", error)
      toast.error("Erro ao carregar configuração do agente")
    } finally {
      setLoading(false)
    }
  }

  const loadKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_agent_knowledge_base")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setKnowledgeBase(data || [])
    } catch (error) {
      console.error("Error loading knowledge base:", error)
      toast.error("Erro ao carregar base de conhecimento")
    }
  }

  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const configData = {
        agent_name: "Tony",
        system_prompt: systemPrompt,
        personality_traits: personalityTraits,
        behavior_rules: behaviorRules.filter((rule) => rule.trim().length > 0),
        temperature: parseFloat(temperature.toString()),
        max_tokens: parseInt(maxTokens.toString()),
        model_name: modelName,
        updated_by: user.id,
      }

      if (config) {
        // Update existing
        const { error } = await supabase
          .from("ai_agent_config")
          .update(configData)
          .eq("id", config.id)

        if (error) throw error
        toast.success("Configuração do agente atualizada com sucesso!")
      } else {
        // Create new
        const { error } = await supabase
          .from("ai_agent_config")
          .insert(configData)

        if (error) throw error
        toast.success("Configuração do agente criada com sucesso!")
      }

      await loadAgentConfig()
    } catch (error: any) {
      console.error("Error saving config:", error)
      toast.error(error.message || "Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `ai-agent/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("ai-agent-files")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("ai-agent-files")
        .getPublicUrl(filePath)

      if (!urlData) {
        throw new Error("Erro ao obter URL pública do arquivo")
      }

      return {
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      }
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast.error("Erro ao fazer upload do arquivo")
      throw error
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSaveKnowledge = async () => {
    try {
      if (!knowledgeForm.title || !knowledgeForm.content) {
        toast.error("Preencha título e conteúdo")
        return
      }

      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let fileData = null
      if (knowledgeForm.file) {
        fileData = await handleFileUpload(knowledgeForm.file)
      }

      const knowledgeData: any = {
        title: knowledgeForm.title,
        content: knowledgeForm.content,
        content_type: knowledgeForm.content_type,
        category: knowledgeForm.category || null,
        priority: knowledgeForm.priority,
        created_by: user.id,
      }

      if (fileData) {
        knowledgeData.file_url = fileData.file_url
        knowledgeData.file_name = fileData.file_name
        knowledgeData.file_type = fileData.file_type
        knowledgeData.file_size = fileData.file_size
      }

      if (isEditing && selectedItem) {
        const { error } = await supabase
          .from("ai_agent_knowledge_base")
          .update(knowledgeData)
          .eq("id", selectedItem.id)

        if (error) throw error
        toast.success("Item da base de conhecimento atualizado!")
      } else {
        const { error } = await supabase
          .from("ai_agent_knowledge_base")
          .insert(knowledgeData)

        if (error) throw error
        toast.success("Item adicionado à base de conhecimento!")
      }

      setIsDialogOpen(false)
      setSelectedItem(null)
      setKnowledgeForm({
        title: "",
        content: "",
        content_type: "text",
        category: "",
        priority: 0,
        file: null,
      })
      await loadKnowledgeBase()
    } catch (error: any) {
      console.error("Error saving knowledge:", error)
      toast.error(error.message || "Erro ao salvar item")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return

    try {
      const { error } = await supabase
        .from("ai_agent_knowledge_base")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Item excluído com sucesso!")
      await loadKnowledgeBase()
    } catch (error: any) {
      console.error("Error deleting knowledge:", error)
      toast.error(error.message || "Erro ao excluir item")
    }
  }

  const handleEditKnowledge = (item: KnowledgeItem) => {
    setSelectedItem(item)
    setKnowledgeForm({
      title: item.title,
      content: item.content,
      content_type: item.content_type,
      category: item.category || "",
      priority: item.priority,
      file: null,
    })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleAddKnowledge = () => {
    setSelectedItem(null)
    setKnowledgeForm({
      title: "",
      content: "",
      content_type: "text",
      category: "",
      priority: 0,
      file: null,
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const addBehaviorRule = () => {
    setBehaviorRules([...behaviorRules, ""])
  }

  const removeBehaviorRule = (index: number) => {
    setBehaviorRules(behaviorRules.filter((_, i) => i !== index))
  }

  const updateBehaviorRule = (index: number, value: string) => {
    const updated = [...behaviorRules]
    updated[index] = value
    setBehaviorRules(updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando configurações do agente...</p>
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
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bot className="h-8 w-8 text-primary" />
                Gerenciar Agente IA - Tony
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure o comportamento, personalidade e base de conhecimento do agente
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <Brain className="h-4 w-4 mr-2" />
              Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="conversations">
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversas
            </TabsTrigger>
          </TabsList>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Configurações do Agente</h3>
              
              <div className="space-y-6">
                {/* System Prompt */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Prompt do Sistema (System Prompt) *
                  </label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Defina como o agente deve se comportar, sua personalidade e propósito..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Este prompt define a identidade e comportamento base do agente Tony
                  </p>
                </div>

                {/* Personality Traits */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Traços de Personalidade</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(personalityTraits).map(([trait, value]) => (
                      <div key={trait} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm capitalize">{trait}</label>
                          <span className="text-sm font-medium">{value}/10</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={value}
                          onChange={(e) =>
                            setPersonalityTraits({
                              ...personalityTraits,
                              [trait]: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Behavior Rules */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Regras de Comportamento</label>
                  <div className="space-y-2">
                    {behaviorRules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={rule}
                          onChange={(e) => updateBehaviorRule(index, e.target.value)}
                          placeholder="Ex: Sempre seja respeitoso e não julgador"
                          className="flex-1"
                        />
                        {behaviorRules.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBehaviorRule(index)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addBehaviorRule}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Regra
                    </Button>
                  </div>
                </div>

                {/* Technical Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Temperatura</label>
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controla a criatividade (0-2)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                    <Input
                      type="number"
                      min="100"
                      max="4000"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tamanho máximo da resposta
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Modelo</label>
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveConfig}
                  disabled={saving || !systemPrompt}
                  className="w-full"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Base de Conhecimento</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie informações, documentos e FAQs que o agente usa
                  </p>
                </div>
                <Button onClick={handleAddKnowledge}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-4">
                {knowledgeBase.length > 0 ? (
                  knowledgeBase.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            <Badge variant="outline">{item.content_type}</Badge>
                            {item.category && (
                              <Badge variant="outline">{item.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.content}
                          </p>
                          {item.file_name && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <File className="h-3 w-3" />
                              <span>{item.file_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditKnowledge(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteKnowledge(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum item na base de conhecimento. Adicione o primeiro item!
                    </p>
                  </Card>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold">Histórico de Conversas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Analise conversas dos usuários com o agente para melhorar o desempenho
                </p>
              </div>
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Histórico de conversas será exibido aqui em breve
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Knowledge Base Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Item" : "Novo Item na Base de Conhecimento"}
              </DialogTitle>
              <DialogDescription>
                Adicione informações que o agente Tony usará para responder aos usuários
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título *</label>
                <Input
                  value={knowledgeForm.title}
                  onChange={(e) =>
                    setKnowledgeForm({ ...knowledgeForm, title: e.target.value })
                  }
                  placeholder="Ex: Como lidar com recaídas"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Conteúdo</label>
                <select
                  value={knowledgeForm.content_type}
                  onChange={(e) =>
                    setKnowledgeForm({
                      ...knowledgeForm,
                      content_type: e.target.value as any,
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="text">Texto</option>
                  <option value="document">Documento</option>
                  <option value="faq">FAQ</option>
                  <option value="guideline">Diretriz</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Conteúdo *</label>
                <Textarea
                  value={knowledgeForm.content}
                  onChange={(e) =>
                    setKnowledgeForm({ ...knowledgeForm, content: e.target.value })
                  }
                  placeholder="Digite o conteúdo que o agente deve usar..."
                  className="min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Input
                    value={knowledgeForm.category}
                    onChange={(e) =>
                      setKnowledgeForm({ ...knowledgeForm, category: e.target.value })
                    }
                    placeholder="Ex: Recuperação, Motivação..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={knowledgeForm.priority}
                    onChange={(e) =>
                      setKnowledgeForm({
                        ...knowledgeForm,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Upload de Arquivo (Opcional)</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setKnowledgeForm({ ...knowledgeForm, file })
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.txt,.doc,.docx,.md"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {knowledgeForm.file
                        ? knowledgeForm.file.name
                        : "Clique para fazer upload de um arquivo"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, TXT, DOC, DOCX, MD (máx. 10MB)
                    </span>
                  </label>
                </div>
                {knowledgeForm.file && (
                  <div className="flex items-center gap-2 mt-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{knowledgeForm.file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setKnowledgeForm({ ...knowledgeForm, file: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveKnowledge} disabled={saving || uploadingFile}>
                  {saving || uploadingFile ? (
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

