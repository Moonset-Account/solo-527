'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/components/useApi'
import useModal from '@/components/useModal'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ContractAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedAt: string
}

interface Contract {
  id: string
  contractNo: string
  apartment: { unitNumber: string; building: string }
  title: string
  startDate: string
  endDate: string
  rentAmount: number
  depositAmount: number
  status: string
  attachments: ContractAttachment[]
}

export default function ContractsPage() {
  const { request, loading } = useApi()
  const [contracts, setContracts] = useState<Contract[]>([])
  const detailModal = useModal()
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    const load = async () => {
      const data = await request<Contract[]>('/api/contracts')
      if (data) setContracts(data)
    }
    load()
  }, [request])

  const openDetail = (c: Contract) => {
    setSelectedContract(c)
    detailModal.open()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">合同附件</h1>
        <p className="text-gray-500 mt-1">查看租赁合同及附件</p>
      </div>

      {loading && contracts.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : contracts.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">暂无合同</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map(c => (
            <div
              key={c.id}
              className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openDetail(c)}
            >
              <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{c.title}</div>
                <div className="text-sm text-gray-500 mt-1">{c.apartment.building} {c.apartment.unitNumber}</div>
              </div>
              <span className="badge bg-blue-100 text-blue-700">{c.status}</span>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="text-gray-600">
                <span className="text-gray-400">合同号：</span>
                <span className="font-mono">{c.contractNo}</span>
              </div>
              <div className="text-gray-600">
                <span className="text-gray-400">租期：</span>
                {formatDate(c.startDate)} ~ {formatDate(c.endDate)}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
              <div className="text-xs text-gray-500">月租金</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(c.rentAmount)}</div>
            </div>
              <div className="text-right">
              <div className="text-xs text-gray-500">附件</div>
              <div className="text-lg font-bold text-gray-900">{c.attachments.length} 份</div>
            </div>
            </div>
          </div>
        ))}
        </div>
      )}

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.close} title="合同详情" size="lg">
        {selectedContract && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">合同编号</div>
                <div className="font-mono text-sm mt-1">{selectedContract.contractNo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">合同状态</div>
                <div className="mt-1">
                  <span className="badge bg-blue-100 text-blue-700">{selectedContract.status}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">房间</div>
                <div className="text-sm mt-1">{selectedContract.apartment.building} {selectedContract.apartment.unitNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">租期</div>
                <div className="text-sm mt-1">{formatDate(selectedContract.startDate)} ~ {formatDate(selectedContract.endDate)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">月租金</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedContract.rentAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">押金</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedContract.depositAmount)}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">附件列表</h3>
              {selectedContract.attachments.length === 0 ? (
                <div className="text-sm text-gray-500">暂无附件</div>
              ) : (
                <div className="space-y-2">
                  {selectedContract.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📎</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{att.fileName}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(att.fileSize)} · {formatDate(att.uploadedAt)}</div>
                        </div>
                      </div>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        onClick={e => e.stopPropagation()}
                      >
                        查看
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button className="btn btn-secondary" onClick={detailModal.close}>关闭</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
