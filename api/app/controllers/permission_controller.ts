import PermissionRequest from '#models/permission_request'
import User from '#models/user'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export default class PermissionController {
  async pending({ response }: HttpContext) {
    const requests = await PermissionRequest.query()
      .where('status', 'pending')
      .preload('user')
      .orderBy('created_at', 'desc')

    return response.ok(requests)
  }

  async review({ params, request, response, auth }: HttpContext) {
    const { approved, comment } = request.only(['approved', 'comment'])
    const reviewer = auth.getUserOrFail()

    const permissionRequest = await PermissionRequest.findOrFail(params.id)

    if (permissionRequest.status !== 'pending') {
      return response.badRequest({ message: '该权限申请已被处理' })
    }

    permissionRequest.reviewerId = reviewer.id
    permissionRequest.reviewComment = comment || null
    permissionRequest.reviewedAt = DateTime.now()
    permissionRequest.status = approved ? 'approved' : 'rejected'

    await permissionRequest.save()

    if (approved) {
      const user = await User.findOrFail(permissionRequest.userId)
      user.role = permissionRequest.requestedRole as any
      await user.save()
    }

    await permissionRequest.load('user')
    await permissionRequest.load('reviewer')

    return response.ok(permissionRequest)
  }
}
