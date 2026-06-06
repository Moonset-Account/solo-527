import { BaseFirestoreService } from './baseService'
import { COLLECTIONS, CLAIM_STATUS, PLOT_STATUS } from '@/models/schemas'
import { plotService } from './plotService'

class ClaimService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.CLAIMS)
  }

  async createClaim(plotId, applicantId, applicantName, plotNumber, claimData) {
    return this.create({
      plotId,
      applicantId,
      applicantName,
      plotNumber,
      reason: claimData.reason,
      plannedCrops: claimData.plannedCrops || [],
      status: CLAIM_STATUS.PENDING
    })
  }

  async getClaimsByStatus(status) {
    return this.getAll({
      where: [['status', '==', status]],
      orderBy: ['createdAt', 'desc']
    })
  }

  async getClaimsByApplicant(applicantId) {
    return this.getAll({
      where: [['applicantId', '==', applicantId]],
      orderBy: ['createdAt', 'desc']
    })
  }

  async getPendingClaims() {
    return this.getClaimsByStatus(CLAIM_STATUS.PENDING)
  }

  async approveClaim(claimId, adminId, comment = '') {
    const claim = await this.getById(claimId)
    if (!claim) throw new Error('Claim not found')
    
    await plotService.claimPlot(claim.plotId, claim.applicantId)
    
    return this.update(claimId, {
      status: CLAIM_STATUS.APPROVED,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewComment: comment
    })
  }

  async rejectClaim(claimId, adminId, comment = '') {
    return this.update(claimId, {
      status: CLAIM_STATUS.REJECTED,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewComment: comment
    })
  }

  async cancelClaim(claimId) {
    return this.update(claimId, {
      status: CLAIM_STATUS.CANCELLED
    })
  }

  async getClaimStatistics() {
    const claims = await this.getAll()
    const total = claims.length
    const pending = claims.filter(c => c.status === CLAIM_STATUS.PENDING).length
    const approved = claims.filter(c => c.status === CLAIM_STATUS.APPROVED).length
    const rejected = claims.filter(c => c.status === CLAIM_STATUS.REJECTED).length
    
    return { total, pending, approved, rejected }
  }
}

export const claimService = new ClaimService()
