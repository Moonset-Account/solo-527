import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { applicationApi, reagentApi } from '@/api';
import { useAppStore } from '@/store';
import { Reagent } from '@/types';
import { formatDate } from '@/utils';

interface FormData {
  reagentId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  purpose: string;
  safetyMeasures: string;
  remark: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ApplicationNew() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = useAppStore((state) => state.user);
  const [loading, setLoading] = React.useState(false);
  const [reagentsLoading, setReagentsLoading] = React.useState(false);
  const [reagents, setReagents] = React.useState<Reagent[]>([]);
  const [filteredReagents, setFilteredReagents] = React.useState<Reagent[]>([]);
  const [selectedReagent, setSelectedReagent] = React.useState<Reagent | null>(null);
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [formData, setFormData] = React.useState<FormData>({
    reagentId: '',
    quantity: 1,
    startDate: formatDate(new Date(), 'yyyy-MM-dd'),
    endDate: formatDate(new Date(), 'yyyy-MM-dd'),
    purpose: '',
    safetyMeasures: '',
    remark: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});

  React.useEffect(() => {
    fetchReagents();
  }, []);

  React.useEffect(() => {
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      setFilteredReagents(
        reagents.filter(
          (r) =>
            r.name.toLowerCase().includes(kw) ||
            r.casNo.toLowerCase().includes(kw) ||
            r.batchNo.toLowerCase().includes(kw)
        )
      );
    } else {
      setFilteredReagents(reagents);
    }
  }, [searchKeyword, reagents]);

  React.useEffect(() => {
    if (formData.reagentId) {
      const reagent = reagents.find((r) => r.id === formData.reagentId);
      setSelectedReagent(reagent || null);
    } else {
      setSelectedReagent(null);
    }
  }, [formData.reagentId, reagents]);

  const fetchReagents = async () => {
    setReagentsLoading(true);
    try {
      const result = await reagentApi.getList({ page: 1, size: 100 });
      setReagents(result.content);
      setFilteredReagents(result.content);
    } catch (error) {
      console.error('Failed to fetch reagents:', error);
      showToast({ type: 'error', message: '获取试剂列表失败' });
    } finally {
      setReagentsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.reagentId) newErrors.reagentId = '请选择试剂';
    if (selectedReagent && formData.quantity > (selectedReagent.totalQuantity - selectedReagent.usedQuantity)) {
      newErrors.quantity = `库存不足，当前可用库存为 ${selectedReagent.totalQuantity - selectedReagent.usedQuantity} ${selectedReagent.unit}`;
    }
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = '请输入有效的数量';
    if (!formData.startDate) newErrors.startDate = '请选择开始日期';
    if (!formData.endDate) newErrors.endDate = '请选择结束日期';
    else if (formData.endDate < formData.startDate) newErrors.endDate = '结束日期不能早于开始日期';
    if (!formData.purpose.trim()) newErrors.purpose = '请填写使用目的';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (selectedReagent) {
      const available = selectedReagent.totalQuantity - selectedReagent.usedQuantity;
      if (formData.quantity > available) {
        showToast({ type: 'error', message: `库存不足，当前可用库存为 ${available} ${selectedReagent.unit}` });
        return;
      }
    }

    setLoading(true);
    try {
      await applicationApi.create({
        reagentId: formData.reagentId,
        reagentName: selectedReagent?.name,
        quantity: formData.quantity,
        purpose: formData.purpose,
        experimentName: formData.purpose,
        scheduledDate: formData.startDate,
        applicantId: user?.id,
        applicantName: user?.name,
      });
      showToast({ type: 'success', message: '申请提交成功' });
      navigate('/application');
    } catch (error) {
      console.error('Failed to create application:', error);
      showToast({ type: 'error', message: '申请提交失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const reagentOptions = filteredReagents.map((r) => ({
    value: r.id,
    label: `${r.name} - ${r.specification}`,
  }));

  const availableStock = selectedReagent
    ? selectedReagent.totalQuantity - selectedReagent.usedQuantity
    : 0;

  if (reagentsLoading) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate('/application')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">新建领用申请</h1>
        <p className="mt-1 text-sm text-neutral-500">填写试剂领用申请信息</p>
      </div>

      <Card>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  试剂选择 <span className="text-danger-500">*</span>
                </label>
                <Input
                  placeholder="搜索试剂名称、CAS号、批号"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  prefix={<Search className="w-4 h-4 text-neutral-400" />}
                  className="mb-3"
                />
                <Select
                  options={reagentOptions}
                  value={formData.reagentId}
                  onChange={(v) => handleInputChange('reagentId', String(v))}
                  placeholder="请选择试剂"
                />
                {errors.reagentId && <p className="mt-1 text-sm text-danger-500">{errors.reagentId}</p>}
              </div>

              {selectedReagent && (
                <div className="md:col-span-2 p-4 bg-neutral-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-neutral-500">试剂名称</p>
                      <p className="text-sm font-medium text-neutral-900">{selectedReagent.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">规格</p>
                      <p className="text-sm font-medium text-neutral-900">{selectedReagent.specification}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">总库存</p>
                      <p className="text-sm font-medium text-neutral-900">
                        {selectedReagent.totalQuantity} {selectedReagent.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">可用库存</p>
                      <p className={`text-sm font-medium ${availableStock <= 0 ? 'text-danger-500' : availableStock < 5 ? 'text-warning-500' : 'text-success-600'}`}>
                        {availableStock} {selectedReagent.unit}
                      </p>
                    </div>
                  </div>
                  {selectedReagent.hazardLabels.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">危化标签</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedReagent.hazardLabels.map((label) => (
                          <Badge key={label.id} variant="danger">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  领用数量 <span className="text-danger-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  error={errors.quantity}
                  suffix={selectedReagent?.unit || '单位'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  使用开始日期 <span className="text-danger-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  error={errors.startDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  使用结束日期 <span className="text-danger-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  error={errors.endDate}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  使用目的 <span className="text-danger-500">*</span>
                </label>
                <Textarea
                  placeholder="请详细描述使用目的和实验名称"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  error={errors.purpose}
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  安全措施
                </label>
                <Textarea
                  placeholder="请描述将采取的安全防护措施"
                  value={formData.safetyMeasures}
                  onChange={(e) => handleInputChange('safetyMeasures', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  备注
                </label>
                <Textarea
                  placeholder="其他需要说明的事项"
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/application')}
              >
                取消
              </Button>
              <Button type="submit" loading={loading}>
                提交申请
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
