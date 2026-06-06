import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, CloudSun } from 'lucide-react'
import { useFilterStore } from '@/store/useFilterStore'
import { WEATHER_TYPES } from '@/data/mock/seedData'
import type { WeatherType } from '@/types/data'

export default function WeatherFilter() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const weatherTypes = useFilterStore(state => state.weatherTypes)
  const setWeatherTypes = useFilterStore(state => state.setWeatherTypes)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const toggleWeather = (type: WeatherType) => {
    if (weatherTypes.includes(type)) {
      setWeatherTypes(weatherTypes.filter(w => w !== type))
    } else {
      setWeatherTypes([...weatherTypes, type])
    }
  }
  
  const clearAll = () => {
    setWeatherTypes([])
  }
  
  const displayText = weatherTypes.length === 0 
    ? '全部天气' 
    : `已选 ${weatherTypes.length} 种`

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm ${
          weatherTypes.length > 0 
            ? 'border-coffee-300 bg-coffee-50 text-coffee-700' 
            : 'border-coffee-200 bg-white text-coffee-600 hover:border-coffee-300'
        }`}
      >
        <CloudSun size={16} />
        <span className="font-medium">{displayText}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-coffee-100 z-50 overflow-hidden">
          <div className="p-3 border-b border-coffee-50 flex items-center justify-between">
            <span className="text-sm font-medium text-coffee-700">选择天气</span>
            {weatherTypes.length > 0 && (
              <button onClick={clearAll} className="text-xs text-coffee-400 hover:text-coffee-600">清空</button>
            )}
          </div>
          
          <div className="p-2">
            {WEATHER_TYPES.map(weather => (
              <button
                key={weather.type}
                onClick={() => toggleWeather(weather.type)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-coffee-50 text-left text-sm transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  weatherTypes.includes(weather.type) 
                    ? 'bg-coffee-700 border-coffee-700 text-white' 
                    : 'border-coffee-300'
                }`}>
                  {weatherTypes.includes(weather.type) && <Check size={12} />}
                </div>
                <span className="text-lg">{weather.icon}</span>
                <span className="text-coffee-700">{weather.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {weatherTypes.length > 0 && (
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
