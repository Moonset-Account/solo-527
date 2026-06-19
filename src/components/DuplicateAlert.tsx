import { Alert, Descriptions } from 'antd'
import type { Contract } from '../../shared/types'

interface DuplicateAlertProps {
  contract: Contract
}

export default function DuplicateAlert({ contract }: DuplicateAlertProps) {
  if (!contract.isDuplicate) return null

  return (
    <Alert
      type="error"
      message="检测到重复申请"
      showIcon
      className="mb-4"
      description={
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="影响对象">
            {contract.duplicateAffectedObjects || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="处理人">
            {contract.duplicateHandler || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="下一步计划">
            {contract.duplicateNextStep || '-'}
          </Descriptions.Item>
        </Descriptions>
      }
    />
  )
}
