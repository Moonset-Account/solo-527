import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { rulesApi } from '../../lib/api';
import type { Rule } from '../../lib/types';

const categories = ['审核规则', '风控规则', '定价规则', '分配规则', '通知规则'];

type ModalType = 'create' | null;

function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [formData, setFormData] = useState({
    version: '',
    name: '',
    category: categories[0],
    description: '',
    content: '{}',
    createdBy: '',
  });

  useEffect(() => {
    fetchRules();
  }, [page, pageSize, category, isActive]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await rulesApi.list({
        page,
        pageSize,
        category: category || undefined,
        isActive: isActive === '' ? undefined : isActive === 'true',
      });
      setRules(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedRules = categories
    .filter((cat) => !category || cat === category)
    .map((cat) => ({
      category: cat,
      items: rules.filter((r) => r.category === cat),
    }))
    .filter((g) => g.items.length > 0 || !category);

  const handleCreate = () => {
    setFormData({
      version: '',
      name: '',
      category: category || categories[0],
      description: '',
      content: '{}',
      createdBy: '',
    });
    setModalType('create');
  };

  const handleSubmitCreate = async () => {
    try {
      let contentObj;
      try {
        contentObj = JSON.parse(formData.content);
      } catch {
        alert('JSON 格式不正确');
        return;
      }

      await rulesApi.create({
        name: formData.name,
        category: formData.category,
        version: formData.version,
        content: contentObj,
        description: formData.description || undefined,
        createdBy: formData.createdBy || undefined,
      });
      setModalType(null);
      fetchRules();
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleActivate = async (rule: Rule) => {
    if (rule.isActive) return;
    try {
      await rulesApi.activate(rule.id);
      fetchRules();
    } catch (error) {
      console.error('Failed to activate rule:', error);
    }
  };

  const handleDeactivate = async (rule: Rule) => {
    if (!rule.isActive) return;
    try {
      await rulesApi.deactivate(rule.id);
      fetchRules();
    } catch (error) {
      console.error('Failed to deactivate rule:', error);
    }
  };

  const handleRollback = async (rule: Rule) => {
    try {
      await rulesApi.rollback(rule.id);
      fetchRules();
    } catch (error) {
      console.error('Failed to rollback rule:', error);
    }
  };

  const handleDelete = async (rule: Rule) => {
    if (!confirm('确定要删除此规则版本吗？')) return;
    try {
      await rulesApi.remove(rule.id);
      fetchRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">规则版本管理</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            创建新版本
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类别</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={isActive}
              onChange={(e) => {
                setIsActive(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="true">已激活</option>
              <option value="false">未激活</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedRules.map((group) => (
            <div key={group.category} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">
                  {group.category}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({group.items.length} 个版本)
                  </span>
                </h3>
              </div>

              {group.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">版本号</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">名称</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">创建人</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">激活时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((rule) => (
                        <tr
                          key={rule.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            rule.isActive ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {rule.isActive && (
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                              )}
                              <span
                                className={`font-mono ${
                                  rule.isActive ? 'font-bold text-blue-700' : 'text-gray-800'
                                }`}
                              >
                                {rule.version}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-800">{rule.name}</td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                            {rule.description || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                rule.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {rule.isActive ? '已激活' : '未激活'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{rule.createdBy || '-'}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {formatDateTime(rule.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {formatDateTime(rule.activatedAt)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!rule.isActive && (
                                <button
                                  onClick={() => handleActivate(rule)}
                                  className="text-green-500 hover:text-green-700 text-sm font-medium"
                                >
                                  激活
                                </button>
                              )}
                              {rule.isActive && (
                                <button
                                  onClick={() => handleDeactivate(rule)}
                                  className="text-yellow-500 hover:text-yellow-700 text-sm font-medium"
                                >
                                  停用
                                </button>
                              )}
                              <button
                                onClick={() => handleRollback(rule)}
                                className="text-orange-500 hover:text-orange-700 text-sm font-medium"
                              >
                                回退
                              </button>
                              <button
                                onClick={() => handleDelete(rule)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">暂无规则版本</div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm">
            <div className="text-sm text-gray-500">
              共 {total} 条记录，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                首页
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {renderPagination().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === page
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                末页
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'create' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">创建新版本</h2>
              <button
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如: v1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="规则名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="规则描述（选填）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">创建人</label>
                <input
                  type="text"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="创建人（选填）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规则内容 (JSON)
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"key": "value"}'
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalType(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitCreate}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/rules')({
  component: RulesPage,
});
