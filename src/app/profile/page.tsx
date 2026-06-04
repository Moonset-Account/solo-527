'use client';

import { useState } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Calendar, Shield, Settings, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const userProfile = {
  name: '张三',
  studentId: '2021001',
  email: 'zhangsan@university.edu.cn',
  phone: '138****1234',
  department: '材料科学与工程学院',
  major: '材料科学与工程',
  grade: '2021级',
  role: 'STUDENT',
  avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20asian%20student&image_size=square',
  joinDate: '2021-09-01',
  safetyTraining: true,
  safetyTrainingDate: '2023-12-15',
  mentor: '李教授',
};

const mentorInfo = {
  name: '李教授',
  title: '教授/博导',
  department: '材料科学与工程学院',
  email: 'lili@university.edu.cn',
  researchDirection: '纳米材料与器件',
  projects: [
    {
      id: 'P001',
      name: '纳米材料表面形貌研究',
      projectNumber: '2024KJ001',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      status: 'ACTIVE',
    },
    {
      id: 'P002',
      name: '新型二维材料制备与表征',
      projectNumber: '2023KJ015',
      startDate: '2023-06-01',
      endDate: '2024-05-31',
      status: 'COMPLETED',
    },
  ],
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">个人中心</h1>
        <p className="text-slate-500 mt-1">管理您的个人信息和设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <img
                  src={userProfile.avatar}
                  alt="头像"
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h2 className="text-xl font-bold text-slate-800">{userProfile.name}</h2>
                <p className="text-slate-500">{userProfile.studentId}</p>
                <Badge className="mt-3" variant="outline">
                  {userProfile.role === 'STUDENT' ? '学生' : userProfile.role}
                </Badge>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{userProfile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{userProfile.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">注册于 {userProfile.joinDate}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">安全培训</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-600 text-sm">已完成</span>
                  <span className="text-green-500 text-xs">{userProfile.safetyTrainingDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">导师信息</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{mentorInfo.name}</div>
                    <div className="text-sm text-slate-500">{mentorInfo.title}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  {mentorInfo.department}
                </div>
                <div className="text-sm text-slate-500">
                  研究方向: {mentorInfo.researchDirection}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="basic">
                <User className="w-4 h-4 mr-2" />
                基本信息
              </TabsTrigger>
              <TabsTrigger value="projects">
                <Building className="w-4 h-4 mr-2" />
                课题项目
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                账号设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>基本信息</CardTitle>
                      <CardDescription>更新您的个人基本信息</CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? 'default' : 'outline'}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? '保存' : '编辑'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">姓名</label>
                      <Input
                        className="mt-1"
                        value={userProfile.name}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">学号</label>
                      <Input
                        className="mt-1"
                        value={userProfile.studentId}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">邮箱</label>
                      <Input
                        className="mt-1"
                        value={userProfile.email}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">手机</label>
                      <Input
                        className="mt-1"
                        value={userProfile.phone}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">学院</label>
                      <Input
                        className="mt-1"
                        value={userProfile.department}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">专业</label>
                      <Input
                        className="mt-1"
                        value={userProfile.major}
                        disabled
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">年级</label>
                      <Input
                        className="mt-1"
                        value={userProfile.grade}
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>参与课题</CardTitle>
                  <CardDescription>您参与的所有研究课题</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mentorInfo.projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-4 border border-slate-200 rounded-lg hover:border-primary-200 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-slate-800">{project.name}</div>
                            <div className="text-sm text-slate-500 mt-1">
                              课题编号: {project.projectNumber}
                            </div>
                          </div>
                          <Badge
                            variant={project.status === 'ACTIVE' ? 'success' : 'outline'}
                          >
                            {project.status === 'ACTIVE' ? '进行中' : '已完成'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span>开始: {project.startDate}</span>
                          <span>结束: {project.endDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      通知设置
                    </CardTitle>
                    <CardDescription>管理您接收的通知类型</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">预约状态变更</div>
                          <div className="text-sm text-slate-500">预约被批准、拒绝或取消时通知</div>
                        </div>
                        <div className="w-12 h-6 bg-primary-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">设备故障通知</div>
                          <div className="text-sm text-slate-500">预约设备发生故障时通知</div>
                        </div>
                        <div className="w-12 h-6 bg-primary-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">证书审核结果</div>
                          <div className="text-sm text-slate-500">资格证书审核通过或拒绝时通知</div>
                        </div>
                        <div className="w-12 h-6 bg-primary-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">危险区域</CardTitle>
                    <CardDescription>修改这些设置会影响您的账户安全</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">修改密码</div>
                        <div className="text-sm text-slate-500">定期修改密码以保护账户安全</div>
                      </div>
                      <Button variant="outline">修改密码</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
