import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, Store } from 'lucide-react'
import { useFilterStore } from '@/store/useFilterStore'
import { STORES } from '@/data/mock/seedData'

export default function StoreFilter() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const storeIds = useFilterStore(state => state.storeIds)
  const setStoreIds = useFilterStore(state => state.setStoreIds)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const toggleStore = (id: string) => {
    if (storeIds.includes(id)) {
      setStoreIds(storeIds.filter(s => s !== id))
    } else {
      setStoreIds([...storeIds, id])
    }
  }
  
  const selectAll = () => {
    setStoreIds(STORES.map(s => s.id))
  }
  
  const clearAll = () => {
    setStoreIds([])
  }
  
  const displayText = storeIds.length === 0 
    ? '全部门店' 
    : storeIds.length === STORES.length 
      ? '全部门店' 
      : `已选 ${storeIds.length} 家`

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm ${
          storeIds.length > 0 
            ? 'border-coffee-300 bg-coffee-50 text-coffee-700' 
            : 'border-coffee-200 bg-white text-coffee-600 hover:border-coffee-300'
        }`}
      >
        <Store size={16} />
        <span className="font-medium">{displayText}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-coffee-100 z-50 overflow-hidden">
          <div className="p-3 border-b border-coffee-50 flex items-center justify-between">
            <span className="text-sm font-medium text-coffee-700">选择门店</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-coffee-600 hover:text-coffee-800">全选</button>
              <span className="text-coffee-200">|</span>
              <button onClick={clearAll} className="text-xs text-coffee-400 hover:text-coffee-600">清空</button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-auto p-2">
            {STORES.map(store => (
              <button
                key={store.id}
                onClick={() => toggleStore(store.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-coffee-50 text-left text-sm transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  storeIds.includes(store.id) 
                    ? 'bg-coffee-700 border-coffee-700 text-white' 
                    : 'border-coffee-300'
                }`}>
                  {storeIds.includes(store.id) && <Check size={12} />}
                </div>
                <div className="flex-1">
                  <div className="text-coffee-700 font-medium">{store.name}</div>
                  <div className="text-xs text-coffee-400">{store.district}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {storeIds.length > 0 && storeIds.length < STORES.length && (
        <button
          onClick={clearAll}
          className="absolute -top-1 -right-1 w-4 h-4 bg-coffee-600 text-white rounded-full flex items-center justify-center"
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}
