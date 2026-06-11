import { useState, useMemo } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { concertApi, orderApi } from '@/api';
import { toast } from 'sonner';
import {
  Music,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  X,
  Check,
  Ticket,
  CreditCard,
  User,
  Phone,
  CreditCard as IdCardIcon,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn, formatDate, formatMoney, getZoneTypeText, getSeatStatusClass } from '@/lib/utils';
import type { Show, Seat, SeatZone } from '@/types';
import dayjs from 'dayjs';

interface SelectedSeatInfo {
  seat: Seat;
  zone: SeatZone;
  realName: string;
  idCard: string;
  phone: string;
}

const ZONE_COLORS: Record<string, string> = {
  vip: 'from-rose-400 to-red-500',
  premium: 'from-amber-400 to-orange-500',
  standard: 'from-blue-400 to-indigo-500',
  economy: 'from-emerald-400 to-green-500',
  standing: 'from-purple-400 to-violet-500',
};

const ZONE_BG: Record<string, string> = {
  vip: 'bg-rose-500',
  premium: 'bg-amber-500',
  standard: 'bg-blue-500',
  economy: 'bg-emerald-500',
  standing: 'bg-purple-500',
};

export default function SeatSelectionPage() {
  const { showId } = useParams({ from: '/shows/$showId/select-seats' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = parseInt(showId, 10);

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Map<number, SelectedSeatInfo>>(new Map());
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show-detail', id],
    queryFn: () => concertApi.getShow(id),
  });

  const { data: seatsData, isLoading: seatsLoading } = useQuery({
    queryKey: ['show-seats', id, selectedZoneId],
    queryFn: () => concertApi.getSeats(id, selectedZoneId || undefined),
    enabled: !!id,
  });

  const zones: SeatZone[] = show?.zones || [];
  const allSeats: Seat[] = seatsData?.list || seatsData || [];

  const seatsByZone = useMemo(() => {
    const map = new Map<number, Seat[]>();
    for (const seat of allSeats) {
      if (!map.has(seat.zoneId)) map.set(seat.zoneId, []);
      map.get(seat.zoneId)!.push(seat);
    }
    for (const zone of zones) {
      if (!map.has(zone.id)) map.set(zone.id, []);
    }
    return map;
  }, [allSeats, zones]);

  const selectedInfoList = Array.from(selectedSeats.values());
  const totalPrice = selectedInfoList.reduce(
    (sum, item) => sum + parseFloat(item.seat.price),
    0
  );

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const toggleSeat = (seat: Seat, zone: SeatZone) => {
    if (seat.status !== 'available') {
      if (seat.status === 'sold') toast.warning('该座位已售出');
      else if (seat.status === 'held') toast.warning('该座位已被锁定');
      return;
    }
    setSelectedSeats((prev) => {
      const next = new Map(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
      } else {
        if (next.size >= 6) {
          toast.warning('单笔订单最多购买6张票');
          return prev;
        }
        next.set(seat.id, {
          seat,
          zone,
          realName: '',
          idCard: '',
          phone: '',
        });
      }
      return next;
    });
  };

  const updateSeatInfo = (seatId: number, field: keyof SelectedSeatInfo, value: string) => {
    setSelectedSeats((prev) => {
      const next = new Map(prev);
      const info = next.get(seatId);
      if (info) {
        next.set(seatId, { ...info, [field]: value });
      }
      return next;
    });
  };

  const createOrder = useMutation({
    mutationFn: (data: any) => orderApi.create(data),
    onSuccess: (res: any) => {
      toast.success('订单创建成功');
      queryClient.invalidateQueries({ queryKey: ['show-seats', id] });
      setShowSubmitModal(false);
      setSelectedSeats(new Map());
      navigate({ to: `/orders/${res.id}` });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || '订单创建失败');
    },
  });

  const validateAndSubmit = () => {
    if (selectedInfoList.length === 0) {
      toast.warning('请先选择座位');
      return;
    }
    for (const info of selectedInfoList) {
      if (!info.realName.trim()) {
        toast.warning(`请填写 ${info.seat.seatLabel} 的持票人姓名`);
        return;
      }
      if (!/^\d{17}[\dXx]$/.test(info.idCard.trim())) {
        toast.warning(`请填写 ${info.seat.seatLabel} 的正确身份证号`);
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(info.phone.trim())) {
        toast.warning(`请填写 ${info.seat.seatLabel} 的正确手机号`);
        return;
      }
    }
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    const items = selectedInfoList.map((info) => ({
      seatId: info.seat.id,
      zoneId: info.zone.id,
      ticketHolderName: info.realName.trim(),
      ticketHolderIdCard: info.idCard.trim(),
      ticketHolderPhone: info.phone.trim(),
      unitPrice: info.seat.price,
      quantity: 1,
      subtotal: info.seat.price,
    }));
    createOrder.mutate({
      showId: id,
      items,
      totalAmount: totalPrice.toFixed(2),
      discountAmount: '0.00',
      payAmount: totalPrice.toFixed(2),
      ticketCount: items.length,
    });
  };

  const renderSeatGrid = (zone: SeatZone) => {
    const seats = seatsByZone.get(zone.id) || [];
    if (seats.length === 0) {
      return (
        <div className="text-center py-8 text-sm text-gray-400">
          该区域暂无座位数据
        </div>
      );
    }
    const seatsByRow = new Map<number, Seat[]>();
    for (const seat of seats) {
      if (!seatsByRow.has(seat.rowNumber)) seatsByRow.set(seat.rowNumber, []);
      seatsByRow.get(seat.rowNumber)!.push(seat);
    }
    const rows = Array.from(seatsByRow.keys()).sort((a, b) => a - b);
    return (
      <div className="space-y-2 overflow-x-auto pb-4">
        {rows.map((rowNum) => {
          const rowSeats = seatsByRow.get(rowNum)!.sort((a, b) => a.seatNumber - b.seatNumber);
          return (
            <div key={rowNum} className="flex items-center gap-1.5 justify-center min-w-max">
              <span className="w-8 text-xs text-gray-400 text-right pr-1">{rowNum}排</span>
              {rowSeats.map((seat) => {
                const isSelected = selectedSeats.has(seat.id);
                const statusClass = getSeatStatusClass(seat.status);
                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat, zone)}
                    disabled={seat.status !== 'available' && !isSelected}
                    title={`${seat.seatLabel} - ${formatMoney(seat.price)}`}
                    className={cn(
                      'w-6 h-6 md:w-7 md:h-7 rounded-t-md text-[9px] md:text-[10px] font-medium transition-all border-2 flex items-center justify-center',
                      isSelected
                        ? 'bg-primary-500 text-white border-primary-600 shadow-md shadow-primary-500/40 scale-110 z-10'
                        : seat.status === 'available'
                        ? `${statusClass} text-white border-transparent hover:scale-110 hover:shadow-md`
                        : `${statusClass} text-white/80 border-transparent opacity-60 cursor-not-allowed`
                    )}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
              <span className="w-8 text-xs text-gray-400 pl-1">{rowNum}排</span>
            </div>
          );
        })}
      </div>
    );
  };

  const isLoading = showLoading || seatsLoading;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: show ? `/concerts/${show.concertId}` : '/concerts' })}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回演出详情
      </button>

      {isLoading ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-12 animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-5 bg-gray-100 rounded w-1/4" />
          <div className="h-40 bg-gray-100 rounded mt-8" />
        </div>
      ) : show ? (
        <>
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row gap-4 p-5 md:p-6 border-b border-gray-100">
              <img
                src={show.posterUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300'}
                alt={show.concertTitle}
                className="w-full md:w-40 h-48 md:h-28 object-cover rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 line-clamp-1">
                  {show.concertTitle}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-gray-400" />
                    {show.artist || '未知艺人'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(show.showDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {show.startTime?.substring(0, 5)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {show.venueName || '待定'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 md:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-800">选择区域</h2>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-t bg-green-500" />可售
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-t bg-primary-500" />已选
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-t bg-gray-400 opacity-60" />已售
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-t bg-yellow-500" />锁定
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {zones.map((zone) => {
                  const isSelected = currentZone?.id === zone.id;
                  const colorClass = ZONE_COLORS[zone.zoneType] || ZONE_COLORS.standard;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50 shadow-md'
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                      )}
                    >
                      <div className={cn('h-2 rounded-full mb-2 bg-gradient-to-r', colorClass)} />
                      <div className="font-semibold text-sm text-gray-800">{zone.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{getZoneTypeText(zone.zoneType)}区</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-primary-600">
                          {formatMoney(zone.basePrice)}
                        </span>
                        <span className="text-xs text-gray-400">
                          剩{zone.availableSeats || zone.totalSeats}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {currentZone && (
              <div className="p-5 md:p-6">
                <div className="mb-6">
                  <div className="relative max-w-3xl mx-auto">
                    <div className={cn(
                      'h-10 md:h-12 rounded-b-[100%] bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm font-medium shadow-lg',
                      ZONE_BG[currentZone.zoneType] || 'bg-gray-800'
                    )}>
                      舞台 Stage
                    </div>
                    <div className="absolute left-0 right-0 -bottom-1 h-4 bg-gradient-to-b from-gray-200/50 to-transparent" />
                  </div>
                </div>

                <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className={cn('w-3 h-3 rounded-full', ZONE_BG[currentZone.zoneType] || 'bg-gray-500')} />
                      {currentZone.name} - 座位图
                    </h3>
                    <span className="text-sm text-gray-500">
                      {currentZone.rows}排 × {currentZone.seatsPerRow}座
                    </span>
                  </div>
                  {renderSeatGrid(currentZone)}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    已选座位 <span className="text-primary-600">({selectedInfoList.length})</span>
                  </h3>
                  {selectedInfoList.length > 0 && (
                    <button
                      onClick={() => setSelectedSeats(new Map())}
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                    >
                      清空选择
                    </button>
                  )}
                </div>

                {selectedInfoList.length === 0 ? (
                  <div className="p-10 text-center">
                    <Ticket className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-500">请在上方座位图中选择座位</p>
                    <p className="text-xs text-gray-400 mt-1">单笔订单最多可选购6张票</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {selectedInfoList.map((info) => (
                      <div key={info.seat.id} className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold text-sm shadow-md',
                              ZONE_COLORS[info.zone.zoneType] || ZONE_COLORS.standard
                            )}>
                              {info.seat.seatLabel}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {info.zone.name} · {info.seat.rowNumber}排{info.seat.seatNumber}座
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {getZoneTypeText(info.zone.zoneType)}区
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs text-gray-400">票价</div>
                              <div className="text-xl font-bold text-primary-600">
                                {formatMoney(info.seat.price)}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const next = new Map(selectedSeats);
                                next.delete(info.seat.id);
                                setSelectedSeats(next);
                              }}
                              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              姓名
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={info.realName}
                              onChange={(e) => updateSeatInfo(info.seat.id, 'realName', e.target.value)}
                              placeholder="请输入持票人姓名"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                              <IdCardIcon className="w-3 h-3" />
                              身份证号
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={info.idCard}
                              onChange={(e) => updateSeatInfo(info.seat.id, 'idCard', e.target.value)}
                              placeholder="18位身份证号"
                              maxLength={18}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              手机号
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={info.phone}
                              onChange={(e) => updateSeatInfo(info.seat.id, 'phone', e.target.value)}
                              placeholder="11位手机号"
                              maxLength={11}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-blue-800">
                    <p className="font-semibold">购票须知</p>
                    <ul className="space-y-1 text-blue-700/90">
                      <li>· 请确保持票人实名信息与身份证一致，入场需核验身份</li>
                      <li>· 订单提交后座位将锁定15分钟，请尽快完成支付</li>
                      <li>· 票品为有价证券，非普通商品，不支持无理由退换</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden sticky top-20">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">订单结算</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">演出场次</span>
                    <span className="text-gray-800 font-medium">
                      {formatDate(show.showDate)} {show.startTime?.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">购票数量</span>
                    <span className="text-gray-800 font-medium">{selectedInfoList.length} 张</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedInfoList.map((info) => (
                      <div key={info.seat.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{info.zone.name} {info.seat.seatLabel}</span>
                        <span className="text-gray-800">{formatMoney(info.seat.price)}</span>
                      </div>
                    ))}
                    {selectedInfoList.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-2">暂无选座</div>
                    )}
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-gray-600">合计金额</span>
                    <span className="text-2xl font-bold text-primary-600">{formatMoney(totalPrice)}</span>
                  </div>

                  <button
                    onClick={validateAndSubmit}
                    disabled={selectedInfoList.length === 0}
                    className={cn(
                      'w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-lg',
                      selectedInfoList.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-primary-500 to-primary-700 text-white hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5'
                    )}
                  >
                    <CreditCard className="w-5 h-5" />
                    提交订单
                    {selectedInfoList.length > 0 && (
                      <span className="text-sm opacity-90">
                        ({selectedInfoList.length}张 · {formatMoney(totalPrice)})
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showSubmitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !createOrder.isPending && setShowSubmitModal(false)} />
              <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-primary-700 text-white">
                  <h3 className="text-xl font-bold">确认订单信息</h3>
                  <p className="text-sm text-white/80 mt-1">请确认以下信息无误</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">演出</span>
                      <span className="text-gray-800 font-medium text-right">{show.concertTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">场次</span>
                      <span className="text-gray-800">
                        {formatDate(show.showDate)} {show.startTime?.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">票数</span>
                      <span className="text-gray-800">{selectedInfoList.length} 张</span>
                    </div>
                    <div className="h-px bg-gray-200 my-2" />
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {selectedInfoList.map((info) => (
                        <div key={info.seat.id} className="flex justify-between text-xs">
                          <span className="text-gray-600">
                            {info.zone.name} {info.seat.seatLabel} · {info.realName}
                          </span>
                          <span className="text-gray-800">{formatMoney(info.seat.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      提交后订单将生成并锁定座位15分钟，请在有效期内完成支付。座位一经售出不支持无理由退票。
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-600">应付金额</span>
                    <span className="text-3xl font-bold text-primary-600">{formatMoney(totalPrice)}</span>
                  </div>
                </div>
                <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                  <button
                    onClick={() => !createOrder.isPending && setShowSubmitModal(false)}
                    disabled={createOrder.isPending}
                    className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmSubmit}
                    disabled={createOrder.isPending}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {createOrder.isPending ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        提交中...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        确认提交
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">场次不存在</h3>
          <p className="text-sm text-gray-500">该场次可能已被取消或不存在</p>
        </div>
      )}
    </div>
  );
}
