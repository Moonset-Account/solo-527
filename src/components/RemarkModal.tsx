import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remark: string) => void | Promise<void>;
  title?: string;
  placeholder?: string;
  confirmText?: string;
  loading?: boolean;
}

export function RemarkModal({
  isOpen,
  onClose,
  onConfirm,
  title = "请输入备注",
  placeholder = "请输入操作备注，说明修改原因...",
  confirmText = "确认提交",
  loading = false,
}: RemarkModalProps) {
  const [remark, setRemark] = useState("");

  const handleConfirm = async () => {
    if (!remark.trim()) return;
    await onConfirm(remark.trim());
    setRemark("");
  };

  const handleClose = () => {
    setRemark("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      showConfirm={false}
      showCancel={false}
      footer={
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-card-border">
          <Button variant="outline" size="sm" onClick={handleClose}>
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!remark.trim()}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          <span className="text-danger">*</span> 备注为必填项，请详细说明操作原因
        </p>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder={placeholder}
          className="w-full h-32 px-4 py-3 border border-card-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground placeholder:text-muted/50"
          autoFocus
        />
        <div className="flex items-center justify-between text-xs text-muted">
          <span>请输入至少 1 个字符</span>
          <span>{remark.length} 字</span>
        </div>
      </div>
    </Modal>
  );
}
