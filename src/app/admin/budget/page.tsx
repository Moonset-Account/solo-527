'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { getBudgetWithExpenses, mockSiteSettings } from '@/lib/mock/data';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { BudgetCategory } from '@/lib/types';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState(getBudgetWithExpenses());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    allocated_amount: '',
    description: '',
  });

  const totalBudget = mockSiteSettings.find(s => s.key === 'project_budget')?.value || 750000;
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.expenses?.reduce((s, e) => s + e.amount, 0) || 0), 0);
  const remaining = totalBudget - totalAllocated;

  const handleOpenModal = (budget?: BudgetCategory) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        name: budget.name,
        allocated_amount: budget.allocated_amount.toString(),
        description: budget.description || '',
      });
    } else {
      setEditingBudget(null);
      setFormData({ name: '', allocated_amount: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.allocated_amount) return;

    const newBudget: BudgetCategory = {
      id: editingBudget?.id || `budget-${Date.now()}`,
      name: formData.name,
      allocated_amount: parseFloat(formData.allocated_amount),
      description: formData.description || null,
      created_at: editingBudget?.created_at || new Date().toISOString(),
    };

    if (editingBudget) {
      setBudgets(budgets.map(b => b.id === editingBudget.id ? newBudget : b));
    } else {
      setBudgets([...budgets, newBudget]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个预算科目吗？')) {
      setBudgets(budgets.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">预算管理</h1>
          <p className="text-gray-500">管理项目预算科目和支出追踪</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          新增预算科目
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">年度总预算</p>
            <p className="text-3xl font-bold text-gray-900 font-serif">{formatCurrency(totalBudget)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">已分配预算</p>
            <p className="text-3xl font-bold text-blue-600 font-serif">{formatCurrency(totalAllocated)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">已支出</p>
            <p className="text-3xl font-bold text-orange-600 font-serif">{formatCurrency(totalSpent)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 mb-1">未分配</p>
            <p className="text-3xl font-bold text-green-600 font-serif">{formatCurrency(remaining)}</p>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        {budgets.map((budget) => {
          const spent = budget.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
          const percentage = budget.allocated_amount > 0 ? Math.round((spent / budget.allocated_amount) * 100) : 0;

          return (
            <Card key={budget.id}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold text-gray-900 font-serif">{budget.name}</h3>
                  <span className="text-gray-500">
                    预算: {formatCurrency(budget.allocated_amount)}
                  </span>
                  <span className={`text-sm font-medium ${percentage >= 90 ? 'text-red-600' : percentage >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                    执行率: {percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleOpenModal(budget)} />
                  <Button variant="ghost" size="sm" icon={Trash2} className="text-red-500 hover:text-red-600" onClick={() => handleDelete(budget.id)} />
                </div>
              </CardHeader>
              <CardBody>
                {budget.description && (
                  <p className="text-gray-600 mb-4">{budget.description}</p>
                )}

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-gray-500">已支出: {formatCurrency(spent)}</span>
                  <span className="text-gray-500">剩余: {formatCurrency(budget.allocated_amount - spent)}</span>
                </div>

                {budget.expenses && budget.expenses.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">支出明细</h4>
                    <div className="space-y-2">
                      {budget.expenses.map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{formatDate(expense.expense_date)}</span>
                            <span className="text-gray-900">{expense.description}</span>
                          </div>
                          <span className="font-medium text-gray-900">-{formatCurrency(expense.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? '编辑预算科目' : '新增预算科目'}
        size="md"
      >
        <div className="space-y-5">
          <Input
            label="科目名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如：助学金"
          />
          <Input
            label="分配金额 (元)"
            type="number"
            value={formData.allocated_amount}
            onChange={(e) => setFormData({ ...formData, allocated_amount: e.target.value })}
            placeholder="例如：500000"
          />
          <Textarea
            label="科目说明"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请输入预算科目的说明"
            rows={3}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {editingBudget ? '保存修改' : '创建科目'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
