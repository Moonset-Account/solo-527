import { NextResponse } from 'next/server';
import { isPostGISAvailable, query } from '@/lib/db';
import { workOrders } from '@/lib/mock-data';
import {
  queryMaterialShortages,
  queryRushOrders,
  queryAdjustments,
  queryTransfersForOrder,
} from '@/lib/postgis-queries';

export async function GET() {
  try {
    if (isPostGISAvailable()) {
      try {
        const woResult = await query(
          `SELECT id, order_no, customer, product, quantity,
             delivery_date::TEXT, priority, status, total_delay_hours
           FROM work_orders ORDER BY priority, delivery_date`
        );

        if (woResult.rows.length > 0) {
          const rows = await Promise.all(woResult.rows.map(async (r: Record<string, unknown>) => {
            const woId = r.id as string;
            const shortages = await queryMaterialShortages(woId);
            const rushOrders = await queryRushOrders(woId);
            const adjustments = await queryAdjustments(woId);
            const transfers = await queryTransfersForOrder(woId);

            return buildExportRow(
              r,
              shortages.map((s) => ({ materialName: s.materialName, shortQty: s.shortQty, severity: s.severity, eta: s.eta, source: s.source })),
              rushOrders,
              transfers.map((t) => ({ fromWorkshopId: t.from_workshop_id, toWorkshopId: t.to_workshop_id, distanceKm: t.distance_km, waitTimeHours: t.wait_time_hours, source: t.source })),
              adjustments
            );
          }));

          return new Response(buildCsv(rows), {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              "Content-Disposition": `attachment; filename=export_${new Date().toISOString().slice(0, 10)}.csv; filename*=UTF-8''${encodeURIComponent(`工单复盘报告_${new Date().toISOString().slice(0, 10)}.csv`)}`,
            },
          });
        }
      } catch {
        // fallback below
      }
    }

    const rows = await Promise.all(workOrders.map(async (wo) => {
      const shortages = await queryMaterialShortages(wo.id);
      const rushOrders = await queryRushOrders(wo.id);
      const adjustments = await queryAdjustments(wo.id);
      const transfers = await queryTransfersForOrder(wo.id);

      return buildExportRow(
        wo,
        shortages.map((s) => ({ materialName: s.materialName, shortQty: s.shortQty, severity: s.severity, eta: s.eta, source: s.source })),
        rushOrders.map((ro) => ({ ...ro, source: ro.source })),
        transfers.map((t) => ({ fromWorkshopId: t.from_workshop_id, toWorkshopId: t.to_workshop_id, distanceKm: t.distance_km, waitTimeHours: t.wait_time_hours, source: t.source })),
        adjustments.map((adj) => ({ ...adj, source: adj.source }))
      );
    }));

    return new Response(buildCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        "Content-Disposition": `attachment; filename=export_${new Date().toISOString().slice(0, 10)}.csv; filename*=UTF-8''${encodeURIComponent(`工单复盘报告_${new Date().toISOString().slice(0, 10)}.csv`)}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface ExportRow {
  [key: string]: string | number;
}

interface ShortageInput {
  materialName: string;
  shortQty: number;
  severity: string;
  eta: string;
  source: string;
}

interface RushInput {
  approved_by?: string;
  approvedBy?: string;
  approval_note?: string;
  approvalNote?: string;
  impact_scope?: string[] | unknown;
  impactScope?: string[] | unknown;
  source: string;
}

interface TransferInput {
  fromWorkshopId: string;
  toWorkshopId: string;
  distanceKm: number;
  waitTimeHours: number;
  source: string;
}

interface AdjInput {
  old_priority?: number;
  oldPriority?: number;
  new_priority?: number;
  newPriority?: number;
  before_delay_risk?: number;
  beforeDelayRisk?: number;
  after_delay_risk?: number;
  afterDelayRisk?: number;
  affected_downstream_steps?: string[] | unknown;
  affectedDownstreamSteps?: string[] | unknown;
  reason?: string;
  adjusted_by?: string;
  adjustedBy?: string;
  adjusted_at?: string;
  adjustedAt?: string;
  source: string;
}

function buildExportRow(
  woInput: unknown,
  shortages: ShortageInput[],
  rushOrders: RushInput[],
  transfers: TransferInput[],
  adjustments: AdjInput[]
): ExportRow {
  const wo = woInput as Record<string, unknown>;
  const orderNo = (wo.order_no || wo.orderNo || '') as string;
  const customer = (wo.customer || '') as string;
  const product = (wo.product || '') as string;
  const quantity = (wo.quantity || 0) as number;
  const deliveryDate = (wo.delivery_date || wo.deliveryDate || '') as string;
  const priority = (wo.priority || 0) as number;
  const status = (wo.status || '') as string;
  const totalDelayHours = (wo.total_delay_hours || wo.totalDelayHours || 0) as number;

  const dataSource = shortages[0]?.source || rushOrders[0]?.source || transfers[0]?.source || adjustments[0]?.source || 'fallback';

  const shortageLabel = shortages.map((s) => `${s.materialName}(缺${s.shortQty},${s.severity},到${s.eta})`).join('; ');

  const rushLabel = rushOrders.map((ro) => {
    const note = (ro.approval_note || ro.approvalNote || '') as string;
    const scopeRaw = (ro.impact_scope || ro.impactScope || []) as string[];
    const scopeStr = Array.isArray(scopeRaw) ? scopeRaw.join(',') : String(scopeRaw);
    const approver = (ro.approved_by || ro.approvedBy || '') as string;
    return `审批:${approver};备注:${note};影响:${scopeStr}`;
  }).join(' | ');

  const distSourceLabel = dataSource === 'postgis' ? 'PostGIS距离' : '距离';
  const transferLabel = transfers.map((t) => `${t.fromWorkshopId}→${t.toWorkshopId}:${distSourceLabel}${t.distanceKm}km/等待${t.waitTimeHours}h`).join('; ');

  if (adjustments.length === 0) {
    return {
      工单号: orderNo, 客户: customer, 产品: product, 数量: quantity,
      交期: deliveryDate, 优先级: priority, 状态: status, 总延期小时: totalDelayHours,
      缺料标签: shortageLabel, 插单审批备注及影响范围: rushLabel, 跨车间距离等待时间: transferLabel,
      调整次数: 0, 调整时间: '', 调整人: '', 优先级变化: '',
      调整前延期风险: '', 调整后延期风险: '', 风险变化: '',
      调整原因: '', 影响下游工序: '',
    };
  }

  const adj = adjustments[0];
  const oldP = (adj.old_priority || adj.oldPriority || 0) as number;
  const newP = (adj.new_priority || adj.newPriority || 0) as number;
  const beforeRisk = (adj.before_delay_risk || adj.beforeDelayRisk || 0) as number;
  const afterRisk = (adj.after_delay_risk || adj.afterDelayRisk || 0) as number;
  const downstreamRaw = (adj.affected_downstream_steps || adj.affectedDownstreamSteps || []) as string[];
  const reason = (adj.reason || '') as string;
  const adjustedBy = (adj.adjusted_by || adj.adjustedBy || '') as string;
  const adjustedAt = (adj.adjusted_at || adj.adjustedAt || '') as string;

  return {
    工单号: orderNo, 客户: customer, 产品: product, 数量: quantity,
    交期: deliveryDate, 优先级: priority, 状态: status, 总延期小时: totalDelayHours,
    缺料标签: shortageLabel, 插单审批备注及影响范围: rushLabel, 跨车间距离等待时间: transferLabel,
    调整次数: adjustments.length,
    调整时间: String(adjustedAt).replace('T', ' ').slice(0, 16),
    调整人: adjustedBy,
    优先级变化: `P${oldP}→P${newP}`,
    调整前延期风险: `${beforeRisk}%`,
    调整后延期风险: `${afterRisk}%`,
    风险变化: `${afterRisk - beforeRisk > 0 ? '+' : ''}${afterRisk - beforeRisk}%`,
    调整原因: reason,
    影响下游工序: (Array.isArray(downstreamRaw) ? downstreamRaw : [downstreamRaw]).map((s) => `工序${String(s).split('-').pop()}`).join('; '),
  };
}

function buildCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
  ];
  return '\uFEFF' + lines.join('\n');
}
