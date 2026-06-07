import { Router, type Request, type Response } from 'express'
import { getNotes, addNote, getAllNotes } from '../services/notes.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json(getAllNotes())
})

router.get('/:targetKey', (req: Request, res: Response) => {
  const notes = getNotes(req.params.targetKey)
  res.json(notes)
})

router.post('/', (req: Request, res: Response) => {
  const { targetKey, content, author } = req.body
  if (!targetKey || !content) {
    res.status(400).json({ error: 'targetKey 和 content 不能为空' })
    return
  }
  const note = addNote(targetKey, content, author || '匿名')
  res.json(note)
})

export default router
