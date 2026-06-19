import { useEffect, useState } from 'react'
import { Card, Select, Row, Col, Statistic, Spin } from 'antd'
import { FileQuestion, FileCheck, FileWarning, FileText } from 'lucide-react'
import { useContractStore } from '@/stores/contractStore'
import { useMaterialStore } from '@/stores/materialStore'
import MaterialTable from '@/components/MaterialTable'

export default function Materials() {
  const { contracts, fetchContracts } = useContractStore()
  const { materials, fetchMaterials, updateMaterialStatus, batchRemind } = useMaterialStore()
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  useEffect(() => {
    if (selectedContractId) {
      fetchMaterials(selectedContractId)
    }
  }, [selectedContractId, fetchMaterials])

  const missingCount = materials.filter((m) => m.status === 'MISSING').length
  const submittedCount = materials.filter((m) => m.status === 'SUBMITTED').length
  const supplementingCount = materials.filter((m) => m.status === 'SUPPLEMENTING').length

  return (
    <div>
      <div className="mb-4">
        <Select
          placeholder="选择合同"
          value={selectedContractId}
          onChange={setSelectedContractId}
          options={contracts.map((c) => ({ value: c.id, label: `${c.contractNo} - ${c.title}` }))}
          style={{ width: 360 }}
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm" style={{ borderRadius: 8 }}>
            <Statistic title="材料总数" value={materials.length} prefix={<FileText size={18} className="text-slate-500" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm" style={{ borderRadius: 8 }}>
            <Statistic title="缺失" value={missingCount} prefix={<FileQuestion size={18} className="text-red-500" />} valueStyle={{ color: '#EF4444' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm" style={{ borderRadius: 8 }}>
            <Statistic title="已提交" value={submittedCount} prefix={<FileCheck size={18} className="text-emerald-500" />} valueStyle={{ color: '#10B981' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm" style={{ borderRadius: 8 }}>
            <Statistic title="补齐中" value={supplementingCount} prefix={<FileWarning size={18} className="text-amber-500" />} valueStyle={{ color: '#F59E0B' }} />
          </Card>
        </Col>
      </Row>

      <Card title="材料列表" className="shadow-sm" style={{ borderRadius: 8 }}>
        {selectedContractId ? (
          <MaterialTable
            materials={materials}
            onStatusChange={updateMaterialStatus}
            onBatchRemind={batchRemind}
          />
        ) : (
          <div className="text-slate-400 text-sm text-center py-12">请先选择合同</div>
        )}
      </Card>
    </div>
  )
}
