import { createSignal, createEffect, For } from "solid-js";
import { A } from "@solidjs/router";

interface Visitor {
  id: string;
  name: string;
  phone: string;
  plate_number: string;
  building: string;
  host_name: string;
  host_phone: string;
  start_time: number;
  end_time: number;
  status: string;
  qr_code: string;
  created_at: number;
}

export default function HostPage() {
  const [visitors, setVisitors] = createSignal<Visitor[]>([]);
  const [showForm, setShowForm] = createSignal(false);
  const [selectedVisitor, setSelectedVisitor] = createSignal<Visitor | null>(null);
  const [qrDataUrl, setQrDataUrl] = createSignal<string>("");
  const [formData, setFormData] = createSignal({
    name: "",
    phone: "",
    plateNumber: "",
    building: "",
    hostName: "",
    hostPhone: "",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = createSignal(false);
  const [message, setMessage] = createSignal<{ type: "success" | "error"; text: string } | null>(null);

  const fetchVisitors = async () => {
    try {
      const res = await fetch("/api/visitors");
      const data = await res.json();
      setVisitors(data);
    } catch (e) {
      console.error("Failed to fetch visitors:", e);
    }
  };

  createEffect(() => {
    fetchVisitors();
  });

  const generateQR = async (qrCode: string) => {
    try {
      const qrModule = await import("qrcode");
      const dataUrl = await qrModule.default.toDataURL(
        JSON.stringify({ type: "visitor", code: qrCode }),
        { width: 256, margin: 2 }
      );
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.error("QR generation failed:", e);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const startTimestamp = formData().startTime
        ? new Date(formData().startTime).getTime()
        : Date.now();
      const endTimestamp = formData().endTime
        ? new Date(formData().endTime).getTime()
        : Date.now() + 4 * 60 * 60 * 1000;

      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData(),
          startTime: startTimestamp,
          endTime: endTimestamp,
          operator: formData().hostName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "创建失败");
      }

      setMessage({ type: "success", text: "访客创建成功！" });
      setShowForm(false);
      setFormData({
        name: "",
        phone: "",
        plateNumber: "",
        building: "",
        hostName: "",
        hostPhone: "",
        startTime: "",
        endTime: "",
      });
      fetchVisitors();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("确定要取消此访客预约吗？会议取消后权限将自动失效。")) return;

    try {
      const res = await fetch(`/api/visitors/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operator: formData().hostName || "system" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "访客权限已失效" });
        fetchVisitors();
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      active: { text: "有效", color: "#48bb78" },
      used: { text: "已使用", color: "#4299e1" },
      cancelled: { text: "已取消", color: "#f56565" },
      expired: { text: "已过期", color: "#a0aec0" },
    };
    return map[status] || { text: status, color: "#666" };
  };

  return (
    <div style="min-height: 100vh; background: #f7fafc;">
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <A href="/" style="text-decoration: none; color: #667eea; font-weight: 600;">← 返回</A>
            <h1 style="font-size: 20px; color: #2d3748; margin: 0;">👤 接待人工作台</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;"
          >
            + 创建访客
          </button>
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
            }}
          >
            {message()!.text}
          </div>
        )}

        {showForm() && (
          <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="font-size: 18px; color: #2d3748; margin-bottom: 20px;">创建访客预约</h2>
            <form onSubmit={handleSubmit} style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">访客姓名 *</label>
                <input
                  type="text"
                  value={formData().name}
                  onInput={(e) => setFormData({ ...formData(), name: e.target.value })}
                  required
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                  placeholder="请输入访客姓名"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">访客电话 *</label>
                <input
                  type="tel"
                  value={formData().phone}
                  onInput={(e) => setFormData({ ...formData(), phone: e.target.value })}
                  required
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                  placeholder="请输入访客电话"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">车牌号码 *</label>
                <input
                  type="text"
                  value={formData().plateNumber}
                  onInput={(e) => setFormData({ ...formData(), plateNumber: e.target.value.toUpperCase() })}
                  required
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; text-transform: uppercase;"
                  placeholder="例如：京A12345"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">来访楼栋 *</label>
                <input
                  type="text"
                  value={formData().building}
                  onInput={(e) => setFormData({ ...formData(), building: e.target.value })}
                  required
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                  placeholder="例如：A座15层"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">接待人姓名 *</label>
                <input
                  type="text"
                  value={formData().hostName}
                  onInput={(e) => setFormData({ ...formData(), hostName: e.target.value })}
                  required
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                  placeholder="请输入您的姓名"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">接待人电话 *</label>
                <input
                  type="tel"
                  value={formData().hostPhone}
                  onInput={(e) => setFormData({ ...formData(), hostPhone: e.target.value })}
                  required
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                  placeholder="请输入您的电话"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">允许进入时间</label>
                <input
                  type="datetime-local"
                  value={formData().startTime}
                  onInput={(e) => setFormData({ ...formData(), startTime: e.target.value })}
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                />
              </div>
              <div>
                <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">允许离开时间</label>
                <input
                  type="datetime-local"
                  value={formData().endTime}
                  onInput={(e) => setFormData({ ...formData(), endTime: e.target.value })}
                  style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                />
              </div>
              <div style="grid-column: span 2; display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px;">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style="padding: 10px 24px; border: 1px solid #e2e8f0; background: white; border-radius: 6px; cursor: pointer; font-size: 14px;"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading()}
                  style="padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                >
                  {loading() ? "创建中..." : "创建访客"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="font-size: 18px; color: #2d3748; margin-bottom: 20px;">访客记录</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                  <th style="text-align: left; padding: 12px 8px; color: #4a5568;">访客</th>
                  <th style="text-align: left; padding: 12px 8px; color: #4a5568;">车牌</th>
                  <th style="text-align: left; padding: 12px 8px; color: #4a5568;">楼栋</th>
                  <th style="text-align: left; padding: 12px 8px; color: #4a5568;">接待人</th>
                  <th style="text-align: left; padding: 12px 8px; color: #4a5568;">有效期</th>
                  <th style="text-align: left; padding: 12px 8px; color: #4a5568;">状态</th>
                  <th style="text-align: left; padding: 12px 8px; color: #4a5568;">操作</th>
                </tr>
              </thead>
              <tbody>
                <For each={visitors()}>
                  {(visitor) => {
                    const status = statusLabel(visitor.status);
                    return (
                      <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 12px 8px;">
                          <div style="font-weight: 500; color: #2d3748;">{visitor.name}</div>
                          <div style="font-size: 12px; color: #718096;">{visitor.phone}</div>
                        </td>
                        <td style="padding: 12px 8px; font-family: monospace; color: #2d3748;">{visitor.plate_number}</td>
                        <td style="padding: 12px 8px; color: #4a5568;">{visitor.building}</td>
                        <td style="padding: 12px 8px; color: #4a5568;">{visitor.host_name}</td>
                        <td style="padding: 12px 8px; font-size: 12px; color: #4a5568;">
                          {new Date(visitor.start_time).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          <br />
                          ~ {new Date(visitor.end_time).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style="padding: 12px 8px;">
                          <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", background: status.color + "20", color: status.color }}>
                            {status.text}
                          </span>
                        </td>
                        <td style="padding: 12px 8px;">
                          <div style="display: flex; gap: 8px;">
                            <button
                              onClick={() => {
                                setSelectedVisitor(visitor);
                                generateQR(visitor.qr_code);
                              }}
                              style="padding: 6px 12px; background: #ebf8ff; color: #2b6cb0; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                            >
                              查看二维码
                            </button>
                            {visitor.status === "active" && (
                              <button
                                onClick={() => handleCancel(visitor.id)}
                                style="padding: 6px 12px; background: #fff5f5; color: #c53030; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                              >
                                取消预约
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
            {visitors().length === 0 && (
              <div style="text-align: center; padding: 40px; color: #a0aec0;">
                暂无访客记录
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedVisitor() && (
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
          <div style="background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 90%; text-align: center;">
            <h3 style="font-size: 18px; color: #2d3748; margin-bottom: 8px;">访客二维码</h3>
            <p style="color: #718096; font-size: 14px; margin-bottom: 20px;">
              {selectedVisitor()!.name} - {selectedVisitor()!.plate_number}
            </p>
            {qrDataUrl() && <img src={qrDataUrl()} alt="访客二维码" style="width: 256px; height: 256px; margin: 0 auto 20px;" />}
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; color: #4a5568; word-break: break-all;">
              二维码内容：{selectedVisitor()!.qr_code}
            </div>
            <p style="font-size: 12px; color: #e53e3e; margin-bottom: 20px;">
              ⚠️ 车辆离场后二维码立即失效，请勿提前截图使用
            </p>
            <button
              onClick={() => {
                setSelectedVisitor(null);
                setQrDataUrl("");
              }}
              style="padding: 10px 32px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
