"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import {
  Bell,
  Mail,
  Calendar,
  Shield,
  Wrench,
  ShoppingBag,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  Info,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const mockMessages = [
  {
    id: "1",
    title: "活动审核通过通知",
    content: "您提交的「春季团建活动」已通过审核，活动将于 6月20日 下午2点在学校体育馆举行。",
    type: "review",
    related_type: "activity",
    related_id: "1",
    is_read: false,
    created_at: "2026-06-12T15:30:00",
  },
  {
    id: "2",
    title: "活动提醒：春季团建活动",
    content: "您报名的「春季团建活动」将于明天下午2点开始，请准时参加。地点：学校体育馆。",
    type: "reminder",
    related_type: "activity",
    related_id: "1",
    is_read: false,
    created_at: "2026-06-19T09:00:00",
  },
  {
    id: "3",
    title: "新的身份审核申请",
    content: "用户「李四」提交了社团负责人认证申请，等待您的审核。",
    type: "system",
    related_type: "verification",
    related_id: "1",
    is_read: false,
    created_at: "2026-06-18T14:20:00",
  },
  {
    id: "4",
    title: "宿舍报修处理完成",
    content: "您提交的报修单「宿舍灯管更换」已处理完成，请确认是否满意。",
    type: "notification",
    related_type: "repair",
    related_id: "1",
    is_read: true,
    created_at: "2026-06-17T16:45:00",
  },
  {
    id: "5",
    title: "报名成功通知",
    content: "恭喜您成功报名「编程技术分享会」，请准时参加活动。座位号：15号。",
    type: "activity",
    related_type: "activity",
    related_id: "2",
    is_read: true,
    created_at: "2026-06-15T10:30:00",
  },
  {
    id: "6",
    title: "二手物品售出通知",
    content: "您发布的二手物品「数据结构教材」已被拍下，请及时与买家联系。",
    type: "notification",
    related_type: "trade",
    related_id: "1",
    is_read: true,
    created_at: "2026-06-14T11:20:00",
  },
  {
    id: "7",
    title: "系统维护通知",
    content: "系统将于本周六凌晨2点-4点进行例行维护，期间服务可能短暂中断。",
    type: "system",
    is_read: true,
    created_at: "2026-06-13T09:00:00",
  },
  {
    id: "8",
    title: "活动取消通知",
    content: "很抱歉，「创业沙龙」活动因特殊原因取消，给您带来不便敬请谅解。",
    type: "activity",
    related_type: "activity",
    related_id: "6",
    is_read: true,
    created_at: "2026-06-12T16:00:00",
  },
];

const tabs = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未读" },
  { key: "activity", label: "活动" },
  { key: "system", label: "系统" },
  { key: "review", label: "审核" },
];

const typeIcons: Record<string, any> = {
  system: AlertCircle,
  activity: Calendar,
  reminder: Bell,
  review: Shield,
  notification: Info,
};

const typeColors: Record<string, string> = {
  system: "bg-blue-100 text-blue-600",
  activity: "bg-green-100 text-green-600",
  reminder: "bg-yellow-100 text-yellow-600",
  review: "bg-purple-100 text-purple-600",
  notification: "bg-gray-100 text-gray-600",
};

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const filteredMessages = mockMessages.filter((msg) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "unread"
        ? !msg.is_read
        : msg.type === activeTab;
    const matchesSearch =
      msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleView = (msg: any) => {
    setSelectedMessage(msg);
    setShowDetailDialog(true);
  };

  const unreadCount = mockMessages.filter((m) => !m.is_read).length;

  const getRelatedIcon = (type: string) => {
    const icons: Record<string, any> = {
      activity: Calendar,
      repair: Wrench,
      trade: ShoppingBag,
      verification: Shield,
    };
    return icons[type] || Bell;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
            <p className="mt-1 text-gray-500">
              查看所有系统通知和消息
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-600">
                  {unreadCount} 条未读
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" />
              全部标为已读
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
                  <div className="flex space-x-1 overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === tab.key
                            ? "bg-primary-100 text-primary-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {tab.label}
                        {tab.key === "unread" && unreadCount > 0 && (
                          <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="搜索消息..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-64 rounded-md border border-gray-200 pl-9 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredMessages.map((msg) => {
                    const TypeIcon = typeIcons[msg.type] || Bell;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => handleView(msg)}
                        className={`flex cursor-pointer items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                          !msg.is_read ? "border-primary-200 bg-primary-50/50" : "border-gray-100"
                        }`}
                      >
                        <div className={`rounded-lg p-2 ${typeColors[msg.type] || "bg-gray-100 text-gray-600"}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h3 className={`font-medium ${!msg.is_read ? "text-gray-900" : "text-gray-700"}`}>
                              {msg.title}
                            </h3>
                            {!msg.is_read && (
                              <span className="ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{msg.content}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatDateTime(msg.created_at)}
                            </span>
                            {msg.related_type && (
                              <Badge variant="outline" className="text-xs">
                                {msg.related_type === "activity" && "活动相关"}
                                {msg.related_type === "repair" && "报修相关"}
                                {msg.related_type === "trade" && "交易相关"}
                                {msg.related_type === "verification" && "审核相关"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredMessages.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <Mail className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">暂无消息</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">消息统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-600">全部消息</span>
                  </div>
                  <span className="font-medium">{mockMessages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-red-100 p-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm text-gray-600">未读消息</span>
                  </div>
                  <span className="font-medium text-red-600">{unreadCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">活动通知</span>
                  </div>
                  <span className="font-medium">
                    {mockMessages.filter((m) => m.type === "activity").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">审核通知</span>
                  </div>
                  <span className="font-medium">
                    {mockMessages.filter((m) => m.type === "review").length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCheck className="mr-2 h-4 w-4" />
                  全部标为已读
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  清空已读消息
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Filter className="mr-2 h-4 w-4" />
                  消息设置
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title={selectedMessage?.title}
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">
                {selectedMessage.type === "system" && "系统消息"}
                {selectedMessage.type === "activity" && "活动消息"}
                {selectedMessage.type === "reminder" && "提醒消息"}
                {selectedMessage.type === "review" && "审核消息"}
                {selectedMessage.type === "notification" && "通知消息"}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatDateTime(selectedMessage.created_at)}
              </span>
            </div>

            <p className="text-gray-700 leading-relaxed">{selectedMessage.content}</p>

            {selectedMessage.related_type && (
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm text-gray-500">相关内容</p>
                <div className="mt-2 flex items-center space-x-3">
                  {(() => {
                    const RelatedIcon = getRelatedIcon(selectedMessage.related_type);
                    return <RelatedIcon className="h-5 w-5 text-gray-400" />;
                  })()}
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedMessage.related_type === "activity" && "查看活动详情"}
                      {selectedMessage.related_type === "repair" && "查看报修详情"}
                      {selectedMessage.related_type === "trade" && "查看交易详情"}
                      {selectedMessage.related_type === "verification" && "查看审核详情"}
                    </p>
                    <p className="text-xs text-gray-500">点击跳转到相关页面</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
            关闭
          </Button>
          <Button onClick={() => setShowDetailDialog(false)}>
            <Check className="mr-2 h-4 w-4" />
            标为已读
          </Button>
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}
