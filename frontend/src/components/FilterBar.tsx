import React, { useEffect, useState } from 'react';
import { Select, DatePicker, Button, Space, Form } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useFilterStore } from '@/store/useFilterStore';
import { apiService } from '@/services/api';
import { FilterOptions } from '@/types';

const { MonthPicker } = DatePicker;

const FilterBar: React.FC = () => {
  const { filters, setMemberTypes, setStores, setCoaches, setCourses, setMonth, resetFilters } = useFilterStore();
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFilterOptions();
      setOptions(data);
    } catch (error) {
      console.error('加载筛选选项失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (date: any) => {
    setMonth(date ? date.format('YYYY-MM') : undefined);
  };

  return (
    <div className="filter-bar">
      <Form layout="inline">
        <Form.Item label="月份">
          <MonthPicker
            placeholder="全部月份"
            style={{ width: 160 }}
            onChange={handleMonthChange}
            allowClear
          />
        </Form.Item>

        <Form.Item label="会员类型">
          <Select
            mode="multiple"
            placeholder="全部"
            style={{ width: 160 }}
            value={filters.memberTypeIds}
            onChange={setMemberTypes}
            loading={loading}
            options={options?.memberTypes.map(mt => ({
              label: mt.name,
              value: mt.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="门店">
          <Select
            mode="multiple"
            placeholder="全部"
            style={{ width: 160 }}
            value={filters.storeIds}
            onChange={setStores}
            loading={loading}
            options={options?.stores.map(s => ({
              label: s.name,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="教练">
          <Select
            mode="multiple"
            placeholder="全部"
            style={{ width: 180 }}
            value={filters.coachIds}
            onChange={setCoaches}
            loading={loading}
            showSearch
            optionFilterProp="children"
            options={options?.coaches.map(c => ({
              label: `${c.name} (${c.store})`,
              value: c.id,
            }))}
          />
        </Form.Item>

        <Form.Item label="课程">
          <Select
            mode="multiple"
            placeholder="全部"
            style={{ width: 180 }}
            value={filters.courseIds}
            onChange={setCourses}
            loading={loading}
            showSearch
            optionFilterProp="children"
            options={options?.courses.map(c => ({
              label: `${c.name} (${c.category})`,
              value: c.id,
            }))}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              重置筛选
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default FilterBar;
