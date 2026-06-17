"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  Trophy,
  Target,
  CalendarDays,
  ArrowRight,
  Home,
  Play,
} from "lucide-react"
import { format, formatDistanceToNow, parseISO } from "date-fns"

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

export default function AssessmentDemoPage() {
  const router = useRouter()

  const assessments = useAppStore((s) => s.assessments)
  const questions = useAppStore((s) => s.questions)
  const addSubmission = useAppStore((s) => s.addSubmission)

  const assessment = useMemo(() => assessments[0] ?? null, [assessments])

  const assessmentQuestions = useMemo(() => {
    if (!assessment) return []
    const qList = assessment.questions
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((aq) => questions.find((q) => q.id === aq.question_id))
      .filter(Boolean) as typeof questions
    return qList.length > 0 ? qList : questions.slice(0, 5)
  }, [assessment, questions])

  const [candidateName, setCandidateName] = useState("")
  const [candidateEmail, setCandidateEmail] = useState("")
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)

  const totalSeconds = (assessment?.duration_minutes ?? 60) * 60
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds)

  useEffect(() => {
    if (!started || submitted) return
    if (remainingSeconds <= 0) {
      handleSubmit()
      return
    }
    const timer = setInterval(() => {
      setRemainingSeconds((s) => s - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [started, submitted, remainingSeconds])

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

  const calculateScore = useCallback(() => {
    let score = 0
    assessmentQuestions.forEach((q) => {
      const answer = answers[q.id] || ""
      if (q.type === "single_choice" || q.type === "multiple_choice") {
        if (answer === q.correct_answer) {
          score += q.points
        }
      } else if (q.type === "short_answer" || q.type === "coding") {
        if (answer.trim().length > 0) {
          score += Math.round(q.points * 0.5)
        }
      }
    })
    return score
  }, [assessmentQuestions, answers])

  const handleSubmit = useCallback(() => {
    if (!assessment) return

    const score = calculateScore()
    const answerList = assessmentQuestions.map((q) => ({
      question_id: q.id,
      content: answers[q.id] || "",
      auto_score: q.type === "single_choice" || q.type === "multiple_choice"
        ? (answers[q.id] === q.correct_answer ? q.points : 0)
        : null,
      manual_score: null,
    }))

    const newSubmission = {
      id: `sub-demo-${Date.now()}`,
      assessment_id: "demo",
      candidate_name: candidateName || "匿名考生",
      candidate_email: candidateEmail || "",
      answers: answerList,
      total_score: score,
      status: "submitted" as const,
      started_at: new Date(Date.now() - totalSeconds * 1000 + remainingSeconds * 1000).toISOString(),
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    addSubmission(newSubmission as any)
    setSubmissionId(newSubmission.id)
    setSubmitted(true)
    setShowConfirm(false)
  }, [assessment, calculateScore, assessmentQuestions, answers, candidateName, candidateEmail, addSubmission, totalSeconds, remainingSeconds])

  const totalPoints = useMemo(() => {
    return assessmentQuestions.reduce((s, q) => s + q.points, 0)
  }, [assessmentQuestions])

  const score = useMemo(() => {
    if (!submitted) return 0
    return calculateScore()
  }, [submitted, calculateScore])

  const percentage = Math.min(100, Math.round((score / (totalPoints || 100)) * 100))

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: "优秀", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" }
    if (pct >= 75) return { label: "良好", color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" }
    if (pct >= 60) return { label: "及格", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" }
    return { label: "待提升", color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" }
  }

  const grade = getGrade(percentage)

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">测评不存在</h1>
          <p className="text-slate-500 mb-6">未找到演示测评。</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </Card>
      </div>
    )
  }

  if (submitted) {
    const answerDetails = assessmentQuestions.map((q) => ({
      question: q,
      content: answers[q.id] || "",
      isCorrect: q.type === "single_choice" || q.type === "multiple_choice"
        ? answers[q.id] === q.correct_answer
        : answers[q.id]?.trim().length > 0,
    }))

    const correctCount = answerDetails.filter((d) => d.isCorrect).length

    return (
      <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className={cn(
              "inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ring-8",
              grade.bg,
              grade.ring
            )}>
              <Trophy className={cn("w-12 h-12", grade.color)} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">测评完成</h1>
            <p className="text-slate-500">{assessment.title} - 结果报告</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-slate-900">{score}</div>
              <div className="text-sm text-slate-500 mt-1">总得分</div>
            </Card>
            <Card className="p-5 text-center">
              <div className={cn("text-3xl font-bold", grade.color)}>{percentage}%</div>
              <div className="text-sm text-slate-500 mt-1">正确率</div>
            </Card>
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold text-slate-900">{correctCount}/{assessmentQuestions.length}</div>
              <div className="text-sm text-slate-500 mt-1">答对题数</div>
            </Card>
            <Card className="p-5 text-center">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {grade.label}
              </Badge>
              <div className="text-sm text-slate-500 mt-2">评级</div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">答题详情</h2>
            <div className="space-y-4">
              {answerDetails.map((detail, index) => (
                <div
                  key={detail.question.id}
                  className={cn(
                    "p-4 rounded-xl border",
                    detail.isCorrect ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      detail.isCorrect ? "bg-emerald-500" : "bg-slate-300"
                    )}>
                      <span className="text-white text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {typeLabel[detail.question.type]}
                        </Badge>
                        <Badge variant={difficultyBadgeVariant[detail.question.difficulty]} className="text-[10px]">
                          {difficultyLabel[detail.question.difficulty]}
                        </Badge>
                        <span className="text-xs text-slate-500">{detail.question.points}分</span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium mb-2">{detail.question.content}</p>
                      {detail.question.type === "single_choice" || detail.question.type === "multiple_choice" ? (
                        <div className="text-xs space-y-1">
                          {detail.question.options?.map((opt: string, i: number) => (
                            <div key={i} className={cn(
                              "px-2 py-1 rounded",
                              opt === detail.question.correct_answer
                                ? "bg-emerald-100 text-emerald-700"
                                : opt === detail.content
                                  ? "bg-red-100 text-red-700"
                                  : "text-slate-600"
                            )}>
                              {String.fromCharCode(65 + i)}. {opt}
                              {opt === detail.question.correct_answer && " ✓"}
                              {opt === detail.content && opt !== detail.question.correct_answer && " ✗"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 bg-slate-100 rounded p-2">
                          {detail.content || "（未作答）"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
            <Button onClick={() => {
              setSubmitted(false)
              setStarted(false)
              setAnswers({})
              setCurrentIndex(0)
              setRemainingSeconds(totalSeconds)
            }}>
              <Play className="w-4 h-4 mr-2" />
              再测一次
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <Badge variant="info" className="mb-3">演示测评</Badge>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{assessment.title}</h1>
            <p className="text-slate-500">{assessment.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <FileText className="w-6 h-6 mx-auto text-blue-500 mb-1" />
              <div className="text-lg font-semibold text-slate-900">{assessmentQuestions.length}</div>
              <div className="text-xs text-slate-500">题目</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <Clock className="w-6 h-6 mx-auto text-amber-500 mb-1" />
              <div className="text-lg font-semibold text-slate-900">{assessment.duration_minutes}</div>
              <div className="text-xs text-slate-500">分钟</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <Trophy className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
              <div className="text-lg font-semibold text-slate-900">{totalPoints}</div>
              <div className="text-xs text-slate-500">总分</div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">姓名</label>
              <Input
                type="text"
                placeholder="请输入您的姓名"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">邮箱</label>
              <Input
                type="email"
                placeholder="请输入您的邮箱"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 text-sm">注意事项</h3>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  <li>• 测评开始后倒计时将自动启动</li>
                  <li>• 请在规定时间内完成所有题目</li>
                  <li>• 提交后不可修改答案</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 text-base"
            onClick={() => setStarted(true)}
          >
            <Play className="w-5 h-5 mr-2" />
            开始测评
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-slate-900 text-sm truncate">{assessment.title}</h1>
              <p className="text-xs text-slate-500">演示测评</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm",
            remainingSeconds < 60 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
          )}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        <div className="lg:w-64 shrink-0 order-2 lg:order-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-900 text-sm">答题卡</h3>
              <span className="text-xs text-slate-500">
                {answeredCount}/{assessmentQuestions.length}
              </span>
            </div>
            <div className="grid grid-cols-10 lg:grid-cols-5 gap-2">
              {assessmentQuestions.map((q, idx) => {
                const answered = answers[q.id] && answers[q.id].trim().length > 0
                const isCurrent = idx === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                      isCurrent && "ring-2 ring-blue-500 ring-offset-2",
                      answered
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="flex-1 order-1 lg:order-2">
          {currentQuestion && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">第 {currentIndex + 1} 题</Badge>
                <Badge variant="info">{typeLabel[currentQuestion.type]}</Badge>
                <Badge variant={difficultyBadgeVariant[currentQuestion.difficulty]}>
                  {difficultyLabel[currentQuestion.difficulty]}
                </Badge>
                <Badge variant="outline">{currentQuestion.points} 分</Badge>
              </div>

              <h2 className="text-lg font-medium text-slate-900 mb-6 leading-relaxed">
                {currentQuestion.content}
              </h2>

              {currentQuestion.type === "single_choice" && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setAnswer(opt)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all",
                        answers[currentQuestion.id] === opt
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                          answers[currentQuestion.id] === opt
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-300"
                        )}>
                          {answers[currentQuestion.id] === opt && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-slate-700">
                          <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {opt}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "multiple_choice" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2">（多选题，可选择多个答案）</p>
                  {currentQuestion.options?.map((opt: string, idx: number) => {
                    const selected = answers[currentQuestion.id]?.split(",").filter(Boolean).includes(opt)
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleChoice(opt)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          selected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                            selected
                              ? "border-blue-500 bg-blue-500"
                              : "border-slate-300"
                          )}>
                            {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <span className="text-slate-700">
                            <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {opt}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === "short_answer" && (
                <div>
                  <Textarea
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="请输入您的答案..."
                    rows={8}
                    className="resize-none"
                  />
                </div>
              )}

              {currentQuestion.type === "coding" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">编程题</span>
                  </div>
                  <Textarea
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="请输入您的代码实现..."
                    rows={12}
                    className="font-mono text-sm resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一题
                </Button>

                <div className="text-sm text-slate-500">
                  {currentIndex + 1} / {assessmentQuestions.length}
                </div>

                {currentIndex < assessmentQuestions.length - 1 ? (
                  <Button onClick={() => setCurrentIndex((i) => Math.min(assessmentQuestions.length - 1, i + 1))}>
                    下一题
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => setShowConfirm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Send className="w-4 h-4 mr-2" />
                    提交试卷
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="确认提交"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 text-sm">确认提交吗？</h3>
                <p className="text-xs text-amber-700 mt-1">
                  您已完成 {answeredCount}/{assessmentQuestions.length} 道题目。
                  提交后将无法修改答案。
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
              继续答题
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              确认提交
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
