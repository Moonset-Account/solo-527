import { useParams } from 'react-router-dom';
import ContractCreatePage from './ContractCreatePage';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ContractCreatePage mode="edit" contractId={id} />;
}
