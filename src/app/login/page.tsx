"use client";

import Link from "next/link";
import { Leaf, Stethoscope } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@tcm.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/";
    }, 600);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A4A4C] via-[#0D7377] to-[#0B5659] px-4">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-gold-400/30 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ochre-400/10 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-gold-400/20 bg-cream-100/95 shadow-2xl backdrop-blur-sm lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-[#0A4A4C] via-[#0D7377] to-[#0B5659] p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20 ring-1 ring-gold-400/40">
              <Leaf className="h-6 w-6 text-gold-300" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-wide text-gold-100">
                病历随访台
              </h2>
              <p className="text-xs uppercase tracking-[0.25em] text-teal-200/70">
                TCM Follow-Up Desk
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Stethoscope className="mt-1 h-5 w-5 flex-shrink-0 text-gold-300" />
              <div>
                <p className="text-sm font-medium text-white">
                  连接前台与后台的全流程管理
                </p>
                <p className="mt-1 text-sm text-teal-100/70">
                  病历管理 · 随访任务 · 复诊统计 · 号源分析
                </p>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
            <p className="text-xs italic leading-relaxed text-teal-100/70">
              &ldquo;上医治未病，中医治欲病，下医治已病。&rdquo;
              <br />
              <span className="text-gold-300/80">——《黄帝内经》</span>
            </p>
          </div>

          <p className="text-xs text-teal-200/50">
            © 2026 病历随访台 · 中医馆数字化运营平台
          </p>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-display text-2xl font-semibold text-ink-900">
              欢迎登录
            </h1>
            <p className="mt-1 text-sm text-ink-600">
              使用您的账号进入运营管理中心
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">
                  账号邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@tcm.com"
                  className="w-full rounded-lg border border-gold-300/50 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-700">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gold-300/50 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  required
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-ink-700">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-3.5 w-3.5 rounded border-gold-300 text-teal-600 focus:ring-teal-500/30"
                  />
                  记住账号
                </label>
                <Link
                  href="#"
                  className="font-medium text-teal-600 hover:text-teal-700"
                >
                  忘记密码？
                </Link>
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "登录中..." : "登 录"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-ink-600">
              演示账号：任意邮箱 · 任意密码即可登录
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
