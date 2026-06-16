import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { materialsApi } from '../../lib/api';
import type { Material, MaterialLicense } from '../../lib/types';

const materialTypes = ['图片', '视频', '音频', '文档', '软件'];
const licenseTypes = ['永久授权', '年度授权', '月度授权', '单次使用'];

function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [owner, setOwner] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [licenses, setLicenses] = useState<MaterialLicense[]>([]);
  const [showLicenses, setShowLicenses] = useState(false);
  const [licensePage, setLicensePage] = useState(1);
  const [licenseTotal, setLicenseTotal] = useState(0);

  const owners = ['张三', '李四', '王五', '赵六'];

  useEffect(() => {
    fetchMaterials();
  }, [page, pageSize, search, type, licenseType, owner, isActive]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await materialsApi.list({
        page,
        pageSize,
        search: search || undefined,
        type: type || undefined,
        licenseType: licenseType || undefined,
        owner: owner || undefined,
        isActive: isActive || undefined,
      });
      setMaterials(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (material: Material) => {
    try {
      await materialsApi.update(material.id, { isActive: !material.isActive });
      fetchMaterials();
    } catch (error) {
      console.error('Failed to update material:', error);
    }
  };

  const handleViewLicenses = async (material: Material) => {
    setSelectedMaterial(material);
    setLicensePage(1);
    fetchLicenses(material.id, 1);
    setShowLicenses(true);
  };

  const fetchLicenses = async (materialId: number, pageNum: number) => {
    try {
      const data = await materialsApi.getLicenses(materialId, {
        page: pageNum,
        pageSize: 5,
      });
      setLicenses(data.items);
      setLicenseTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? Number(value) : value;
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">素材授权管理</h1>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索素材名称..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类型</option>
              {materialTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={licenseType}
              onChange={(e) => {
                setLicenseType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部授权类型</option>
              {licenseTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={owner}
              onChange={(e) => {
                setOwner(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部负责人</option>
              {owners.map((o) => (
                <option key={o} value={o}>{o}</option>
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
              <option value="true">启用</option>
              <option value="false">停用</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">素材名称</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">授权类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">费用</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">负责人</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{material.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {material.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{material.licenseType}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{formatCurrency(material.fee)}</td>
                      <td className="py-3 px-4 text-gray-600">{material.owner || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          material.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {material.isActive ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewLicenses(material)}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            授权记录
                          </button>
                          <button
                            onClick={() => handleToggleActive(material)}
                            className={`text-sm font-medium ${
                              material.isActive
                                ? 'text-red-500 hover:text-red-700'
                                : 'text-green-500 hover:text-green-700'
                            }`}
                          >
                            {material.isActive ? '停用' : '启用'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
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
          </>
        )}
      </div>

      {showLicenses && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">授权记录</h2>
                <p className="text-sm text-gray-500">{selectedMaterial.name}</p>
              </div>
              <button
                onClick={() => setShowLicenses(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {licenses.length > 0 ? (
                <div className="space-y-3">
                  {licenses.map((license) => (
                    <div key={license.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-800">{license.userName || '-'}</p>
                          <p className="text-xs text-gray-500">{license.userEmail || '-'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          license.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {license.status === 'active' ? '有效' : '已过期'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>开始: {formatDate(license.startDate)}</span>
                        {license.endDate && <span>结束: {formatDate(license.endDate)}</span>}
                        {license.orderId && <span>订单号: {license.orderId}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">暂无授权记录</p>
              )}

              {licenseTotal > 5 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, licensePage - 1);
                      setLicensePage(newPage);
                      fetchLicenses(selectedMaterial.id, newPage);
                    }}
                    disabled={licensePage === 1}
                    className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-500">第 {licensePage} 页</span>
                  <button
                    onClick={() => {
                      const newPage = licensePage + 1;
                      setLicensePage(newPage);
                      fetchLicenses(selectedMaterial.id, newPage);
                    }}
                    disabled={licensePage * 5 >= licenseTotal}
                    className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/materials')({
  component: MaterialsPage,
});
