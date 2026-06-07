import React, { useState } from 'react';
import { Settings, Shield, Eye, EyeOff, Save, Check } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [saved, setSaved] = useState(false);

  const statusDefinitions = [
    { key: 'pending', label: '待整改', description: '隐患已发现，通知班组整改中', color: 'yellow' },
    { key: 'in_progress', label: '整改中', description: '班组正在进行整改工作', color: 'blue' },
    { key: 'under_review', label: '复查中', description: '整改已提交，等待安全人员复查', color: 'purple' },
    { key: 'closed', label: '已关闭', description: '复查通过，隐患整改完成', color: 'green' },
    { key: 'rejected', label: '整改驳回', description: '复查不通过，需重新整改', color: 'red' },
  ];

  const [permissionSettings, setPermissionSettings] = useState({
    directorCanViewSensitive: true,
    adminCanViewSensitive: true,
    teamLeaderCanViewSensitive: false,
    directorCanExport: true,
    adminCanExport: true,
    teamLeaderCanExport: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统配置</h1>
        <p className="text-gray-500 mt-1">状态口径定义与权限管理</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'status', label: '状态口径', icon: Settings },
              { id: 'permissions', label: '附件权限', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">状态口径定义</h3>
                <p className="text-sm text-gray-500 mb-4">
                  统一各图表和列表的状态判定标准，确保数据口径一致。
                  <span className="text-yellow-600 font-medium"> 注意：复查中状态不算已关闭。</span>
                </p>
              </div>

              <div className="grid gap-4">
                {statusDefinitions.map((status) => (
                  <div
                    key={status.key}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-md text-sm font-medium ${colorClasses[status.color]}`}>
                        {status.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{status.key}</p>
                        <p className="text-sm text-gray-500">{status.description}</p>
                      </div>
                    </div>
                    {status.key === 'closed' && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        计入闭环率
                      </span>
                    )}
                    {status.key === 'under_review' && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        不计入已关闭
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">闭环率计算公式</h4>
                <code className="text-sm text-blue-700 bg-white px-3 py-2 rounded block">
                  闭环率 = 已关闭数 / (总隐患数 - 申诉通过延期数) × 100%
                </code>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">附件权限配置</h3>
                <p className="text-sm text-gray-500 mb-4">
                  配置不同角色对附件（照片、文档）的访问权限
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">查看敏感附件</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">导出数据</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { role: '安全总监', key: 'director' },
                      { role: '安全管理员', key: 'admin' },
                      { role: '班组负责人', key: 'teamLeader' },
                    ].map(({ role, key }) => (
                      <tr key={key}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{role}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              setPermissionSettings((prev) => ({
                                ...prev,
                                [`${key}CanViewSensitive`]: !prev[`${key}CanViewSensitive` as keyof typeof prev],
                              }))
                            }
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              permissionSettings[`${key}CanViewSensitive` as keyof typeof permissionSettings]
                                ? 'bg-blue-600'
                                : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                permissionSettings[`${key}CanViewSensitive` as keyof typeof permissionSettings]
                                  ? 'translate-x-5'
                                  : ''
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              setPermissionSettings((prev) => ({
                                ...prev,
                                [`${key}CanExport`]: !prev[`${key}CanExport` as keyof typeof prev],
                              }))
                            }
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              permissionSettings[`${key}CanExport` as keyof typeof permissionSettings]
                                ? 'bg-blue-600'
                                : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                permissionSettings[`${key}CanExport` as keyof typeof permissionSettings]
                                  ? 'translate-x-5'
                                  : ''
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">成本统计规则</h4>
                <p className="text-sm text-yellow-700">
                  罚款金额未确认的隐患不计入成本统计。只有状态为"已确认"的罚款才会被纳入成本分析报表。
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? '已保存' : '保存配置'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
