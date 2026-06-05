import Link from 'next/link';
import { Theater, Calendar, Ticket, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-primary-dark">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/80 to-primary/60" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-3">
              <Theater className="h-10 w-10 text-secondary" />
              <span className="text-2xl font-display font-bold text-white">
                梨园剧社
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-white/80 hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
              >
                注册
              </Link>
            </div>
          </nav>

          <div className="text-center py-16 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6">
              舞台之上，梦想绽放
            </h1>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              专业的校园戏剧社排练与票务管理平台，让每一次演出都更加精彩
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tickets/shows"
                className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                浏览演出
              </Link>
              <Link
                href="/login"
                className="border-2 border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all"
              >
                社团登录
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-gray-900">
            核心功能
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Calendar className="h-8 w-8" />,
                title: '排练管理',
                desc: '智能排期，自动检测课程冲突，让排练安排更高效',
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: '角色分配',
                desc: '清晰的角色管理，演员信息一目了然',
              },
              {
                icon: <Ticket className="h-8 w-8" />,
                title: '在线选座',
                desc: '可视化座位图，轻松选座购票，支持候补排队',
              },
              {
                icon: <Theater className="h-8 w-8" />,
                title: '扫码验票',
                desc: '现场快速验票，支持换座并留存完整记录',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 card-hover"
              >
                <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Theater className="h-6 w-6 text-secondary" />
            <span className="font-display font-semibold text-white">
              校园戏剧社管理系统
            </span>
          </div>
          <p className="text-sm">
            © 2024 校园戏剧社. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  );
}
