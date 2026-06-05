import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { User, Mail, Phone, GraduationCap, Building, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function ProfilePage() {
  const session = await auth();

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          characters: {
            include: {
              production: true,
            },
          },
          courseSchedules: true,
        },
      })
    : null;

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    COMMITTEE: '社团干事',
    DIRECTOR: '导演',
    ACTOR: '演员',
    TICKET_STAFF: '票务人员',
    USER: '普通用户',
  };

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          个人中心
        </h1>
        <p className="text-gray-500 mt-1">查看和管理您的个人信息</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-32 theater-gradient"></div>
            <div className="px-6 pb-6 -mt-12">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.name}
              </h2>
              <p className="text-sm text-primary font-medium mt-1">
                {roleLabels[user?.role || 'USER']}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="h-4 w-4 mr-2" />
                  {user?.email}
                </div>
                {user?.phone && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="h-4 w-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                {user?.studentId && (
                  <div className="flex items-center text-sm text-gray-500">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    学号：{user.studentId}
                  </div>
                )}
                {user?.department && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Building className="h-4 w-4 mr-2" />
                    {user.department}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  注册于 {formatDate(user?.createdAt || new Date(), 'yyyy-MM-dd')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {user?.characters && user.characters.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                我的角色
              </h3>
              <div className="space-y-3">
                {user?.characters?.map((character: any) => (
                  <div
                    key={character.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {character.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {character.production.title}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      演员
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user?.courseSchedules && user.courseSchedules.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                我的课程表
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        星期
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        课程名称
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        时间
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        学期
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.courseSchedules
                      .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek)
                      .map((course: any) => (
                        <tr key={course.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {weekDays[course.dayOfWeek]}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {course.courseName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {course.startTime} - {course.endTime}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {course.semester}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              排练时间冲突提示
            </h3>
            <p className="text-sm text-yellow-700">
              系统会自动检测排练时间与您的课程表是否冲突。如有冲突，会在排练通知中提醒您。请确保课程表信息准确无误。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
