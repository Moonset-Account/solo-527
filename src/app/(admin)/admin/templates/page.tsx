'use client';

import { useEffect, useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { mockServiceTemplates } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

const categories = [
  { id: 'all', name: '全部' },
  { id: '保养', name: '保养服务' },
  { id: '检测', name: '检测服务' },
  { id: '维修', name: '维修服务' },
];

export default function TemplatesPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    setCurrentPageTitle('检测模板维护');
  }, [setCurrentPageTitle]);

  const filteredTemplates = mockServiceTemplates.filter((t) => {
    if (!showInactive && !t.is_active) return false;
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (searchQuery && !t.name.includes(searchQuery) && !t.description.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">检测项目模板</CardTitle>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-dark-400" />}
              />
            </div>
            <Button variant="outline" onClick={() => setShowInactive(!showInactive)}>
              {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showInactive ? '显示全部' : '隐藏停用'}
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增模板
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-6">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-0">
                {/* 卡片视图 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                  {filteredTemplates
                    .filter((t) => cat.id === 'all' || t.category === cat.id)
                    .map((template) => (
                      <Card
                        key={template.id}
                        hoverable
                        className={`${!template.is_active ? 'opacity-60' : ''}`}
                      >
                        <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-50 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Wrench className="h-12 w-12 text-primary-300" />
                          </div>
                          <Badge variant="primary" className="absolute top-3 left-3">
                            <Tag className="h-3 w-3 mr-1" />
                            {template.category}
                          </Badge>
                          {!template.is_active && (
                            <Badge variant="default" className="absolute top-3 right-3">
                              已停用
                            </Badge>
                          )}
                          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full text-xs text-dark-600">
                            <Clock className="h-3 w-3" />
                            {template.duration_minutes}分钟
                          </div>
                        </div>
                        <CardContent className="pt-5">
                          <h4 className="font-semibold text-dark-900 mb-2">
                            {template.name}
                          </h4>
                          <p className="text-sm text-dark-500 line-clamp-2 mb-4">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between pt-3 border-t border-dark-100">
                            <div>
                              <span className="text-xl font-bold text-primary-600 font-display">
                                {formatCurrency(template.price)}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm">
                              详情
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* 表格视图 */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>项目名称</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>价格</TableHead>
                      <TableHead>工时</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>排序</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates
                      .filter((t) => cat.id === 'all' || t.category === cat.id)
                      .map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="font-medium text-dark-900">{template.name}</div>
                            <div className="text-xs text-dark-500 mt-0.5 line-clamp-1">
                              {template.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" size="sm">
                              {template.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary-600 font-display">
                              {formatCurrency(template.price)}
                            </span>
                          </TableCell>
                          <TableCell className="text-dark-500">
                            {template.duration_minutes} 分钟
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={template.is_active ? 'success' : 'default'}
                              size="sm"
                            >
                              {template.is_active ? '启用' : '停用'}
                            </Badge>
                          </TableCell>
                          <TableCell>{template.sort_order}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger-600 hover:text-danger-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
