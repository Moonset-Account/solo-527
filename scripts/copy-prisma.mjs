#!/usr/bin/env node
import { existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const outputDir = join(rootDir, '.output', 'server', 'node_modules')
const sourceDir = join(rootDir, 'node_modules')

function copyDir(src, dest) {
  if (!existsSync(src)) return false
  mkdirSync(dirname(dest), { recursive: true })
  const entries = readdirSync(src, { withFileTypes: true })
  let copied = 0
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    if (entry.isDirectory()) {
      const n = copyDir(srcPath, destPath)
      copied += n
    } else {
      cpSync(srcPath, destPath)
      copied++
    }
  }
  return copied
}

function main() {
  console.log('\n[postbuild] 复制完整 Prisma Client 到生产产物...')

  const dotPrismaSrc = join(sourceDir, '.prisma')
  const dotPrismaDest = join(outputDir, '.prisma')
  if (existsSync(dotPrismaSrc)) {
    mkdirSync(dirname(dotPrismaDest), { recursive: true })
    // 先移除已有不完整的拷贝
    try {
      // 不能 rm，用户不让删。我们直接覆盖
    } catch (e) {}
    const count = copyDir(dotPrismaSrc, dotPrismaDest)
    console.log(`  ✓ .prisma → ${count} 个文件`)
  } else {
    console.warn('  ⚠ 未找到 node_modules/.prisma，请先执行 prisma generate')
  }

  const prismaClientSrc = join(sourceDir, '@prisma', 'client')
  const prismaClientDest = join(outputDir, '@prisma', 'client')
  if (existsSync(prismaClientSrc)) {
    mkdirSync(dirname(prismaClientDest), { recursive: true })
    const count = copyDir(prismaClientSrc, prismaClientDest)
    console.log(`  ✓ @prisma/client → ${count} 个文件`)
  }

  const prismaEngineDir = join(dotPrismaDest, 'client')
  if (existsSync(prismaEngineDir)) {
    const files = readdirSync(prismaEngineDir)
    const engines = files.filter(f => f.startsWith('libquery_engine') || f.startsWith('query-engine') || f.endsWith('.node'))
    console.log(`  ✓ query engine 二进制: ${engines.join(', ') || '未找到'}`)
  }

  console.log('[postbuild] Prisma Client 复制完成 ✅\n')
}

main()
