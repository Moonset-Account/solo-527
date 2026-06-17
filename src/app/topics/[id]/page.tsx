'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, Button, EmptyState, Textarea, Modal } from '@/components/ui'
import { TopicStatusBadge } from '@/components/Badges'
import { formatDate, cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'

export default function TopicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id as string
  const { user } = useUser()
  const { data, isLoading } = trpc.topic.get.useQuery({ id: topicId })
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const voteMutation = trpc.topic.vote.useMutation({
    onSuccess: () => {
      setShowConfirm(false)
      router.refresh()
    },
  })
  const startVotingMutation = trpc.topic.startVoting.useMutation({ onSuccess: () => router.refresh() })
  const publishMutation = trpc.topic.publish.useMutation({ onSuccess: () => router.refresh() })
  const closeMutation = trpc.topic.close.useMutation({ onSuccess: () => router.refresh() })

  const handleToggleOption = (optionId: string) => {
    if (!data) return
    const maxSel = data.maxSelections || 1
    setSelectedOptions(prev => {
      if (data.voteType === 'SINGLE') {
        return [optionId]
      }
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId)
      }
      if (prev.length >= maxSel) {
        return prev
      }
      return [...prev, optionId]
    })
  }

  const handleSubmitVote = () => {
    if (selectedOptions.length === 0) return
    voteMutation.mutate({
      topicId,
      optionIds: selectedOptions,
      comment: comment.trim() || undefined,
    })
  }

  if (isLoading) {
    return <div className="mx-auto max-w-3xl">
      <Card><CardBody><div className="h-32 animate-pulse rounded bg-slate-100" /></CardBody></Card>
    </div>
  }

  if (!data) {
    return <EmptyState icon="❓" title="议题不存在" description="该议题可能已被删除" />
  }

  const isVoting = data.status === 'VOTING'
  const hasVoted = data.userVotedOptionIds.length > 0
  const totalVotes = data.voteStats.reduce((sum, s) => sum + s._count.id, 0)
  const maxSel = data.maxSelections || 1

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← 返回议题列表
      </button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl">{data.title}</CardTitle>
                <TopicStatusBadge status={data.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {data.startAt && <span>📅 开始: {formatDate(data.startAt)}</span>}
                {data.endAt && <span>⏰ 截止: {formatDate(data.endAt)}</span>}
                <span>📊 已投票: {totalVotes} 人</span>
                {data.voteType === 'SINGLE' && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">单选</span>}
                {data.voteType === 'MULTIPLE' && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">多选 (最多{maxSel}项)</span>}
                {data.voteType === 'RANKED' && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">排序投票</span>}
                {data.isAnonymous && <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">匿名投票</span>}
              </div>
            </div>
            {(data.status === 'DRAFT') && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => publishMutation.mutate({ id: topicId })}>
                  发布
                </Button>
                <Button size="sm" onClick={() => startVotingMutation.mutate({ id: topicId })}>
                  开始投票
                </Button>
              </div>
            )}
            {data.status === 'PUBLISHED' && (
              <Button size="sm" onClick={() => startVotingMutation.mutate({ id: topicId })}>
                开始投票
              </Button>
            )}
            {data.status === 'VOTING' && (
              <Button variant="secondary" size="sm" onClick={() => closeMutation.mutate({ id: topicId })}>
                结束投票
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {data.description}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isVoting ? (hasVoted ? '✅ 你已投票，查看选项' : '请选择你的投票选项') : '投票选项与结果'}
          </CardTitle>
          {isVoting && !hasVoted && (
            <p className="mt-1 text-sm text-slate-500">
              {data.voteType === 'SINGLE' && '请选择 1 个选项'}
              {data.voteType === 'MULTIPLE' && `请选择 1 - ${maxSel} 个选项`}
              {data.voteType === 'RANKED' && `请按偏好顺序选择最多 ${maxSel} 个选项`}
            </p>
          )}
        </CardHeader>
        <CardBody className="space-y-3">
          {data.options.map((opt, i) => {
            const stat = data.voteStats.find(s => s.optionId === opt.id)
            const count = stat?._count.id ?? 0
            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0
            const isSelected = selectedOptions.includes(opt.id) || data.userVotedOptionIds.includes(opt.id)
            const selectedRank = data.voteType === 'RANKED' ? selectedOptions.indexOf(opt.id) + 1 : 0
            const disabled = !isVoting || hasVoted

            return (
              <button
                key={opt.id}
                onClick={() => !disabled && handleToggleOption(opt.id)}
                disabled={disabled}
                className={cn(
                  'relative w-full overflow-hidden rounded-xl border-2 p-4 text-left transition-all',
                  disabled ? 'cursor-default' : 'cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/40',
                  isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                )}
              >
                <div className="absolute inset-y-0 left-0 bg-emerald-100/60 transition-all" style={{ width: `${pct}%` }} />
                <div className="relative z-10 flex items-center gap-3">
                  <div className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'
                  )}>
                    {data.voteType === 'RANKED' && isSelected ? (selectedOptions.indexOf(opt.id) + 1) : '✓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">{opt.label}</span>
                      <span className="text-sm text-slate-500">{count} 票 ({pct.toFixed(1)}%)</span>
                    </div>
                    {opt.description && (
                      <p className="mt-1 text-sm text-slate-500">{opt.description}</p>
                    )}
                  </div>
                </div>
                {totalVotes > 0 && (
                  <div className="relative z-10 mt-2 h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </button>
            )
          })}

          {isVoting && !hasVoted && user && (
            <div className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <Textarea
                label="投票留言（可选）"
                placeholder="可简要说明选择理由..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={selectedOptions.length === 0 || voteMutation.isPending}
                >
                  {voteMutation.isPending ? '提交中...' : '确认投票'}
                </Button>
              </div>
            </div>
          )}

          {!user && isVoting && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
              <p className="text-sm text-amber-800">请登录后参与投票</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="确认投票"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>取消</Button>
            <Button onClick={handleSubmitVote} disabled={voteMutation.isPending}>
              {voteMutation.isPending ? '提交中...' : '确认提交'}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-600">你已选择以下选项：</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
            {selectedOptions.map(id => {
              const opt = data.options.find(o => o.id === id)
              return <li key={id}>{data.voteType === 'RANKED' ? `第${selectedOptions.indexOf(id) + 1}选择: ` : ''}{opt?.label}</li>
            })}
          </ul>
          <p className="text-xs text-slate-500 mt-4">⚠️ 投票提交后不可修改，请确认选择无误</p>
        </div>
      </Modal>
    </div>
  )
}
