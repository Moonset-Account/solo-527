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
import { useMessages } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";

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
  const { data: messages, loading, refetch } = useMessages();

  const filteredMessages = (messages || []).filter((msg: any) => {
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

  const unreadCount = (messages || []).filter((m: any) => !m.is_read).length;

  const getRelatedIcon = (type: string) => {
    const icons: Record<string, any> = {
      activity: Calendar,
      repair: Wrench,
      trade: ShoppingBag,
      verification: Shield,
    };
    return icons[type] || Bell;
  };

  const handleMarkAllRead = async () => {
    const supabase = createClient();
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("is_read", false);
    refetch();
  };

  const handleMarkRead = async (msg: any) => {
    if (!msg.is_read) {
      const supabase = createClient();
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", msg.id);
      refetch();
    }
    setShowDetailDialog(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </AdminLayout>
    );
  }

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
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
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
                  {filteredMessages.map((msg: any) => {
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
                  <span className="font-medium">{(messages || []).length}</span>
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
                    {(messages || []).filter((m: any) => m.type === "activity").length}
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
                    {(messages || []).filter((m: any) => m.type === "review").length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleMarkAllRead}>
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
          <Button onClick={() => handleMarkRead(selectedMessage)}>
            <Check className="mr-2 h-4 w-4" />
            标为已读
          </Button>
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}
