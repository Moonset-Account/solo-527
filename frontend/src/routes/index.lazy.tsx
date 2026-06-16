import { createLazyFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

function IndexPage() {
  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">欢迎来到播客收入看板</h1>
        <p className="text-blue-100 text-lg mb-6">
          独立播客创作者的收入结算与内容管理平台
        </p>
        <div className="flex gap-4">
          <Link
            to="/admin"
            className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            进入后台
          </Link>
          <button className="border border-white/30 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-white/10 transition-colors">
            了解更多
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">🎧</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">优质内容</h3>
          <p className="text-gray-500 text-sm">
            精选播客内容，独家会员专享节目持续更新
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">会员订阅</h3>
          <p className="text-gray-500 text-sm">
            灵活的订阅方案，满足不同听众的需求
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">数据透明</h3>
          <p className="text-gray-500 text-sm">
            清晰的收入数据，让创作者了解每一笔收益
          </p>
        </div>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">热门节目</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: '创业故事汇', duration: '45分钟', type: 'free' },
            { title: '技术深度谈', duration: '60分钟', type: 'premium' },
            { title: '生活观察室', duration: '30分钟', type: 'free' },
          ].map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                🎵
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{item.title}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.type === 'premium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {item.type === 'premium' ? '会员' : '免费'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{item.duration}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export const Route = createLazyFileRoute('/')({
  component: IndexPage,
})
