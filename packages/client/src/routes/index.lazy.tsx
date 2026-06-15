import { createLazyFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        宠物寄养健康记录站
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        专业的宠物寄养训练管理平台，提供完整的健康记录、寄养安全复盘、排班管理和单据追踪功能
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Link
          to="/pets/new"
          className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-3">📝</div>
          <h3 className="font-semibold text-gray-800 mb-2">宠物档案登记</h3>
          <p className="text-sm text-gray-500">入口填写宠物基本信息、疫苗记录和过敏史</p>
        </Link>
        <Link
          to="/records"
          className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-semibold text-gray-800 mb-2">寄养记录管理</h3>
          <p className="text-sm text-gray-500">记录健康处置、洗护照片和回访计划</p>
        </Link>
        <Link
          to="/schedules"
          className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-3">📅</div>
          <h3 className="font-semibold text-gray-800 mb-2">排班负荷管理</h3>
          <p className="text-sm text-gray-500">按志愿者、日期和风险原因拆分查看</p>
        </Link>
      </div>
    </div>
  );
}
