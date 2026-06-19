import { RequirementService } from '../services/RequirementService.js'

const requirementService = new RequirementService()

export class RequirementController {
  async index(req: any, res: any) {
    try {
      const result = await requirementService.listRequirements(req.query)
      return res.json(result)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async show(req: any, res: any) {
    try {
      const requirement = await requirementService.getRequirementById(req.params.id)
      if (!requirement) {
        return res.status(404).json({ error: '需求不存在' })
      }

      const [comments, notes, attachments, histories] = await Promise.all([
        requirementService.getComments(req.params.id),
        requirementService.getNotes(req.params.id),
        requirementService.getAttachments(req.params.id),
        requirementService.getHistories(req.params.id),
      ])

      return res.json({ ...requirement, comments, notes, attachments, histories })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async store(req: any, res: any) {
    try {
      const requirement = await requirementService.createRequirement(req.body, req.user.id)
      return res.status(201).json(requirement)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async update(req: any, res: any) {
    try {
      const requirement = await requirementService.updateRequirement(req.params.id, req.body, req.user.id)
      if (!requirement) {
        return res.status(404).json({ error: '需求不存在' })
      }
      return res.json(requirement)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async destroy(req: any, res: any) {
    try {
      await requirementService.deleteRequirement(req.params.id)
      return res.json({ message: '删除成功' })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async addComment(req: any, res: any) {
    try {
      const { content, type = 'comment' } = req.body
      if (!content) {
        return res.status(400).json({ error: '评论内容不能为空' })
      }
      const comment = await requirementService.addComment(req.params.id, content, req.user.id, type)
      return res.status(201).json(comment)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async addNote(req: any, res: any) {
    try {
      const { content } = req.body
      if (!content) {
        return res.status(400).json({ error: '备注内容不能为空' })
      }
      const note = await requirementService.addNote(req.params.id, content, req.user.id)
      return res.status(201).json(note)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async uploadAttachment(req: any, res: any) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请选择文件' })
      }
      const attachment = await requirementService.addAttachment(req.params.id, req.file, req.user.id)
      return res.status(201).json(attachment)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async deleteAttachment(req: any, res: any) {
    try {
      const attachment = await requirementService.deleteAttachment(req.params.requirementId, req.params.attachmentId)
      if (!attachment) {
        return res.status(404).json({ error: '附件不存在' })
      }
      return res.json({ message: '附件已删除' })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async markAttachmentMissing(req: any, res: any) {
    try {
      const attachment = await requirementService.markAttachmentMissing(
        req.params.requirementId,
        req.params.attachmentId,
        req.user.id
      )
      if (!attachment) {
        return res.status(404).json({ error: '附件不存在' })
      }
      return res.json(attachment)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }
}
