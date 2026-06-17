'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  User,
  Clock,
  MapPin,
  FileText,
  Paperclip,
  MessageSquare,
  History,
  Plus,
  Upload,
  Send,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Package,
  DollarSign,
  Printer,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Alert } from '@/components/ui/Alert';
import {
  mockAppointments,
  mockOrderItems,
  mockOrderParts,
  mockAttachments,
  mockNotes,
  mockAuditLogs,
  mockTechnicians,
  mockStations,
  mockParts,
  mockServiceTemplates,
} from '@/lib/mockData';
import {
  formatCurrency,
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  generateId,
} from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentPageTitle } = useUIStore();
  const [activeTab, setActiveTab] = useState('info');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState(mockNotes.filter((n) => n.appointment_id === params.id));
  const [status, setStatus] = useState('');

  const appointment = mockAppointments.find((a) => a.id === params.id);
  const orderItems = mockOrderItems.filter((oi) => oi.appointment_id === params.id);
  const orderParts = mockOrderParts.filter((op) => op.appointment_id === params.id);
  const attachments = mockAttachments.filter((a) => a.appointment_id === params.id);
  const auditLogs = mockAuditLogs.filter((l) => l.appointment_id === params.id);

  useEffect(() => {
    if (appointment) {
      setCurrentPageTitle(`预约详情 - ${appointment.car_plate}`);
      setStatus(appointment.status);
    }
  }, [appointment, setCurrentPageTitle]);

  if (!appointment) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-dark-300 mx-auto mb-4" />
          <p className="text-dark-500 mb-4">预约单不存在</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  const totalItemsAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPartsAmount = orderParts.reduce((sum, part) => sum + part.price * part.quantity, 0);
  const totalAmount = totalItemsAmount + totalPartsAmount;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: generateId(),
      appointment_id: appointment.id,
      author_id: 'admin-001',
      content: newNote,
      is_internal: false,
      created_at: new Date().toISOString(),
    };
    setNotes([...notes, note]);
    setNewNote('');
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h2 className="text-xl font-bold text-dark-900 font-display">
              {appointment.car_plate} - {appointment.car_model}
            </h2>
            <p className="text-sm text-dark-500">
              预约单号：{appointment.id}
            </p>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {getStatusLabel(appointment.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            打印
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            生成收银单
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧信息栏 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 客户信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">客户信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar size="lg" fallback={appointment.customer_name.charAt(0)} />
                <div>
                  <div className="font-medium text-dark-900">{appointment.customer_name}</div>
                  <div className="text-sm text-dark-500">{appointment.customer_phone}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-dark-600">
                  <Car className="h-4 w-4 text-dark-400" />
                  {appointment.car_plate}
                </div>
                <div className="flex items-center gap-2 text-dark-600">
                  <Wrench className="h-4 w-4 text-dark-400" />
                  {appointment.car_model}
                </div>
                <div className="flex items-center gap-2 text-dark-600">
                  <Clock className="h-4 w-4 text-dark-400" />
                  {appointment.mileage} 公里
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 服务信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">服务信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-dark-500">预约时间</span>
                  <div className="font-medium text-dark-900 mt-0.5">
                    {formatDateTime(appointment.appointment_time)}
                  </div>
                </div>
                <div>
                  <span className="text-dark-500">负责技师</span>
                  <div className="font-medium text-dark-900 mt-0.5">
                    {appointment.technician?.name || '未分配'}
                  </div>
                </div>
                <div>
                  <span className="text-dark-500">使用工位</span>
                  <div className="font-medium text-dark-900 mt-0.5">
                    {appointment.station?.name || '未分配'}
                  </div>
                </div>
                <div>
                  <span className="text-dark-500">服务状态</span>
                  <div className="mt-1">
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-100">
                <label className="text-sm text-dark-500 block mb-2">状态变更</label>
                <Select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  options={[
                    { value: 'pending', label: '待确认' },
                    { value: 'confirmed', label: '已确认' },
                    { value: 'in_progress', label: '进行中' },
                    { value: 'completed', label: '已完成' },
                    { value: 'cancelled', label: '已取消' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* 费用汇总 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">费用汇总</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-500">服务项目</span>
                  <span>{formatCurrency(totalItemsAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">配件费用</span>
                  <span>{formatCurrency(totalPartsAmount)}</span>
                </div>
                <div className="flex justify-between text-dark-500">
                  <span>优惠</span>
                  <span className="text-danger-600">-¥0.00</span>
                </div>
                <div className="pt-3 mt-3 border-t border-dark-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-dark-900">合计</span>
                    <span className="text-2xl font-bold text-primary-600 font-display">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧主内容区 */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="info" className="gap-2">
                    <FileText className="h-4 w-4" />
                    检测项目
                  </TabsTrigger>
                  <TabsTrigger value="parts" className="gap-2">
                    <Package className="h-4 w-4" />
                    配件使用
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="gap-2">
                    <Paperclip className="h-4 w-4" />
                    附件
                    <Badge variant="secondary" size="sm">{attachments.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    备注
                    <Badge variant="secondary" size="sm">{notes.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    修改历史
                  </TabsTrigger>
                </TabsList>

                {/* 检测项目 */}
                <TabsContent value="info" className="mt-0 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-dark-900">检测项目列表</h3>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      添加项目
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>项目名称</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>负责技师</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>检测结果</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                          <TableCell>
                            {item.technician_id
                              ? mockTechnicians.find((t) => t.id === item.technician_id)?.name
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(item.status)} size="sm">
                              {getStatusLabel(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm text-dark-500 truncate" title={item.result}>
                              {item.result || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {item.status !== 'completed' && (
                                <Button variant="ghost" size="sm" className="text-success-600">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {orderItems.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-dark-300 mx-auto mb-4" />
                      <p className="text-dark-500">暂无检测项目</p>
                    </div>
                  )}
                </TabsContent>

                {/* 配件使用 */}
                <TabsContent value="parts" className="mt-0 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-dark-900">配件使用记录</h3>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      添加配件
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>配件名称</TableHead>
                        <TableHead>对应项目</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderParts.map((part) => {
                        const orderItem = orderItems.find((oi) => oi.id === part.order_item_id);
                        return (
                          <TableRow key={part.id}>
                            <TableCell className="font-medium">{part.part_name}</TableCell>
                            <TableCell className="text-dark-500">
                              {orderItem?.item_name || '-'}
                            </TableCell>
                            <TableCell>{formatCurrency(part.price)}</TableCell>
                            <TableCell>{part.quantity}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(part.price * part.quantity)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {orderParts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-dark-300 mx-auto mb-4" />
                      <p className="text-dark-500">暂无配件使用记录</p>
                    </div>
                  )}
                </TabsContent>

                {/* 附件 */}
                <TabsContent value="attachments" className="mt-0 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-dark-900">附件资料</h3>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      上传附件
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="border border-dark-200 rounded-xl p-4 hover:border-primary-300 transition-colors group"
                      >
                        <div className="aspect-video bg-dark-100 rounded-lg mb-3 flex items-center justify-center">
                          {att.file_type?.startsWith('image') ? (
                            <div className="text-dark-400 text-center">
                              <Paperclip className="h-10 w-10 mx-auto mb-2" />
                              <p className="text-xs">图片预览</p>
                            </div>
                          ) : (
                            <Paperclip className="h-10 w-10 text-dark-300" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="truncate flex-1">
                            <p className="text-sm font-medium text-dark-900 truncate">
                              {att.file_name}
                            </p>
                            <p className="text-xs text-dark-500">
                              {formatDateTime(att.created_at)}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 rounded hover:bg-dark-100">
                              <Download className="h-4 w-4 text-dark-500" />
                            </button>
                            <button className="p-1 rounded hover:bg-danger-50">
                              <XCircle className="h-4 w-4 text-danger-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {attachments.length === 0 && (
                    <div className="text-center py-12">
                      <Paperclip className="h-12 w-12 text-dark-300 mx-auto mb-4" />
                      <p className="text-dark-500 mb-4">暂无附件</p>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        上传第一个附件
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* 备注 */}
                <TabsContent value="notes" className="mt-0 space-y-4">
                  <h3 className="font-medium text-dark-900">备注记录</h3>

                  {/* 添加备注 */}
                  <div className="bg-dark-50 rounded-xl p-4">
                    <Textarea
                      placeholder="添加备注..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <label className="flex items-center gap-2 text-sm text-dark-600">
                        <input type="checkbox" className="rounded border-dark-300" />
                        内部备注（仅内部可见）
                      </label>
                      <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        发送
                      </Button>
                    </div>
                  </div>

                  {/* 备注列表 */}
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="flex gap-3">
                        <Avatar size="sm" fallback="管" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-dark-900">
                              {note.author_id === 'admin-001' ? '管理员' : '用户'}
                            </span>
                            {note.is_internal && (
                              <Badge variant="secondary" size="sm">内部</Badge>
                            )}
                            <span className="text-xs text-dark-400">
                              {formatDateTime(note.created_at)}
                            </span>
                          </div>
                          <div className="bg-white border border-dark-200 rounded-lg p-3 text-sm text-dark-700">
                            {note.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {notes.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-dark-300 mx-auto mb-3" />
                      <p className="text-dark-500 text-sm">暂无备注</p>
                    </div>
                  )}
                </TabsContent>

                {/* 修改历史 */}
                <TabsContent value="history" className="mt-0">
                  <h3 className="font-medium text-dark-900 mb-4">操作修改历史</h3>

                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-dark-200" />
                    <div className="space-y-4">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="relative pl-10">
                          <div className="absolute left-2 w-4 h-4 rounded-full border-2 border-primary-500 bg-white" />
                          <div className="bg-dark-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-dark-900 text-sm">
                                  {log.action}
                                </span>
                                <Badge variant="secondary" size="sm">
                                  {log.table_name}
                                </Badge>
                              </div>
                              <span className="text-xs text-dark-500">
                                {formatDateTime(log.created_at)}
                              </span>
                            </div>
                            {log.old_values && (
                              <div className="text-xs text-dark-500">
                                <span className="text-danger-600">修改前：</span>
                                {JSON.stringify(log.old_values)}
                              </div>
                            )}
                            {log.new_values && (
                              <div className="text-xs text-dark-500 mt-1">
                                <span className="text-success-600">修改后：</span>
                                {JSON.stringify(log.new_values)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {auditLogs.length === 0 && (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 text-dark-300 mx-auto mb-4" />
                      <p className="text-dark-500">暂无修改历史</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
