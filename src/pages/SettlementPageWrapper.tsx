import { useParams } from 'react-router-dom'
import SettlementPage from '@/components/settlement/SettlementPage'

export default function SettlementPageWrapper() {
  const { chapterId } = useParams<{ chapterId: string }>()

  return <SettlementPage />
}
