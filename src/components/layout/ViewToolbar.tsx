import { useState, useRef, useEffect } from 'react'
import { Save, FolderOpen, Download, RefreshCw, Trash2, FileText, FileSpreadsheet } from 'lucide-react'
import { useViewStore } from '@/store/useViewStore'
import { useDataStore } from '@/store/useDataStore'
import { useFilterStore } from '@/store/useFilterStore'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export default function ViewToolbar() {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showViewList, setShowViewList] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [viewName, setViewName] = useState('')
  
  const viewListRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  
  const savedViews = useViewStore(state => state.savedViews)
  const currentViewName = useViewStore(state => state.getCurrentViewName())
  const saveView = useViewStore(state => state.saveView)
  const loadView = useViewStore(state => state.loadView)
  const deleteView = useViewStore(state => state.deleteView)
  const refreshData = useDataStore(state => state.refreshData)
  const filteredData = useDataStore(state => state.filteredData)
  const kpiData = useDataStore(state => state.kpiData)
  const filters = useFilterStore(state => state)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewListRef.current && !viewListRef.current.contains(e.target as Node)) {
        setShowViewList(false)
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSaveView = () => {
    if (viewName.trim()) {
      saveView(viewName.trim())
      setViewName('')
      setShowSaveModal(false)
    }
  }
  
  const handleExportPDF = async () => {
    const dashboard = document.getElementById('dashboard-content')
    if (!dashboard) return
    
    try {
      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F9F5ED',
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      
      pdf.setFontSize(10)
      pdf.setTextColor(107, 78, 55)
      pdf.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 10, pdfHeight - 10)
      if (currentViewName) {
        pdf.text(`视图: ${currentViewName}`, 10, pdfHeight - 5)
      }
      
      pdf.save(`销售分析报告_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error('PDF导出失败:', e)
    }
    
    setShowExportMenu(false)
  }
  
  const handleExportExcel = () => {
    const filterSummary = [
      { '筛选条件': '时间范围', '值': `${filters.timeRange.start} ~ ${filters.timeRange.end}` },
      { '筛选条件': '时间粒度', '值': filters.timeWindow === 'day' ? '日' : filters.timeWindow === 'week' ? '周' : '月' },
      { '筛选条件': '门店数量', '值': filters.storeIds.length === 0 ? '全部' : `${filters.storeIds.length} 家` },
      { '筛选条件': '品类', '值': filters.categories.length === 0 ? '全部' : `${filters.categories.length} 类` },
      { '筛选条件': '天气类型', '值': filters.weatherTypes.length === 0 ? '全部' : `${filters.weatherTypes.length} 种` },
      { '筛选条件': '活动批次', '值': filters.campaignId || '全部' },
    ]
    
    const overview = kpiData ? [
      { '指标': '总销售额', '值': kpiData.totalSales, '环比': kpiData.salesWoW },
      { '指标': '客单价', '值': kpiData.avgOrderValue, '环比': kpiData.aovWoW },
      { '指标': '总订单数', '值': kpiData.totalOrders, '环比': kpiData.ordersWoW },
      { '指标': '库存损耗率', '值': kpiData.inventoryLossRate, '环比': kpiData.lossRateWoW },
      { '指标': '样本量', '值': kpiData.sampleSize, '环比': null },
    ] : []
    
    const detailData = filteredData.map(item => ({
      '日期': item.date,
      '门店': item.storeName,
      '销售额': item.salesAmount,
      '订单数': item.orderCount,
      '客单价': item.avgOrderValue,
      '库存损耗': item.inventoryLoss,
      '损耗率': item.inventoryLossRate,
      '天气类型': item.weatherType,
      '温度': item.temperature,
      '是否节假日': item.isHoliday ? '是' : '否',
      '活动ID': item.campaignId || '',
    }))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filterSummary), '筛选条件')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), '指标概览')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailData), '明细数据')
    
    XLSX.writeFile(wb, `销售数据_${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowExportMenu(false)
  }

  return (
    <div className="flex items-center gap-2">
      {currentViewName && (
        <div className="px-3 py-1.5 bg-coffee-100 text-coffee-700 rounded-lg text-sm font-medium">
          📋 {currentViewName}
        </div>
      )}
      
      <button
        onClick={refreshData}
        className="p-2 text-coffee-500 hover:text-coffee-700 hover:bg-coffee-100 rounded-lg transition-colors"
        title="刷新数据"
      >
        <RefreshCw size={18} />
      </button>
      
      <div className="relative" ref={viewListRef}>
        <button
          onClick={() => setShowViewList(!showViewList)}
          className="flex items-center gap-1.5 px-3 py-2 text-coffee-600 hover:bg-coffee-100 rounded-lg transition-colors text-sm"
        >
          <FolderOpen size={16} />
          视图
        </button>
        
        {showViewList && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-coffee-100 z-50 overflow-hidden">
            <div className="p-3 border-b border-coffee-50">
              <div className="text-sm font-medium text-coffee-700">已保存视图</div>
            </div>
            
            {savedViews.length === 0 ? (
              <div className="p-4 text-center text-sm text-coffee-400">
                暂无保存的视图
              </div>
            ) : (
              <div className="max-h-64 overflow-auto">
                {savedViews.map(view => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-coffee-50 group"
                  >
                    <button
                      onClick={() => { loadView(view.id); setShowViewList(false) }}
                      className="flex-1 text-left text-sm text-coffee-700"
                    >
                      {view.name}
                    </button>
                    <button
                      onClick={() => deleteView(view.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-2 border-t border-coffee-50">
              <button
                onClick={() => { setShowSaveModal(true); setShowViewList(false) }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-coffee-700 text-white rounded-lg text-sm hover:bg-coffee-800 transition-colors"
              >
                <Save size={14} />
                保存当前视图
              </button>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={() => setShowSaveModal(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-coffee-600 hover:bg-coffee-100 rounded-lg transition-colors text-sm"
      >
        <Save size={16} />
        保存
      </button>
      
      <div className="relative" ref={exportMenuRef}>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1.5 px-4 py-2 bg-coffee-700 text-white rounded-lg hover:bg-coffee-800 transition-colors text-sm"
        >
          <Download size={16} />
          导出
        </button>
        
        {showExportMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-coffee-100 z-50 overflow-hidden">
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-coffee-50 text-left transition-colors"
            >
              <FileText size={18} className="text-coffee-600" />
              <div>
                <div className="text-sm font-medium text-coffee-700">导出 PDF</div>
                <div className="text-xs text-coffee-400">包含图表的完整报告</div>
              </div>
            </button>
            <button
              onClick={handleExportExcel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-coffee-50 text-left transition-colors border-t border-coffee-50"
            >
              <FileSpreadsheet size={18} className="text-green-600" />
              <div>
                <div className="text-sm font-medium text-coffee-700">导出 Excel</div>
                <div className="text-xs text-coffee-400">可追溯的明细数据</div>
              </div>
            </button>
          </div>
        )}
      </div>
      
      {showSaveModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-5 border-b border-coffee-100">
              <h3 className="text-lg font-semibold text-coffee-800 font-serif">保存视图</h3>
              <p className="text-sm text-coffee-500 mt-1">保存当前筛选条件，方便快速切换</p>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                视图名称
              </label>
              <input
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="例如：本月门店周报"
                className="w-full px-4 py-2.5 rounded-lg border border-coffee-200 text-coffee-700 focus:outline-none focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100"
                autoFocus
              />
            </div>
            
            <div className="p-4 bg-coffee-50 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-coffee-600 hover:bg-white rounded-lg transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSaveView}
                disabled={!viewName.trim()}
                className="px-4 py-2 bg-coffee-700 text-white rounded-lg hover:bg-coffee-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认保存
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
