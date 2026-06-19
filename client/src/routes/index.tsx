import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">专业家电维修服务</h1>
          <p className="text-xl mb-8 text-primary-100">
            快速上门 · 透明收费 · 品质保障
          </p>
          <Link
            to="/book"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            立即预约维修
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">我们的服务</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '❄️', title: '空调维修', desc: '加氟、清洗、故障排查' },
              { icon: '🧊', title: '冰箱维修', desc: '不制冷、噪音大、漏水' },
              { icon: '🧺', title: '洗衣机维修', desc: '不启动、不脱水、漏水' },
              { icon: '📺', title: '电视维修', desc: '无图像、无声音、屏幕故障' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">服务流程</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: '在线预约', desc: '填写故障信息，上传照片' },
              { step: '02', title: '师傅接单', desc: '系统分配，师傅联系确认' },
              { step: '03', title: '上门维修', desc: '准时到达，专业维修' },
              { step: '04', title: '验收付款', desc: '满意付款，售后保障' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">需要维修帮助？</h2>
          <p className="text-gray-500 mb-8">专业师傅随时为您服务，24小时内响应</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              在线预约
            </Link>
            <Link
              to="/admin"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              管理后台
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
