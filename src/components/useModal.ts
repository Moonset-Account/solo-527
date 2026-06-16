'use client'

import { useCallback, useState } from 'react'

export default function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<unknown>(null)

  const open = useCallback((d?: unknown) => {
    if (d !== undefined) setData(d)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  return { isOpen, open, close, data, setData }
}
