'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Phone,
  Wrench,
  Car,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { mockTechnicians, mockStations } from '@/lib/mockData';
import { useUIStore } from '@/store/uiStore';

export default function TechniciansPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [activeTab, setActiveTab] = useState('technicians');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentPageTitle('技师工位管理');
  }, [setCurrentPageTitle]);

  const filteredTechnicians = mockTechnicians.filter(
    (t) =>
      t.name.includes(searchQuery) ||
      t.skills.includes(searchQuery)
  );

  const filteredStations = mockStations.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.type.includes(searchQuery)
  );

  const statusMap: Record<string, { label: string; variant: string }> = {
    available: { label: '在岗', variant: 'success' },
    busy: { label: '忙碌', variant: 'warning' },
    off: { label: '休息', variant: 'default' },
  };

  const stationStatusMap: Record<string, { label: string; variant: string }> = {
    available: { label: '空闲', variant: 'success' },
    occupied: { label: '使用中', variant: 'warning' },
    maintenance: { label: '维护中', variant: 'danger' },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">技师工位管理</CardTitle>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-dark-400" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="technicians" className="gap-2">
                <Users className="h-4 w-4" />
                技师管理
              </TabsTrigger>
              <TabsTrigger value="stations" className="gap-2">
                <Car className="h-4 w-4" />
                工位管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value="technicians" className="mt-0">
              <div className="flex justify-end mb-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加技师
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {filteredTechnicians.map((tech) => {
                  const status = statusMap[tech.status] || statusMap.available;
                  return (
                    <Card key={tech.id} hoverable>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar size="lg" fallback={tech.name.charAt(0)} />
                            <div>
                              <h4 className="font-semibold text-dark-900">{tech.name}</h4>
                              <Badge variant={status.variant as any} size="sm">
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                          <button className="p-1 rounded hover:bg-dark-100">
                            <MoreVertical className="h-5 w-5 text-dark-400" />
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-dark-500">
                            <Phone className="h-4 w-4" />
                            {tech.phone}
                          </div>
                          <div className="flex items-start gap-2 text-dark-500">
                            <Wrench className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{tech.skills}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-dark-100">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>技师</TableHead>
                    <TableHead>联系方式</TableHead>
                    <TableHead>技能特长</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechnicians.map((tech) => {
                    const status = statusMap[tech.status] || statusMap.available;
                    return (
                      <TableRow key={tech.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar size="sm" fallback={tech.name.charAt(0)} />
                            <span className="font-medium text-dark-900">{tech.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{tech.phone}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tech.skills.split(',').map((skill, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-dark-100 text-dark-600 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant as any} size="sm">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{tech.sort_order}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-danger-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="stations" className="mt-0">
              <div className="flex justify-end mb-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加工位
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {filteredStations.map((station) => {
                  const status = stationStatusMap[station.status] || stationStatusMap.available;
                  return (
                    <Card key={station.id} hoverable>
                      <CardContent className="pt-6 text-center">
                        <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                          station.status === 'available' ? 'bg-success-100 text-success-600' :
                          station.status === 'occupied' ? 'bg-amber-100 text-amber-600' :
                          'bg-danger-100 text-danger-600'
                        }`}>
                          <Car className="h-8 w-8" />
                        </div>
                        <h4 className="font-semibold text-dark-900 mb-1">{station.name}</h4>
                        <p className="text-sm text-dark-500 mb-3">{station.type}</p>
                        <Badge variant={status.variant as any}>
                          {status.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工位名称</TableHead>
                    <TableHead>工位类型</TableHead>
                    <TableHead>设备配置</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStations.map((station) => {
                    const status = stationStatusMap[station.status] || stationStatusMap.available;
                    return (
                      <TableRow key={station.id}>
                        <TableCell className="font-medium text-dark-900">{station.name}</TableCell>
                        <TableCell>{station.type}</TableCell>
                        <TableCell className="text-dark-500">{station.equipment}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant as any} size="sm">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{station.sort_order}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
