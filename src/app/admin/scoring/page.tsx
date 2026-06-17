"use client"

import { useState } from "react"
import { Plus, ChevronDown, ChevronUp, Trash2, Target } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/components/ui/empty-state"
import type { ScoringStandard, ScoringDimension, ScoringLevel } from "@/types/database"

interface StandardForm {
  name: string
  position: string
  dimensions: ScoringDimension[]
  is_active: boolean
}

const defaultDimension = (): ScoringDimension => ({
  name: "",
  weight: 1,
  levels: [
    { level: "优秀", min_score: 80, max_score: 100, description: "" },
    { level: "良好", min_score: 60, max_score: 79, description: "" },
    { level: "待改进", min_score: 0, max_score: 59, description: "" },
  ],
})

const defaultForm: StandardForm = {
  name: "",
  position: "",
  dimensions: [defaultDimension()],
  is_active: true,
}

export default function ScoringPage() {
  const {
    scoringStandards,
    systemConfigs,
    addScoringStandard,
    updateScoringStandard,
  } = useAppStore()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StandardForm>(defaultForm)

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_scoring_standards")?.value !== "false"

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (s: ScoringStandard) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      position: s.position,
      dimensions: s.dimensions.length > 0 ? s.dimensions : [defaultDimension()],
      is_active: s.is_active,
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    const now = new Date().toISOString()
    if (editingId) {
      updateScoringStandard(editingId, {
        name: form.name,
        position: form.position,
        dimensions: form.dimensions,
        is_active: form.is_active,
        updated_at: now,
      })
    } else {
      const newS: ScoringStandard = {
        id: crypto.randomUUID(),
        name: form.name,
        position: form.position,
        dimensions: form.dimensions,
        is_active: form.is_active,
        created_at: now,
        updated_at: now,
      }
      addScoringStandard(newS)
    }
    setModalOpen(false)
  }

  const addDimension = () => {
    setForm({ ...form, dimensions: [...form.dimensions, defaultDimension()] })
  }

  const removeDimension = (index: number) => {
    setForm({ ...form, dimensions: form.dimensions.filter((_, i) => i !== index) })
  }

  const updateDimension = (index: number, field: keyof ScoringDimension, value: string | number) => {
    const next = [...form.dimensions]
    next[index] = { ...next[index], [field]: value }
    setForm({ ...form, dimensions: next })
  }

  const addLevel = (dimIndex: number) => {
    const next = [...form.dimensions]
    next[dimIndex] = {
      ...next[dimIndex],
      levels: [...next[dimIndex].levels, { level: "", min_score: 0, max_score: 0, description: "" }],
    }
    setForm({ ...form, dimensions: next })
  }

  const removeLevel = (dimIndex: number, levelIndex: number) => {
    const next = [...form.dimensions]
    next[dimIndex] = {
      ...next[dimIndex],
      levels: next[dimIndex].levels.filter((_, i) => i !== levelIndex),
    }
    setForm({ ...form, dimensions: next })
  }

  const updateLevel = (dimIndex: number, levelIndex: number, field: keyof ScoringLevel, value: string | number) => {
    const next = [...form.dimensions]
    const levels = [...next[dimIndex].levels]
    levels[levelIndex] = { ...levels[levelIndex], [field]: value }
    next[dimIndex] = { ...next[dimIndex], levels }
    setForm({ ...form, dimensions: next })
  }

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">评分标准</h1>
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title="模块已禁用"
          description="评分标准模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">评分标准</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          新增标准
        </Button>
      </div>

      {scoringStandards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-400">暂无评分标准</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scoringStandards.map((standard) => {
            const isExpanded = expandedId === standard.id
            return (
              <Card key={standard.id}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleExpand(standard.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{standard.name}</CardTitle>
                      <Badge variant="secondary">{standard.position}</Badge>
                      <Badge variant={standard.is_active ? "default" : "secondary"}>
                        {standard.is_active ? "启用" : "停用"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {standard.dimensions.length} 个维度
                      </span>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(standard) }}>
                        编辑
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    {standard.dimensions.length === 0 ? (
                      <p className="py-4 text-center text-sm text-slate-400">暂无维度</p>
                    ) : (
                      <div className="space-y-6">
                        {standard.dimensions.map((dim, di) => (
                          <div key={di} className="rounded-lg border border-slate-100 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <h4 className="font-medium text-slate-900">{dim.name}</h4>
                              <Badge variant="info">权重: {dim.weight}</Badge>
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-100">
                                  <th className="pb-2 text-left font-medium text-slate-500">等级</th>
                                  <th className="pb-2 text-left font-medium text-slate-500">最低分</th>
                                  <th className="pb-2 text-left font-medium text-slate-500">最高分</th>
                                  <th className="pb-2 text-left font-medium text-slate-500">描述</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dim.levels.map((lvl, li) => (
                                  <tr key={li} className="border-b border-slate-50">
                                    <td className="py-2 text-slate-700">{lvl.level}</td>
                                    <td className="py-2 text-slate-600">{lvl.min_score}</td>
                                    <td className="py-2 text-slate-600">{lvl.max_score}</td>
                                    <td className="py-2 text-slate-500">{lvl.description || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "编辑评分标准" : "新增评分标准"}
        className="max-w-3xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">名称</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">职位</label>
              <Input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">维度</label>
            <Button size="sm" variant="ghost" onClick={addDimension}>
              <Plus className="h-3.5 w-3.5" />
              添加维度
            </Button>
          </div>

          {form.dimensions.map((dim, di) => (
            <div key={di} className="rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Input
                    placeholder="维度名称"
                    value={dim.name}
                    onChange={(e) => updateDimension(di, "name", e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 shrink-0">权重</label>
                    <Input
                      type="number"
                      min={0}
                      value={dim.weight}
                      onChange={(e) => updateDimension(di, "weight", Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
                {form.dimensions.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeDimension(di)} className="ml-2 text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">等级</span>
                  <Button size="sm" variant="ghost" onClick={() => addLevel(di)} className="text-xs h-7">
                    <Plus className="h-3 w-3" />
                    添加等级
                  </Button>
                </div>
                <div className="space-y-2">
                  {dim.levels.map((lvl, li) => (
                    <div key={li} className="flex items-center gap-2">
                      <Input
                        placeholder="等级"
                        value={lvl.level}
                        onChange={(e) => updateLevel(di, li, "level", e.target.value)}
                        className="w-24"
                      />
                      <Input
                        type="number"
                        placeholder="最低分"
                        value={lvl.min_score}
                        onChange={(e) => updateLevel(di, li, "min_score", Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-slate-400">-</span>
                      <Input
                        type="number"
                        placeholder="最高分"
                        value={lvl.max_score}
                        onChange={(e) => updateLevel(di, li, "max_score", Number(e.target.value))}
                        className="w-20"
                      />
                      <Input
                        placeholder="描述"
                        value={lvl.description}
                        onChange={(e) => updateLevel(di, li, "description", e.target.value)}
                        className="flex-1"
                      />
                      {dim.levels.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => removeLevel(di, li)} className="shrink-0 text-red-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4">
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm({ ...form, is_active: v })}
              label="启用"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.position.trim()}>
              {editingId ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
