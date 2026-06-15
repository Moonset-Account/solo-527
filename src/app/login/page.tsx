'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store'
import { ROLE_LABELS, type AuthUser } from '@/types'
import { Cpu, FlaskConical, Microscope, Shield, BookOpen, ChevronRight } from 'lucide-react'

const mockUsers: AuthUser[] = [
  { id: '1', email: 'researcher@lab.cn', role: 'researcher', display_name: '张明远', lab_id: 'lab-1' },
  { id: '2', email: 'archivist@lab.cn', role: 'archivist', display_name: '李文静', lab_id: 'lab-1' },
  { id: '3', email: 'admin@lab.cn', role: 'admin', display_name: '王管理', lab_id: 'lab-1' },
  { id: '4', email: 'teacher@lab.cn', role: 'equipment_teacher', display_name: '陈老师', lab_id: 'lab-1' },
]

const roleIcons: Record<string, React.ReactNode> = {
  researcher: <FlaskConical className="w-4 h-4" />,
  archivist: <BookOpen className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
  equipment_teacher: <Microscope className="w-4 h-4" />,
}

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAppStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise((r) => setTimeout(r, 800))

    const user = mockUsers.find((u) => u.email === email)
    if (!user) {
      setError('邮箱或密码错误')
      setLoading(false)
      return
    }

    setUser(user)
    setCurrentUser(user)
    setLoggedIn(true)
    setTimeout(() => router.push('/'), 1500)
  }

  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-700 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white/30" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white/25" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Cpu className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">实验预约登记站</span>
          </div>

          <h1 className="text-4xl font-black leading-tight mb-4">
            科研实验室<br />综合管理平台
          </h1>
          <p className="text-teal-200 text-lg leading-relaxed max-w-md">
            仪器预约、数据归档、权限审批、设备看板 — 一站式闭环管理
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm">
            {[
              { icon: <FlaskConical className="w-5 h-5" />, label: '智能预约' },
              { icon: <BookOpen className="w-5 h-5" />, label: '数据归档' },
              { icon: <Shield className="w-5 h-5" />, label: '权限管控' },
              { icon: <Microscope className="w-5 h-5" />, label: '设备监控' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-sm"
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 bg-slate-50">
        <div className="w-full max-w-md">
          {loggedIn && currentUser ? (
            <div className="text-center animate-[slide-in_0.3s_ease-out]">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <div className="text-teal-700">{roleIcons[currentUser.role]}</div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                欢迎回来，{currentUser.display_name}
              </h2>
              <p className="text-slate-500 mb-2">{currentUser.email}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium">
                {roleIcons[currentUser.role]}
                {ROLE_LABELS[currentUser.role]}
              </div>
              <p className="mt-6 text-sm text-slate-400">正在跳转到首页...</p>
            </div>
          ) : (
            <>
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">实验预约登记站</span>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-2">登录</h2>
              <p className="text-slate-500 mb-8">请使用邮箱和密码登录您的账号</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">邮箱地址</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="input-field"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      登录
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a href="#" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  注册账号
                </a>
              </div>

              <div className="mt-8 p-4 rounded-xl bg-slate-100 border border-slate-200">
                <p className="text-xs text-slate-500 mb-3 font-medium">测试账号（任意密码登录）</p>
                <div className="space-y-1.5">
                  {mockUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setEmail(u.email)
                        setPassword('123456')
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-white hover:text-teal-700 transition-colors text-left"
                    >
                      {roleIcons[u.role]}
                      <span className="font-medium">{u.display_name}</span>
                      <span className="text-slate-400">· {u.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
