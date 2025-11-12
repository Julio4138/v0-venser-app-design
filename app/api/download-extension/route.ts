import { NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { createReadStream } from 'fs'
import { Readable } from 'stream'

export async function GET() {
  try {
    // Caminho para a pasta da extensão
    const extensionPath = join(process.cwd(), 'browser-extension')
    
    // Lista de arquivos da extensão
    const files = [
      'manifest.json',
      'background.js',
      'popup.html',
      'popup.js',
      'blocked.html'
    ]
    
    // Cria um objeto com todos os arquivos
    const extensionFiles: Record<string, string> = {}
    
    for (const file of files) {
      try {
        const filePath = join(extensionPath, file)
        const content = await readFile(filePath, 'utf-8')
        extensionFiles[file] = content
      } catch (error) {
        console.error(`Erro ao ler ${file}:`, error)
      }
    }
    
    // Retorna os arquivos como JSON (o cliente pode criar o ZIP)
    return NextResponse.json({
      files: extensionFiles,
      message: 'Extensão VENSER Blocker'
    })
  } catch (error) {
    console.error('Erro ao preparar download:', error)
    return NextResponse.json(
      { error: 'Erro ao preparar download da extensão' },
      { status: 500 }
    )
  }
}

