import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}

export default function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
