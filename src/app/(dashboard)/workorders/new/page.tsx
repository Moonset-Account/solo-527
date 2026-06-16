"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/react";
import {
  ClipboardList,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Wrench,
  Car,
} from "lucide-react";
import Link from "next/link";

interface WorkOrderItemInput {
  type: "SERVICE" | "PART";
  name: string;
  quantity: number;
  unitPrice: number;
  partId?: string;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get("vehicleId");
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    vehicleId: preselectedVehicleId || "",
    priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH" | "URGENT",
    description: "",
    estimatedDelivery: "",
  });

  const [items, setItems] = useState<WorkOrderItemInput[]>([]);

  const { data: vehicles, isLoading: vehiclesLoading } =
    trpc.vehicle.list.useQuery({
      page: 1,
      pageSize: 100,
    });

  const { data: parts, isLoading: partsLoading } = trpc.part.list.useQuery({
    page: 1,
    pageSize: 100,
  });

  const createWorkOrder = trpc.workOrder.create.useMutation({
    onSuccess: () => {
      utils.workOrder.list.invalidate();
      router.push("/workorders");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  useEffect(() => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    setFormData((prev) => ({
      ...prev,
      estimatedDelivery: deliveryDate.toISOString().split("T")[0],
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      alert("请选择车辆");
      return;
    }
    createWorkOrder.mutate({
      ...formData,
      items,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addServiceItem = () => {
    setItems((prev) => [
      ...prev,
      { type: "SERVICE", name: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const addPartItem = () => {
    setItems((prev) => [
      ...prev,
      { type: "PART", name: "", quantity: 1, unitPrice: 0, partId: "" },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof WorkOrderItemInput,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "partId" && value) {
          const part = parts?.data.find((p: any) => p.id === value);
          if (part) {
            updated.name = part.name;
            updated.unitPrice = Number(part.price);
          }
        }
        return updated;
      })
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const selectedVehicle = vehicles?.data.find(
    (v: any) => v.id === formData.vehicleId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/workorders"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            新建工单
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            创建维修工单，录入维修需求和配件
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <ClipboardList className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                工单基本信息
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                填写工单的基本信息
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                选择车辆 <span className="text-rose-500">*</span>
              </label>
              {vehiclesLoading ? (
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-500">
                  加载中...
                </div>
              ) : (
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">请选择车辆</option>
                  {vehicles?.data.map((vehicle: any) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.brand} {vehicle.model} (
                      {vehicle.ownerName})
                    </option>
                  ))}
                </select>
              )}
              {selectedVehicle && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedVehicle.plateNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedVehicle.brand} {selectedVehicle.model} ·{" "}
                        {selectedVehicle.year}款 · {selectedVehicle.color} ·{" "}
                        {Number(selectedVehicle.mileage).toLocaleString()} km
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                优先级
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="LOW">低</option>
                <option value="NORMAL">普通</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                预计交付时间 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="estimatedDelivery"
                value={formData.estimatedDelivery}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                维修需求描述 <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="请详细描述车辆故障或维修需求..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Wrench className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  维修项目与配件
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  添加工时项目和所需配件
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addServiceItem}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors font-medium"
              >
                <Wrench className="w-4 h-4" />
                添加工时
              </button>
              <button
                type="button"
                onClick={addPartItem}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors font-medium"
              >
                <Package className="w-4 h-4" />
                添加配件
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Wrench className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                点击上方按钮添加维修项目或配件
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.type === "SERVICE"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}
                    >
                      {item.type === "SERVICE" ? "工时" : "配件"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-auto p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    {item.type === "PART" ? (
                      <div className="col-span-5">
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          选择配件
                        </label>
                        <select
                          value={item.partId || ""}
                          onChange={(e) =>
                            updateItem(index, "partId", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">请选择配件</option>
                          {parts?.data.map((part: any) => (
                            <option key={part.id} value={part.id}>
                              {part.code} - {part.name} (库存: {part.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="col-span-5">
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          项目名称
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, "name", e.target.value)
                          }
                          placeholder="如：常规保养、发动机检修"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                        数量
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                        单价 (¥)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", Number(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <div className="text-right w-full">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          小计
                        </p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          ¥{(item.quantity * item.unitPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end">
              <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  合计金额
                </p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                  ¥{totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/workorders"
            className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={createWorkOrder.isPending}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {createWorkOrder.isPending ? "创建中..." : "创建工单"}
          </button>
        </div>
      </form>
    </div>
  );
}
