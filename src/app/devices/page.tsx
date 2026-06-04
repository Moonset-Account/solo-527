'use client';

import { useState } from 'react';
import { Search, Filter, Plus, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const mockDevices = [
  {
    id: '1',
    name: '场发射扫描电子显微镜',
    type: '电子显微镜',
    model: 'FEI Quanta 250',
    location: 'A栋302室',
    status: 'AVAILABLE',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scanning%20electron%20microscope%20laboratory%20equipment&image_size=square',
    bookings: 156,
  },
  {
    id: '2',
    name: 'X射线衍射仪',
    type: 'X射线仪器',
    model: 'Bruker D8 Advance',
    location: 'A栋305室',
    status: 'IN_USE',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=X-ray%20diffractometer%20laboratory%20equipment&image_size=square',
    bookings: 89,
  },
  {
    id: '3',
    name: '400MHz核磁共振仪',
    type: '核磁共振',
    model: 'Bruker AVANCE III',
    location: 'B栋101室',
    status: 'MAINTENANCE',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=NMR%20spectrometer%20laboratory%20equipment&image_size=square',
    bookings: 203,
  },
  {
    id: '4',
    name: '高效液相色谱仪',
    type: '色谱分析',
    model: 'Agilent 1260',
    location: 'A栋208室',
    status: 'AVAILABLE',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=HPLC%20high%20performance%20liquid%20chromatography%20laboratory&image_size=square',
    bookings: 78,
  },
  {
    id: '5',
    name: '气相色谱质谱联用仪',
    type: '质谱分析',
    model: 'Thermo Fisher TSQ 8000',
    location: 'B栋203室',
    status: 'AVAILABLE',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=GC-MS%20gas%20chromatography%20mass%20spectrometry&image_size=square',
    bookings: 112,
  },
  {
    id: '6',
    name: '激光共聚焦显微镜',
    type: '光学显微镜',
    model: 'Zeiss LSM 880',
    location: 'A栋401室',
    status: 'IN_USE',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=confocal%20laser%20scanning%20microscope&image_size=square',
    bookings: 167,
  },
];

const deviceTypes = ['全部', '电子显微镜', 'X射线仪器', '核磁共振', '色谱分析', '质谱分析', '光学显微镜'];
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'AVAILABLE', label: '可用' },
  { value: 'IN_USE', label: '使用中' },
  { value: 'MAINTENANCE', label: '维护中' },
  { value: 'BROKEN', label: '故障' },
];

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  AVAILABLE: { label: '可用', variant: 'success', icon: CheckCircle },
  IN_USE: { label: '使用中', variant: 'default', icon: Clock },
  MAINTENANCE: { label: '维护中', variant: 'warning', icon: AlertTriangle },
  BROKEN: { label: '故障', variant: 'destructive', icon: AlertTriangle },
};

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredDevices = mockDevices.filter((device) => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === '全部' || device.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || device.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">设备管理</h1>
          <p className="text-slate-500 mt-1">浏览和预约实验室设备</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加设备
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索设备名称或型号..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {selectedType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {deviceTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => setSelectedType(type)}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {statusOptions.find((s) => s.value === selectedStatus)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {statusOptions.map((status) => (
                <DropdownMenuItem key={status.value} onClick={() => setSelectedStatus(status.value)}>
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => {
          const config = statusConfig[device.status];
          const StatusIcon = config.icon;
          return (
            <Link href={`/devices/${device.id}`} key={device.id}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  <img
                    src={device.image}
                    alt={device.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={config.variant as any} className="flex items-center gap-1">
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <CardDescription>{device.model}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-500">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                      {device.location}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{device.type}</span>
                      <span className="text-slate-400">{device.bookings} 次预约</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg">没有找到匹配的设备</div>
          <p className="text-slate-500 mt-2">尝试调整搜索条件</p>
        </div>
      )}
    </div>
  );
}
