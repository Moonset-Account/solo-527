import { useState } from 'react';
import {
  Car,
  Clock,
  CalendarDays,
  User,
  LogIn,
  ShoppingCart,
  ChevronRight,
  Check,
  Star,
  Shield,
  Sparkles,
  Droplets,
  Zap,
  Gem,
  MessageSquare,
  MapPin,
  Phone,
} from 'lucide-react';
import { servicePackages } from '@/data/mockData';
import type { ServicePackage } from '@/types';
import { cn } from '@/lib/utils';

const DEEP_BLUE = '#0F2B46';
const VIBRANT_ORANGE = '#FF6B35';

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

const bookedSlots = ['09:00', '10:00', '14:00', '15:30'];

const serviceIcons: Record<string, React.ReactNode> = {
  '洗车服务': <Droplets className="w-6 h-6" />,
  '精洗服务': <Sparkles className="w-6 h-6" />,
  '内饰服务': <Shield className="w-6 h-6" />,
  '养护服务': <Zap className="w-6 h-6" />,
  '镀晶镀膜': <Gem className="w-6 h-6" />,
};

export default function BookingPage() {
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [remarks, setRemarks] = useState('');

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        day: weekDays[date.getDay()],
        date: date.getDate(),
        month: date.getMonth() + 1,
        isToday: i === 0,
      });
    }
    return days;
  };

  const days = getNext7Days();

  const isTimeSlotAvailable = (time: string) => {
    if (selectedDate === 0) {
      return !bookedSlots.includes(time);
    }
    return !bookedSlots.slice(0, 2).includes(time);
  };

  const canSubmit = selectedPackage && selectedDate >= 0 && selectedTime && plateNumber && brand && model;

  const handleSubmit = () => {
    if (!canSubmit) return;
    alert('预约提交成功！');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: DEEP_BLUE }}
            >
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: DEEP_BLUE }}>
              靓车坊
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium" style={{ color: VIBRANT_ORANGE }}>
              首页
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              我的订单
            </a>
            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
              <LogIn className="w-4 h-4" />
              登录
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4" style={{ backgroundColor: DEEP_BLUE }}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            专业洗车美容服务
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            在线预约，到店即享。专业技师，优质服务，让您的爱车焕然一新
          </p>
          <div className="flex items-center justify-center gap-8 text-white">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-300">第一步</p>
                <p className="font-medium">选择套餐</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-300">第二步</p>
                <p className="font-medium">预约时间</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Check className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-300">第三步</p>
                <p className="font-medium">到店服务</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-2" style={{ color: DEEP_BLUE }}>
            服务套餐
          </h2>
          <p className="text-gray-500 mb-8">选择适合您爱车的服务套餐</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicePackages.filter(p => p.isActive && !p.isDeleted).map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={cn(
                  'bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 border-2',
                  selectedPackage?.id === pkg.id
                    ? 'shadow-lg scale-[1.02]'
                    : 'shadow-sm hover:shadow-md border-transparent'
                )}
                style={{
                  borderColor: selectedPackage?.id === pkg.id ? VIBRANT_ORANGE : 'transparent',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${DEEP_BLUE}10` }}
                  >
                    <div style={{ color: DEEP_BLUE }}>
                      {serviceIcons[pkg.category as string] || <Car className="w-6 h-6" />}
                    </div>
                  </div>
                  {selectedPackage?.id === pkg.id && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: VIBRANT_ORANGE }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: DEEP_BLUE }}>
                  {pkg.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {pkg.description}
                </p>
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {pkg.durationMinutes}分钟
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    通用车型
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: VIBRANT_ORANGE }}>
                    ¥{pkg.discountPrice || pkg.price}
                  </span>
                  {pkg.discountPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ¥{pkg.price}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: `${VIBRANT_ORANGE}15`, color: VIBRANT_ORANGE }}>
                    会员价 ¥{pkg.memberPrice}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Time Slot Selector */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-2" style={{ color: DEEP_BLUE }}>
            选择时段
          </h2>
          <p className="text-gray-500 mb-8">选择您方便的到店时间</p>

          {/* Date Selector */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(index)}
                className={cn(
                  'flex-shrink-0 w-20 py-4 rounded-xl text-center transition-all duration-200',
                  selectedDate === index
                    ? 'text-white shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
                style={{
                  backgroundColor: selectedDate === index ? DEEP_BLUE : undefined,
                }}
              >
                <p
                  className={cn(
                    'text-sm font-medium mb-1',
                    selectedDate === index ? 'text-white' : 'text-gray-500'
                  )}
                >
                  {day.isToday ? '今天' : day.day}
                </p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    selectedDate === index ? 'text-white' : 'text-gray-900'
                  )}
                >
                  {day.date}
                </p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    selectedDate === index ? 'text-white/70' : 'text-gray-400'
                  )}
                >
                  {day.month}月
                </p>
              </button>
            ))}
          </div>

          {/* Time Slots */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {timeSlots.map((time) => {
              const available = isTimeSlotAvailable(time);
              const selected = selectedTime === time;
              return (
                <button
                  key={time}
                  disabled={!available}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    !available && 'bg-gray-100 text-gray-400 cursor-not-allowed',
                    available && !selected && 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200',
                    selected && 'text-white shadow-md'
                  )}
                  style={{
                    backgroundColor: selected ? VIBRANT_ORANGE : undefined,
                  }}
                >
                  {time}
                  {!available && <span className="block text-xs">已满</span>}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500" />
              可预约
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-300" />
              已满
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: VIBRANT_ORANGE }} />
              已选择
            </span>
          </div>
        </div>
      </section>

      {/* Vehicle Info Form */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-2" style={{ color: DEEP_BLUE }}>
            车辆信息
          </h2>
          <p className="text-gray-500 mb-8">请填写您的车辆信息</p>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  车牌号 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="请输入车牌号"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all"
                    style={{
                      '--tw-ring-color': `${VIBRANT_ORANGE}40`,
                      borderColor: plateNumber ? VIBRANT_ORANGE : undefined,
                    } as React.CSSProperties}
                  />
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  品牌 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="请输入品牌"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all"
                    style={{
                      '--tw-ring-color': `${VIBRANT_ORANGE}40`,
                      borderColor: brand ? VIBRANT_ORANGE : undefined,
                    } as React.CSSProperties}
                  />
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  车型 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="请输入车型"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all"
                    style={{
                      '--tw-ring-color': `${VIBRANT_ORANGE}40`,
                      borderColor: model ? VIBRANT_ORANGE : undefined,
                    } as React.CSSProperties}
                  />
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注信息
              </label>
              <div className="relative">
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="如有特殊需求请备注..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none transition-all resize-none"
                  style={{
                    '--tw-ring-color': `${VIBRANT_ORANGE}40`,
                  } as React.CSSProperties}
                />
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Info */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
              <span className="text-sm">北京市朝阳区建国路88号</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
              <span className="text-sm">400-123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
              <span className="text-sm">营业时间：09:00 - 18:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Fixed Booking Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">预约总价</p>
            <p className="text-2xl font-bold" style={{ color: VIBRANT_ORANGE }}>
              ¥{selectedPackage?.discountPrice || selectedPackage?.price || '--'}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center gap-2',
              canSubmit ? 'shadow-lg hover:shadow-xl' : 'bg-gray-300 cursor-not-allowed'
            )}
            style={{
              backgroundColor: canSubmit ? VIBRANT_ORANGE : undefined,
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            立即预约
          </button>
        </div>
      </div>

      {/* Bottom spacer for fixed button */}
      <div className="h-24" />
    </div>
  );
}
