'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizeClassMap: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }
  const sizeClass = sizeClassMap[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
