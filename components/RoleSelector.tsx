'use client'

import { Shield, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { UserPermission } from '@/lib/types'

interface RoleSelectorProps {
  currentRole: UserPermission['role']
  onChange: (role: UserPermission['role']) => void
}

const roles: { value: UserPermission['role']; label: string; description: string }[] = [
  { value: 'admin', label: '系统管理员', description: '查看全部数据、导出、敏感字段' },
  { value: 'dispatcher', label: '调度员', description: '查看明细、导出，无敏感字段' },
  { value: 'viewer', label: '访客', description: '仅查看聚合数据' },
]

export default function RoleSelector({ currentRole, onChange }: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = roles.find(r => r.value === currentRole)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Shield className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">{current?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {roles.map(role => (
            <button
              key={role.value}
              onClick={() => {
                onChange(role.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                currentRole === role.value ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  currentRole === role.value ? 'text-primary-700' : 'text-gray-800'
                }`}>
                  {role.label}
                </span>
                {currentRole === role.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{role.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
