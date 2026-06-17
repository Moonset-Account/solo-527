import Link from "next/link"

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 0%, rgba(16,185,129,0.1), transparent), radial-gradient(ellipse 60% 40% at 20% 10%, rgba(59,130,246,0.08), transparent)",
        }}
      />

      <div className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="flex flex-col items-center gap-8 px-6 text-center animate-fade-in">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 font-serif">
            技术面试测评台
          </h1>
          <p className="text-lg text-slate-600">
            标准化技术面试流程，量化面试质量
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/assessment/demo"
            className="inline-flex items-center justify-center h-12 px-8 text-base font-medium text-white bg-emerald-500 rounded-lg transition-colors hover:bg-emerald-600"
          >
            开始测评
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center h-12 px-8 text-base font-medium text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors hover:bg-slate-50 hover:border-slate-300"
          >
            管理后台
          </Link>
        </div>
      </div>
    </div>
  )
}
