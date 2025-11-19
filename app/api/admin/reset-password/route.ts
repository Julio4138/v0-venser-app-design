import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Esta rota requer autenticação de admin
export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Obter variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // Criar cliente com chave anônima para verificar o token do usuário
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o token é válido e obter o usuário
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se service role key está configurada
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta: SUPABASE_SERVICE_ROLE_KEY não configurada' },
        { status: 500 }
      )
    }

    // Criar cliente com service role para verificar perfil (ignora RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o usuário tem privilégios de admin
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single()

    if (profileCheckError) {
      console.error('Erro ao verificar perfil:', profileCheckError)
      return NextResponse.json(
        { error: 'Erro ao verificar permissões' },
        { status: 500 }
      )
    }

    if (!profile?.is_pro) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem alterar senhas.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, newPassword } = body

    // Validação
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'ID do usuário e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Alterar senha usando o cliente admin
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword
      }
    )

    if (updateError) {
      console.error('Erro ao alterar senha:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Erro ao alterar senha' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

