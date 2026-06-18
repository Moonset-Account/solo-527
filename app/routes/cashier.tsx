import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader({ request }) {
  const url = new URL(request.url);
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const today = dayjs().format("YYYY-MM-DD");

  try {
    const [techRes, treatRes, consulRes, apptRes] = await Promise.all([
      fetch(`${baseUrl}/api/technicians/list/active`),
      fetch(`${baseUrl}/api/treatments/list/active`),
      fetch(`${baseUrl}/api/consultants/list/active`),
      fetch(`${baseUrl}/api/appointments?startDate=${today}&endDate=${today}&pageSize=50`),
    ]);

    const techData = await techRes.json();
    const treatData = await treatRes.json();
    const consulData = await consulRes.json();
    const apptData = await apptRes.json();

    const todayAppointments = apptData.data?.list || [];
    const todayRevenue = todayAppointments.reduce((sum: number, item: any) => sum + (item.paidAmount || 0), 0);

    return json({
      technicians: techData.data || [],
      treatments: treatData.data || [],
      consultants: consulData.data || [],
      todayAppointments,
      todayTotal: apptData.data?.total || 0,
      todayRevenue,
      todayCompleted: todayAppointments.filter((item: any) => item.status === "已完成").length,
    });
  } catch (error) {
    return json({
      technicians: [],
      treatments: [],
      consultants: [],
      todayAppointments: [],
      todayTotal: 0,
      todayRevenue: 0,
      todayCompleted: 0,
    });
  }
}

export async function action({ request }) {
  const formData = await request.formData();
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const _action = formData.get("_action");

  if (_action === "create") {
    const treatmentId = formData.get("treatmentId");
    const technicianId = formData.get("technicianId");
    const startTime = formData.get("startTime");
    const duration = parseInt(formData.get("duration") || "60");

    const startHour = parseInt(startTime?.toString().split(":")[0] || "10");
    const startMin = parseInt(startTime?.toString().split(":")[1] || "0");
    const endHour = startHour + Math.floor(duration / 60);
    const endMin = startMin + (duration % 60);
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    const body = {
      customerId: formData.get("customerId"),
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      treatmentId,
      treatmentName: formData.get("treatmentName"),
      technicianId,
      technicianName: formData.get("technicianName"),
      consultantId: formData.get("consultantId") || undefined,
      consultantName: formData.get("consultantName") || undefined,
      appointmentDate: formData.get("appointmentDate"),
      startTime,
      endTime,
      duration,
      price: parseFloat(formData.get("price") || "0"),
      source: formData.get("source") || "门店",
      remark: formData.get("remark"),
    };

    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data);
  }

  if (_action === "payment") {
    const id = formData.get("id");
    const body = {
      paidAmount: parseFloat(formData.get("paidAmount") || "0"),
      paymentMethod: formData.get("paymentMethod"),
      useBalance: parseFloat(formData.get("useBalance") || "0"),
      usePoints: parseInt(formData.get("usePoints") || "0"),
      discount: parseFloat(formData.get("discount") || "0"),
      remark: formData.get("remark"),
    };

    const res = await fetch(`${baseUrl}/api/appointments/${id}/payment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return json(data);
  }

  return json({ success: false, message: "无效操作" });
}

export default function Cashier() {
  const { technicians, treatments, consultants, todayAppointments, todayTotal, todayRevenue, todayCompleted } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState<any>(null);
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("现金");
  const [discount, setDiscount] = useState("0");
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTreatment || !selectedTechnician) {
      alert("请选择项目和技师");
      return;
    }
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("_action", "create");
    formData.set("treatmentId", selectedTreatment._id);
    formData.set("treatmentName", selectedTreatment.name);
    formData.set("technicianId", selectedTechnician._id);
    formData.set("technicianName", selectedTechnician.name);
    formData.set("duration", String(selectedTreatment.duration));
    formData.set("price", String(selectedTreatment.price));
    if (selectedConsultant) {
      formData.set("consultantId", selectedConsultant._id);
      formData.set("consultantName", selectedConsultant.name);
    }
    setLastAction("create");
    fetcher.submit(formData, { method: "post" });
  };

  useEffect(() => {
    const data = fetcher.data as any;
    if (data && data.success && lastAction === "create") {
      const appointment = data.data;
      if (appointment && appointment._id) {
        if (!appointment.paidAmount || appointment.paidAmount < (appointment.actualPrice || appointment.price)) {
          openPayment(appointment);
        }
      }
      setLastAction(null);
      setCustomerInfo({ name: "", phone: "" });
      setSelectedTreatment(null);
      setSelectedTechnician(null);
      setSelectedConsultant(null);
    }
    if (data && data.success && lastAction === "payment") {
      setShowPaymentModal(false);
      setLastAction(null);
    }
  }, [fetcher.data]);

  const handlePayment = () => {
    if (!paymentAppointment) return;
    const formData = new FormData();
    formData.set("_action", "payment");
    formData.set("id", paymentAppointment._id);
    formData.set("paidAmount", paidAmount);
    formData.set("paymentMethod", paymentMethod);
    formData.set("discount", discount);
    setLastAction("payment");
    fetcher.submit(formData, { method: "post" });
  };

  const openPayment = (appointment: any) => {
    setPaymentAppointment(appointment);
    const remain = (appointment.actualPrice || appointment.price) - (appointment.paidAmount || 0);
    setPaidAmount(remain > 0 ? remain.toFixed(2) : "0.00");
    setPaymentMethod("现金");
    setDiscount("0");
    setShowPaymentModal(true);
  };

  const timeSlots: string[] = [];
  for (let h = 9; h < 22; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    timeSlots.push(`${String(h).padStart(2, "0")}:30`);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📝</span> 预约登记
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">客户姓名 *</label>
                  <input
                    name="customerName"
                    className="input-field"
                    placeholder="请输入客户姓名"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">手机号 *</label>
                  <input
                    name="customerPhone"
                    className="input-field"
                    placeholder="请输入手机号"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <input type="hidden" name="customerId" value={customerInfo.phone} />

              <div>
                <label className="label">选择项目 *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                  {treatments.map((treat: any) => (
                    <div
                      key={treat._id}
                      onClick={() => setSelectedTreatment(treat)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTreatment?._id === treat._id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <p className="font-medium text-sm">{treat.name}</p>
                      <p className="text-xs text-gray-500">{treat.duration}分钟</p>
                      <p className="text-primary-600 font-semibold mt-1">¥{treat.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">选择技师 *</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-32 overflow-y-auto p-1">
                  {technicians.map((tech: any) => (
                    <div
                      key={tech._id}
                      onClick={() => setSelectedTechnician(tech)}
                      className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                        selectedTechnician?._id === tech._id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center text-white font-bold">
                        {tech.name?.charAt(0)}
                      </div>
                      <p className="text-sm font-medium mt-2">{tech.name}</p>
                      <p className="text-xs text-gray-500">{tech.level}</p>
                    </div>
                  ))}
                </div>
              </div>

              {consultants.length > 0 && (
                <div>
                  <label className="label">顾问 (可选)</label>
                  <select
                    className="select-field"
                    value={selectedConsultant?._id || ""}
                    onChange={(e) => {
                      const consultant = consultants.find((c: any) => c._id === e.target.value);
                      setSelectedConsultant(consultant || null);
                    }}
                  >
                    <option value="">请选择顾问</option>
                    {consultants.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">预约日期 *</label>
                  <input
                    name="appointmentDate"
                    type="date"
                    className="input-field"
                    defaultValue={dayjs().format("YYYY-MM-DD")}
                    required
                  />
                </div>
                <div>
                  <label className="label">开始时间 *</label>
                  <select name="startTime" className="select-field" defaultValue="10:00">
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">来源</label>
                  <select name="source" className="select-field" defaultValue="门店">
                    <option value="门店">门店</option>
                    <option value="电话">电话</option>
                    <option value="微信">微信</option>
                    <option value="美团">美团</option>
                    <option value="大众点评">大众点评</option>
                    <option value="转介绍">转介绍</option>
                  </select>
                </div>
                <div>
                  <label className="label">预计时长</label>
                  <div className="input-field bg-gray-50 text-gray-600">
                    {selectedTreatment?.duration || 0} 分钟
                  </div>
                </div>
              </div>

              <div>
                <label className="label">备注</label>
                <textarea
                  name="remark"
                  className="input-field h-20"
                  placeholder="可选：客户特殊要求等"
                ></textarea>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <span className="text-gray-600">应收金额：</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ¥{selectedTreatment?.price?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setCustomerInfo({ name: "", phone: "" });
                    setSelectedTreatment(null);
                    setSelectedTechnician(null);
                    setSelectedConsultant(null);
                  }}>
                    重置
                  </button>
                  <button type="submit" className="btn btn-primary">
                    ✅ 确认预约
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>💰</span> 今日收银
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">今日营收</p>
                <p className="text-2xl font-bold text-green-600 mt-1">¥{todayRevenue?.toFixed(2) || "0.00"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">今日预约</p>
                  <p className="text-xl font-bold text-blue-600">{todayTotal || 0}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">已完成</p>
                  <p className="text-xl font-bold text-purple-600">{todayCompleted || 0}</p>
                </div>
              </div>
              <Link to="/appointments" className="btn btn-secondary w-full justify-center">
                📋 查看全部预约
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📅</span> 今日预约
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appt: any) => (
                  <div key={appt._id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{appt.customerName}</p>
                        <p className="text-xs text-gray-500">{appt.treatmentName}</p>
                        <p className="text-xs text-gray-400">
                          {appt.startTime} · {appt.technicianName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary-600 text-sm">
                          ¥{(appt.actualPrice || appt.price)?.toFixed(2)}
                        </p>
                        <span
                          className={`text-xs ${
                            appt.paymentStatus === "已支付"
                              ? "text-green-600"
                              : appt.paymentStatus === "未支付"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        >
                          {appt.paymentStatus}
                        </span>
                      </div>
                    </div>
                    {appt.paymentStatus !== "已支付" && appt.status !== "已取消" && (
                      <button
                        onClick={() => openPayment(appt)}
                        className="mt-2 w-full py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors"
                      >
                        💰 去收款
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无今日预约
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span> 快捷操作
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/schedules"
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
              >
                <span className="text-2xl">📅</span>
                <p className="text-sm font-medium text-gray-700 mt-1">排班管理</p>
              </Link>
              <Link
                to="/customer-treatments"
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
              >
                <span className="text-2xl">💆</span>
                <p className="text-sm font-medium text-gray-700 mt-1">疗程卡</p>
              </Link>
              <Link
                to="/materials"
                className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-center"
              >
                <span className="text-2xl">📦</span>
                <p className="text-sm font-medium text-gray-700 mt-1">耗材库存</p>
              </Link>
              <Link
                to="/commissions"
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
              >
                <span className="text-2xl">💰</span>
                <p className="text-sm font-medium text-gray-700 mt-1">提成结算</p>
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⏰</span> 今日待提醒
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                <p className="text-sm font-medium text-red-700">紧急：技师请假待审批</p>
                <p className="text-xs text-red-500">1条请假申请待处理</p>
              </div>
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <p className="text-sm font-medium text-yellow-700">提醒：耗材库存不足</p>
                <p className="text-xs text-yellow-500">3种耗材低于安全库存</p>
              </div>
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-sm font-medium text-blue-700">普通：今日新客</p>
                <p className="text-xs text-blue-500">2位新客户到店</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && paymentAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">💰 收银结算</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">预约单号</span>
                  <span className="font-mono text-sm">{paymentAppointment.appointmentNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">客户</span>
                  <span className="font-medium">{paymentAppointment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">项目</span>
                  <span className="font-medium">{paymentAppointment.treatmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">技师</span>
                  <span className="font-medium">{paymentAppointment.technicianName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">应收金额</span>
                  <span className="font-bold text-primary-600">
                    ¥{(paymentAppointment.actualPrice || paymentAppointment.price)?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">已付金额</span>
                  <span className="font-medium">
                    ¥{(paymentAppointment.paidAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">待收金额</span>
                  <span className="font-bold text-green-600">
                    ¥{((paymentAppointment.actualPrice || paymentAppointment.price) - (paymentAppointment.paidAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">支付方式</label>
                <select
                  className="select-field"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="现金">现金</option>
                  <option value="微信">微信支付</option>
                  <option value="支付宝">支付宝</option>
                  <option value="银行卡">银行卡</option>
                  <option value="会员卡">会员卡</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">优惠金额</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">实收金额</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  取消
                </button>
                <button className="btn btn-success" onClick={handlePayment}>
                  ✅ 确认收款
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
