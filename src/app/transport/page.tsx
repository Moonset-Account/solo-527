'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useRef } from 'react';
import type { TransportHandover, Exhibit, LoanApplication, ConditionReport } from '@/types/database';
import { formatDateTime, createExecutionRecord, logError } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Signature, ArrowRightLeft, CheckCircle, AlertTriangle } from 'lucide-react';

interface TransportWithRelations extends TransportHandover {
  application?: LoanApplication & { exhibit?: Exhibit };
  condition_report?: ConditionReport;
}

export default function TransportPage() {
  const [handovers, setHandovers] = useState<TransportWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingHandover, setSigningHandover] = useState<TransportWithRelations | null>(null);
  const [signatureType, setSignatureType] = useState<'sender' | 'receiver' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadHandovers();
  }, [supabase]);

  const loadHandovers = async () => {
    try {
      const { data } = await supabase
        .from('transport_handovers')
        .select(`
          *,
          application:loan_applications(*, exhibit:exhibits(*)),
          condition_report:condition_reports(*)
        `)
        .order('created_at', { ascending: false });
      setHandovers(data || []);
    } catch (error) {
      console.error('Failed to load handovers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSignaturePad = (handover: TransportWithRelations, type: 'sender' | 'receiver') => {
    if (type === 'receiver' && handover.condition_report?.status !== 'confirmed') {
      alert('状况报告未确认，无法签收！请先确认状况报告。');
      return;
    }
    setSigningHandover(handover);
    setSignatureType(type);
    setTimeout(() => setupCanvas(), 100);
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupCanvas();
  };

  const saveSignature = async () => {
    if (!signingHandover || !signatureType || !canvasRef.current) return;

    try {
      setLoading(true);
      const signatureData = canvasRef.current.toDataURL('image/png');
      const { data: userData } = await supabase.auth.getUser();

      const updates: Partial<TransportHandover> = {};
      const now = new Date().toISOString();

      if (signatureType === 'sender') {
        updates.sender_signature = signatureData;
        updates.sender_signed_by = userData.user?.id;
        updates.sender_signed_at = now;
        updates.status = 'in_transit';
      } else {
        updates.receiver_signature = signatureData;
        updates.receiver_signed_by = userData.user?.id;
        updates.receiver_signed_at = now;
        updates.status = 'received';
        updates.actual_arrival = now;
      }

      await supabase
        .from('transport_handovers')
        .update(updates)
        .eq('id', signingHandover.id);

      await createExecutionRecord(
        signingHandover.application_id,
        `${signatureType}_signed`,
        `${signatureType === 'sender' ? '发送方' : '接收方'}已完成电子签名`
      );

      setSigningHandover(null);
      setSignatureType(null);
      loadHandovers();
    } catch (error) {
      console.error('Failed to save signature:', error);
      logError(error as Error, '/transport/sign');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'handover_number',
      header: '交接编号',
      render: (row: TransportWithRelations) => (
        <span className="font-mono text-sm text-gray-600">{row.handover_number}</span>
      ),
    },
    {
      key: 'exhibit',
      header: '展品',
      render: (row: TransportWithRelations) => (
        <div>
          <p className="font-medium text-gray-900">{row.application?.exhibit?.title || '-'}</p>
          <p className="text-sm text-gray-500">{row.carrier_name || '-'}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: '运输路线',
      render: (row: TransportWithRelations) => (
        <div className="flex items-center gap-1 text-sm">
          <span>{row.departure_location || '-'}</span>
          <ArrowRightLeft className="h-3 w-3 text-gray-400" />
          <span>{row.destination_location || '-'}</span>
        </div>
      ),
    },
    {
      key: 'signatures',
      header: '签名状态',
      render: (row: TransportWithRelations) => (
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1 text-xs ${
            row.sender_signed_at ? 'text-green-600' : 'text-gray-400'
          }`}>
            <Signature className="h-3.5 w-3.5" />
            发件方
          </span>
          <span className={`inline-flex items-center gap-1 text-xs ${
            row.receiver_signed_at ? 'text-green-600' : 'text-gray-400'
          }`}>
            <Signature className="h-3.5 w-3.5" />
            收件方
          </span>
        </div>
      ),
    },
    {
      key: 'condition_check',
      header: '状况报告',
      render: (row: TransportWithRelations) => (
        <div className="flex items-center gap-1">
          {row.condition_report?.status === 'confirmed' ? (
            <span className="text-green-600 text-xs flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              已确认
            </span>
          ) : (
            <span className="text-yellow-600 text-xs flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              待确认
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: TransportWithRelations) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: TransportWithRelations) => (
        <div className="flex gap-2">
          {!row.sender_signed_at && row.status === 'preparing' && (
            <Button size="sm" variant="outline" onClick={() => openSignaturePad(row, 'sender')}>
              <Signature className="h-4 w-4 mr-1" />
              发送方签名
            </Button>
          )}
          {row.sender_signed_at && !row.receiver_signed_at && row.status === 'in_transit' && (
            <Button size="sm" onClick={() => openSignaturePad(row, 'receiver')}>
              <Signature className="h-4 w-4 mr-1" />
              接收方签收
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="运输交接"
          description="管理展品运输交接流程，双方电子签名确认"
          action={{ label: '新建运输交接', href: '/transport/new' }}
        />

        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            <strong>业务规则：</strong>状况报告未确认前不能进行接收方签收。运输交接需要双方完成电子签名。
          </p>
        </div>

        <DataTable
          data={handovers}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['handover_number', 'carrier_name']}
          onRowClick={(row) => router.push(`/transport/${row.id}`)}
          emptyMessage="暂无运输交接记录"
        />

        {signingHandover && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {signatureType === 'sender' ? '发送方电子签名' : '接收方电子签名'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                交接编号: {signingHandover.handover_number}
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="w-full cursor-crosshair rounded-lg"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={clearCanvas}>清除</Button>
                <Button variant="outline" onClick={() => { setSigningHandover(null); setSignatureType(null); }}>
                  取消
                </Button>
                <Button onClick={saveSignature}>确认签名</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
