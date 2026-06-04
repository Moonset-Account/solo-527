"use client";

import { useState, useEffect } from "react";
import { MACHINERY_TYPE_LABELS, MachineryType } from "@/lib/types";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";

interface Field {
  id: number;
  village: string;
  location: string;
  area: number;
  cropType: string;
  ownerName: string;
}

interface ReservationFormProps {
  onSuccess?: () => void;
}

export function ReservationForm({ onSuccess }: ReservationFormProps) {
  const [fieldId, setFieldId] = useState<number>(0);
  const [operationType, setOperationType] = useState<MachineryType>(
    MachineryType.HARVESTER
  );
  const [scheduledDate, setScheduledDate] = useState("");
  const [area, setArea] = useState("");
  const [pricePerMu, setPricePerMu] = useState("80");
  const [village, setVillage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [remarks, setRemarks] = useState("");
  const [fields, setFields] = useState<Field[]>([]);

  const { post, get, loading } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    const result = await get("/api/fields?pageSize=100");
    if (result.success && result.data) {
      setFields(result.data as Field[]);
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    setFieldId(id);
    const field = fields.find((f) => f.id === id);
    if (field) {
      setVillage(field.village);
      setContactName(field.ownerName);
      setArea(String(field.area));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalAmount = parseFloat(area) * parseFloat(pricePerMu);
    const result = await post("/api/reservations", {
      fieldId,
      operationType,
      scheduledDate,
      area: parseFloat(area),
      pricePerMu: parseFloat(pricePerMu),
      village,
      contactName,
      contactPhone,
      remarks: remarks || undefined,
    });

    if (result.success) {
      showToast("预约提交成功，等待审批", "success");
      setFieldId(0);
      setScheduledDate("");
      setArea("");
      setContactName("");
      setContactPhone("");
      setRemarks("");
      onSuccess?.();
    } else {
      showToast(result.error || "提交失败", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作业地块 <span className="text-red-500">*</span>
          </label>
          <select
            className="input"
            value={fieldId}
            onChange={handleFieldChange}
            required
          >
            <option value={0}>请选择作业地块</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.village} - {field.location} ({field.area}亩)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作业类型 <span className="text-red-500">*</span>
          </label>
          <select
            className="input"
            value={operationType}
            onChange={(e) => setOperationType(e.target.value as MachineryType)}
            required
          >
            {Object.entries(MACHINERY_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作业日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="input"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作业面积(亩) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="请输入作业面积"
            required
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            单价(元/亩) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={pricePerMu}
            onChange={(e) => setPricePerMu(e.target.value)}
            placeholder="请输入单价"
            required
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            所属村庄 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="input"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="请输入所属村庄"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            联系人 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="input"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="请输入联系人姓名"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            联系电话 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            className="input"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="请输入联系电话"
            required
            minLength={11}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          备注
        </label>
        <textarea
          className="input"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="请输入备注信息（可选）"
        />
      </div>

      {area && pricePerMu && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            预计总金额：
            <span className="text-xl font-bold">
              ¥{(parseFloat(area) * parseFloat(pricePerMu)).toFixed(2)}
            </span>
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setFieldId(0);
            setScheduledDate("");
            setArea("");
            setContactName("");
            setContactPhone("");
            setRemarks("");
          }}
        >
          重置
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "提交中..." : "提交预约"}
        </button>
      </div>
    </form>
  );
}
