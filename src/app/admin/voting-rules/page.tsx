'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, Button, Input, Select, Modal, Textarea } from '@/components/ui'
import { formatDate } from '@/lib/utils'

const voteTypeOptions = [
  { value: 'SINGLE', label: '单选投票' },
  { value: 'MULTIPLE', label: '多选投票' },
  { value: 'RANKED', label: '排序投票' },
]

const adminNavItems = [
  { href: '/admin', label: '📊 仪表盘' },
  { href: '/admin/users', label: '👥 用户权限' },
  { href: '/admin/voting-rules', label: '⚙️ 投票规则', active: true },
  { href: '/admin/audit', label: '📜 审计日志' },
]

export default function AdminVotingRulesPage() {
  const { data, isLoading } = trpc.admin.listVotingRules.useQuery()
  const utils = trpc.useUtils()
  const [showCreate, setShowCreate] = useState(false)
  const [editRule, setEditRule] = useState<any>(null)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [voteType, setVoteType] = useState('SINGLE')
  const [quorum, setQuorum] = useState<string>('')
  const [threshold, setThreshold] = useState(0.5)
  const [allowAnonymous, setAllowAnonymous] = useState(false)
  const [allowAmendments, setAllowAmendments] = useState(true)
  const [duration, setDuration] = useState(72)
  const [requireVerify, setRequireVerify] = useState(true)

  const createMutation = trpc.admin.createVotingRule.useMutation({
    onSuccess: () => {
      setShowCreate(false); resetForm()
      utils.admin.listVotingRules.invalidate()
    },
  })
  const updateMutation = trpc.admin.updateVotingRule.useMutation({
    onSuccess: () => {
      setEditRule(null); resetForm()
      utils.admin.listVotingRules.invalidate()
    },
  })
  const deleteMutation = trpc.admin.deleteVotingRule.useMutation({
    onSuccess: () => utils.admin.listVotingRules.invalidate(),
  })

  const resetForm = () => {
    setName(''); setDesc(''); setVoteType('SINGLE'); setQuorum('')
    setThreshold(0.5); setAllowAnonymous(false); setAllowAmendments(true)
    setDuration(72); setRequireVerify(true)
  }

  const openCreate = () => { resetForm(); setShowCreate(true) }

  const openEdit = (rule: any) => {
    setEditRule(rule)
    setName(rule.name); setDesc(rule.description || '')
    setVoteType(rule.defaultVoteType); setQuorum(rule.defaultQuorum ? String(rule.defaultQuorum) : '')
    setThreshold(rule.defaultThreshold); setAllowAnonymous(rule.allowAnonymous)
    setAllowAmendments(rule.allowAmendments); setDuration(rule.votingDurationHours)
    setRequireVerify(rule.requireVerification)
  }

  const handleSubmit = () => {
    if (editRule) {
      updateMutation.mutate({
        id: editRule.id,
        description: desc || undefined,
        defaultVoteType: voteType as any,
        defaultQuorum: quorum ? parseInt(quorum) : undefined,
        defaultThreshold: threshold,
        allowAnonymous,
        allowAmendments,
        votingDurationHours: duration,
        requireVerification: requireVerify,
      })
    } else {
      createMutation.mutate({
        name: name.trim(),
        description: desc.trim() || undefined,
        defaultVoteType: voteType as any,
        defaultQuorum: quorum ? parseInt(quorum) : undefined,
        defaultThreshold: threshold,
        allowAnonymous,
        allowAmendments,
        votingDurationHours: duration,
        requireVerification: requireVerify,
      })
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">⚙️ 后台管理</h1>
        <p className="mt-1 text-sm text-slate-500">社区管理中心</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {adminNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              item.active
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>⚙️ 投票规则配置</CardTitle>
          <Button onClick={openCreate}>+ 新增规则</Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState icon="⚙️" title="暂无投票规则" description="点击右上角创建新的投票规则" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.map(rule => (
                <div key={rule.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                      {rule.description && <p className="mt-1 text-sm text-slate-500">{rule.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>编辑</Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm('确定删除？')) deleteMutation.mutate({ id: rule.id }) }}>
                        删除
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span>默认方式: {voteTypeOptions.find(o => o.value === rule.defaultVoteType)?.label}</span>
                    <span>通过阈值: {(rule.defaultThreshold * 100).toFixed(0)}%</span>
                    <span>投票时长: {rule.votingDurationHours}h</span>
                    <span>最低人数: {rule.defaultQuorum || '不限'}</span>
                    <span>{rule.allowAnonymous ? '🔓 允许匿名' : '🔒 实名投票'}</span>
                    <span>{rule.requireVerification ? '✅ 需验证' : '❌ 无需验证'}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">更新于 {formatDate(rule.updatedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showCreate || !!editRule}
        onClose={() => { setShowCreate(false); setEditRule(null) }}
        title={editRule ? '编辑投票规则' : '新增投票规则'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowCreate(false); setEditRule(null) }}>取消</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="规则名称" value={name} onChange={e => setName(e.target.value)} disabled={!!editRule} />
          <Textarea label="规则说明（可选）" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="默认投票方式" value={voteType} onChange={e => setVoteType(e.target.value)} options={voteTypeOptions} />
            <Input label="通过阈值（0-1）" type="number" step="0.05" min={0} max={1} value={threshold} onChange={e => setThreshold(parseFloat(e.target.value) || 0)} />
            <Input label="法定最低人数（可选）" type="number" placeholder="不设置则不限" value={quorum} onChange={e => setQuorum(e.target.value)} />
            <Input label="投票时长（小时）" type="number" min={1} value={duration} onChange={e => setDuration(parseInt(e.target.value) || 72)} />
          </div>
          <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allowAnonymous} onChange={e => setAllowAnonymous(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-rose-600" />
              允许匿名投票
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={allowAmendments} onChange={e => setAllowAmendments(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-rose-600" />
              允许提案修正
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={requireVerify} onChange={e => setRequireVerify(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-rose-600" />
              投票需身份验证
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
