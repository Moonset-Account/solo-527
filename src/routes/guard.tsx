import { createSignal, createEffect, For, onMount } from "solid-js";
import { A } from "@solidjs/router";

interface Guard {
  id: string;
  name: string;
  username: string;
  booth_number: string;
}

interface ParkingRecord {
  id: string;
  visitor_id: string;
  plate_number: string;
  entry_time?: number;
  exit_time?: number;
  entry_guard?: string;
  exit_guard?: string;
  entry_remark?: string;
  exit_remark?: string;
  is_manual_entry: number;
  is_manual_exit: number;
  is_offline_entry: number;
  is_offline_exit: number;
  status: string;
  name?: string;
  building?: string;
  host_name?: string;
  host_phone?: string;
  visitor_end_time?: number;
}

interface OfflineRecord {
  id: string;
  type: "entry" | "exit";
  visitorId?: string;
  plateNumber: string;
  entryTime?: number;
  exitTime?: number;
  guardName: string;
  remark: string;
  isManual: boolean;
}

export default function GuardPage() {
  const [guards, setGuards] = createSignal<Guard[]>([]);
  const [selectedGuard, setSelectedGuard] = createSignal<Guard | null>(null);
  const [isOnline, setIsOnline] = createSignal(true);
  const [activeRecords, setActiveRecords] = createSignal<ParkingRecord[]>([]);
  const [mode, setMode] = createSignal<"entry" | "exit">("entry");
  const [showManual, setShowManual] = createSignal(false);
  const [scanInput, setScanInput] = createSignal("");
  const [manualPlate, setManualPlate] = createSignal("");
  const [manualRemark, setManualRemark] = createSignal("");
  const [message, setMessage] = createSignal<{ type: "success" | "error"; text: string } | null>(null);
  const [offlineRecords, setOfflineRecords] = createSignal<OfflineRecord[]>([]);
  const [visitorCache, setVisitorCache] = createSignal<Map<string, any>>(new Map());
  const [syncing, setSyncing] = createSignal(false);

  onMount(() => {
    loadGuards();
    checkNetwork();
    setInterval(checkNetwork, 5000);
    window.addEventListener("online", () => {
      setIsOnline(true);
      syncOfflineRecords();
    });
    window.addEventListener("offline", () => setIsOnline(false));
  });

  createEffect(() => {
    if (selectedGuard()) {
      loadActiveRecords();
      loadOfflineRecords();
      loadVisitorCache();
    }
  });

  const checkNetwork = () => {
    setIsOnline(navigator.onLine);
  };

  const loadGuards = async () => {
    try {
      const res = await fetch("/api/guards");
      const data = await res.json();
      setGuards(data);
      if (data.length > 0) {
        setSelectedGuard(data[0]);
      }
    } catch (e) {
      console.error("Failed to load guards:", e);
    }
  };

  const loadActiveRecords = async () => {
    if (!isOnline()) return;
    try {
      const res = await fetch("/api/records/active");
      const data = await res.json();
      setActiveRecords(data);
    } catch (e) {
      console.error("Failed to load records:", e);
    }
  };

  const loadOfflineRecords = () => {
    try {
      const stored = localStorage.getItem("offlineRecords");
      if (stored) {
        setOfflineRecords(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load offline records:", e);
    }
  };

  const saveOfflineRecord = (record: OfflineRecord) => {
    const records = [...offlineRecords(), record];
    setOfflineRecords(records);
    localStorage.setItem("offlineRecords", JSON.stringify(records));
  };

  const removeOfflineRecords = (ids: string[]) => {
    const records = offlineRecords().filter(r => !ids.includes(r.id));
    setOfflineRecords(records);
    localStorage.setItem("offlineRecords", JSON.stringify(records));
  };

  const loadVisitorCache = async () => {
    if (!isOnline()) return;
    try {
      const res = await fetch("/api/visitors?status=active");
      const data = await res.json();
      const cache = new Map<string, any>();
      data.forEach((v: any) => {
        cache.set(v.qr_code, v);
        cache.set(v.plate_number, v);
      });
      setVisitorCache(cache);
      localStorage.setItem("visitorCache", JSON.stringify(Array.from(cache.entries())));
    } catch (e) {
      console.error("Failed to cache visitors:", e);
    }
  };

  const getCachedVisitor = (key: string) => {
    if (visitorCache().has(key)) {
      return visitorCache().get(key);
    }
    try {
      const stored = localStorage.getItem("visitorCache");
      if (stored) {
        const cache = new Map(JSON.parse(stored));
        setVisitorCache(cache);
        return cache.get(key);
      }
    } catch (e) {}
    return null;
  };

  const handleScan = async (e: Event) => {
    e.preventDefault();
    const code = scanInput().trim();
    if (!code) return;

    let qrCode = code;
    try {
      const parsed = JSON.parse(code);
      if (parsed.code) {
        qrCode = parsed.code;
      }
    } catch (e) {}

    if (isOnline()) {
      await onlineProcess(qrCode);
    } else {
      offlineProcess(qrCode);
    }

    setScanInput("");
  };

  const onlineProcess = async (code: string) => {
    try {
      const endpoint = mode() === "entry" ? "/api/records/entry" : "/api/records/exit";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: code,
          guardName: selectedGuard()?.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "操作失败");
      }

      setMessage({
        type: "success",
        text: mode() === "entry"
          ? `✅ 入场成功！${data.plate_number} - ${new Date(data.entry_time).toLocaleTimeString("zh-CN")}`
          : `✅ 离场成功！${data.plate_number} - ${new Date(data.exit_time).toLocaleTimeString("zh-CN")}`,
      });

      loadActiveRecords();
      loadVisitorCache();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const offlineProcess = (code: string) => {
    const visitor = getCachedVisitor(code);
    if (!visitor) {
      setMessage({ type: "error", text: "离线状态下未找到该访客信息，请联网后重试或使用人工放行" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const now = Date.now();
    if (visitor.start_time > now || visitor.end_time < now) {
      setMessage({ type: "error", text: "该访客预约时间无效" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const record: OfflineRecord = {
      id: "offline-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
      type: mode(),
      visitorId: visitor.id,
      plateNumber: visitor.plate_number,
      [mode() === "entry" ? "entryTime" : "exitTime"]: now,
      guardName: selectedGuard()?.name || "",
      remark: "离线核验通过",
      isManual: false,
    };

    saveOfflineRecord(record);

    setMessage({
      type: "success",
      text: `📱 离线核验通过！${visitor.plate_number} ${mode() === "entry" ? "入场" : "离场"}记录已保存，联网后自动同步`,
    });

    setTimeout(() => setMessage(null), 3000);
  };

  const handleManual = async (e: Event) => {
    e.preventDefault();
    if (!manualPlate()) {
      setMessage({ type: "error", text: "请输入车牌号码" });
      return;
    }
    if (!manualRemark()) {
      setMessage({ type: "error", text: "请填写放行原因" });
      return;
    }

    if (isOnline()) {
      try {
        const endpoint = mode() === "entry" ? "/api/records/entry" : "/api/records/exit";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plateNumber: manualPlate(),
            guardName: selectedGuard()?.name,
            isManual: true,
            remark: manualRemark(),
            isOffline: !isOnline(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "操作失败");
        }

        setMessage({ type: "success", text: `✅ 人工放行成功！${data.plate_number}` });
        setShowManual(false);
        setManualPlate("");
        setManualRemark("");
        loadActiveRecords();
      } catch (e: any) {
        setMessage({ type: "error", text: e.message });
      }
    } else {
      const record: OfflineRecord = {
        id: "offline-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        type: mode(),
        plateNumber: manualPlate().toUpperCase(),
        [mode() === "entry" ? "entryTime" : "exitTime"]: Date.now(),
        guardName: selectedGuard()?.name || "",
        remark: manualRemark(),
        isManual: true,
      };

      saveOfflineRecord(record);

      setMessage({ type: "success", text: "📱 人工放行记录已保存，联网后自动同步" });
      setShowManual(false);
      setManualPlate("");
      setManualRemark("");
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const syncOfflineRecords = async () => {
    if (offlineRecords().length === 0 || !isOnline()) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/records/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: offlineRecords(),
          guardName: selectedGuard()?.name,
        }),
      });

      const data = await res.json();
      const syncedIds = data.results.filter((r: any) => r.success).map((r: any) => r.id);
      removeOfflineRecords(syncedIds);

      setMessage({ type: "success", text: `已同步 ${data.synced} 条离线记录` });
      loadActiveRecords();
      loadVisitorCache();
    } catch (e: any) {
      console.error("Sync failed:", e);
      setMessage({ type: "error", text: "同步失败，请稍后重试" });
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      parked: { text: "停放中", color: "#48bb78" },
      timeout: { text: "已超时", color: "#f56565" },
      exited: { text: "已离场", color: "#4299e1" },
    };
    return map[status] || { text: status, color: "#666" };
  };

  return (
    <div style="min-height: 100vh; background: #f7fafc;">
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <A href="/" style="text-decoration: none; color: #667eea; font-weight: 600;">← 返回</A>
            <h1 style="font-size: 20px; color: #2d3748; margin: 0;">🛡️ 保安亭</h1>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <select
              value={selectedGuard()?.id || ""}
              onChange={(e) => {
                const guard = guards().find(g => g.id === e.target.value);
                setSelectedGuard(guard || null);
              }}
              style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
            >
              <For each={guards()}>
                {(g) => <option value={g.id}>{g.name} - {g.booth_number}</option>}
              </For>
            </select>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              background: isOnline() ? "#c6f6d5" : "#fed7d7",
              color: isOnline() ? "#22543d" : "#742a2a",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isOnline() ? "#48bb78" : "#f56565" }}></span>
              {isOnline() ? "在线" : "离线"}
            </div>
            {offlineRecords().length > 0 && (
              <button
                onClick={syncOfflineRecords}
                disabled={syncing()}
                style="padding: 8px 16px; background: #ed8936; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;"
              >
                {syncing() ? "同步中..." : `同步离线记录 (${offlineRecords().length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        {message() && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              background: message()!.type === "success" ? "#c6f6d5" : "#fed7d7",
              color: message()!.type === "success" ? "#22543d" : "#742a2a",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            {message()!.text}
          </div>
        )}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
              <button
                onClick={() => setMode("entry")}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  background: mode() === "entry" ? "#48bb78" : "#e2e8f0",
                  color: mode() === "entry" ? "white" : "#4a5568",
                }}
              >
                🚗 入场
              </button>
              <button
                onClick={() => setMode("exit")}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  background: mode() === "exit" ? "#4299e1" : "#e2e8f0",
                  color: mode() === "exit" ? "white" : "#4a5568",
                }}
              >
                🚗 离场
              </button>
            </div>

            <form onSubmit={handleScan} style="margin-bottom: 16px;">
              <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 8px;">扫描二维码 / 输入访客码</label>
              <div style="display: flex; gap: 8px;">
                <input
                  type="text"
                  value={scanInput()}
                  onInput={(e) => setScanInput(e.target.value)}
                  placeholder="扫码枪输入或手动输入访客码"
                  style="flex: 1; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px;"
                  autofocus
                />
                <button
                  type="submit"
                  style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;"
                >
                  核验
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowManual(!showManual())}
              style="width: 100%; padding: 12px; background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; border-radius: 8px; cursor: pointer; font-size: 14px;"
            >
              {showManual() ? "取消" : "+ 人工放行"}
            </button>

            {showManual() && (
              <form onSubmit={handleManual} style="margin-top: 16px; padding: 16px; background: #fff5f5; border-radius: 8px;">
                <h4 style="color: #c53030; margin: 0 0 12px 0; font-size: 14px;">⚠️ 人工放行</h4>
                <div style="margin-bottom: 12px;">
                  <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">车牌号码 *</label>
                  <input
                    type="text"
                    value={manualPlate()}
                    onInput={(e) => setManualPlate(e.target.value.toUpperCase())}
                    placeholder="例如：京A12345"
                    style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; text-transform: uppercase;"
                  />
                </div>
                <div style="margin-bottom: 12px;">
                  <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">保安姓名：{selectedGuard()?.name}</label>
                </div>
                <div style="margin-bottom: 12px;">
                  <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">放行原因 *</label>
                  <textarea
                    value={manualRemark()}
                    onInput={(e) => setManualRemark(e.target.value)}
                    placeholder="请详细填写放行原因..."
                    rows={3}
                    style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; resize: vertical;"
                  />
                </div>
                <button
                  type="submit"
                  style="width: 100%; padding: 12px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;"
                >
                  确认{mode() === "entry" ? "入场" : "离场"}
                </button>
              </form>
            )}
          </div>

          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="font-size: 18px; color: #2d3748; margin: 0 0 20px 0;">在场车辆 ({activeRecords().length})</h2>
            <div style="max-height: 500px; overflow-y: auto;">
              <For each={activeRecords()}>
                {(record) => {
                  const status = statusLabel(record.status);
                  const isTimeout = record.status === "timeout";
                  return (
                    <div style={{
                      padding: "16px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      background: isTimeout ? "#fff5f5" : "white",
                      borderLeft: isTimeout ? "4px solid #f56565" : "4px solid #48bb78",
                    }}>
                      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div>
                          <div style="font-size: 18px; font-weight: 600; color: #2d3748; font-family: monospace;">{record.plate_number}</div>
                          <div style="font-size: 13px; color: #718096;">{record.name} · {record.building}</div>
                        </div>
                        <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", background: status.color + "20", color: status.color }}>
                          {status.text}
                        </span>
                      </div>
                      <div style="font-size: 12px; color: #4a5568; line-height: 1.6;">
                        <div>接待人：{record.host_name} ({record.host_phone})</div>
                        <div>入场时间：{record.entry_time ? new Date(record.entry_time).toLocaleString("zh-CN") : "-"}</div>
                        <div>允许停放至：{record.visitor_end_time ? new Date(record.visitor_end_time).toLocaleString("zh-CN") : "-"}</div>
                        {record.is_manual_entry ? <div style="color: #e53e3e;">⚠️ 人工放行：{record.entry_remark}</div> : null}
                      </div>
                    </div>
                  );
                }}
              </For>
              {activeRecords().length === 0 && (
                <div style="text-align: center; padding: 40px; color: #a0aec0;">
                  暂无在场车辆
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
