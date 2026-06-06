import React from 'react';
import { DatePicker, Select, Button, Space, Card, Tag, Popover, List, Typography } from 'antd';
import { FilterOutlined, ReloadOutlined, SaveOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDashboardStore } from '../../store/dashboard';
import { FilterState } from '../../types';
import { api } from '../../services/api';
import { saveAs } from 'file-saver';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface FilterBarProps {
  onSaveView: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onSaveView }) => {
  const {
    filters,
    filterOptions,
    setFilters,
    resetFilters,
    savedViews,
    loadView,
    deleteView,
    fetchDashboardData
  } = useDashboardStore();

  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters({
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD')
      });
    } else {
      setFilters({ start_date: undefined, end_date: undefined });
    }
  };

  const handleSelectChange = (key: keyof FilterState, value: any) => {
    setFilters({ [key]: value?.length > 0 ? value : undefined });
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportReport(filters);
      saveAs(blob, `退货分析报告_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const activeFilterTags = [
    filters.store_ids?.length ? `店铺: ${filters.store_ids.length}项` : null,
    filters.product_ids?.length ? `商品: ${filters.product_ids.length}项` : null,
    filters.product_categories?.length ? `品类: ${filters.product_categories.length}项` : null,
    filters.warehouse_ids?.length ? `仓库: ${filters.warehouse_ids.length}项` : null,
    filters.logistics_providers?.length ? `物流: ${filters.logistics_providers.length}项` : null,
    filters.return_reasons_level1?.length ? `原因: ${filters.return_reasons_level1.length}项` : null,
  ].filter(Boolean);

  const savedViewsContent = (
    <div style={{ width: 300 }}>
      <List
        size="small"
        dataSource={savedViews}
        renderItem={(view) => (
          <List.Item
            actions={[
              <Button type="link" size="small" onClick={() => loadView(view)}>加载</Button>,
              <Button type="link" size="small" danger onClick={() => deleteView(view.id)}>删除</Button>
            ]}
          >
            <List.Item.Meta
              title={<Text strong>{view.name}</Text>}
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {Object.keys(view.filters).length} 个筛选条件
                </Text>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: '暂无保存的视图' }}
      />
    </div>
  );

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space wrap size="middle">
        <RangePicker
          value={filters.start_date && filters.end_date ? [
            dayjs(filters.start_date),
            dayjs(filters.end_date)
          ] : null}
          onChange={handleDateChange}
          allowClear
          placeholder={['开始日期', '结束日期']}
        />

        <Select
          mode="multiple"
          placeholder="选择店铺"
          style={{ minWidth: 140 }}
          value={filters.store_ids}
          onChange={(v) => handleSelectChange('store_ids', v)}
          allowClear
          maxTagCount="responsive"
        >
          {filterOptions?.stores.map(s => (
            <Option key={s.id} value={s.id}>{s.name}</Option>
          ))}
        </Select>

        <Select
          mode="multiple"
          placeholder="选择品类"
          style={{ minWidth: 140 }}
          value={filters.product_categories}
          onChange={(v) => handleSelectChange('product_categories', v)}
          allowClear
          maxTagCount="responsive"
        >
          {filterOptions?.product_categories.map(c => (
            <Option key={c.name} value={c.name}>{c.name}</Option>
          ))}
        </Select>

        <Select
          mode="multiple"
          placeholder="选择商品"
          style={{ minWidth: 200 }}
          value={filters.product_ids}
          onChange={(v) => handleSelectChange('product_ids', v)}
          allowClear
          maxTagCount="responsive"
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {filterOptions?.products.map(p => (
            <Option key={p.id} value={p.id}>{p.name}</Option>
          ))}
        </Select>

        <Select
          mode="multiple"
          placeholder="选择仓库"
          style={{ minWidth: 140 }}
          value={filters.warehouse_ids}
          onChange={(v) => handleSelectChange('warehouse_ids', v)}
          allowClear
          maxTagCount="responsive"
        >
          {filterOptions?.warehouses.map(w => (
            <Option key={w.id} value={w.id}>{w.name}</Option>
          ))}
        </Select>

        <Select
          mode="multiple"
          placeholder="选择物流商"
          style={{ minWidth: 140 }}
          value={filters.logistics_providers}
          onChange={(v) => handleSelectChange('logistics_providers', v)}
          allowClear
          maxTagCount="responsive"
        >
          {filterOptions?.logistics_providers.map(l => (
            <Option key={l.name} value={l.name}>{l.name}</Option>
          ))}
        </Select>

        <Select
          mode="multiple"
          placeholder="退货原因"
          style={{ minWidth: 140 }}
          value={filters.return_reasons_level1}
          onChange={(v) => handleSelectChange('return_reasons_level1', v)}
          allowClear
          maxTagCount="responsive"
        >
          {filterOptions?.return_reasons_level1.map(r => (
            <Option key={r.name} value={r.name}>{r.name}</Option>
          ))}
        </Select>

        <Button type="primary" icon={<FilterOutlined />} onClick={fetchDashboardData}>
          查询
        </Button>

        <Button icon={<ReloadOutlined />} onClick={resetFilters}>
          重置
        </Button>

        <Button icon={<SaveOutlined />} onClick={onSaveView}>
          保存视图
        </Button>

        <Popover
          title="已保存视图"
          content={savedViewsContent}
          trigger="click"
          placement="bottom"
        >
          <Button>视图库 ({savedViews.length})</Button>
        </Popover>

        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} ghost>
          导出报告
        </Button>
      </Space>

      {activeFilterTags.length > 0 && (
        <Space size="small" style={{ marginTop: 12 }} wrap>
          <Text type="secondary" style={{ fontSize: 12 }}>当前筛选:</Text>
          {activeFilterTags.map((tag, i) => (
            <Tag key={i} color="blue">{tag}</Tag>
          ))}
        </Space>
      )}
    </Card>
  );
};
