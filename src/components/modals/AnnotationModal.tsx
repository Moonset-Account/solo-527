"use client";

import { useState } from "react";
import { X, MessageSquarePlus } from "lucide-react";
import { ANNOTATION_TYPES } from "@/types";
import { useAppStore } from "@/store";

interface AnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultDeptId?: string;
}

export function AnnotationModal({
  isOpen,
  onClose,
  defaultDate,
  defaultDeptId,
}: AnnotationModalProps) {
  const addAnnotation = useAppStore((state) => state.addAnnotation);
  const [annotationType, setAnnotationType] = useState(ANNOTATION_TYPES[0].value);
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(defaultDate || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAnnotation({
      userId: "user-001",
      visitId: null,
      annotationType,
      description,
      metadata: {
        date: selectedDate,
        deptId: defaultDeptId,
      },
    });
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-semibold text-neutral-800">添加异常标注</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              标注日期
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              异常类型
            </label>
            <select
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              {ANNOTATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              标注说明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入异常情况说明..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors"
            >
              确认标注
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
