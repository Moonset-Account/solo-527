import React from 'react';
import {
  Form,
  Select,
  InputNumber,
  Switch,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  Card,
} from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import { FilterParams, CHANNELS, CONDITIONS } from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface FilterPanelProps {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
  onSearch: () => void;
  onReset: () => void;
  onExport: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onSearch,
  onReset,
  onExport,
}) => {
  const [form] = Form.useForm();

  const handleFormChange = (_: any, allValues: any) => {
    const newFilters: FilterParams = {
      ...filters,
      ...allValues,
      start_date: allValues.date_range ? allValues.date_range[0]?.toISOString() : undefined,
      end_date: allValues.date_range ? allValues.date_range[1]?.toISOString() : undefined,
    };
    delete (newFilters as any).date_range;
    onChange(newFilters);
  };

  const initialValues = {
    ...filters,
    date_range:
      filters.start_date && filters.end_date
        ? [dayjs(filters.start_date), dayjs(filters.end_date)]
        : undefined,
  };

  return (
    <Card title="筛选条件" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleFormChange}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="channels" label="回收渠道">
              <Select
                mode="multiple"
                placeholder="选择渠道"
                options={CHANNELS}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="conditions" label="品相">
              <Select
                mode="multiple"
                placeholder="选择品相"
                options={CONDITIONS}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="isbn_keyword" label="ISBN关键词">
              <Input placeholder="输入ISBN" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="title_keyword" label="书名关键词">
              <Input placeholder="输入书名" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="min_days_in_stock" label="最小在库天数">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="最小天数" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="max_days_in_stock" label="最大在库天数">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="最大天数" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="min_recycle_price" label="最小回收价">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="元" prefix="¥" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="max_recycle_price" label="最大回收价">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="元" prefix="¥" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="date_range" label="回收日期范围">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="only_abnormal" label="仅显示异常" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="only_unsold" label="仅显示未售出" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8} style={{ textAlign: 'right', paddingTop: 30 }}>
            <Button icon={<SearchOutlined />} type="primary" onClick={onSearch} style={{ marginRight: 8 }}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReset} style={{ marginRight: 8 }}>
              重置
            </Button>
            <Button icon={<ExportOutlined />} onClick={onExport}>
              导出报表
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default FilterPanel;
