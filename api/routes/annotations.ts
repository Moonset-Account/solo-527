import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { annotations as seedAnnotations } from '../mock-data.js'
import type { Annotation } from '../mock-data.js'

const router = Router()

const mutableAnnotations: Annotation[] = [...seedAnnotations]

router.get('/', (req: Request, res: Response): void => {
  const targetType = req.query.targetType as string | undefined
  const targetId = req.query.targetId as string | undefined

  let result = mutableAnnotations

  if (targetType) {
    result = result.filter((a) => a.targetType === targetType)
  }
  if (targetId) {
    result = result.filter((a) => a.targetId === targetId)
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { targetType, targetId, content, author } = req.body

  if (!targetType || !targetId || !content) {
    res.status(400).json({ success: false, error: 'targetType, targetId, and content are required' })
    return
  }

  if (!['order', 'product', 'reason', 'warehouse'].includes(targetType)) {
    res.status(400).json({ success: false, error: 'targetType must be order, product, reason, or warehouse' })
    return
  }

  const now = new Date().toISOString()
  const annotation: Annotation = {
    id: uuidv4(),
    targetType,
    targetId,
    content,
    author: author ?? 'anonymous',
    createdAt: now,
    updatedAt: now,
  }

  mutableAnnotations.push(annotation)
  res.status(201).json({ success: true, data: annotation })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const idx = mutableAnnotations.findIndex((a) => a.id === id)

  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Annotation not found' })
    return
  }

  const existing = mutableAnnotations[idx]
  mutableAnnotations[idx] = {
    ...existing,
    content: req.body.content ?? existing.content,
    author: req.body.author ?? existing.author,
    updatedAt: new Date().toISOString(),
  }

  res.json({ success: true, data: mutableAnnotations[idx] })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const idx = mutableAnnotations.findIndex((a) => a.id === id)

  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Annotation not found' })
    return
  }

  mutableAnnotations.splice(idx, 1)
  res.json({ success: true, data: null })
})

export default router
