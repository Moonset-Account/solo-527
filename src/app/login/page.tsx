'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [email, setEmail] = useState('resident1@example.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      setError('邮箱或密码错误')
      setLoading(false)
    } else if (result?.ok) {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">公寓住户服务门户</h1>
          <p className="text-gray-500 mt-2">请登录您的账户</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-3">演示账号（密码均为 123456）</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => { setEmail('admin@example.com'); setPassword('123456') }}
                className="p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                管理员
              </button>
              <button
                onClick={() => { setEmail('cs@example.com'); setPassword('123456') }}
                className="p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                客服
              </button>
              <button
                onClick={() => { setEmail('engineer@example.com'); setPassword('123456') }}
                className="p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                工程师
              </button>
              <button
                onClick={() => { setEmail('resident1@example.com'); setPassword('123456') }}
                className="p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                住户
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
