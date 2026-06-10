import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  variant?: 'danger' | 'primary'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  variant = 'primary',
}: ConfirmDialogProps) {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-outline">
          取消
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={btnClass}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
