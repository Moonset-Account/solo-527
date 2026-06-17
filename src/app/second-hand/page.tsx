"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  User,
  Calendar,
  DollarSign,
  Tag,
  Link2,
  Eye,
  Check,
  X,
  Phone,
  MessageSquare,
} from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/utils";

const mockItems = [
  {
    id: "1",
    title: "数据结构教材",
    description: "九成新的《数据结构与算法分析》教材，附带笔记",
    price: 25.0,
    category: "书籍",
    condition: "good",
    seller_name: "张三",
    seller_id: "user1",
    seller_phone: "13800138001",
    buyer_name: "李四",
    buyer_id: "user2",
    status: "sold",
    related_activity_id: "2",
    related_activity_title: "编程技术分享会",
    images: [],
    created_at: "2026-06-10T10:00:00",
    updated_at: "2026-06-14T11:20:00",
  },
  {
    id: "2",
    title: "二手篮球",
    description: "斯伯丁篮球，用了半年，弹性还很好",
    price: 80.0,
    category: "运动器材",
    condition: "like_new",
    seller_name: "王五",
    seller_id: "user3",
    seller_phone: "13800138002",
    buyer_name: null,
    buyer_id: null,
    status: "available",
    related_activity_id: "1",
    related_activity_title: "春季团建活动",
    images: [],
    created_at: "2026-06-12T14:30:00",
    updated_at: "2026-06-12T14:30:00",
  },
  {
    id: "3",
    title: "机械键盘",
    description: "Cherry红轴机械键盘，87键，手感很好",
    price: 200.0,
    category: "数码产品",
    condition: "like_new",
    seller_name: "赵六",
    seller_id: "user4",
    seller_phone: "13800138003",
    buyer_name: null,
    buyer_id: null,
    status: "reserved",
    related_activity_id: null,
    related_activity_title: null,
    images: [],
    created_at: "2026-06-15T09:00:00",
    updated_at: "2026-06-17T16:00:00",
  },
  {
    id: "4",
    title: "台灯",
    description: "护眼台灯，可调节亮度，USB供电",
    price: 35.0,
    category: "生活用品",
    condition: "good",
    seller_name: "钱七",
    seller_id: "user5",
    seller_phone: "13800138004",
    buyer_name: null,
    buyer_id: null,
    status: "available",
    related_activity_id: null,
    related_activity_title: null,
    images: [],
    created_at: "2026-06-16T11:00:00",
    updated_at: "2026-06-16T11:00:00",
  },
  {
    id: "5",
    title: "吉他",
    description: "入门级民谣吉他，送琴包和拨片",
    price: 300.0,
    category: "乐器",
    condition: "fair",
    seller_name: "孙八",
    seller_id: "user6",
    seller_phone: "13800138005",
    buyer_name: "周九",
    buyer_id: "user7",
    status: "sold",
    related_activity_id: "3",
    related_activity_title: "校园歌手大赛",
    images: [],
    created_at: "2026-06-08T08:00:00",
    updated_at: "2026-06-12T10:00:00",
  },
  {
    id: "6",
    title: "羽毛球拍",
    description: "一对羽毛球拍，送一桶球",
    price: 60.0,
    category: "运动器材",
    condition: "good",
    seller_name: "吴十",
    seller_id: "user8",
    seller_phone: "13800138006",
    buyer_name: null,
    buyer_id: null,
    status: "cancelled",
    related_activity_id: null,
    related_activity_title: null,
    images: [],
    created_at: "2026-06-14T15:00:00",
    updated_at: "2026-06-16T09:00:00",
  },
];

const tabs = [
  { key: "all", label: "全部" },
  { key: "available", label: "在售" },
  { key: "reserved", label: "已预订" },
  { key: "sold", label: "已售出" },
  { key: "cancelled", label: "已下架" },
];

const categories = ["全部", "书籍", "数码产品", "运动器材", "生活用品", "乐器", "其他"];

const conditionText: Record<string, string> = {
  new: "全新",
  like_new: "几乎全新",
  good: "品相良好",
  fair: "一般",
};

export default function SecondHandPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const filteredItems = mockItems.filter((item) => {
    const matchesTab = activeTab === "all" || item.status === activeTab;
    const matchesCategory = selectedCategory === "全部" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
  };

  const stats = {
    total: mockItems.length,
    available: mockItems.filter((i) => i.status === "available").length,
    sold: mockItems.filter((i) => i.status === "sold").length,
    total_amount: mockItems.filter((i) => i.status === "sold").reduce((sum, i) => sum + i.price, 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">二手交易</h1>
            <p className="mt-1 text-gray-500">管理二手物品交易信息</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            发布物品
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总物品数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">在售中</p>
                  <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                </div>
                <Tag className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已售出</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
                </div>
                <Check className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">成交总额</p>
                  <p className="text-2xl font-bold text-orange-600">¥{stats.total_amount}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索物品..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleView(item)}
                >
                  <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                      <Badge status={item.status} />
                    </div>
                    <p className="mt-1 text-lg font-bold text-orange-600">
                      {formatPrice(item.price)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="mr-1 h-4 w-4" />
                        {item.seller_name}
                      </div>
                      <div className="flex items-center">
                        <Tag className="mr-1 h-4 w-4" />
                        {conditionText[item.condition]}
                      </div>
                    </div>

                    {item.related_activity_id && (
                      <div className="mt-2 flex items-center text-xs text-primary-600">
                        <Link2 className="mr-1 h-3 w-3" />
                        关联活动：{item.related_activity_title}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-400">
                      发布于 {formatDateTime(item.created_at)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">暂无物品</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="发布二手物品"
        description="填写物品信息进行发布"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">物品标题</label>
            <Input placeholder="请输入物品标题" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">价格</label>
              <Input type="number" placeholder="¥ 0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">分类</label>
              <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                {categories.filter((c) => c !== "全部").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">成色</label>
            <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
              <option value="new">全新</option>
              <option value="like_new">几乎全新</option>
              <option value="good">品相良好</option>
              <option value="fair">一般</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">关联活动（可选）</label>
            <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
              <option value="">无</option>
              <option value="1">春季团建活动</option>
              <option value="2">编程技术分享会</option>
              <option value="3">校园歌手大赛</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">物品描述</label>
            <Textarea placeholder="请详细描述物品情况" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            取消
          </Button>
          <Button onClick={() => setShowCreateDialog(false)}>发布物品</Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title={selectedItem?.title}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Badge status={selectedItem.status} />
              <span className="text-sm text-gray-500">{selectedItem.category}</span>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-500">{conditionText[selectedItem.condition]}</span>
            </div>

            <div className="h-48 rounded-lg bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-400" />
            </div>

            <p className="text-2xl font-bold text-orange-600">
              {formatPrice(selectedItem.price)}
            </p>

            <p className="text-gray-600">{selectedItem.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">卖家</p>
                <p className="font-medium">{selectedItem.seller_name}</p>
              </div>
              <div>
                <p className="text-gray-500">联系电话</p>
                <p className="font-medium">{selectedItem.seller_phone}</p>
              </div>
              <div>
                <p className="text-gray-500">发布时间</p>
                <p className="font-medium">{formatDateTime(selectedItem.created_at)}</p>
              </div>
              {selectedItem.buyer_name && (
                <div>
                  <p className="text-gray-500">买家</p>
                  <p className="font-medium">{selectedItem.buyer_name}</p>
                </div>
              )}
            </div>

            {selectedItem.related_activity_id && (
              <div className="rounded-md bg-blue-50 p-3">
                <div className="flex items-center text-sm">
                  <Link2 className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-blue-700">
                    关联活动：{selectedItem.related_activity_title}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
            关闭
          </Button>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            联系卖家
          </Button>
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}
