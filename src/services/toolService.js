import { BaseFirestoreService } from './baseService'
import { COLLECTIONS, TOOL_STATUS, BORROW_STATUS } from '@/models/schemas'

class ToolService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.TOOLS)
  }

  async getAvailableTools() {
    return this.getAll({
      where: [['status', '==', TOOL_STATUS.AVAILABLE]],
      orderBy: ['name', 'asc']
    })
  }

  async getToolsByCategory(category) {
    return this.getAll({
      where: [['category', '==', category]],
      orderBy: ['name', 'asc']
    })
  }

  async updateToolQuantity(toolId, quantityChange) {
    const tool = await this.getById(toolId)
    if (!tool) throw new Error('Tool not found')
    
    const newQuantity = tool.availableQuantity + quantityChange
    if (newQuantity < 0) throw new Error('Insufficient quantity')
    
    const status = newQuantity === 0 ? TOOL_STATUS.IN_USE : TOOL_STATUS.AVAILABLE
    
    return this.update(toolId, {
      availableQuantity: newQuantity,
      status
    })
  }

  async setMaintenance(toolId) {
    return this.update(toolId, {
      status: TOOL_STATUS.MAINTENANCE,
      lastMaintenanceDate: new Date()
    })
  }

  async getToolStatistics() {
    const tools = await this.getAll()
    const total = tools.reduce((sum, t) => sum + t.totalQuantity, 0)
    const available = tools.reduce((sum, t) => sum + t.availableQuantity, 0)
    const inMaintenance = tools.filter(t => t.status === TOOL_STATUS.MAINTENANCE).length
    
    return {
      totalTools: tools.length,
      totalQuantity: total,
      availableQuantity: available,
      inMaintenance,
      utilizationRate: total > 0 ? Math.round(((total - available) / total * 100) : 0
    }
  }
}

class ToolBorrowService extends BaseFirestoreService {
  constructor() {
    super(COLLECTIONS.TOOL_BORROWS)
  }

  async borrowTool(toolId, toolName, borrowerId, borrowerName, quantity, expectedReturnDays = 3) {
    const toolService = new ToolService()
    await toolService.updateToolQuantity(toolId, -quantity)
    
    const expectedReturnTime = new Date(Date.now() + expectedReturnDays * 24 * 60 * 60 * 1000)
    
    return this.create({
      toolId,
      toolName,
      borrowerId,
      borrowerName,
      quantity,
      borrowTime: new Date(),
      expectedReturnTime,
      status: BORROW_STATUS.BORROWED
    })
  }

  async returnTool(borrowId) {
    const borrow = await this.getById(borrowId)
    if (!borrow) throw new Error('Borrow record not found')
    
    const toolService = new ToolService()
    await toolService.updateToolQuantity(borrow.toolId, borrow.quantity)
    
    const isOverdue = new Date() > borrow.expectedReturnTime
    
    return this.update(borrowId, {
      returnTime: new Date(),
      status: isOverdue ? BORROW_STATUS.OVERDUE : BORROW_STATUS.RETURNED
    })
  }

  async getBorrowsByUser(borrowerId) {
    return this.getAll({
      where: [['borrowerId', '==', borrowerId]],
      orderBy: ['createdAt', 'desc']
    })
  }

  async getActiveBorrows() {
    return this.getAll({
      where: [['status', '==', BORROW_STATUS.BORROWED]],
      orderBy: ['expectedReturnTime', 'asc']
    })
  }

  async getOverdueBorrows() {
    const now = new Date()
    return this.getAll({
      where: [
        ['status', '==', BORROW_STATUS.BORROWED],
        ['expectedReturnTime', '<', now]
      ],
      orderBy: ['expectedReturnTime', 'asc']
    })
  }
}

export const toolService = new ToolService()
export const toolBorrowService = new ToolBorrowService()
