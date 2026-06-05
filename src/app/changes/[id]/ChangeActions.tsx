"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChangeStatus } from "@/generated/prisma";

interface ChangeActionsProps {
  changeId: string;
  status: string;
  canConfirm: boolean;
  canWithdraw: boolean;
  canCreatePO: boolean;
  isDesigner: boolean;
  isProjectManager: boolean;
  isFinance: boolean;
  isLocked: boolean;
}

export default function ChangeActions({
  changeId,
  status,
  canConfirm,
  canWithdraw,
  canCreatePO,
  isDesigner,
  isProjectManager,
  isFinance,
  isLocked,
}: ChangeActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPOForm, setShowPOForm] = useState(false);
  const [poItems, setPoItems] = useState([
    { name: "", quantity: 1, unitPrice: 0 },
  ]);
  const router = useRouter();

  const handleAction = async (action: string, comment?: string) => {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/changes/${changeId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(null);
    }
  };

  const handleCreatePO = async () => {
    setLoading("createPO");
    setError(null);

    try {
      const validItems = poItems.filter(
        (item) => item.name && item.quantity > 0 && item.unitPrice > 0
      );

      if (validItems.length === 0) {
        throw new Error("请至少添加一个采购项");
      }

      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeRequestId: changeId,
          items: validItems,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建采购单失败");
      }

      router.refresh();
      setShowPOForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建采购单失败");
    } finally {
      setLoading(null);
    }
  };

  const addPOItem = () => {
    setPoItems([...poItems, { name: "", quantity: 1, unitPrice: 0 }]);
  };

  const updatePOItem = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newItems = [...poItems];
    (newItems[index] as any)[field] = value;
    setPoItems(newItems);
  };

  const removePOItem = (index: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {canConfirm && (
          <>
            <button
              onClick={() => handleAction("confirm")}
              disabled={loading === "confirm"}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading === "confirm" ? "确认中..." : "确认变更"}
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={loading === "reject"}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading === "reject" ? "拒绝中..." : "拒绝变更"}
            </button>
          </>
        )}

        {canWithdraw && (
          <button
            onClick={() => handleAction("withdraw")}
            disabled={loading === "withdraw"}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {loading === "withdraw" ? "撤回中..." : "撤回变更（恢复原方案）"}
          </button>
        )}

        {status === ChangeStatus.DRAFT && (
          <button
            onClick={() => handleAction("submit")}
            disabled={loading === "submit"}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading === "submit" ? "提交中..." : "提交确认"}
          </button>
        )}

        {canCreatePO && (
          <button
            onClick={() => setShowPOForm(!showPOForm)}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {showPOForm ? "取消" : "生成采购单"}
          </button>
        )}

        {showPOForm && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <h3 className="font-medium text-gray-900">采购明细</h3>
            {poItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">材料名称</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updatePOItem(index, "name", e.target.value)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="输入材料名称"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs text-gray-500">数量</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updatePOItem(index, "quantity", parseInt(e.target.value) || 1)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-gray-500">单价</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updatePOItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                {poItems.length > 1 && (
                  <button
                    onClick={() => removePOItem(index)}
                    className="text-red-500 hover:text-red-700 text-sm pb-1"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPOItem}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + 添加采购项
            </button>
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">合计：</span>
                <span className="font-bold">
                  ¥
                  {poItems
                    .reduce(
                      (sum, item) => sum + item.quantity * item.unitPrice,
                      0
                    )
                    .toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleCreatePO}
                disabled={loading === "createPO"}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading === "createPO" ? "创建中..." : "确认创建采购单"}
              </button>
            </div>
          </div>
        )}

        {isLocked && status === ChangeStatus.PENDING_CONFIRMATION && (
          <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
            <p className="font-medium text-gray-700 mb-2">锁定状态下可操作：</p>
            {isDesigner && (
              <p className="text-purple-600">✓ 设计师可修改图纸说明</p>
            )}
            {isProjectManager && (
              <p className="text-green-600">✓ 项目经理可补充说明</p>
            )}
            {isFinance && <p className="text-orange-600">✓ 财务可查看付款节点</p>}
          </div>
        )}
      </div>
    </div>
  );
}
