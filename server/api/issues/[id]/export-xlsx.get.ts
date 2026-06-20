import { prisma } from '../../../utils/prisma'
import { fail } from '../../../utils/response'
import ExcelJS from 'exceljs'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw fail('缺少议题ID', 400)
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reporter: true,
      photos: true,
      votes: { include: { resident: true } },
      rectifications: { include: { photos: true } },
      reviews: { include: { photos: true } },
      gridEvents: true,
      todos: true,
      operationLogs: { orderBy: { createdAt: 'asc' } }
    }
  })
  if (!issue) throw fail('议题不存在', 404, 404)

  const wb = new ExcelJS.Workbook()
  wb.creator = '居民议题看板'
  wb.created = new Date()

  const ws = wb.addWorksheet('议题单据')
  ws.columns = [
    { header: '字段', key: 'k', width: 22 },
    { header: '内容', key: 'v', width: 70 }
  ]
  const statusMap: any = { PENDING: '待处理', VOTING: '投票中', RECTIFYING: '整改中', REVIEWING: '复查中', DONE: '已完成', CANCELLED: '已取消' }
  const data = [
    { k: '单据编号', v: issue.code },
    { k: '标题', v: issue.title },
    { k: '分类', v: issue.category },
    { k: '优先级', v: issue.priority },
    { k: '状态', v: statusMap[issue.status] || issue.status },
    { k: '所属社区', v: issue.community || '-' },
    { k: '网格编号', v: issue.gridNo || '-' },
    { k: '位置', v: issue.location || '-' },
    { k: '反映人', v: `${issue.reporter?.name || '-'} (${issue.reporter?.phone || '-'})` },
    { k: '负责人', v: issue.handler || '-' },
    { k: '创建时间', v: issue.createdAt.toLocaleString('zh-CN') },
    { k: '问题描述', v: issue.description },
    { k: '投票截止', v: issue.voteEndAt?.toLocaleString('zh-CN') || '-' },
    { k: '整改截止', v: issue.rectifyDeadline?.toLocaleString('zh-CN') || '-' },
    { k: '是否公示', v: issue.published ? '是' : '否' }
  ]
  data.forEach(r => ws.addRow(r))
  ws.getRow(1).font = { bold: true }
  ws.getColumn('k').font = { bold: true }

  if (issue.votes.length) {
    const vs = wb.addWorksheet('投票记录')
    vs.columns = [
      { header: '时间', key: 't', width: 22 },
      { header: '居民', key: 'r', width: 24 },
      { header: '手机号', key: 'p', width: 16 },
      { header: '意见', key: 'o', width: 10 },
      { header: '备注', key: 'c', width: 50 }
    ]
    vs.getRow(1).font = { bold: true }
    issue.votes.forEach(v => vs.addRow({
      t: v.createdAt.toLocaleString('zh-CN'),
      r: v.resident?.name || '-',
      p: v.resident?.phone || '-',
      o: v.option,
      c: v.comment || ''
    }))
  }

  if (issue.rectifications.length) {
    const rs = wb.addWorksheet('整改记录')
    rs.columns = [
      { header: '时间', key: 't', width: 22 },
      { header: '负责人', key: 'h', width: 16 },
      { header: '整改措施', key: 'a', width: 50 },
      { header: '截止', key: 'd', width: 22 },
      { header: '完成状态', key: 's', width: 12 },
      { header: '备注', key: 'n', width: 40 }
    ]
    rs.getRow(1).font = { bold: true }
    issue.rectifications.forEach(r => rs.addRow({
      t: r.createdAt.toLocaleString('zh-CN'),
      h: r.handler || '-',
      a: r.action,
      d: r.deadline?.toLocaleString('zh-CN') || '-',
      s: r.completed ? `已完成 ${r.completedAt?.toLocaleString('zh-CN')}` : '未完成',
      n: r.note || ''
    }))
  }

  if (issue.reviews.length) {
    const rws = wb.addWorksheet('复查记录')
    rws.columns = [
      { header: '时间', key: 't', width: 22 },
      { header: '复查人', key: 'r', width: 16 },
      { header: '结果', key: 'e', width: 12 },
      { header: '评分', key: 'g', width: 8 },
      { header: '意见', key: 'c', width: 60 }
    ]
    rws.getRow(1).font = { bold: true }
    issue.reviews.forEach(r => rws.addRow({
      t: r.reviewedAt.toLocaleString('zh-CN'),
      r: r.reviewer,
      e: r.result,
      g: r.rated || '-',
      c: r.comment || ''
    }))
  }

  if (issue.operationLogs.length) {
    const ls = wb.addWorksheet('操作时间线')
    ls.columns = [
      { header: '时间', key: 't', width: 22 },
      { header: '操作人', key: 'o', width: 18 },
      { header: '动作', key: 'a', width: 20 },
      { header: '详情', key: 'd', width: 60 }
    ]
    ls.getRow(1).font = { bold: true }
    issue.operationLogs.forEach(l => ls.addRow({
      t: l.createdAt.toLocaleString('zh-CN'),
      o: l.operator,
      a: l.action,
      d: l.detail || '-'
    }))
  }

  const buffer = await wb.xlsx.writeBuffer()
  const filename = encodeURIComponent(`议题单据_${issue.code}.xlsx`)
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${filename}`)
  return buffer
})
