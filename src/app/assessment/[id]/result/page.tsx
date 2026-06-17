"use client"

import { useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  Home,
  AlertCircle,
} from "lucide-react"
import { format, parseISO } from "date-fns"

export default function AssessmentResultPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentId = params.id as string
  const submissionId = searchParams.get("sub")

  const assessments = useAppStore((s) => s.assessments)
  const submissions = useAppStore((s) => s.submissions)
  const questions = useAppStore((s) => s.questions)

  const assessment = useMemo(
    () => assessments.find((a) => a.id === assessmentId || assessmentId === "demo") ?? assessments[0],
    [assessments, assessmentId]
  )

  const submission = useMemo(() => {
    if (submissionId) {
      const found = submissions.find((s) => s.id === submissionId)
      if (found) return found
    }
    return submissions[submissions.length - 1]
  }, [submissions, submissionId])

  const totalPoints = useMemo(() => {
    if (!assessment) return 0
    const qIds = assessment.questions.map((aq) => aq.question_id)
    return questions
      .filter((q) => qIds.includes(q.id))
      .reduce((s, q) => s + q.points, 0)
  }, [assessment, questions])

  const score = submission?.total_score ?? 0
  const maxScore = totalPoints || 100
  const percentage = Math.min(100, Math.round((score / maxScore) * 100))

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: "优秀", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" }
    if (pct >= 75) return { label: "良好", color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" }
    if (pct >= 60) return { label: "及格", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" }
    return { label: "待提升", color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" }
  }

  const grade = getGrade(percentage)

  const answerDetails = useMemo(() => {
    if (!submission?.answers) return []
    return submission.answers.map((ans) => {
      const q = questions.find((qq) => qq.id === ans.question_id)
      return {
        question: q,
        content: ans.content,
        autoScore: ans.auto_score,
        manualScore: ans.manual_score,
        totalScore: q?.points ?? 0,
      }
    }).filter((d) => d.question)
  }, [submission, questions])

  const answeredCount = answerDetails.length
  const correctCount = answerDetails.filter((d) => {
    const s = (d.autoScore ?? d.manualScore ?? 0)
    return s >= (d.totalScore * 0.6)
  }).length

  if (!assessment || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">结果不存在</h1>
          <p className="text-slate-500 mb-6">未找到该测评结果。</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className={`p-8 sm:p-10 ring-1 ${grade.ring} ${grade.bg}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm mb-6">
              <Trophy className={`h-10 w-10 ${grade.color}`} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 font-serif">
              测评完成
            </h1>
            <p className="text-slate-500">{assessment.title}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-slate-500">得分</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl sm:text-4xl font-bold ${grade.color}`}>{score}</span>
                <span className="text-slate-400">/ {maxScore}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="default" className={grade.color.replace("text-", "bg-").replace("600", "500").replace("text-", "")}>{grade.label}</Badge>
                <span className="text-sm text-slate-500">评级</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold text-slate-900">{percentage}</span>
                <span className="text-slate-400">%</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-slate-500">正确率</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}
                </span>
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="relative h-4 bg-white rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${grade.color.replace("text-", "bg-").replace("600", "500")}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>提交时间：{format(parseISO(submission.submitted_at), "yyyy-MM-dd HH:mm")}</span>
            </div>
            <div>
              考生：<span className="font-medium text-slate-700">{submission.candidate_name}</span>
            </div>
          </div>
        </Card>

        {answerDetails.length > 0 && (
          <Card>
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">答题详情</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {answerDetails.map((detail, idx) => {
                const s = detail.autoScore ?? detail.manualScore ?? 0
                const isGood = s >= (detail.totalScore * 0.6)
                return (
                  <div key={idx} className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="flex items-center justify-center w-7 h-7 shrink-0 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-800 font-medium line-clamp-2">
                            {detail.question?.content.slice(0, 120)}
                            {detail.question && detail.question.content.length > 120 ? "..." : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {detail.question?.category}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {detail.question?.difficulty === "easy" ? "简单" : detail.question?.difficulty === "medium" ? "中等" : "困难"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-lg font-bold ${isGood ? "text-emerald-600" : "text-slate-400"}`}>
                          {s}<span className="text-sm text-slate-400">/{detail.totalScore}</span>
                        </div>
                        <Badge variant={isGood ? "default" : "secondary"} className="text-xs mt-1">
                          {isGood ? "正确" : "待改进"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 shrink-0">
                <CalendarDays className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 mb-2">下一步：预约技术面试</h2>
                <p className="text-slate-600">
                  您的测评已完成，系统已自动记录您的成绩。现在您可以预约技术面试，选择适合您的时段与面试官进行面对面交流。
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => router.push(`/booking?sub=${submission.id}`)}
                >
                  预约面试
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => router.push("/")}
                >
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
