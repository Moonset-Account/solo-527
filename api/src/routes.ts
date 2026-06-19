import { Router } from 'express'
import multer from 'multer'
import { diskStorage } from 'multer'
import { authMiddleware } from './middleware/auth.js'
import { rbac } from './middleware/rbac.js'
import { AuthController } from './controllers/AuthController.js'
import { RequirementController } from './controllers/RequirementController.js'
import { ReminderController } from './controllers/ReminderController.js'
import { AdminController } from './controllers/AdminController.js'

const router = Router()

const authController = new AuthController()
const requirementController = new RequirementController()
const reminderController = new ReminderController()
const adminController = new AdminController()

const upload = multer({
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, process.env.UPLOAD_DIR || './uploads')
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + '-' + file.originalname)
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
})

router.post('/auth/login', (req, res) => authController.login(req, res))
router.get('/auth/me', authMiddleware, (req, res) => authController.me(req, res))

router.get('/requirements', authMiddleware, (req, res) => requirementController.index(req, res))
router.post('/requirements', authMiddleware, (req, res) => requirementController.store(req, res))
router.get('/requirements/:id', authMiddleware, (req, res) => requirementController.show(req, res))
router.put('/requirements/:id', authMiddleware, (req, res) => requirementController.update(req, res))
router.delete('/requirements/:id', authMiddleware, (req, res) => requirementController.destroy(req, res))
router.post('/requirements/:id/comments', authMiddleware, (req, res) => requirementController.addComment(req, res))
router.post('/requirements/:id/notes', authMiddleware, (req, res) => requirementController.addNote(req, res))
router.post('/requirements/:id/attachments', authMiddleware, upload.single('file'), (req, res) => requirementController.uploadAttachment(req, res))
router.delete('/requirements/:requirementId/attachments/:attachmentId', authMiddleware, (req, res) => requirementController.deleteAttachment(req, res))
router.patch('/requirements/:requirementId/attachments/:attachmentId', authMiddleware, (req, res) => requirementController.markAttachmentMissing(req, res))

router.get('/reminders', authMiddleware, (req, res) => reminderController.index(req, res))
router.post('/reminders', authMiddleware, rbac('project_pm', 'admin'), (req, res) => reminderController.store(req, res))
router.patch('/reminders/:id/acknowledge', authMiddleware, (req, res) => reminderController.acknowledge(req, res))

router.get('/admin/dictionaries', authMiddleware, rbac('admin'), (req, res) => adminController.listDictionaries(req, res))
router.post('/admin/dictionaries', authMiddleware, rbac('admin'), (req, res) => adminController.createDictionary(req, res))
router.put('/admin/dictionaries/:id', authMiddleware, rbac('admin'), (req, res) => adminController.updateDictionary(req, res))
router.delete('/admin/dictionaries/:id', authMiddleware, rbac('admin'), (req, res) => adminController.deleteDictionary(req, res))

router.get('/admin/thresholds', authMiddleware, rbac('admin'), (req, res) => adminController.listThresholds(req, res))
router.post('/admin/thresholds', authMiddleware, rbac('admin'), (req, res) => adminController.createThreshold(req, res))
router.put('/admin/thresholds/:id', authMiddleware, rbac('admin'), (req, res) => adminController.updateThreshold(req, res))
router.delete('/admin/thresholds/:id', authMiddleware, rbac('admin'), (req, res) => adminController.deleteThreshold(req, res))

router.get('/admin/default-assignees', authMiddleware, rbac('admin'), (req, res) => adminController.listDefaultAssignees(req, res))
router.post('/admin/default-assignees', authMiddleware, rbac('admin'), (req, res) => adminController.createDefaultAssignee(req, res))
router.put('/admin/default-assignees/:id', authMiddleware, rbac('admin'), (req, res) => adminController.updateDefaultAssignee(req, res))
router.delete('/admin/default-assignees/:id', authMiddleware, rbac('admin'), (req, res) => adminController.deleteDefaultAssignee(req, res))

router.get('/admin/users', authMiddleware, rbac('admin'), (req, res) => adminController.listUsers(req, res))
router.post('/admin/users', authMiddleware, rbac('admin'), (req, res) => adminController.createUser(req, res))
router.put('/admin/users/:id', authMiddleware, rbac('admin'), (req, res) => adminController.updateUser(req, res))
router.delete('/admin/users/:id', authMiddleware, rbac('admin'), (req, res) => adminController.deleteUser(req, res))

router.get('/admin/logs', authMiddleware, rbac('admin'), (req, res) => adminController.listLogs(req, res))

export default router
