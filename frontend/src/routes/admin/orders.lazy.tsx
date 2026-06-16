import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ordersApi } from '../../lib/api';
import type { Order, OrderNode, OrderNodeLog } from '../../lib/types';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: '已支付', color: 'bg-green-100 text-green-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
};

const nodeStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待执行', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700' },
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [nodes, setNodes] = useState<OrderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'nodes'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nodeLogs, setNodeLogs] = useState<OrderNodeLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const owners = ['张三', '李四', '王五', '赵六'];

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchNodes();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [page, pageSize, search, status, owner]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.list({
        page,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        owner: owner || undefined,
      });
      setOrders(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNodes = async () => {
    setNodeLoading(true);
    try {
      const data = await ordersApi.getNodes();
      setNodes(data.nodes);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    } finally {
      setNodeLoading(false);
    }
  };

  const handleToggleNode = async (node: OrderNode) => {
    try {
      await ordersApi.updateNode(node.id, { isEnabled: !node.isEnabled });
      fetchNodes();
    } catch (error) {
      console.error('Failed to update node:', error);
    }
  };

  const handleViewLogs = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const data = await ordersApi.getNodeLogs(order.id);
      setNodeLogs(data.logs);
      setShowLogs(true);
    } catch (error) {
      console.error('Failed to fetch node logs:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">订单节点管理</h1>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            订单列表
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'nodes'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            节点配置
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="搜索订单号、用户..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                {Object.entries(statusMap).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
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
            </div>
          </div>
        )}
      </div>

      {activeTab === 'orders' && (
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
                      <th className="text-left py-3 px-4 font-medium text-gray-600">订单号</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">用户</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">金额</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">负责人</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">{order.orderNo}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-gray-800">{order.userName || '-'}</div>
                            <div className="text-xs text-gray-500">{order.userEmail || '-'}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">{formatCurrency(order.amount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {statusMap[order.status]?.label || order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{order.owner || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleViewLogs(order)}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            节点日志
                          </button>
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
      )}

      {activeTab === 'nodes' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {nodeLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">节点名称</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">节点编码</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">排序</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr key={node.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{node.name}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{node.code}</td>
                      <td className="py-3 px-4 text-gray-600">{node.description || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{node.sortOrder}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          node.isEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {node.isEnabled ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleNode(node)}
                          className={`text-sm font-medium ${
                            node.isEnabled
                              ? 'text-red-500 hover:text-red-700'
                              : 'text-green-500 hover:text-green-700'
                          }`}
                        >
                          {node.isEnabled ? '停用' : '启用'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showLogs && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">订单节点流转日志</h2>
                <p className="text-sm text-gray-500">订单号: {selectedOrder.orderNo}</p>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {nodeLogs.length > 0 ? (
                <div className="space-y-4">
                  {nodeLogs.map((log, index) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          log.status === 'completed' ? 'bg-green-500' :
                          log.status === 'processing' ? 'bg-blue-500' :
                          log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        {index < nodeLogs.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="font-medium text-gray-800">{log.nodeName}</span>
                            <span className="mx-2 text-xs text-gray-400">{log.nodeCode}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${nodeStatusMap[log.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {nodeStatusMap[log.status]?.label || log.status}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-sm text-gray-600 mb-1">{log.note}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {log.operator && <span>操作人: {log.operator}</span>}
                          {log.executedAt && <span>执行时间: {formatDateTime(log.executedAt)}</span>}
                          {!log.executedAt && <span>创建时间: {formatDateTime(log.createdAt)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">暂无节点流转记录</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/orders')({
  component: OrdersPage,
});
