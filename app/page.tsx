import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Shield, FileCheck, Users, Bell, Scale, BarChart3 } from 'lucide-react';

export default function Home() {
  const { userId } = auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mt-8 text-4xl font-bold text-slate-900 sm:text-5xl">
            合规清单台
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
            企业级数据合规风险看板，实现风险识别、评估、整改全流程闭环管理
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <a
              href="/sign-in"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              登录系统
            </a>
            <a
              href="/sign-up"
              className="px-8 py-3 bg-white text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors border border-slate-300 shadow"
            >
              注册账号
            </a>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <FileCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">检查清单管理</h3>
            <p className="mt-2 text-slate-600">
              业务部门填写合规检查清单，支持多类别检查项配置
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">风险等级评估</h3>
            <p className="mt-2 text-slate-600">
              法务团队进行风险等级评定，配置整改建议和到期提醒
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Scale className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">合同版本管理</h3>
            <p className="mt-2 text-slate-600">
              合同版本追踪，审查意见维护，与风险闭环关联
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">越权提醒处理</h3>
            <p className="mt-2 text-slate-600">
              公益律师接收权限越权提醒，处理结果回流风险闭环
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">风险闭环看板</h3>
            <p className="mt-2 text-slate-600">
              全流程风险闭环管理，从发现到整改完成全程追踪
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">多角色协作</h3>
            <p className="mt-2 text-slate-600">
              支持业务、法务、公益律师、管理员等多角色协同工作
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
