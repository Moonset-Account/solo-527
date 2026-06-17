"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Edit2, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/components/ui/empty-state"
import type { Question, QuestionType, Difficulty } from "@/types/database"

const typeLabel: Record<QuestionType, string> = {
  single_choice: "单选",
  multiple_choice: "多选",
  coding: "编程",
  short_answer: "简答",
}

const difficultyLabel: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
}

const difficultyBadgeVariant: Record<Difficulty, "default" | "warning" | "destructive"> = {
  easy: "default",
  medium: "warning",
  hard: "destructive",
}

const PAGE_SIZE = 10

interface QuestionForm {
  type: QuestionType
  content: string
  options: string[]
  difficulty: Difficulty
  category: string
  scoring_standard_id: string
  points: number
  is_active: boolean
}

const defaultForm: QuestionForm = {
  type: "single_choice",
  content: "",
  options: ["", "", "", ""],
  difficulty: "easy",
  category: "前端开发",
  scoring_standard_id: "",
  points: 10,
  is_active: true,
}

export default function QuestionsPage() {
  const {
    questions,
    scoringStandards,
    systemConfigs,
    addQuestion,
    updateQuestion,
  } = useAppStore()

  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterDifficulty, setFilterDifficulty] = useState("")
  const [filterType, setFilterType] = useState("")
  const [page, setPage] = useState(1)

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_question_bank")?.value !== "false"

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<QuestionForm>(defaultForm)

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (search && !q.content.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCategory && q.category !== filterCategory) return false
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false
      if (filterType && q.type !== filterType) return false
      return true
    })
  }, [questions, search, filterCategory, filterDifficulty, filterType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (q: Question) => {
    setEditingId(q.id)
    setForm({
      type: q.type,
      content: q.content,
      options: q.options ?? (q.type === "single_choice" || q.type === "multiple_choice" ? ["", "", "", ""] : []),
      difficulty: q.difficulty,
      category: q.category,
      scoring_standard_id: q.scoring_standard_id ?? "",
      points: q.points,
      is_active: q.is_active,
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    const now = new Date().toISOString()
    const isChoice = form.type === "single_choice" || form.type === "multiple_choice"
    const options = isChoice ? form.options.filter((o) => o.trim() !== "") : undefined

    if (editingId) {
      updateQuestion(editingId, {
        type: form.type,
        content: form.content,
        options,
        difficulty: form.difficulty,
        category: form.category,
        scoring_standard_id: form.scoring_standard_id || undefined,
        points: form.points,
        is_active: form.is_active,
        updated_at: now,
      })
    } else {
      const newQ: Question = {
        id: crypto.randomUUID(),
        type: form.type,
        content: form.content,
        options,
        difficulty: form.difficulty,
        category: form.category,
        scoring_standard_id: form.scoring_standard_id || undefined,
        points: form.points,
        is_active: form.is_active,
        created_at: now,
        updated_at: now,
      }
      addQuestion(newQ)
    }
    setModalOpen(false)
  }

  const toggleActive = (q: Question) => {
    updateQuestion(q.id, { is_active: !q.is_active, updated_at: new Date().toISOString() })
  }

  const updateOption = (index: number, value: string) => {
    const next = [...form.options]
    next[index] = value
    setForm({ ...form, options: next })
  }

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ""] })
  }

  const removeOption = (index: number) => {
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) })
  }

  const isChoiceType = form.type === "single_choice" || form.type === "multiple_choice"

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">题库管理</h1>
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="模块已禁用"
          description="题库管理模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">题库管理</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          新增题目
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索题目内容..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }} className="w-36">
              <option value="">全部分类</option>
              <option value="前端开发">前端开发</option>
              <option value="后端开发">后端开发</option>
              <option value="算法">算法</option>
              <option value="系统设计">系统设计</option>
            </Select>
            <Select value={filterDifficulty} onChange={(e) => { setFilterDifficulty(e.target.value); setPage(1) }} className="w-32">
              <option value="">全部难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </Select>
            <Select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }} className="w-32">
              <option value="">全部类型</option>
              <option value="single_choice">单选</option>
              <option value="multiple_choice">多选</option>
              <option value="coding">编程</option>
              <option value="short_answer">简答</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">题目内容</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">类型</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">难度</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">分类</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">分值</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      暂无题目
                    </td>
                  </tr>
                ) : (
                  paged.map((q) => (
                    <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 max-w-xs truncate">{q.content.slice(0, 50)}{q.content.length > 50 ? "..." : ""}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{typeLabel[q.type]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={difficultyBadgeVariant[q.difficulty]}>{difficultyLabel[q.difficulty]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{q.category}</td>
                      <td className="px-4 py-3 text-slate-600">{q.points}</td>
                      <td className="px-4 py-3">
                        <Badge variant={q.is_active ? "default" : "secondary"}>
                          {q.is_active ? "启用" : "停用"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(q)}>
                            <Edit2 className="h-3.5 w-3.5" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant={q.is_active ? "outline" : "default"}
                            onClick={() => toggleActive(q)}
                          >
                            {q.is_active ? "停用" : "启用"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <span className="text-sm text-slate-500">
                共 {filtered.length} 条，第 {currentPage}/{totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑题目" : "新增题目"}
        className="max-w-2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">题目类型</label>
              <Select
                value={form.type}
                onChange={(e) => {
                  const t = e.target.value as QuestionType
                  const isC = t === "single_choice" || t === "multiple_choice"
                  setForm({
                    ...form,
                    type: t,
                    options: isC && form.options.length === 0 ? ["", "", "", ""] : form.options,
                  })
                }}
              >
                <option value="single_choice">单选</option>
                <option value="multiple_choice">多选</option>
                <option value="coding">编程</option>
                <option value="short_answer">简答</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">难度</label>
              <Select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">题目内容</label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={3}
            />
          </div>

          {isChoiceType && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">选项</label>
                <Button size="sm" variant="ghost" onClick={addOption}>
                  <Plus className="h-3.5 w-3.5" />
                  添加选项
                </Button>
              </div>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-5 shrink-0">{String.fromCharCode(65 + i)}</span>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                    />
                    {form.options.length > 2 && (
                      <Button size="sm" variant="ghost" onClick={() => removeOption(i)} className="shrink-0 text-slate-400 hover:text-red-500">
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">分类</label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="前端开发">前端开发</option>
                <option value="后端开发">后端开发</option>
                <option value="算法">算法</option>
                <option value="系统设计">系统设计</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">评分标准</label>
              <Select
                value={form.scoring_standard_id}
                onChange={(e) => setForm({ ...form, scoring_standard_id: e.target.value })}
              >
                <option value="">无</option>
                {scoringStandards.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">分值</label>
              <Input
                type="number"
                min={1}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end pb-1">
              <Toggle
                checked={form.is_active}
                onChange={(v) => setForm({ ...form, is_active: v })}
                label="启用"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!form.content.trim()}>
              {editingId ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
