import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, Calendar, Users, FileText } from 'lucide-react';
import { Layout } from '../components/Layout';
import { demandApi } from '../services/api';
import { useAuthStore } from '../stores/auth';

interface DemandFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  travelStart: string;
  travelEnd: string;
  days: number;
  peopleCount: number;
  adultCount: number;
  childCount: number;
  destinations: string;
  specialRequirements: string;
}

export const DemandForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DemandFormData>({
    defaultValues: {
      adultCount: 0,
      childCount: 0,
      days: 1,
      peopleCount: 1,
    },
  });

  const travelStart = watch('travelStart');
  const travelEnd = watch('travelEnd');
  const adultCount = watch('adultCount');
  const childCount = watch('childCount');

  React.useEffect(() => {
    if (travelStart && travelEnd) {
      const start = new Date(travelStart);
      const end = new Date(travelEnd);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) {
        setValue('days', diff);
      }
    }
  }, [travelStart, travelEnd, setValue]);

  React.useEffect(() => {
    setValue('peopleCount', Number(adultCount || 0) + Number(childCount || 0));
  }, [adultCount, childCount, setValue]);

  const onSubmit = async (data: DemandFormData) => {
    setLoading(true);
    try {
      await demandApi.create({
        ...data,
        assigneeId: user?.id,
      });
      navigate('/demands');
    } catch (error) {
      console.error('Failed to create demand:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/demands')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">新建客户需求</h1>
            <p className="text-slate-500 mt-1">录入客户旅行定制需求信息</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-teal-600" />
              客户信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">客户姓名 *</label>
                <input
                  type="text"
                  {...register('customerName', { required: '请输入客户姓名' })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入客户姓名"
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">联系电话 *</label>
                <input
                  type="tel"
                  {...register('customerPhone', { required: '请输入联系电话' })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入联系电话"
                />
                {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">电子邮箱</label>
                <input
                  type="email"
                  {...register('customerEmail')}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入电子邮箱"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-teal-600" />
              出行信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">出发日期 *</label>
                <input
                  type="date"
                  {...register('travelStart', { required: '请选择出发日期' })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
                {errors.travelStart && <p className="text-red-500 text-xs mt-1">{errors.travelStart.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">结束日期 *</label>
                <input
                  type="date"
                  {...register('travelEnd', { required: '请选择结束日期' })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
                {errors.travelEnd && <p className="text-red-500 text-xs mt-1">{errors.travelEnd.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">行程天数</label>
                <input
                  type="number"
                  {...register('days')}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">总人数</label>
                <input
                  type="number"
                  {...register('peopleCount')}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">成人数量</label>
                <input
                  type="number"
                  {...register('adultCount', { min: 0 })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">儿童数量</label>
                <input
                  type="number"
                  {...register('childCount', { min: 0 })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  min={0}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">目的地</label>
                <input
                  type="text"
                  {...register('destinations')}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="例如：北京、上海、杭州"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-teal-600" />
              特殊要求
            </h2>
            <textarea
              {...register('specialRequirements')}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="请描述客户的特殊要求，如酒店星级偏好、饮食禁忌、特殊活动安排等..."
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/demands')}
              className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors shadow-sm"
            >
              <Save size={18} />
              {loading ? '保存中...' : '保存需求'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
