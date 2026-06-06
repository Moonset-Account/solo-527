import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, Coffee } from 'lucide-react'
import { useFilterStore } from '@/store/useFilterStore'
import { CATEGORIES } from '@/data/mock/seedData'

export default function CategoryFilter() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const categories = useFilterStore(state => state.categories)
  const setCategories = useFilterStore(state => state.setCategories)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const toggleCategory = (id: string) => {
    if (categories.includes(id)) {
      setCategories(categories.filter(c => c !== id))
    } else {
      setCategories([...categories, id])
    }
  }
  
  const selectAll = () => {
    setCategories(CATEGORIES.map(c => c.id))
  }
  
  const clearAll = () => {
    setCategories([])
  }
  
  const displayText = categories.length === 0 
    ? '全部品类' 
    : categories.length === CATEGORIES.length 
      ? '全部品类' 
      : `已选 ${categories.length} 类`

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm ${
          categories.length > 0 
            ? 'border-coffee-300 bg-coffee-50 text-coffee-700' 
            : 'border-coffee-200 bg-white text-coffee-600 hover:border-coffee-300'
        }`}
      >
        <Coffee size={16} />
        <span className="font-medium">{displayText}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-coffee-100 z-50 overflow-hidden">
          <div className="p-3 border-b border-coffee-50 flex items-center justify-between">
            <span className="text-sm font-medium text-coffee-700">选择品类</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-coffee-600 hover:text-coffee-800">全选</button>
              <span className="text-coffee-200">|</span>
              <button onClick={clearAll} className="text-xs text-coffee-400 hover:text-coffee-600">清空</button>
            </div>
          </div>
          
          <div className="p-2">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-coffee-50 text-left text-sm transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  categories.includes(category.id) 
                    ? 'bg-coffee-700 border-coffee-700 text-white' 
                    : 'border-coffee-300'
                }`}>
                  {categories.includes(category.id) && <Check size={12} />}
                </div>
                <span className="text-coffee-700">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {categories.length > 0 && categories.length < CATEGORIES.length && (
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
