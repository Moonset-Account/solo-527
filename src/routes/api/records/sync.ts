import { getDB, initDB } from "~/server/db";
import { writeAuditLog, generateId } from "~/server/utils";
import type { APIEvent } from "@solidjs/start/server";

initDB();

export async function POST({ request }: APIEvent) {
  const db = getDB();
  const body = await request.json();
  const { records, guardName } = body;

  if (!guardName || !guardName.trim()) {
    return Response.json({ error: "保安姓名不能为空" }, { status: 400 });
  }

  for (const record of records) {
    if (record.isManual && (!record.remark || !record.remark.trim())) {
      return Response.json(
        { error: `记录 ${record.id}: 人工放行必须填写原因` },
        { status: 400 }
      );
    }
    if (!record.guardName && !guardName) {
      return Response.json(
        { error: `记录 ${record.id}: 保安姓名不能为空` },
        { status: 400 }
      );
    }
  }

  const results: any[] = [];

  for (const record of records) {
    const tx = db.transaction(() => {
      try {
        if (record.type === "entry") {
          const existing = db.prepare("SELECT id FROM parking_records WHERE id = ?").get(record.id);
          if (!existing) {
            let visitorId = record.visitorId;
            
            if (!visitorId) {
              const visitor = db
                .prepare(
                  "SELECT * FROM visitors WHERE plate_number = ? AND status = 'active'"
                )
                .get(record.plateNumber.toUpperCase());
              if (visitor) {
                visitorId = visitor.id;
              } else {
                throw new Error(`未找到车牌 ${record.plateNumber} 的有效访客预约`);
              }
            }

            const visitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(visitorId);
            if (!visitor) {
              throw new Error("访客不存在");
            }

            const stmt = db.prepare(`
              INSERT INTO parking_records (id, visitor_id, plate_number, entry_time, entry_guard, entry_remark, is_manual_entry, is_offline_entry, synced, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'parked')
            `);
            stmt.run(
              record.id,
              visitorId,
              record.plateNumber.toUpperCase(),
              record.entryTime,
              guardName || record.guardName,
              record.remark || null,
              record.isManual ? 1 : 0,
              1
            );

            writeAuditLog(
              "entry",
              "parking_record",
              record.id,
              guardName || record.guardName || "system",
              "guard",
              null,
              { 
                plateNumber: record.plateNumber, 
                visitorName: visitor.name,
                building: visitor.building,
                isOffline: true,
                isManual: record.isManual
              },
              record.isManual 
                ? `离线人工放行入场：${record.remark}` 
                : `离线核验入场（联网同步）`
            );

            results.push({ id: record.id, success: true, type: "entry" });
          } else {
            results.push({ id: record.id, success: true, type: "entry", skipped: true });
          }
        } else if (record.type === "exit") {
          let parkingRecord: any = null;

          if (record.id) {
            parkingRecord = db.prepare("SELECT * FROM parking_records WHERE id = ?").get(record.id);
          }
          
          if (!parkingRecord && record.plateNumber) {
            parkingRecord = db
              .prepare("SELECT * FROM parking_records WHERE plate_number = ? AND status IN ('parked', 'timeout') ORDER BY entry_time DESC LIMIT 1")
              .get(record.plateNumber.toUpperCase());
          }

          if (!parkingRecord) {
            throw new Error(`未找到车牌 ${record.plateNumber} 的在场停车记录`);
          }

          db.prepare(
            "UPDATE parking_records SET exit_time = ?, exit_guard = ?, exit_remark = ?, is_manual_exit = ?, is_offline_exit = ?, synced = 1, status = 'exited' WHERE id = ?"
          ).run(
            record.exitTime,
            guardName || record.guardName,
            record.remark || null,
            record.isManual ? 1 : 0,
            1,
            parkingRecord.id
          );

          db.prepare("UPDATE visitors SET status = 'used', updated_at = ? WHERE id = ?").run(
            Date.now(),
            parkingRecord.visitor_id
          );

          writeAuditLog(
            "exit",
            "parking_record",
            parkingRecord.id,
            guardName || record.guardName || "system",
            "guard",
            { status: parkingRecord.status },
            { status: "exited" },
            record.isManual 
              ? `离线人工放行离场：${record.remark}（二维码已失效）` 
              : `离线核验离场（联网同步，二维码已失效）`
          );

          writeAuditLog(
            "update",
            "visitor",
            parkingRecord.visitor_id,
            guardName || record.guardName || "system",
            "system",
            { status: "active" },
            { status: "used" },
            "车辆离场，访客二维码自动失效"
          );

          results.push({ id: record.id || parkingRecord.id, success: true, type: "exit", qrInvalidated: true });
        }
      } catch (e: any) {
        results.push({ id: record.id, success: false, error: e.message });
      }
    });

    try {
      tx();
    } catch (e: any) {
      if (!results.find(r => r.id === record.id)) {
        results.push({ id: record.id, success: false, error: e.message });
      }
    }
  }

  return Response.json({ 
    results, 
    synced: results.filter(r => r.success && !r.skipped).length 
  });
}
