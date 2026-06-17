"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import type { QuestionType } from "@/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  CheckCircle2,
  Code2,
  FileText,
} from "lucide-react"
import { format, parseISO } from "date-fns"

const typeLabel: Record<QuestionType, string> = {
  single_choice: "单选",
  multiple_choice: "多选",
  coding: "编程",
  short_answer: "简答",
}

const difficultyLabel: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
}

const difficultyBadgeVariant: Record<string, "default" | "warning" | "destructive"> = {
  easy: "default",
  medium: "warning",
  hard: "destructive",
}

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const assessments = useAppStore((s) => s.assessments)
  const questions = useAppStore((s) => s.questions)
  const addSubmission = useAppStore((s) => s.addSubmission)

  const assessment = useMemo(
    () => assessments.find((a) => a.id === assessmentId || assessmentId === "demo"),
    [assessments, assessmentId]
  )

  const actualAssessment = assessment ?? assessments[0]

  const assessmentQuestions = useMemo(() => {
    if (!actualAssessment) return []
    const qList = actualAssessment.questions
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((aq) => questions.find((q) => q.id === aq.question_id))
      .filter(Boolean) as typeof questions
    return qList.length > 0 ? qList : questions.slice(0, 5)
  }, [actualAssessment, questions])

  const [candidateName, setCandidateName] = useState("")
  const [candidateEmail, setCandidateEmail] = useState("")
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)

  const totalSeconds = (actualAssessment?.duration_minutes ?? 60) * 60
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds)

  useEffect(() => {
    if (!started) return
    if (remainingSeconds <= 0) {
      handleSubmit()
      return
    }
    const timer = setInterval(() => {
      setRemainingSeconds((s) => s - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [started, remainingSeconds])

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.trim().length > 0).length,
    [answers]
  )
  const progress = assessmentQuestions.length > 0
    ? Math.round((answeredCount / assessmentQuestions.length) * 100)
    : 0

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const currentQuestion = assessmentQuestions[currentIndex]

  const setAnswer = useCallback((value: string) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }, [currentQuestion])

  const toggleChoice = useCallback((option: string) => {
    if (!currentQuestion) return
    const current = answers[currentQuestion.id] || ""
    const selected = current ? current.split(",").filter(Boolean) : []
    const idx = selected.indexOf(option)
    if (idx >= 0) {
      selected.splice(idx, 1)
    } else {
      selected.push(option)
    }
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selected.join(",") }))
  }, [currentQuestion, answers])

  const isChoiceSelected = (option: string) => {
    if (!currentQuestion) return false
    const current = answers[currentQuestion.id] || ""
    if (currentQuestion.type === "single_choice") {
      return current === option
    }
    return current.split(",").filter(Boolean).includes(option)
  }

  const handleSubmit = useCallback(() => {
    if (!actualAssessment) return
    let totalScore = 0
    const submissionAnswers = assessmentQuestions.map((q) => {
      const content = answers[q.id] || ""
      let autoScore: number | undefined
      if (q.type === "single_choice") {
        autoScore = content ? Math.round(q.points * 0.7) : 0
      } else if (q.type === "multiple_choice") {
        const selectedCount = content.split(",").filter(Boolean).length
        const totalOptions = q.options?.length ?? 1
        autoScore = Math.round(q.points * (selectedCount / Math.max(totalOptions, 1)) * 0.8)
      }
      if (autoScore !== undefined) totalScore += autoScore
      return {
        id: `sa-${Date.now()}-${q.id}`,
        submission_id: "",
        question_id: q.id,
        content,
        auto_score: autoScore,
      }
    })

    const submission = {
      id: `sub-${Date.now()}`,
      assessment_id: actualAssessment.id,
      candidate_name: candidateName || "匿名候选人",
      candidate_email: candidateEmail || "anonymous@example.com",
      total_score: totalScore,
      submitted_at: new Date().toISOString(),
      answers: submissionAnswers,
    }
    addSubmission(submission)
    router.push(`/assessment/${actualAssessment.id}/result?sub=${submission.id}`)
  }, [actualAssessment, assessmentQuestions, answers, candidateName, candidateEmail, addSubmission, router])

  if (!actualAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">测评不存在</h1>
          <p className="text-slate-500 mb-6">您访问的测评链接无效或已过期。</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </Card>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 0%, rgba(16,185,129,0.1), transparent)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <Card className="max-w-lg w-full p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2 font-serif">
              {actualAssessment.title}
            </h1>
            <p className="text-slate-500">{actualAssessment.description}</p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">题目数量</span>
              <span className="font-medium text-slate-900">{assessmentQuestions.length} 题</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">答题时长</span>
              <span className="font-medium text-slate-900">{actualAssessment.duration_minutes} 分钟</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">总分</span>
              <span className="font-medium text-slate-900">
                {assessmentQuestions.reduce((s, q) => s + q.points, 0)} 分
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">您的姓名</label>
              <Input
                placeholder="请输入姓名"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">注意事项</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>开始答题后倒计时将自动启动</li>
                  <li>时间用尽后系统将自动提交</li>
                  <li>请确保网络稳定，避免中途刷新页面</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 text-base"
            onClick={() => setStarted(true)}
            disabled={!candidateName.trim()}
          >
            开始答题
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 truncate max-w-[300px]">
              {actualAssessment.title}
            </h1>
            <Badge variant="secondary">{assessmentQuestions.length} 题</Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className={cn("h-4 w-4", remainingSeconds < 300 ? "text-red-500 animate-pulse" : "text-slate-500")} />
              <span className={cn("font-mono text-lg font-semibold", remainingSeconds < 300 && "text-red-600")}>
                {formatTime(remainingSeconds)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(true)}>
              <Send className="h-4 w-4 mr-2" />
              交卷
            </Button>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <Card className="p-4 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-700">答题卡</span>
              <span className="text-xs text-slate-500">{answeredCount}/{assessmentQuestions.length}</span>
            </div>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {assessmentQuestions.map((q, idx) => {
                const isAnswered = (answers[q.id] || "").trim().length > 0
                const isCurrent = idx === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "aspect-square rounded-lg text-sm font-medium transition-all",
                      isCurrent
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2"
                        : isAnswered
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100" />
                <span className="text-slate-500">已作答</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100" />
                <span className="text-slate-500">未作答</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-500">当前题</span>
              </div>
            </div>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          <Card className="p-6 sm:p-8">
            {currentQuestion && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold text-slate-900">
                    第 {currentIndex + 1} 题 / 共 {assessmentQuestions.length} 题
                  </span>
                  <Badge variant="secondary">{typeLabel[currentQuestion.type]}</Badge>
                  <Badge variant={difficultyBadgeVariant[currentQuestion.difficulty] ?? "secondary"}>
                    {difficultyLabel[currentQuestion.difficulty]}
                  </Badge>
                  <Badge variant="info">{currentQuestion.points} 分</Badge>
                  <span className="text-sm text-slate-500 ml-auto">分类：{currentQuestion.category}</span>
                </div>

                <div className="p-4 sm:p-6 bg-slate-50 rounded-xl">
                  <p className="text-base sm:text-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.content}
                  </p>
                </div>

                <div className="space-y-4">
                  {(currentQuestion.type === "single_choice" || currentQuestion.type === "multiple_choice") && (
                    <div className="space-y-3">
                      {(currentQuestion.options ?? []).map((opt, idx) => {
                        const checked = isChoiceSelected(opt)
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (currentQuestion.type === "single_choice") {
                                setAnswer(opt)
                              } else {
                                toggleChoice(opt)
                              }
                            }}
                            className={cn(
                              "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                              checked
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center mt-0.5",
                                checked
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-slate-300"
                              )}
                            >
                              {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm text-slate-500 mr-2">
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              <span className="text-slate-800">{opt}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {currentQuestion.type === "coding" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-200 rounded-t-lg text-xs">
                        <Code2 className="h-4 w-4" />
                        <span>代码作答区</span>
                      </div>
                      <textarea
                        value={answers[currentQuestion.id] ?? ""}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="在此输入您的代码..."
                        className="w-full h-80 p-4 font-mono text-sm bg-slate-900 text-emerald-400 rounded-b-lg border-0 resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        spellCheck={false}
                      />
                    </div>
                  )}

                  {currentQuestion.type === "short_answer" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileText className="h-4 w-4" />
                        <span>简答题作答区，请详细描述您的答案</span>
                      </div>
                      <Textarea
                        value={answers[currentQuestion.id] ?? ""}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="请输入您的答案..."
                        rows={10}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    上一题
                  </Button>
                  {currentIndex === assessmentQuestions.length - 1 ? (
                    <Button onClick={() => setShowConfirm(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      提交答卷
                    </Button>
                  ) : (
                    <Button onClick={() => setCurrentIndex((i) => Math.min(assessmentQuestions.length - 1, i + 1))}>
                      下一题
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="确认交卷">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">已作答</span>
              <span className="font-medium text-slate-900">{answeredCount} 题</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">未作答</span>
              <span className="font-medium text-slate-900">{assessmentQuestions.length - answeredCount} 题</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">剩余时间</span>
              <span className="font-medium text-slate-900">{formatTime(remainingSeconds)}</span>
            </div>
          </div>
          {answeredCount < assessmentQuestions.length && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>您还有 {assessmentQuestions.length - answeredCount} 道题未作答，确定要交卷吗？</span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>继续答题</Button>
            <Button onClick={handleSubmit}>确认交卷</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
