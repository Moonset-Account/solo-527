import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, orderApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import {
  User,
  Camera,
  Mail,
  Phone,
  Calendar,
  Ticket,
  ChevronRight,
  Check,
  XCircle,
  Clock,
  Edit3,
  Save,
  X,
  LogOut,
  Shield,
  FileCheck,
  UserCircle,
  AlertCircle,
} from 'lucide-react';
import {
  cn,
  formatDateTime,
  formatMoney,
  getVerificationStatusText,
  getVerificationStatusColor,
  maskIdCard,
  maskPhone,
} from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    avatar: '',
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    realName: '',
    idCardNumber: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
      setVerifyForm({
        realName: user.realName || '',
        idCardNumber: user.idCardNumber || '',
        gender: user.gender || 'male',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['profile-recent-orders'],
    queryFn: () => orderApi.list({ pageSize: 5 }),
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => authApi.updateMe(data),
    onSuccess: (res: any) => {
      toast.success('个人信息已更新');
      updateUser(res);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile-recent-orders'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '更新失败'),
  });

  const submitVerification = useMutation({
    mutationFn: (data: any) => authApi.updateMe(data),
    onSuccess: (res: any) => {
      toast.success('实名认证信息已提交，等待审核');
      updateUser(res);
      setIsVerifying(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '提交失败'),
  });

  const handleSaveBasic = () => {
    if (!editForm.fullName.trim()) {
      toast.warning('请填写姓名');
      return;
    }
    if (editForm.phone && !/^1[3-9]\d{9}$/.test(editForm.phone.trim())) {
      toast.warning('请填写正确的手机号');
      return;
    }
    updateProfile.mutate({
      fullName: editForm.fullName.trim(),
      phone: editForm.phone.trim(),
      avatar: editForm.avatar.trim(),
    });
  };

  const handleSubmitVerify = () => {
    if (!verifyForm.realName.trim()) {
      toast.warning('请填写真实姓名');
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(verifyForm.idCardNumber.trim())) {
      toast.warning('请填写正确的身份证号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(verifyForm.phone.trim())) {
      toast.warning('请填写正确的手机号');
      return;
    }
    submitVerification.mutate({
      realName: verifyForm.realName.trim(),
      idCardNumber: verifyForm.idCardNumber.trim(),
      gender: verifyForm.gender,
      phone: verifyForm.phone.trim(),
      isVerified: user?.isVerified ? true : undefined,
    });
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
      navigate({ to: '/login' });
    }
  };

  const stats = [
    { label: '全部订单', value: 0, to: '/my-orders?tab=all', color: 'from-blue-500 to-indigo-600' },
    { label: '待支付', value: 0, to: '/my-orders?tab=pending', color: 'from-amber-500 to-orange-600' },
    { label: '已完成', value: 0, to: '/my-orders?tab=paid', color: 'from-emerald-500 to-green-600' },
    { label: '已退款', value: 0, to: '/my-orders?tab=refunded', color: 'from-purple-500 to-pink-600' },
  ];

  const orderList = recentOrders?.list || recentOrders || [];

  if (!user) {
    return (
      <div className="card p-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">请先登录</h3>
        <p className="text-sm text-gray-500 mb-6">登录后可查看个人信息</p>
        <Link to="/login" className="btn-primary">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="px-6 pb-6 -mt-16 md:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-purple-100">
                    <User className="w-14 h-14 text-primary-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 md:pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.fullName || '未设置昵称'}
                </h1>
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    已认证
                  </span>
                ) : user.realName ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    审核中
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    <UserCircle className="w-3 h-3" />
                    未认证
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {maskPhone(user.phone)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  注册于 {formatDateTime(user.createdAt).split(' ')[0]}
                </span>
              </div>
            </div>

            <div className="flex gap-2 md:pb-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-outline"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑资料
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        fullName: user.fullName || '',
                        phone: user.phone || '',
                        avatar: user.avatar || '',
                      });
                    }}
                    className="btn-outline"
                    disabled={updateProfile.isPending}
                  >
                    <X className="w-4 h-4" />
                    取消
                  </button>
                  <button
                    onClick={handleSaveBasic}
                    className="btn-primary"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        保存中
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                基本信息
              </span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  昵称
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="请输入昵称"
                    className="input"
                  />
                ) : (
                  <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-800">
                    {user.fullName || '未设置'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  头像链接
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    placeholder="https://... 头像图片地址"
                    className="input"
                  />
                ) : (
                  <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-800 break-all">
                    {user.avatar || '未设置'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  邮箱
                </label>
                <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                  <span className="text-xs text-gray-400 ml-auto">登录账号，不可修改</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  手机号
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="11位手机号"
                    maxLength={11}
                    className="input"
                  />
                ) : (
                  <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-800">
                    {user.phone ? maskPhone(user.phone) : '未设置'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-gray-400" />
                实名认证
              </h3>
              {user.isVerified ? (
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  getVerificationStatusColor('approved')
                )}>
                  {getVerificationStatusText('approved')}
                </span>
              ) : user.realName ? (
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  getVerificationStatusColor('pending')
                )}>
                  {getVerificationStatusText('pending')}
                </span>
              ) : (
                !isVerifying && (
                  <button
                    onClick={() => setIsVerifying(true)}
                    className="btn-primary text-sm py-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    去认证
                  </button>
                )
              )}
            </div>

            {user.isVerified && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-100 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">实名认证已通过</p>
                    <p className="text-sm text-green-600/90 mt-0.5">
                      您的身份信息已核验，可放心购票入场
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(user.realName && !user.isVerified) && !isVerifying && (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-800">审核中</p>
                    <p className="text-sm text-yellow-600/90 mt-0.5">
                      您的实名认证信息正在审核中，预计1-3个工作日完成
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isVerifying || user.realName ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      真实姓名 <span className="text-red-500">*</span>
                    </label>
                    {user.isVerified || !isVerifying ? (
                      <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-800">
                        {user.realName || '-'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={verifyForm.realName}
                        onChange={(e) => setVerifyForm({ ...verifyForm, realName: e.target.value })}
                        placeholder="请输入身份证上的真实姓名"
                        className="input"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      性别
                    </label>
                    {user.isVerified || !isVerifying ? (
                      <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-800">
                        {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        {([
                          { value: 'male', label: '男' },
                          { value: 'female', label: '女' },
                          { value: 'other', label: '其他' },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setVerifyForm({ ...verifyForm, gender: opt.value })}
                            className={cn(
                              'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                              verifyForm.gender === opt.value
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    身份证号 <span className="text-red-500">*</span>
                  </label>
                  {user.isVerified || !isVerifying ? (
                    <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-800 font-mono text-sm">
                      {maskIdCard(user.idCardNumber)}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={verifyForm.idCardNumber}
                      onChange={(e) => setVerifyForm({ ...verifyForm, idCardNumber: e.target.value })}
                      placeholder="请输入18位身份证号"
                      maxLength={18}
                      className="input font-mono"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  {user.isVerified || !isVerifying ? (
                    <div className="py-2 px-3 rounded-lg bg-gray-50 text-gray-800 font-mono text-sm">
                      {maskPhone(user.phone)}
                    </div>
                  ) : (
                    <input
                      type="tel"
                      value={verifyForm.phone}
                      onChange={(e) => setVerifyForm({ ...verifyForm, phone: e.target.value })}
                      placeholder="请输入11位手机号"
                      maxLength={11}
                      className="input font-mono"
                    />
                  )}
                </div>

                {isVerifying && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 leading-relaxed">
                      <p className="font-semibold mb-1">实名认证须知</p>
                      <ul className="space-y-0.5 text-blue-700/90">
                        <li>· 请确保填写的信息与您的身份证件完全一致</li>
                        <li>· 实名认证通过后信息不可修改，请仔细核对</li>
                        <li>· 所有购票入场均需核验实名信息</li>
                      </ul>
                    </div>
                  </div>
                )}

                {isVerifying && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsVerifying(false);
                        setVerifyForm({
                          realName: user.realName || '',
                          idCardNumber: user.idCardNumber || '',
                          gender: user.gender || 'male',
                          phone: user.phone || '',
                        });
                      }}
                      disabled={submitVerification.isPending}
                      className="flex-1 btn-outline"
                    >
                      <XCircle className="w-4 h-4" />
                      取消
                    </button>
                    <button
                      onClick={handleSubmitVerify}
                      disabled={submitVerification.isPending}
                      className="flex-1 btn-primary"
                    >
                      {submitVerification.isPending ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          提交中
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          提交审核
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">完成实名认证后可正常购票入场</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400" />
                最近订单
              </h3>
              <Link
                to="/my-orders"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-4 bg-gray-100 rounded w-32" />
                      <div className="h-4 bg-gray-100 rounded w-16" />
                    </div>
                    <div className="h-5 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : orderList.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无订单记录</p>
                <Link to="/concerts" className="inline-flex items-center gap-1.5 mt-4 btn-primary text-sm">
                  去购票
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orderList.slice(0, 5).map((order: any) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-6 h-6 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800 line-clamp-1">
                          {order.items?.[0]?.zoneName || '演出门票'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-mono">{order.orderNo}</span>
                        <span>{order.ticketCount} 张</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-primary-600">
                        {formatMoney(order.payAmount)}
                      </div>
                      <span className={cn(
                        'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                        getVerificationStatusColor(order.verificationStatus)
                      )}>
                        {getVerificationStatusText(order.verificationStatus)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-800">我的订单</h3>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100">
              {stats.map((stat) => (
                <Link
                  key={stat.to}
                  to={stat.to}
                  className="p-4 bg-white hover:bg-gray-50/50 transition-colors group"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform',
                    stat.color
                  )}>
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-gray-500 mb-0.5">{stat.label}</div>
                  <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-5 space-y-2">
              <Link
                to="/my-orders"
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">全部订单</div>
                  <div className="text-xs text-gray-400">查看所有购票记录</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>

              <Link
                to="/my-orders?tab=pending"
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">待支付</div>
                  <div className="text-xs text-gray-400">继续完成支付</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>

              <Link
                to="/concerts"
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">去购票</div>
                  <div className="text-xs text-gray-400">发现更多精彩演出</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>

              <div className="h-px bg-gray-100 my-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-red-600 text-sm">退出登录</div>
                  <div className="text-xs text-red-400">安全退出当前账号</div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
