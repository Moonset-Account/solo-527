import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TreePine, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-moss blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent-400 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-400 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mb-4 shadow-lg">
              <TreePine className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-primary-800">果园采摘生产记录台</h1>
            <p className="text-sm text-gray-500 mt-1">生产管理 · 质量追溯 · 申报审核</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-700 text-white py-2.5 rounded-lg font-medium hover:bg-primary-800 active:bg-primary-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">© 2026 果园采摘生产记录台 · 绿色数字果园</p>
          </div>
        </div>
      </div>
    </div>
  )
}
