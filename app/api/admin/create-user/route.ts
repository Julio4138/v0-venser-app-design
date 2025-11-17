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
    
    // Obter variáveis de ambiente uma única vez
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

    // Verificar se o token é válido e obter o usuário (passando o token diretamente)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se service role key está configurada (necessária para verificar perfil ignorando RLS)
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

    // Verificar se o usuário tem privilégios de admin usando service role (ignora RLS)
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
        { error: 'Acesso negado. Apenas administradores podem criar usuários.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, full_name, language_preference, is_pro, start_date } = body

    // Validação
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Criar usuário no auth usando o cliente admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: full_name || null
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário no auth:', authError)
      return NextResponse.json(
        { error: authError.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado' },
        { status: 500 }
      )
    }

    // Atualizar perfil com informações adicionais
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name || null,
        language_preference: language_preference || 'pt',
        is_pro: is_pro || false,
        start_date: start_date || new Date().toISOString().split('T')[0],
      })
      .eq('id', authData.user.id)

    if (profileUpdateError) {
      console.error('Erro ao atualizar perfil:', profileUpdateError)
      // Não falhar aqui, o perfil já foi criado pelo trigger
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    })
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
