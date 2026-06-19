'use client'

import { useEffect } from 'react'
import { SignInButton, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { HandshakeIcon, FileCheck, AlertTriangle, Users, ArrowRight, ShieldCheck, BarChart3 } from 'lucide-react'

export default function Home() {
  const { userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (userId) {
      router.push('/dashboard')
    }
  }, [userId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <nav className="flex items-center justify-between mb-12 sm:mb-16">
          <div className="flex items-center gap-2 font-bold text-xl sm:text-2xl text-primary">
            <HandshakeIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">办公耗材交付对账系统</span>
            <span className="sm:hidden">耗材对账</span>
          </div>
          <SignInButton mode="modal">
            <button className="btn-primary">登录系统</button>
          </SignInButton>
        </nav>

        <div className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <ShieldCheck className="w-4 h-4" />
            采购办公耗材全流程管理平台
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            智能对账
            <span className="text-primary"> · </span>
            <br className="sm:hidden" />
            供应商风险防控
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            从员工耗材登记、采购需求、框架协议到对账付款，全流程联动提醒规则，
            交付差异和付款差异自动推送供应商风险看板，让采购管理更透明更高效。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <SignInButton mode="modal">
              <button className="btn-primary text-base px-6 py-3 w-full sm:w-auto">
                开始使用
                <ArrowRight className="w-5 h-5" />
              </button>
            </SignInButton>
            <a href="#features" className="btn-secondary text-base px-6 py-3 w-full sm:w-auto">
              了解更多
            </a>
          </div>
        </div>

        <div id="features" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16 sm:mb-24">
          {[
            { icon: FileCheck, title: '全流程对账', desc: '交付记录、对账匹配、差异提醒、付款建议一体化处理，数据不遗漏。', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            { icon: AlertTriangle, title: '风险智能联动', desc: '框架协议、报价、交付与提醒规则联动，异常自动进入供应商风险档案。', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
            { icon: Users, title: '角色协同工作', desc: '员工登记、经理对账、协同员处理付款差异、负责人审批，各司其职。', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
            { icon: BarChart3, title: '风险看板', desc: '多维度风险可视化，按供应商、风险等级、处理状态实时统计。', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
            { icon: HandshakeIcon, title: '协议报价管理', desc: '框架协议与采购需求、供应商报价关联管理，价格溯源清晰。', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
            { icon: ShieldCheck, title: '移动端适配', desc: '表单项多时自动响应式布局，手机操作字段不重叠，按钮不挤压。', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-3 rounded-xl ${f.color} mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-10 text-center bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">准备好提升采购对账效率了吗？</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
            使用 Clerk 账号一键登录，立即开启办公耗材智能对账之旅。
          </p>
          <SignInButton mode="modal">
            <button className="btn-primary text-base px-8 py-3 w-full sm:w-auto">
              立即登录系统
              <ArrowRight className="w-5 h-5" />
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  )
}
