import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, Tag, Calendar } from 'lucide-react'
import { useFilterStore } from '@/store/useFilterStore'
import { CAMPAIGNS } from '@/data/mock/seedData'

export default function CampaignFilter() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const campaignId = useFilterStore(state => state.campaignId)
  const setCampaignId = useFilterStore(state => state.setCampaignId)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const selectedCampaign = CAMPAIGNS.find(c => c.id === campaignId)
  
  const displayText = selectedCampaign ? selectedCampaign.name : '全部活动'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm ${
          campaignId 
            ? 'border-amber-300 bg-amber-50 text-amber-700' 
            : 'border-coffee-200 bg-white text-coffee-600 hover:border-coffee-300'
        }`}
      >
        <Tag size={16} />
        <span className="font-medium truncate max-w-32">{displayText}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-coffee-100 z-50 overflow-hidden">
          <div className="p-3 border-b border-coffee-50">
            <span className="text-sm font-medium text-coffee-700">选择活动批次</span>
          </div>
          
          <div className="p-2">
            <button
              onClick={() => { setCampaignId(null); setIsOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-coffee-50 text-left text-sm transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                !campaignId ? 'bg-coffee-700 border-coffee-700 text-white' : 'border-coffee-300'
              }`}>
                {!campaignId && <Check size={12} />}
              </div>
              <span className="text-coffee-700">全部活动</span>
            </button>
            
            {CAMPAIGNS.map(campaign => (
              <button
                key={campaign.id}
                onClick={() => { setCampaignId(campaign.id); setIsOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-coffee-50 text-left text-sm transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  campaignId === campaign.id 
                    ? 'bg-coffee-700 border-coffee-700 text-white' 
                    : 'border-coffee-300'
                }`}>
                  {campaignId === campaign.id && <Check size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-coffee-700 font-medium truncate">{campaign.name}</div>
                  <div className="text-xs text-coffee-400 flex items-center gap-1">
                    <Calendar size={10} />
                    {campaign.startDate} ~ {campaign.endDate}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {campaignId && (
        <button
          onClick={() => setCampaignId(null)}
          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center"
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}
