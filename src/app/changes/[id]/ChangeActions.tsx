"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChangeStatus, Role } from "@/generated/prisma/client";

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
  currentManagerNote?: string | null;
  currentDrawingNote?: string | null;
  currentFinanceNote?: string | null;
  currentVersion: number;
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
  currentManagerNote,
  currentDrawingNote,
  currentFinanceNote,
  currentVersion,
}: ChangeActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPOForm, setShowPOForm] = useState(false);
  const [showEditManagerNote, setShowEditManagerNote] = useState(false);
  const [showEditDrawingNote, setShowEditDrawingNote] = useState(false);
  const [showEditFinanceNote, setShowEditFinanceNote] = useState(false);
  const [managerNote, setManagerNote] = useState(currentManagerNote || "");
  const [drawingNote, setDrawingNote] = useState(currentDrawingNote || "");
  const [financeNote, setFinanceNote] = useState(currentFinanceNote || "");
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [poItems, setPoItems] = useState([
    { name: "", quantity: 1, unitPrice: 0 },
  ]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAction = async (action: string, actionComment?: string) => {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/changes/${changeId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: actionComment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }

      router.refresh();
      setShowCommentInput(false);
      setPendingAction(null);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateNote = async (
    field: "managerNote" | "drawingNote" | "financeNote",
    value: string
  ) => {
    setLoading(field);
    setError(null);

    try {
      const res = await fetch(`/api/changes/${changeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "更新失败");
      }

      if (field === "managerNote") setShowEditManagerNote(false);
      if (field === "drawingNote") setShowEditDrawingNote(false);
      if (field === "financeNote") setShowEditFinanceNote(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/changes/${changeId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "上传失败");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const confirmActionWithComment = (action: string) => {
    if (comment.trim()) {
      handleAction(action, comment);
    } else {
      handleAction(action);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {canConfirm && !showCommentInput && (
            <>
              <button
                onClick={() => {
                  setPendingAction("confirm");
                  setShowCommentInput(true);
                }}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                确认变更
              </button>
              <button
                onClick={() => {
                  setPendingAction("reject");
                  setShowCommentInput(true);
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                拒绝变更
              </button>
            </>
          )}

          {showCommentInput && pendingAction && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {pendingAction === "confirm" ? "确认变更" : "拒绝变更"}
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="添加备注（可选）"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => confirmActionWithComment(pendingAction)}
                  disabled={loading === pendingAction}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium text-white ${
                    pendingAction === "confirm"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  {loading === pendingAction
                    ? "处理中..."
                    : pendingAction === "confirm"
                    ? "确认"
                    : "拒绝"}
                </button>
                <button
                  onClick={() => {
                    setShowCommentInput(false);
                    setPendingAction(null);
                    setComment("");
                  }}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
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
              {loading === "submit" ? "提交中..." : "提交业主确认"}
            </button>
          )}

          {canCreatePO && !showPOForm && (
            <button
              onClick={() => setShowPOForm(true)}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              生成采购单
            </button>
          )}
        </div>
      </div>

      {showPOForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">采购单明细</h3>
            <button
              onClick={() => setShowPOForm(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              取消
            </button>
          </div>
          <div className="space-y-3">
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
                      updatePOItem(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1
                      )
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
                      updatePOItem(
                        index,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      )
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
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {loading === "createPO" ? "创建中..." : "确认创建采购单"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isProjectManager || isDesigner || isFinance) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">角色专属操作</h3>
          <div className="space-y-4">
            {isProjectManager && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-700">
                    项目经理补充说明
                  </span>
                  {!showEditManagerNote && isLocked && (
                    <button
                      onClick={() => setShowEditManagerNote(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                  )}
                </div>
                {showEditManagerNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={managerNote}
                      onChange={(e) => setManagerNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-green-300 rounded-md text-sm bg-green-50"
                      placeholder="输入补充说明..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateNote("managerNote", managerNote)
                        }
                        disabled={loading === "managerNote"}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading === "managerNote" ? "保存中..." : "保存"}
                      </button>
                      <button
                        onClick={() => {
                          setShowEditManagerNote(false);
                          setManagerNote(currentManagerNote || "");
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                    {currentManagerNote || "暂无补充说明"}
                  </p>
                )}
              </div>
            )}

            {isDesigner && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-700">
                    设计师图纸说明
                  </span>
                  {!showEditDrawingNote && isLocked && (
                    <button
                      onClick={() => setShowEditDrawingNote(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                  )}
                </div>
                {showEditDrawingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={drawingNote}
                      onChange={(e) => setDrawingNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm bg-purple-50"
                      placeholder="输入图纸说明..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateNote("drawingNote", drawingNote)
                        }
                        disabled={loading === "drawingNote"}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading === "drawingNote" ? "保存中..." : "保存"}
                      </button>
                      <button
                        onClick={() => {
                          setShowEditDrawingNote(false);
                          setDrawingNote(currentDrawingNote || "");
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded">
                    {currentDrawingNote || "暂无图纸说明"}
                  </p>
                )}
              </div>
            )}

            {isFinance && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-orange-700">
                    财务付款节点/差价确认
                  </span>
                  {!showEditFinanceNote && isLocked && (
                    <button
                      onClick={() => setShowEditFinanceNote(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                  )}
                </div>
                {showEditFinanceNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={financeNote}
                      onChange={(e) => setFinanceNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm bg-orange-50"
                      placeholder="确认差价和付款节点..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateNote("financeNote", financeNote)
                        }
                        disabled={loading === "financeNote"}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                      >
                        {loading === "financeNote" ? "保存中..." : "确认"}
                      </button>
                      <button
                        onClick={() => {
                          setShowEditFinanceNote(false);
                          setFinanceNote(currentFinanceNote || "");
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded">
                    {currentFinanceNote || "暂无财务确认"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">附件留痕</h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            上传相关文件作为变更的附件留痕
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={uploadingFile}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50"
          />
          {uploadingFile && (
            <p className="text-sm text-blue-600">正在上传...</p>
          )}
        </div>
      </div>

      {isLocked && status === ChangeStatus.PENDING_CONFIRMATION && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            ⚠️ 当前状态：锁定（待业主确认）
          </p>
          <div className="text-xs text-yellow-700 space-y-1">
            {isProjectManager && <p>✓ 您可以添加项目经理补充说明</p>}
            {isDesigner && <p>✓ 您可以修改设计师图纸说明</p>}
            {isFinance && <p>✓ 您可以确认差价和付款节点</p>}
            <p className="text-gray-600 mt-2">
              当前版本：v{currentVersion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
