import { Router, type Request, type Response } from 'express'
import Appointment from '../models/Appointment.js'
import AppointmentHistory from '../models/AppointmentHistory.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {}
    if (req.query.date) filter.date = req.query.date
    if (req.query.doctorId) filter.doctorId = req.query.doctorId
    if (req.query.status) filter.status = req.query.status
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: req.query.startDate as string, $lte: req.query.endDate as string }
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('doctorId', 'name title department')
        .populate('timeSlotId', 'startTime endTime label')
        .populate('serviceId', 'name category duration price')
        .populate('scheduleId')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: appointments,
      pagination: { page, limit, total },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.create(req.body)

    await AppointmentHistory.create({
      appointmentId: appointment._id,
      fromStatus: 'pending',
      toStatus: 'pending',
      changedBy: req.headers['x-operator-id'] as string || '',
      remark: 'Appointment created',
    })

    res.status(201).json({ success: true, data: appointment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const oldAppointment = await Appointment.findById(req.params.id)
    if (!oldAppointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' })
      return
    }

    const updateData: Record<string, any> = { ...req.body }
    delete updateData.status

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })

    if (req.body.status && req.body.status !== oldAppointment.status) {
      await AppointmentHistory.create({
        appointmentId: appointment!._id,
        fromStatus: oldAppointment.status,
        toStatus: req.body.status,
        changedBy: req.headers['x-operator-id'] as string || '',
        remark: req.body.remark || '',
      })
      appointment!.status = req.body.status
      await appointment!.save()
    }

    res.json({ success: true, data: appointment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.put('/:id/no-show', async (req: Request, res: Response): Promise<void> => {
  try {
    const { noShowReason } = req.body
    if (!noShowReason) {
      res.status(400).json({ success: false, error: 'noShowReason is required' })
      return
    }

    const oldAppointment = await Appointment.findById(req.params.id)
    if (!oldAppointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' })
      return
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'no_show', noShowReason },
      { new: true },
    )

    await AppointmentHistory.create({
      appointmentId: appointment!._id,
      fromStatus: oldAppointment.status,
      toStatus: 'no_show',
      changedBy: req.headers['x-operator-id'] as string || '',
      remark: `No-show reason: ${noShowReason}`,
    })

    res.json({ success: true, data: appointment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

router.get('/:id/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await AppointmentHistory.find({ appointmentId: req.params.id }).sort({ changedAt: -1 })
    res.json({ success: true, data: history })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
