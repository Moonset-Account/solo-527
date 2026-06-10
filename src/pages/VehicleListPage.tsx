import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { vehicles, appointments } from '@/data/mockData'
import {
  Search,
  Car,
  User,
  Tag,
  Calendar,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
} from 'lucide-react'

export default function VehicleListPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterBrand, setFilterBrand] = useState('')

  const allBrands = useMemo(() => {
    const brands = new Set(vehicles.map((v) => v.brand))
    return Array.from(brands)
  }, [])

  const getLastServiceTime = (vehicleId: string) => {
    const vehicleAppts = appointments.filter(
      (a) => a.vehicleId === vehicleId && a.status === '已完成'
    )
    if (vehicleAppts.length === 0) return null
    return vehicleAppts.sort(
      (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    )[0]
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      if (filterBrand && vehicle.brand !== filterBrand) return false
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        vehicle.plateNumber.toLowerCase().includes(query) ||
        vehicle.brand.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.customer?.name.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, filterBrand])

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const tagColors = [
    'bg-primary-100 text-primary-700',
    'bg-accent-100 text-accent-700',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
  ]

  const VehicleCard = ({ vehicle }: { vehicle: typeof vehicles[0] }) => {
    const lastAppt = getLastServiceTime(vehicle.id)
    const tags = vehicle.tags ? vehicle.tags.split(',').filter(Boolean) : []

    return (
      <div
        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
        className="card-hover cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-deep-600 flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
        </div>
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {vehicle.plateNumber}
          </h3>
          <p className="text-sm text-gray-500">
            {vehicle.brand} {vehicle.model}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: getColorHex(vehicle.color) }}
            />
            <span>{vehicle.color}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-primary-500" />
            <span>{vehicle.customer?.name}</span>
            <span className="text-gray-400 text-xs">
              {vehicle.customer?.phone}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-accent-500" />
            <span>
              上次服务：{lastAppt ? formatDate(lastAppt.appointmentDate) : '暂无记录'}
            </span>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  tagColors[index % tagColors.length]
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const VehicleListItem = ({ vehicle }: { vehicle: typeof vehicles[0] }) => {
    const lastAppt = getLastServiceTime(vehicle.id)
    const tags = vehicle.tags ? vehicle.tags.split(',').filter(Boolean) : []

    return (
      <div
        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
        className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-deep-600 flex items-center justify-center flex-shrink-0">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">{vehicle.plateNumber}</h3>
            <span className="text-sm text-gray-500">
              {vehicle.brand} {vehicle.model}
            </span>
            <div
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: getColorHex(vehicle.color) }}
              title={vehicle.color}
            />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {vehicle.customer?.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {lastAppt ? formatDate(lastAppt.appointmentDate) : '暂无记录'}
            </span>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-shrink-0">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  tagColors[index % tagColors.length]
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
      </div>
    )
  }

  return (
    <AdminLayout title="车辆档案">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索车牌、品牌、车主..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="input-field text-sm py-2 w-32"
              >
                <option value="">全部品牌</option>
                {allBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Tag className="w-4 h-4" />
          <span>
            共 <span className="font-semibold text-primary-600">{filteredVehicles.length}</span>{' '}
            辆车
          </span>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVehicles.map((vehicle) => (
              <VehicleListItem key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        {filteredVehicles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Car className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">未找到匹配的车辆</p>
            <p className="text-sm mt-1">试试其他搜索条件或筛选条件</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    黑色: '#1f2937',
    白色: '#f9fafb',
    银色: '#9ca3af',
    红色: '#ef4444',
    灰色: '#6b7280',
    蓝色: '#3b82f6',
  }
  return colorMap[color] || '#6b7280'
}
