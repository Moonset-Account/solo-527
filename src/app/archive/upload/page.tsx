'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Upload,
  FileUp,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  ArrowLeft,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import type { ProcessingStatus } from '@/types'
import { PROCESSING_STATUS_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const MOCK_PROJECTS = [
  { id: 'p1', code: 'PRJ-2024-001', name: '新型蛋白质结构研究' },
  { id: 'p2', code: 'PRJ-2024-002', name: '纳米材料表征' },
  { id: 'p3', code: 'PRJ-2024-003', name: '干细胞分化研究' },
  { id: 'p4', code: 'PRJ-2024-004', name: '药物代谢动力学' },
]

const MOCK_SAMPLES = [
  { id: 's1', code: 'SMP-001', name: '蛋白质样本A1', project_id: 'p1' },
  { id: 's2', code: 'SMP-002', name: 'DNA样本B3', project_id: 'p1' },
  { id: 's3', code: 'SMP-003', name: '纳米粒子C7', project_id: 'p2' },
  { id: 's4', code: 'SMP-004', name: '碳纳米管D2', project_id: 'p2' },
  { id: 's5', code: 'SMP-005', name: '干细胞E5', project_id: 'p3' },
  { id: 's6', code: 'SMP-006', name: 'RNA样本F1', project_id: 'p3' },
  { id: 's7', code: 'SMP-007', name: '药物样本G3', project_id: 'p4' },
  { id: 's8', code: 'SMP-008', name: '血清样本H7', project_id: 'p4' },
]

type Step = 1 | 2 | 3

interface CustomMeta {
  key: string
  value: string
}

export default function ArchiveUploadPage() {
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [sampleId, setSampleId] = useState('')
  const [sampleSearch, setSampleSearch] = useState('')
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('pending')
  const [responsiblePerson, setResponsiblePerson] = useState('')
  const [notes, setNotes] = useState('')
  const [customMetas, setCustomMetas] = useState<CustomMeta[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadDone, setUploadDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredSamples = MOCK_SAMPLES.filter(
    (s) =>
      (!projectId || s.project_id === projectId) &&
      (s.code.includes(sampleSearch) || s.name.includes(sampleSearch))
  )

  const selectedProject = MOCK_PROJECTS.find((p) => p.id === projectId)
  const selectedSample = MOCK_SAMPLES.find((s) => s.id === sampleId)

  const addCustomMeta = () => setCustomMetas((prev) => [...prev, { key: '', value: '' }])
  const removeCustomMeta = (idx: number) =>
    setCustomMetas((prev) => prev.filter((_, i) => i !== idx))
  const updateCustomMeta = (idx: number, field: 'key' | 'value', val: string) =>
    setCustomMetas((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m)))

  const canProceedStep1 = !!file
  const canProceedStep2 = !!projectId && !!sampleId && !!responsiblePerson

  const handleSubmit = () => {
    setUploading(true)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          setUploadDone(true)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 300)
  }

  const STEPS = [
    { num: 1, label: '上传文件' },
    { num: 2, label: '填写元数据' },
    { num: 3, label: '确认提交' },
  ]

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/archive" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="page-title">上传实验数据</h1>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                      step > s.num
                        ? 'bg-teal-600 text-white'
                        : step === s.num
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      step >= s.num ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4',
                      step > s.num ? 'bg-teal-600' : 'bg-slate-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {uploadDone ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">上传成功</h2>
              <p className="text-sm text-slate-500 mb-6">文件已成功归档至系统</p>
              <Link href="/archive" className="btn-primary">
                返回归档列表
              </Link>
            </div>
          ) : uploading ? (
            <div className="py-12">
              <div className="text-center mb-4">
                <FileUp className="w-12 h-12 text-teal-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-900">正在上传</h2>
                <p className="text-sm text-slate-500 mt-1">{file?.name}</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                />
              </div>
              <p className="text-center text-sm text-slate-500 mt-2">
                {Math.min(Math.round(uploadProgress), 100)}%
              </p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      const dropped = e.dataTransfer.files[0]
                      if (dropped) setFile(dropped)
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
                      dragOver
                        ? 'border-teal-500 bg-teal-50'
                        : file
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.pdf,.zip,.txt"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
                    />
                    <FileUp
                      className={cn(
                        'w-12 h-12 mx-auto mb-3',
                        file ? 'text-emerald-500' : 'text-slate-400'
                      )}
                    />
                    {file ? (
                      <>
                        <p className="font-medium text-slate-900">{file.name}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-slate-700">拖拽文件至此处或点击上传</p>
                        <p className="text-sm text-slate-400 mt-1">
                          支持 .csv, .xlsx, .pdf, .zip, .txt
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!canProceedStep1}
                      className="btn-primary"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="label">课题编号</label>
                    <select
                      value={projectId}
                      onChange={(e) => { setProjectId(e.target.value); setSampleId('') }}
                      className="input-field"
                    >
                      <option value="">请选择课题</option>
                      {MOCK_PROJECTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="label">样本ID</label>
                    <input
                      type="text"
                      value={sampleSearch}
                      onChange={(e) => { setSampleSearch(e.target.value); setSampleDropdownOpen(true) }}
                      onFocus={() => setSampleDropdownOpen(true)}
                      placeholder="搜索样本编号或名称"
                      className="input-field"
                    />
                    {selectedSample && (
                      <div className="mt-1 text-xs text-teal-700">
                        已选择: {selectedSample.code} - {selectedSample.name}
                      </div>
                    )}
                    {sampleDropdownOpen && filteredSamples.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredSamples.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSampleId(s.id)
                              setSampleSearch(s.code)
                              setSampleDropdownOpen(false)
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors',
                              sampleId === s.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                            )}
                          >
                            {s.code} - {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">处理状态</label>
                    <select
                      value={processingStatus}
                      onChange={(e) => setProcessingStatus(e.target.value as ProcessingStatus)}
                      className="input-field"
                    >
                      {(Object.keys(PROCESSING_STATUS_LABELS) as ProcessingStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {PROCESSING_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">责任人</label>
                    <input
                      type="text"
                      value={responsiblePerson}
                      onChange={(e) => setResponsiblePerson(e.target.value)}
                      placeholder="输入责任人姓名"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">备注</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="可选，补充说明"
                      className="input-field resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">自定义元数据</label>
                      <button onClick={addCustomMeta} className="text-sm text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        添加
                      </button>
                    </div>
                    {customMetas.length === 0 && (
                      <p className="text-xs text-slate-400">暂无自定义元数据，点击上方按钮添加</p>
                    )}
                    <div className="space-y-2">
                      {customMetas.map((meta, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={meta.key}
                            onChange={(e) => updateCustomMeta(idx, 'key', e.target.value)}
                            placeholder="键"
                            className="input-field flex-1"
                          />
                          <input
                            type="text"
                            value={meta.value}
                            onChange={(e) => updateCustomMeta(idx, 'value', e.target.value)}
                            placeholder="值"
                            className="input-field flex-1"
                          />
                          <button
                            onClick={() => removeCustomMeta(idx)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setStep(1)} className="btn-secondary">
                      <ChevronLeft className="w-4 h-4" />
                      上一步
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                      className="btn-primary"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h3 className="section-title">确认信息</h3>

                  <div className="bg-slate-50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">文件名</span>
                      <span className="font-medium text-slate-900">{file?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">课题</span>
                      <span className="font-medium text-slate-900">
                        {selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">样本</span>
                      <span className="font-medium text-slate-900">
                        {selectedSample ? `${selectedSample.code} - ${selectedSample.name}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">处理状态</span>
                      <span className="font-medium text-slate-900">{PROCESSING_STATUS_LABELS[processingStatus]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">责任人</span>
                      <span className="font-medium text-slate-900">{responsiblePerson || '-'}</span>
                    </div>
                    {notes && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">备注</span>
                        <span className="font-medium text-slate-900 max-w-[60%] text-right">{notes}</span>
                      </div>
                    )}
                    {customMetas.filter((m) => m.key).length > 0 && (
                      <div>
                        <span className="text-slate-500 block mb-1">自定义元数据</span>
                        <div className="space-y-1 pl-2">
                          {customMetas
                            .filter((m) => m.key)
                            .map((m, i) => (
                              <div key={i} className="text-slate-700">
                                <span className="font-medium">{m.key}</span>: {m.value}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setStep(2)} className="btn-secondary">
                      <ChevronLeft className="w-4 h-4" />
                      上一步
                    </button>
                    <button onClick={handleSubmit} className="btn-primary">
                      <Upload className="w-4 h-4" />
                      确认上传
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
