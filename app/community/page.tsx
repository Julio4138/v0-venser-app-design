"use client"
import { useState, useEffect, useRef } from "react"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useLanguage } from "@/lib/language-context"
import { translations } from "@/lib/translations"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Trophy, 
  Flame, 
  Award, 
  MessageCircle, 
  Heart, 
  ThumbsUp,
  Send,
  Image as ImageIcon,
  Smile,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  X
} from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

type TabType = "feed" | "performers" | "victories" | "support"

interface Post {
  id: string
  userInitial: string
  userName: string
  userAvatarUrl?: string | null
  userStreak: number
  isPro: boolean
  content: string
  imageUrl?: string
  likes: number
  comments: number
  shares: number
  timeAgo: string
  liked: boolean
  isAnonymous?: boolean
  commentsList?: Comment[]
}

interface Comment {
  id: string
  userInitial: string
  userName: string
  avatarUrl?: string | null
  content: string
  timeAgo: string
  likes: number
  liked: boolean
  isAnonymous?: boolean
}

export default function CommunityPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const { collapsed } = useSidebar()
  const [activeTab, setActiveTab] = useState<TabType>("feed")
  const [newPostContent, setNewPostContent] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  
  // Estados para foto do perfil e upload
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("Você")
  const [userInitial, setUserInitial] = useState<string>("V.")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para comentários
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  
  // Estados para posts reais
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Estados para post anônimo
  const [isAnonymousPostOpen, setIsAnonymousPostOpen] = useState(false)
  const [anonymousPostContent, setAnonymousPostContent] = useState("")
  const [anonymousPostImage, setAnonymousPostImage] = useState<File | null>(null)
  const [anonymousPostImagePreview, setAnonymousPostImagePreview] = useState<string | null>(null)
  const [isPostingAnonymous, setIsPostingAnonymous] = useState(false)
  
  // Estados para vitórias reais
  const [userVictories, setUserVictories] = useState<any[]>([])
  const [isLoadingVictories, setIsLoadingVictories] = useState(true)
  const [isShareVictoryDialogOpen, setIsShareVictoryDialogOpen] = useState(false)
  const [victoryStoryText, setVictoryStoryText] = useState("")
  const [selectedVictoryDays, setSelectedVictoryDays] = useState<number | null>(null)
  const [isSharingVictory, setIsSharingVictory] = useState(false)
  
  // Estados para ranking real
  const [realLeaderboard, setRealLeaderboard] = useState<any[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)
  
  // Emojis comuns para o seletor
  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "💪", "🔥", "✨", "⭐", "🌟", "💫", "🎉", "🎊", "🎈", "🎁",
    "❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️",
    "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️"
  ]
  
  // Carregar vitórias reais do usuário
  const loadUserVictories = async () => {
    try {
      setIsLoadingVictories(true)
      
      if (!currentUserId) {
        setIsLoadingVictories(false)
        return
      }

      // Buscar progresso do usuário
      const { data: progress } = await supabase
        .from("user_progress")
        .select("current_streak, longest_streak, total_days_clean, current_day")
        .eq("user_id", currentUserId)
        .single()

      // Buscar milestones alcançados
      const { data: milestones } = await supabase
        .from("milestones")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("achieved", true)
        .order("achieved_at", { ascending: false })

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .single()

      const victories: any[] = []

      // Adicionar milestones como vitórias
      if (milestones && milestones.length > 0) {
        milestones.forEach((milestone) => {
          const daysAgo = milestone.achieved_at 
            ? Math.floor((new Date().getTime() - new Date(milestone.achieved_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0
          
          let dateText = ""
          if (daysAgo === 0) dateText = language === "pt" ? "Hoje" : "Today"
          else if (daysAgo === 1) dateText = language === "pt" ? "1 dia atrás" : "1 day ago"
          else if (daysAgo < 7) dateText = language === "pt" ? `${daysAgo} dias atrás` : `${daysAgo} days ago`
          else if (daysAgo < 30) {
            const weeks = Math.floor(daysAgo / 7)
            dateText = language === "pt" ? `${weeks} ${weeks === 1 ? "semana" : "semanas"} atrás` : `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
          } else {
            const months = Math.floor(daysAgo / 30)
            dateText = language === "pt" ? `${months} ${months === 1 ? "mês" : "meses"} atrás` : `${months} ${months === 1 ? "month" : "months"} ago`
          }

          victories.push({
            id: milestone.id,
            type: "milestone",
            days: milestone.days_required,
            date: dateText,
            achievedAt: milestone.achieved_at,
            milestoneType: milestone.milestone_type
          })
        })
      }

      // Adicionar streak atual como vitória se for significativo (7+ dias)
      if (progress && progress.current_streak >= 7) {
        const streakMilestones = [7, 14, 30, 60, 90]
        const hasMilestone = milestones?.some(m => 
          streakMilestones.includes(m.days_required) && m.achieved
        )
        
        if (!hasMilestone || progress.current_streak >= 7) {
          victories.push({
            id: `streak-${progress.current_streak}`,
            type: "streak",
            days: progress.current_streak,
            date: language === "pt" ? "Em progresso" : "In progress",
            isCurrent: true
          })
        }
      }

      // Ordenar por dias (maior primeiro)
      victories.sort((a, b) => b.days - a.days)
      
      setUserVictories(victories)
    } catch (error) {
      console.error("Error loading user victories:", error)
    } finally {
      setIsLoadingVictories(false)
    }
  }

  // Carregar foto do perfil do usuário e posts
  useEffect(() => {
    loadUserProfile()
    loadPosts()
  }, [])
  
  // Carregar vitórias quando currentUserId estiver disponível
  useEffect(() => {
    if (currentUserId) {
      loadUserVictories()
    }
  }, [currentUserId, language])
  
  // Carregar ranking quando a aba performers for ativada
  useEffect(() => {
    if (activeTab === "performers" && !isLoadingLeaderboard) {
      loadRealLeaderboard()
    }
  }, [activeTab])
  
  // Função helper para formatar tempo relativo
  const formatTimeAgo = (date: string): string => {
    const now = new Date()
    const postDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)
    
    if (diffInSeconds < 60) return language === "pt" ? "agora" : "now"
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return language === "pt" ? `${minutes}min` : `${minutes}m`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return language === "pt" ? `${hours}h` : `${hours}h`
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return language === "pt" ? `${days}d` : `${days}d`
    }
    const weeks = Math.floor(diffInSeconds / 604800)
    return language === "pt" ? `${weeks}sem` : `${weeks}w`
  }
  
  // Função helper para obter iniciais
  const getInitials = (name: string | null): string => {
    if (!name) return "U."
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0][0].toUpperCase() + "."
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join(".")
  }
  
  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return
      
      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .single()

      if (profile) {
        if (profile.avatar_url) {
          setUserAvatarUrl(profile.avatar_url)
        }
        if (profile.full_name) {
          setUserName(profile.full_name)
          setUserInitial(getInitials(profile.full_name))
        } else {
          setUserName("Você")
          setUserInitial("V.")
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }
  
  const loadPosts = async () => {
    try {
      setIsLoadingPosts(true)
      
      // Buscar posts (incluindo anônimos, mas não contar no ranking)
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (postsError) throw postsError

      if (!postsData) {
        setPosts([])
        setIsLoadingPosts(false)
        return
      }

      // Buscar perfis dos usuários
      const userIds = postsData.map(p => p.user_id)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, is_pro")
        .in("id", userIds)

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p]) || []
      )

      // Buscar progresso dos usuários para obter streak
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("user_id, current_streak")
        .in("user_id", userIds)

      const progressMap = new Map(
        progressData?.map(p => [p.user_id, p.current_streak]) || []
      )

      // Buscar likes do usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      let userLikes: string[] = []
      let userCommentLikes: string[] = []
      
      if (user) {
        const { data: likesData } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id)
        
        userLikes = likesData?.map(l => l.post_id) || []
        
        const { data: commentLikesData } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", user.id)
        
        userCommentLikes = commentLikesData?.map(l => l.comment_id) || []
      }

      // Buscar comentários para cada post
      const postIds = postsData.map(p => p.id)
      const { data: commentsData } = await supabase
        .from("post_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
      
      // Buscar perfis dos comentários
      const commentUserIds = commentsData?.map(c => c.user_id) || []
      const { data: commentProfilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", commentUserIds)
      
      const commentProfilesMap = new Map(
        commentProfilesData?.map(p => [p.id, p]) || []
      )

      const commentsMap = new Map<string, any[]>()
      commentsData?.forEach(comment => {
        if (!commentsMap.has(comment.post_id)) {
          commentsMap.set(comment.post_id, [])
        }
        commentsMap.get(comment.post_id)!.push(comment)
      })

      // Transformar dados para o formato esperado
      const formattedPosts: Post[] = postsData.map(post => {
        const profile = profilesMap.get(post.user_id)
        const streak = progressMap.get(post.user_id) || 0
        const comments = commentsMap.get(post.id) || []
        
        const formattedComments: Comment[] = comments.map(comment => {
          const commentProfile = commentProfilesMap.get(comment.user_id)
          const isCommentAnonymous = comment.is_anonymous || false
          return {
            id: comment.id,
            userInitial: isCommentAnonymous ? "A." : getInitials(commentProfile?.full_name),
            userName: isCommentAnonymous ? "Anônimo" : (commentProfile?.full_name || "Usuário"),
            avatarUrl: isCommentAnonymous ? null : (commentProfile?.avatar_url || null),
            content: comment.content,
            timeAgo: formatTimeAgo(comment.created_at),
            likes: comment.likes_count || 0,
            liked: user ? userCommentLikes.includes(comment.id) : false,
            isAnonymous: isCommentAnonymous
          }
        })

        return {
          id: post.id,
          userInitial: post.is_anonymous ? "A." : getInitials(profile?.full_name),
          userName: post.is_anonymous ? "Anônimo" : (profile?.full_name || "Usuário"),
          userAvatarUrl: post.is_anonymous ? null : (profile?.avatar_url || null),
          userStreak: post.is_anonymous ? 0 : streak,
          isPro: post.is_anonymous ? false : (profile?.is_pro || false),
          content: post.content,
          imageUrl: post.image_url || undefined,
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: 0, // Não implementado ainda
          timeAgo: formatTimeAgo(post.created_at),
          liked: user ? userLikes.includes(post.id) : false,
          isAnonymous: post.is_anonymous || false,
          commentsList: formattedComments
        }
      })

      setPosts(formattedPosts)
    } catch (error) {
      console.error("Error loading posts:", error)
      toast.error(language === "pt" ? "Erro ao carregar posts" : "Error loading posts")
    } finally {
      setIsLoadingPosts(false)
    }
  }
  
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error(language === "pt" ? "Por favor, selecione uma imagem" : "Please select an image")
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "pt" ? "A imagem deve ter no máximo 5MB" : "Image must be less than 5MB")
      return
    }

    setSelectedImage(file)
    
    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  const handleAnonymousImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error(language === "pt" ? "Por favor, selecione uma imagem" : "Please select an image")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "pt" ? "A imagem deve ter no máximo 5MB" : "Image must be less than 5MB")
      return
    }

    setAnonymousPostImage(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setAnonymousPostImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const handleRemoveAnonymousImage = () => {
    setAnonymousPostImage(null)
    setAnonymousPostImagePreview(null)
  }
  
  const handlePostAnonymous = async () => {
    if (!anonymousPostContent.trim() && !anonymousPostImage) return
    
    if (!currentUserId) {
      toast.error(language === "pt" ? "Você precisa estar logado" : "You need to be logged in")
      return
    }
    
    setIsPostingAnonymous(true)
    
    let imageUrl: string | undefined = undefined
    
    // Upload da imagem se houver
    if (anonymousPostImage) {
      try {
        const fileExt = anonymousPostImage.name.split(".").pop()
        const fileName = `anonymous_post_${currentUserId}_${Date.now()}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, anonymousPostImage, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          toast.error(language === "pt" ? "Erro ao fazer upload da imagem" : "Error uploading image")
          setIsPostingAnonymous(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath)
        
        imageUrl = publicUrl
      } catch (error) {
        console.error("Error uploading image:", error)
        toast.error(language === "pt" ? "Erro ao fazer upload da imagem" : "Error uploading image")
        setIsPostingAnonymous(false)
        return
      }
    }
    
    try {
      // Criar post anônimo no Supabase
      const { data: newPostData, error: postError } = await supabase
        .from("community_posts")
        .insert({
          user_id: currentUserId,
          content: anonymousPostContent.trim(),
          image_url: imageUrl || null,
          is_anonymous: true
        })
        .select("*")
        .single()

      if (postError) throw postError

      const newPost: Post = {
        id: newPostData.id,
        userInitial: "A.",
        userName: "Anônimo",
        userStreak: 0,
        isPro: false,
        content: newPostData.content,
        imageUrl: newPostData.image_url || undefined,
        likes: 0,
        comments: 0,
        shares: 0,
        timeAgo: formatTimeAgo(newPostData.created_at),
        liked: false,
        isAnonymous: true,
        commentsList: []
      }
      
      setPosts([newPost, ...posts])
      setAnonymousPostContent("")
      setAnonymousPostImage(null)
      setAnonymousPostImagePreview(null)
      setIsAnonymousPostOpen(false)
      
      toast.success(language === "pt" ? "Post anônimo publicado! 🔒" : "Anonymous post published! 🔒", {
        duration: 2000,
      })
    } catch (error) {
      console.error("Error creating anonymous post:", error)
      toast.error(language === "pt" ? "Erro ao publicar post anônimo" : "Error publishing anonymous post")
    } finally {
      setIsPostingAnonymous(false)
    }
  }
  
  const handleEmojiSelect = (emoji: string) => {
    setNewPostContent(prev => prev + emoji)
    setIsEmojiPickerOpen(false)
  }
  
  const handleToggleComments = (postId: string) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null)
    } else {
      setOpenCommentsPostId(postId)
    }
  }
  
  const handleAddComment = async (postId: string) => {
    const commentText = commentTexts[postId]?.trim()
    if (!commentText) return
    
    if (!currentUserId) {
      toast.error(language === "pt" ? "Você precisa estar logado" : "You need to be logged in")
      return
    }
    
    // Verificar se o post é anônimo
    const post = posts.find(p => p.id === postId)
    const isPostAnonymous = post?.isAnonymous || false
    
    try {
      // Criar comentário no Supabase
      const { data: newCommentData, error: commentError } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: commentText,
          is_anonymous: isPostAnonymous // Comentários em posts anônimos são anônimos
        })
        .select("*")
        .single()

      if (commentError) throw commentError

      // Se o comentário é anônimo, não buscar perfil
      const isCommentAnonymous = isPostAnonymous
      let profile = null
      if (!isCommentAnonymous) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", currentUserId)
          .single()
        profile = profileData
      }
      
      const newComment: Comment = {
        id: newCommentData.id,
        userInitial: isCommentAnonymous ? "A." : getInitials(profile?.full_name || userName),
        userName: isCommentAnonymous ? "Anônimo" : (profile?.full_name || userName),
        avatarUrl: isCommentAnonymous ? null : (profile?.avatar_url || userAvatarUrl),
        content: newCommentData.content,
        timeAgo: formatTimeAgo(newCommentData.created_at),
        likes: 0,
        liked: false,
        isAnonymous: isCommentAnonymous
      }
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const updatedComments = post.commentsList || []
          return {
            ...post,
            comments: post.comments + 1,
            commentsList: [newComment, ...updatedComments]
          }
        }
        return post
      }))
      
      // Limpar o texto do comentário
      setCommentTexts(prev => ({ ...prev, [postId]: "" }))
      
      toast.success(language === "pt" ? "Comentário adicionado! 💬" : "Comment added! 💬", {
        duration: 1500,
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error(language === "pt" ? "Erro ao adicionar comentário" : "Error adding comment")
    }
  }
  
  const handleCommentTextChange = (postId: string, text: string) => {
    setCommentTexts(prev => ({ ...prev, [postId]: text }))
  }
  
  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!currentUserId) {
      toast.error(language === "pt" ? "Você precisa estar logado" : "You need to be logged in")
      return
    }

    const post = posts.find(p => p.id === postId)
    const comment = post?.commentsList?.find(c => c.id === commentId)
    if (!comment) return

    const isLiked = comment.liked

    try {
      if (isLiked) {
        // Remover like
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId)

        if (error) throw error
      } else {
        // Adicionar like
        const { error } = await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: currentUserId
          })

        if (error) throw error
      }

      // Atualizar estado local
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const updatedComments = p.commentsList?.map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                liked: !c.liked,
                likes: c.liked ? c.likes - 1 : c.likes + 1
              }
            }
            return c
          })
          return {
            ...p,
            commentsList: updatedComments
          }
        }
        return p
      }))
      
      toast.success("👍", {
        duration: 1000,
      })
    } catch (error) {
      console.error("Error toggling comment like:", error)
      toast.error(language === "pt" ? "Erro ao curtir comentário" : "Error liking comment")
    }
  }


  // Carregar ranking real dos melhores performers
  const loadRealLeaderboard = async () => {
    try {
      setIsLoadingLeaderboard(true)
      
      // Buscar todos os usuários com progresso
      const { data: allProgress, error: progressError } = await supabase
        .from("user_progress")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(100) // Limitar para performance

      if (progressError) throw progressError

      if (!allProgress || allProgress.length === 0) {
        setRealLeaderboard([])
        setIsLoadingLeaderboard(false)
        return
      }

      // Buscar perfis dos usuários
      const userIds = allProgress.map(p => p.user_id)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, is_pro")
        .in("id", userIds)

      const profilesMap = new Map(
        profiles?.map(p => [p.id, p]) || []
      )

      // Buscar contagem de missões completadas por usuário
      const { data: missionCompletions } = await supabase
        .from("mission_completions")
        .select("user_id")
        .in("user_id", userIds)

      const missionsCountMap = new Map<string, number>()
      missionCompletions?.forEach(mc => {
        missionsCountMap.set(mc.user_id, (missionsCountMap.get(mc.user_id) || 0) + 1)
      })

      // Buscar contagem de milestones alcançados por usuário
      const { data: milestones } = await supabase
        .from("milestones")
        .select("user_id")
        .in("user_id", userIds)
        .eq("achieved", true)

      const milestonesCountMap = new Map<string, number>()
      milestones?.forEach(m => {
        milestonesCountMap.set(m.user_id, (milestonesCountMap.get(m.user_id) || 0) + 1)
      })

      // Buscar contagem de dias do programa completados
      const { data: programDays } = await supabase
        .from("program_days")
        .select("user_id")
        .in("user_id", userIds)
        .eq("completed", true)

      const programDaysCountMap = new Map<string, number>()
      programDays?.forEach(pd => {
        programDaysCountMap.set(pd.user_id, (programDaysCountMap.get(pd.user_id) || 0) + 1)
      })

      // Calcular score combinado para cada usuário
      const leaderboardData = allProgress.map((progress) => {
        const profile = profilesMap.get(progress.user_id)
        const missionsCount = missionsCountMap.get(progress.user_id) || 0
        const milestonesCount = milestonesCountMap.get(progress.user_id) || 0
        const programDaysCount = programDaysCountMap.get(progress.user_id) || 0

        // Calcular score combinado:
        // - XP total (peso 1)
        // - Streak atual (peso 2 - mais importante)
        // - Dias limpos (peso 1.5)
        // - Missões completadas (peso 0.5)
        // - Milestones alcançados (peso 3 - muito importante)
        // - Dias do programa completados (peso 1)
        const score = 
          (progress.total_xp || 0) * 1 +
          (progress.current_streak || 0) * 2 +
          (progress.total_days_clean || 0) * 1.5 +
          missionsCount * 0.5 +
          milestonesCount * 3 +
          programDaysCount * 1

        return {
          userId: progress.user_id,
          initial: profile?.full_name ? getInitials(profile.full_name) : "U.",
          streak: progress.current_streak || 0,
          isPro: profile?.is_pro || false,
          totalXp: progress.total_xp || 0,
          totalDaysClean: progress.total_days_clean || 0,
          missionsCount,
          milestonesCount,
          programDaysCount,
          score
        }
      })

      // Ordenar por score (maior primeiro)
      leaderboardData.sort((a, b) => b.score - a.score)

      // Adicionar rank
      const rankedLeaderboard = leaderboardData.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))

      setRealLeaderboard(rankedLeaderboard)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
      toast.error(language === "pt" ? "Erro ao carregar ranking" : "Error loading leaderboard")
    } finally {
      setIsLoadingLeaderboard(false)
    }
  }

  // Função para compartilhar vitória no feed
  const handleShareVictory = async () => {
    if (!victoryStoryText.trim() || !selectedVictoryDays) {
      toast.error(language === "pt" ? "Por favor, escreva sua história de vitória" : "Please write your victory story")
      return
    }

    if (!currentUserId) {
      toast.error(language === "pt" ? "Você precisa estar logado" : "You need to be logged in")
      return
    }

    setIsSharingVictory(true)

    try {
      // Criar post no feed com a vitória
      const victoryContent = `${victoryStoryText}\n\n🎉 ${selectedVictoryDays} ${language === "pt" ? "dias" : "days"} de vitória! 🔥`

      const { data: newPostData, error: postError } = await supabase
        .from("community_posts")
        .insert({
          user_id: currentUserId,
          content: victoryContent,
          image_url: null,
          is_anonymous: false
        })
        .select("*")
        .single()

      if (postError) throw postError

      // Buscar perfil e streak do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_pro")
        .eq("id", currentUserId)
        .single()

      const { data: progress } = await supabase
        .from("user_progress")
        .select("current_streak")
        .eq("user_id", currentUserId)
        .single()

      const newPost: Post = {
        id: newPostData.id,
        userInitial: getInitials(profile?.full_name || userName),
        userName: profile?.full_name || userName,
        userStreak: progress?.current_streak || 0,
        isPro: profile?.is_pro || false,
        content: newPostData.content,
        imageUrl: newPostData.image_url || undefined,
        likes: 0,
        comments: 0,
        shares: 0,
        timeAgo: formatTimeAgo(newPostData.created_at),
        liked: false,
        isAnonymous: false,
        commentsList: []
      }

      setPosts([newPost, ...posts])
      setVictoryStoryText("")
      setSelectedVictoryDays(null)
      setIsShareVictoryDialogOpen(false)
      
      toast.success(language === "pt" ? "Vitória compartilhada no feed! 🎉" : "Victory shared on feed! 🎉", {
        duration: 2000,
      })

      // Recarregar posts para garantir sincronização
      loadPosts()
    } catch (error) {
      console.error("Error sharing victory:", error)
      toast.error(language === "pt" ? "Erro ao compartilhar vitória" : "Error sharing victory")
    } finally {
      setIsSharingVictory(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      toast.error(language === "pt" ? "Você precisa estar logado" : "You need to be logged in")
      return
    }

    const post = posts.find(p => p.id === postId)
    if (!post) return

    const isLiked = post.liked

    try {
      if (isLiked) {
        // Remover like
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId)

        if (error) throw error
      } else {
        // Adicionar like
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: currentUserId
          })

        if (error) throw error
      }

      // Atualizar estado local
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            liked: !p.liked,
            likes: p.liked ? p.likes - 1 : p.likes + 1
          }
        }
        return p
      }))
      
      // Feedback visual dopaminérgico
      toast.success("❤️", {
        duration: 1000,
      })
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error(language === "pt" ? "Erro ao curtir post" : "Error liking post")
    }
  }

  const handlePost = async () => {
    if (!newPostContent.trim() && !selectedImage) return
    
    if (!currentUserId) {
      toast.error(language === "pt" ? "Você precisa estar logado" : "You need to be logged in")
      return
    }
    
    setIsPosting(true)
    
    let imageUrl: string | undefined = undefined
    
    // Upload da imagem se houver
    if (selectedImage) {
      try {
        const fileExt = selectedImage.name.split(".").pop()
        const fileName = `post_${currentUserId}_${Date.now()}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from("avatars") // Usando o mesmo bucket, ou pode criar um bucket 'posts'
          .upload(filePath, selectedImage, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          toast.error(language === "pt" ? "Erro ao fazer upload da imagem" : "Error uploading image")
          setIsPosting(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath)
        
        imageUrl = publicUrl
      } catch (error) {
        console.error("Error uploading image:", error)
        toast.error(language === "pt" ? "Erro ao fazer upload da imagem" : "Error uploading image")
        setIsPosting(false)
        return
      }
    }
    
    try {
      // Criar post no Supabase
      const { data: newPostData, error: postError } = await supabase
        .from("community_posts")
        .insert({
          user_id: currentUserId,
          content: newPostContent.trim(),
          image_url: imageUrl || null,
          is_anonymous: false
        })
        .select("*")
        .single()

      if (postError) throw postError

      // Buscar perfil e streak do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_pro")
        .eq("id", currentUserId)
        .single()

      const { data: progress } = await supabase
        .from("user_progress")
        .select("current_streak")
        .eq("user_id", currentUserId)
        .single()
      const newPost: Post = {
        id: newPostData.id,
        userInitial: getInitials(profile?.full_name || userName),
        userName: profile?.full_name || userName,
        userAvatarUrl: profile?.avatar_url || userAvatarUrl,
        userStreak: progress?.current_streak || 0,
        isPro: profile?.is_pro || false,
        content: newPostData.content,
        imageUrl: newPostData.image_url || undefined,
        likes: 0,
        comments: 0,
        shares: 0,
        timeAgo: formatTimeAgo(newPostData.created_at),
        liked: false,
        isAnonymous: false,
        commentsList: []
      }
      
      setPosts([newPost, ...posts])
      setNewPostContent("")
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      toast.success(language === "pt" ? "Post publicado com sucesso! 🎉" : "Post published successfully! 🎉", {
        duration: 2000,
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error(language === "pt" ? "Erro ao publicar post" : "Error publishing post")
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopSidebar />

      <div className={cn(collapsed ? "md:ml-20 lg:ml-20" : "md:ml-56 lg:ml-64")}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 md:pt-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
          {/* Header com Tabs */}
          <Card className="p-4 md:p-6 venser-card-glow">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] bg-clip-text text-transparent text-center">
                {language === "pt" ? "Comunidade" : "Community"}
              </h1>
              
              {/* Tab Selectors */}
              <div className="flex flex-wrap gap-2 justify-center items-center">
                <Button
                  onClick={() => setActiveTab("feed")}
                  variant={activeTab === "feed" ? "default" : "outline"}
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "feed"
                      ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white border-0 shadow-lg hover:shadow-xl scale-105"
                      : "hover:bg-accent"
                  )}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {language === "pt" ? "Feed" : "Feed"}
                </Button>
                
                <Button
                  onClick={() => setActiveTab("performers")}
                  variant={activeTab === "performers" ? "default" : "outline"}
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "performers"
                      ? "bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0 shadow-lg hover:shadow-xl scale-105"
                      : "hover:bg-accent"
                  )}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {t.topPerformers}
                </Button>
                
                <Button
                  onClick={() => setActiveTab("victories")}
                  variant={activeTab === "victories" ? "default" : "outline"}
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "victories"
                      ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white border-0 shadow-lg hover:shadow-xl scale-105"
                      : "hover:bg-accent"
                  )}
                >
                  <Award className="h-4 w-4 mr-2" />
                  {t.victoryStories}
                </Button>
                
                <Button
                  onClick={() => setIsAnonymousPostOpen(true)}
                  variant={activeTab === "support" ? "default" : "outline"}
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "support"
                      ? "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white border-0 shadow-lg hover:shadow-xl scale-105"
                      : "hover:bg-accent"
                  )}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t.anonymousSupport}
                </Button>
              </div>
            </div>
          </Card>

          {/* Content based on active tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            {activeTab === "feed" && (
              <div className="lg:col-span-2 space-y-4">
                {/* Create Post Card */}
                <Card className="p-4 md:p-6 venser-card-glow border-2 border-[oklch(0.54_0.18_285)]/20">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {userAvatarUrl ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[oklch(0.54_0.18_285)]">
                          <img
                            src={userAvatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center text-white font-bold text-lg">
                          {userInitial}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">Compartilhe algo...</p>
                        <p className="text-xs text-muted-foreground">Sua jornada inspira outros!</p>
                      </div>
                    </div>
                    
                    <Textarea
                      placeholder={language === "pt" ? "O que está em sua mente?" : "What's on your mind?"}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[100px] resize-none border-2 focus:border-[oklch(0.54_0.18_285)]"
                    />
                    
                    {/* Preview da imagem selecionada */}
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-64 object-cover rounded-lg border-2 border-[oklch(0.54_0.18_285)]/30"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-accent"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {language === "pt" ? "Foto" : "Photo"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-accent"
                          onClick={() => setIsEmojiPickerOpen(true)}
                        >
                          <Smile className="h-4 w-4 mr-2" />
                          {language === "pt" ? "Emoji" : "Emoji"}
                        </Button>
                      </div>
                      
                      <Button
                        onClick={handlePost}
                        disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
                        className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {isPosting ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            {language === "pt" ? "Publicando..." : "Posting..."}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {language === "pt" ? "Publicar" : "Post"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Posts Feed */}
                {isLoadingPosts ? (
                  <Card className="p-8 text-center">
                    <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-[oklch(0.54_0.18_285)]" />
                    <p className="text-muted-foreground">
                      {language === "pt" ? "Carregando posts..." : "Loading posts..."}
                    </p>
                  </Card>
                ) : posts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">
                      {language === "pt" ? "Nenhum post ainda" : "No posts yet"}
                    </p>
                    <p className="text-muted-foreground">
                      {language === "pt" ? "Seja o primeiro a compartilhar algo com a comunidade!" : "Be the first to share something with the community!"}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                    <Card 
                      key={post.id} 
                      className="p-4 md:p-6 venser-card-glow hover:shadow-xl transition-all duration-300 border-2 hover:border-[oklch(0.54_0.18_285)]/30"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {post.isAnonymous ? (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)]/50 to-[oklch(0.7_0.15_220)]/50 flex items-center justify-center text-white font-bold text-lg border-2 border-[oklch(0.54_0.18_285)]/30">
                              A.
                            </div>
                          ) : post.userAvatarUrl ? (
                            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[oklch(0.54_0.18_285)]">
                              <img
                                src={post.userAvatarUrl}
                                alt={post.userName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center text-white font-bold text-lg">
                              {post.userInitial}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{post.userName}</p>
                              {post.isAnonymous && (
                                <Badge className="bg-gradient-to-r from-[oklch(0.54_0.18_285)]/80 to-[oklch(0.7_0.15_220)]/80 text-white border-0 text-xs">
                                  {language === "pt" ? "Anônimo" : "Anonymous"}
                                </Badge>
                              )}
                              {post.isPro && !post.isAnonymous && (
                                <Badge className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0 text-xs">
                                  PRO
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {!post.isAnonymous && (
                                <>
                                  <Flame className="h-3 w-3 text-[oklch(0.68_0.18_45)]" />
                                  <span>{post.userStreak} {t.days}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{post.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-sm leading-relaxed mb-4">{post.content}</p>
                      
                      {/* Post Image */}
                      {post.imageUrl && (
                        <div className="mb-4">
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            className="w-full max-h-96 object-cover rounded-lg border-2 border-[oklch(0.54_0.18_285)]/20"
                          />
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={cn(
                            "transition-all duration-200",
                            post.liked 
                              ? "text-[oklch(0.68_0.18_45)] hover:text-[oklch(0.68_0.18_45)]" 
                              : "hover:text-[oklch(0.68_0.18_45)]"
                          )}
                        >
                          <Heart className={cn("h-4 w-4 mr-2", post.liked && "fill-current")} />
                          <span className={cn(post.liked && "font-semibold")}>{post.likes}</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "hover:text-[oklch(0.54_0.18_285)]",
                            openCommentsPostId === post.id && "text-[oklch(0.54_0.18_285)]"
                          )}
                          onClick={() => handleToggleComments(post.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {post.comments}
                        </Button>
                        
                      </div>

                      {/* Comments Section */}
                      {openCommentsPostId === post.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          {/* Input para adicionar comentário */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {userAvatarUrl ? (
                                <div className="h-8 w-8 rounded-full overflow-hidden border border-[oklch(0.54_0.18_285)]/30">
                                  <img
                                    src={userAvatarUrl}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)]/30 to-[oklch(0.7_0.15_220)]/30 flex items-center justify-center text-xs font-bold">
                                  {userInitial}
                                </div>
                              )}
                              <div className="flex-1 flex gap-2">
                                <Textarea
                                  placeholder={language === "pt" ? "Escreva um comentário..." : "Write a comment..."}
                                  value={commentTexts[post.id] || ""}
                                  onChange={(e) => handleCommentTextChange(post.id, e.target.value)}
                                  className="min-h-[60px] resize-none text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                      handleAddComment(post.id)
                                    }
                                  }}
                                />
                                <Button
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!commentTexts[post.id]?.trim()}
                                  size="sm"
                                  className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 disabled:opacity-50 h-[60px]"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground ml-10">
                              {language === "pt" ? "Pressione Ctrl+Enter para enviar" : "Press Ctrl+Enter to send"}
                            </p>
                          </div>
                          
                          {/* Lista de comentários existentes */}
                          {post.commentsList && post.commentsList.length > 0 ? (
                            <div className="space-y-3">
                              {post.commentsList.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  {comment.isAnonymous ? (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)]/50 to-[oklch(0.7_0.15_220)]/50 flex items-center justify-center text-xs font-bold shrink-0 border border-[oklch(0.54_0.18_285)]/30">
                                      A.
                                    </div>
                                  ) : comment.avatarUrl ? (
                                    <div className="h-8 w-8 rounded-full overflow-hidden border border-[oklch(0.54_0.18_285)]/30 shrink-0">
                                      <img
                                        src={comment.avatarUrl}
                                        alt={comment.userName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)]/30 to-[oklch(0.7_0.15_220)]/30 flex items-center justify-center text-xs font-bold shrink-0">
                                      {comment.userInitial}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-muted rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-xs">{comment.userName}</p>
                                        {comment.isAnonymous && (
                                          <Badge className="bg-gradient-to-r from-[oklch(0.54_0.18_285)]/80 to-[oklch(0.7_0.15_220)]/80 text-white border-0 text-[10px] px-1.5 py-0">
                                            {language === "pt" ? "Anônimo" : "Anonymous"}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm break-words">{comment.content}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 ml-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={cn(
                                          "h-6 px-2 text-xs transition-all duration-200",
                                          comment.liked 
                                            ? "text-[oklch(0.68_0.18_45)] hover:text-[oklch(0.68_0.18_45)]" 
                                            : "hover:text-[oklch(0.68_0.18_45)]"
                                        )}
                                        onClick={() => handleLikeComment(post.id, comment.id)}
                                      >
                                        <ThumbsUp className={cn("h-3 w-3 mr-1", comment.liked && "fill-current")} />
                                        <span className={cn(comment.liked && "font-semibold")}>{comment.likes}</span>
                                      </Button>
                                      <span className="text-xs text-muted-foreground">{comment.timeAgo}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {language === "pt" ? "Nenhum comentário ainda. Seja o primeiro!" : "No comments yet. Be the first!"}
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                  </div>
                )}
              </div>
            )}

            {/* Sidebar - Always visible on desktop, hidden on mobile when feed is active */}
            <div className={cn(
              "space-y-6",
              activeTab === "feed" && "hidden lg:block"
            )}>
              {/* Top Performers */}
              {activeTab === "performers" ? (
                <div className="lg:col-span-3 space-y-6">
                  <Card className="p-5 md:p-6 venser-card-glow">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-[oklch(0.68_0.18_45)]" />
                        {t.topPerformers}
                      </h2>
                      <Badge className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0">
                        {t.proLabel}
                      </Badge>
                    </div>

                    {isLoadingLeaderboard ? (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-[oklch(0.68_0.18_45)]" />
                        <p className="text-muted-foreground">
                          {language === "pt" ? "Carregando ranking..." : "Loading leaderboard..."}
                        </p>
                      </div>
                    ) : realLeaderboard.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-semibold mb-2">
                          {language === "pt" ? "Nenhum ranking ainda" : "No leaderboard yet"}
                        </p>
                        <p className="text-muted-foreground">
                          {language === "pt" 
                            ? "Seja o primeiro a aparecer no ranking!"
                            : "Be the first to appear on the leaderboard!"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {realLeaderboard.map((entry) => (
                          <Card
                            key={entry.userId}
                            className={cn(
                              "p-4 transition-all hover:shadow-lg",
                              entry.rank <= 3 &&
                              "bg-gradient-to-r from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 border-[oklch(0.54_0.18_285)]/30"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div
                                  className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0",
                                    entry.rank === 1
                                      ? "bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white"
                                      : entry.rank === 2
                                        ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white"
                                        : entry.rank === 3
                                          ? "bg-gradient-to-br from-[oklch(0.68_0.18_45)]/70 to-[oklch(0.7_0.15_220)]/70 text-white"
                                          : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {entry.rank === 1 && <Trophy className="h-6 w-6" />}
                                  {entry.rank !== 1 && entry.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{entry.initial}</p>
                                    {entry.isPro && (
                                      <Badge variant="outline" className="text-[oklch(0.68_0.18_45)] text-xs">
                                        {t.proLabel}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1">
                                      <Flame className="h-3 w-3 text-[oklch(0.68_0.18_45)]" />
                                      <span>{entry.streak} {t.days}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3" />
                                      <span>{entry.totalXp.toLocaleString()} XP</span>
                                    </div>
                                    {entry.missionsCount > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{entry.missionsCount} {language === "pt" ? "missões" : "missions"}</span>
                                      </>
                                    )}
                                    {entry.milestonesCount > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{entry.milestonesCount} {language === "pt" ? "marcos" : "milestones"}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <div className="text-xs text-muted-foreground mb-1">
                                  {language === "pt" ? "Score" : "Score"}
                                </div>
                                <div className="text-lg font-bold text-[oklch(0.68_0.18_45)]">
                                  {Math.round(entry.score).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    <Button className="w-full mt-4 bg-transparent" variant="outline">
                      {t.upgradePro}
                    </Button>
                  </Card>
                </div>
              ) : activeTab === "feed" && (
                <Card className="p-5 md:p-6 venser-card-glow">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                      <Trophy className="h-6 w-6 text-[oklch(0.68_0.18_45)]" />
                      {t.topPerformers}
                    </h2>
                    <Badge className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0">
                      {t.proLabel}
                    </Badge>
                  </div>

                  {isLoadingLeaderboard ? (
                    <div className="text-center py-4">
                      <Clock className="h-6 w-6 animate-spin mx-auto mb-2 text-[oklch(0.68_0.18_45)]" />
                      <p className="text-xs text-muted-foreground">
                        {language === "pt" ? "Carregando..." : "Loading..."}
                      </p>
                    </div>
                  ) : realLeaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {realLeaderboard.slice(0, 5).map((entry) => (
                        <Card
                          key={entry.userId}
                          className={cn(
                            "p-3 transition-all hover:shadow-lg",
                            entry.rank <= 3 &&
                            "bg-gradient-to-r from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 border-[oklch(0.54_0.18_285)]/30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                  entry.rank === 1
                                    ? "bg-gradient-to-br from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white"
                                    : entry.rank === 2
                                      ? "bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white"
                                      : entry.rank === 3
                                        ? "bg-gradient-to-br from-[oklch(0.68_0.18_45)]/70 to-[oklch(0.7_0.15_220)]/70 text-white"
                                        : "bg-muted text-muted-foreground"
                                )}
                              >
                                {entry.rank === 1 && <Trophy className="h-5 w-5" />}
                                {entry.rank !== 1 && entry.rank}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{entry.initial}</p>
                                  {entry.isPro && (
                                    <Badge variant="outline" className="text-[oklch(0.68_0.18_45)] text-[10px] px-1.5 py-0">
                                      {t.proLabel}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Flame className="h-3 w-3 text-[oklch(0.68_0.18_45)]" />
                                  <span>{entry.streak} {t.days}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === "pt" ? "Nenhum ranking ainda" : "No leaderboard yet"}
                    </p>
                  )}

                  <Button 
                    className="w-full mt-4 bg-transparent" 
                    variant="outline"
                    onClick={() => setActiveTab("performers")}
                  >
                    {language === "pt" ? "Ver ranking completo" : "View full leaderboard"}
                  </Button>
                </Card>
              )}

              {/* Victory Stories */}
              {activeTab === "victories" && (
                <div className="lg:col-span-3 space-y-6">
                  <Card className="p-5 md:p-6 venser-card-glow">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <Award className="h-6 w-6 text-[oklch(0.54_0.18_285)]" />
                        {t.victoryStories}
                      </h2>
                    </div>

                    {isLoadingVictories ? (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-[oklch(0.54_0.18_285)]" />
                        <p className="text-muted-foreground">
                          {language === "pt" ? "Carregando suas vitórias..." : "Loading your victories..."}
                        </p>
                      </div>
                    ) : userVictories.length === 0 ? (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-semibold mb-2">
                          {language === "pt" ? "Nenhuma vitória ainda" : "No victories yet"}
                        </p>
                        <p className="text-muted-foreground mb-4">
                          {language === "pt" 
                            ? "Continue sua jornada e alcance marcos para compartilhar suas vitórias!"
                            : "Continue your journey and reach milestones to share your victories!"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userVictories.map((victory) => (
                          <Card key={victory.id} className="p-6 hover:border-[oklch(0.54_0.18_285)] transition-all">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center text-white font-bold">
                                    {userInitial}
                                  </div>
                                  <div>
                                    <p className="font-semibold">{userName}</p>
                                    <p className="text-sm text-muted-foreground">{victory.date}</p>
                                  </div>
                                </div>
                                <Badge className="bg-gradient-to-r from-[oklch(0.68_0.18_45)] to-[oklch(0.7_0.18_30)] text-white border-0">
                                  {victory.days} {t.days}
                                </Badge>
                              </div>
                              {victory.type === "milestone" && (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                  {language === "pt" 
                                    ? `🎉 Alcançou ${victory.days} dias de recuperação! Uma conquista incrível na sua jornada.`
                                    : `🎉 Reached ${victory.days} days of recovery! An incredible achievement on your journey.`}
                                </p>
                              )}
                              {victory.type === "streak" && victory.isCurrent && (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                  {language === "pt" 
                                    ? `🔥 Sequência atual de ${victory.days} dias! Continue assim!`
                                    : `🔥 Current streak of ${victory.days} days! Keep it up!`}
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    <Button 
                      onClick={() => {
                        if (userVictories.length > 0) {
                          // Selecionar a maior vitória por padrão
                          const biggestVictory = userVictories[0]
                          setSelectedVictoryDays(biggestVictory.days)
                        }
                        setIsShareVictoryDialogOpen(true)
                      }}
                      disabled={userVictories.length === 0}
                      className="w-full mt-6 bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 disabled:opacity-50"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t.shareVictory}
                    </Button>
                  </Card>
                </div>
              )}

              {/* Anonymous Support */}
              {activeTab === "support" && (
                <Card className="p-6 bg-gradient-to-br from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 venser-card-glow">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] flex items-center justify-center mx-auto">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{t.anonymousSupport}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {language === "pt" 
                          ? "Conecte-se com outros na mesma jornada. Compartilhe experiências e apoie-se mutuamente de forma anônima."
                          : "Connect with others on the same journey. Share experiences and support each other anonymously."}
                      </p>
                    </div>
                    <Button size="lg" variant="outline" className="w-full">
                      {language === "pt" ? "Entrar no Fórum da Comunidade" : "Join Community Forum"}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      <MobileNav translations={t} />
      
      {/* Emoji Picker Dialog */}
      <Dialog open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "pt" ? "Selecione um Emoji" : "Select an Emoji"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto p-4">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-2 rounded hover:bg-accent"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Share Victory Dialog */}
      <Dialog open={isShareVictoryDialogOpen} onOpenChange={setIsShareVictoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[oklch(0.54_0.18_285)]" />
              {language === "pt" ? "Compartilhar Minha Vitória" : "Share My Victory"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {language === "pt" 
                ? "Compartilhe sua história de vitória com a comunidade e inspire outros na jornada!"
                : "Share your victory story with the community and inspire others on the journey!"}
            </p>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Seleção de vitória */}
            {userVictories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "pt" ? "Selecione sua vitória:" : "Select your victory:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {userVictories.map((victory) => (
                    <Button
                      key={victory.id}
                      variant={selectedVictoryDays === victory.days ? "default" : "outline"}
                      onClick={() => setSelectedVictoryDays(victory.days)}
                      className={cn(
                        "justify-start",
                        selectedVictoryDays === victory.days &&
                        "bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white"
                      )}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      {victory.days} {t.days}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              placeholder={language === "pt" 
                ? "Conte sua história de vitória... Como você se sente? O que mudou? O que te ajudou?"
                : "Tell your victory story... How do you feel? What changed? What helped you?"}
              value={victoryStoryText}
              onChange={(e) => setVictoryStoryText(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            
            {selectedVictoryDays && (
              <div className="p-4 bg-gradient-to-r from-[oklch(0.54_0.18_285)]/10 to-[oklch(0.7_0.15_220)]/10 rounded-lg border border-[oklch(0.54_0.18_285)]/20">
                <p className="text-sm font-semibold mb-1">
                  {language === "pt" ? "Preview do post:" : "Post preview:"}
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {victoryStoryText || (language === "pt" ? "Sua história aparecerá aqui..." : "Your story will appear here...")}
                </p>
                {victoryStoryText && (
                  <p className="text-sm mt-2">
                    🎉 {selectedVictoryDays} {language === "pt" ? "dias" : "days"} de vitória! 🔥
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsShareVictoryDialogOpen(false)
                setVictoryStoryText("")
                setSelectedVictoryDays(null)
              }}
            >
              {language === "pt" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={handleShareVictory}
              disabled={!victoryStoryText.trim() || !selectedVictoryDays || isSharingVictory}
              className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {isSharingVictory ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {language === "pt" ? "Compartilhando..." : "Sharing..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {language === "pt" ? "Compartilhar no Feed" : "Share on Feed"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Anonymous Post Dialog */}
      <Dialog open={isAnonymousPostOpen} onOpenChange={setIsAnonymousPostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[oklch(0.54_0.18_285)]" />
              {language === "pt" ? "Suporte Anônimo" : "Anonymous Support"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {language === "pt" 
                ? "Compartilhe sua experiência de forma anônima. Seu nome e perfil não serão exibidos."
                : "Share your experience anonymously. Your name and profile will not be displayed."}
            </p>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={language === "pt" ? "Compartilhe sua experiência de forma anônima..." : "Share your experience anonymously..."}
              value={anonymousPostContent}
              onChange={(e) => setAnonymousPostContent(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            
            {/* Preview da imagem */}
            {anonymousPostImagePreview && (
              <div className="relative">
                <img
                  src={anonymousPostImagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg border-2 border-[oklch(0.54_0.18_285)]/30"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAnonymousImage}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleAnonymousImageSelect}
                className="hidden"
                id="anonymous-image-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("anonymous-image-upload")?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {language === "pt" ? "Adicionar Foto" : "Add Photo"}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAnonymousPostOpen(false)
                setAnonymousPostContent("")
                setAnonymousPostImage(null)
                setAnonymousPostImagePreview(null)
              }}
            >
              {language === "pt" ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={handlePostAnonymous}
              disabled={(!anonymousPostContent.trim() && !anonymousPostImage) || isPostingAnonymous}
              className="bg-gradient-to-r from-[oklch(0.54_0.18_285)] to-[oklch(0.7_0.15_220)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPostingAnonymous ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {language === "pt" ? "Publicando..." : "Publishing..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {language === "pt" ? "Publicar Anonimamente" : "Publish Anonymously"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
