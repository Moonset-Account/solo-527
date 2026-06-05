'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Ticket,
  MapPin,
  Calendar,
  ShoppingCart,
  Info,
  Check,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface Seat {
  id: string;
  rowLabel: string;
  seatNumber: number;
  status: 'AVAILABLE' | 'HELD' | 'SOLD' | 'RESERVED';
  tier: {
    id: string;
    name: string;
    price: string;
    color: string | null;
  };
}

interface Show {
  id: string;
  startTime: string;
  endTime: string;
  production: { title: string };
  venue: { name: string };
  ticketTiers: { id: string; name: string; price: string; color: string | null }[];
}

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShowAndSeats();
  }, [params.id]);

  const fetchShowAndSeats = async () => {
    try {
      const [showRes, seatsRes] = await Promise.all([
        fetch(`/api/v1/shows/${params.id}`),
        fetch(`/api/v1/shows/${params.id}/seats`),
      ]);
      if (showRes.ok && seatsRes.ok) {
        const [showData, seatsData] = await Promise.all([
          showRes.json(),
          seatsRes.json(),
        ]);
        setShow(showData);
        setSeats(seatsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.status !== 'AVAILABLE') return;

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      return total + (seat ? parseFloat(seat.tier.price) : 0);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (selectedSeats.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId: params.id,
          seatIds: selectedSeats,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        router.push(`/tickets/orders/${order.id}`);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.includes(seat.id)) {
      return 'bg-primary text-white border-primary';
    }
    switch (seat.status) {
      case 'AVAILABLE':
        return seat.tier.color
          ? `border-[${seat.tier.color}] text-gray-700 hover:border-primary`
          : 'border-gray-300 text-gray-700 hover:border-primary';
      case 'HELD':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700 cursor-not-allowed';
      case 'SOLD':
        return 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed';
      case 'RESERVED':
        return 'bg-purple-100 border-purple-300 text-purple-700 cursor-not-allowed';
      default:
        return 'border-gray-300';
    }
  };

  const rows = Array.from(new Set(seats.map((s) => s.rowLabel))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/tickets/shows"
            className="text-sm text-gray-500 hover:text-primary mb-2 inline-block"
          >
            ← 返回演出列表
          </Link>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            选择座位
          </h1>
          {show && (
            <div className="flex items-center space-x-4 mt-2 text-gray-500">
              <span className="flex items-center">
                <Ticket className="h-4 w-4 mr-1" />
                {show.production.title}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(show.startTime, 'yyyy-MM-dd HH:mm')}
              </span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {show.venue.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-8">
              <div className="h-4 bg-gradient-to-r from-primary via-primary-light to-primary rounded-lg mb-2"></div>
              <p className="text-center text-sm text-gray-500">舞台</p>
            </div>

            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row} className="flex items-center justify-center">
                  <span className="w-8 text-center text-sm text-gray-500">
                    {row}
                  </span>
                  <div className="flex gap-1">
                    {seats
                      .filter((s) => s.rowLabel === row)
                      .sort((a, b) => a.seatNumber - b.seatNumber)
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat.id)}
                          disabled={seat.status !== 'AVAILABLE'}
                          className={`w-8 h-8 text-xs rounded border-2 transition-all ${getSeatColor(
                            seat
                          )}`}
                          title={`${seat.rowLabel}排${seat.seatNumber}座 - ${seat.tier.name} - ${formatCurrency(seat.tier.price)}`}
                        >
                          {seat.seatNumber}
                        </button>
                      ))}
                  </div>
                  <span className="w-8 text-center text-sm text-gray-500">
                    {row}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">可选</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-white border-2 border-primary rounded flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-sm text-gray-600">已选</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                <span className="text-sm text-gray-600">待支付</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">已售</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              票档说明
            </h3>
            <div className="space-y-3">
              {show?.ticketTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded border-2"
                      style={tier.color ? { borderColor: tier.color } : {}}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">
                      {tier.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(tier.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              订单摘要
            </h3>
            <div className="space-y-3 mb-4">
              {selectedSeats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  请选择座位
                </p>
              ) : (
                selectedSeats.map((seatId) => {
                  const seat = seats.find((s) => s.id === seatId);
                  return (
                    <div
                      key={seatId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        {seat?.rowLabel}排{seat?.seatNumber}座 ({seat?.tier.name})
                      </span>
                      <span className="font-medium">
                        {seat && formatCurrency(seat.tier.price)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">共 {selectedSeats.length} 张</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(getTotalPrice())}
                </span>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={selectedSeats.length === 0 || submitting}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>{submitting ? '提交中...' : '确认下单'}</span>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">温馨提示</p>
                <p>选座后请在15分钟内完成支付，超时座位将被释放。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
