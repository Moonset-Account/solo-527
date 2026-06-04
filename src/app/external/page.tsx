"use client";

import { useState } from "react";
import { ReservationForm } from "@/components/ReservationForm";
import { useToast } from "@/components/Toast";

export default function ExternalPage() {
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">作业预约</h1>
          <p className="text-gray-500 mt-1">
            提交农机作业预约申请，等待管理员审批
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "收起表单" : "新建预约"}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">提交作业预约</h2>
          <ReservationForm
            onSuccess={() => {
              setShowForm(false);
              showToast("预约提交成功", "success");
            }}
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">待审批预约</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">已完成作业</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-gray-900">¥0.00</div>
          <div className="text-sm text-gray-500">累计收益</div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">操作说明</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            1. 点击「新建预约」按钮，填写作业地块、类型、日期等信息
          </p>
          <p>2. 提交后等待管理员审批，可在「我的预约」中查看状态</p>
          <p>3. 审批通过后，农机将按预约时间前往作业</p>
          <p>4. 作业完成后进行收益结算</p>
          <p className="text-orange-600">
            注意：如遇雨天等恶劣天气，预约可能会被批量改期，请留意通知
          </p>
        </div>
      </div>
    </div>
  );
}
