import React from 'react';
import { Form, Button, Input, Select, DatePicker, Space } from 'antd';
import { SearchOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { FilterField } from '../../types';

const { RangePicker } = DatePicker;

interface QuickFilterBarProps {
  fields: FilterField[];
  onFilter: (values: Record<string, any>) => void;
  onReset: () => void;
  loading?: boolean;
}

const renderFieldItem = (field: FilterField) => {
  switch (field.type) {
    case 'input':
    case 'search':
      return (
        <Input
          placeholder={`请输入${field.label}`}
          allowClear
          prefix={field.type === 'search' ? <SearchOutlined /> : undefined}
        />
      );
    case 'select':
      return (
        <Select
          placeholder={`请选择${field.label}`}
          allowClear
          options={field.options?.map((opt: { value: string | number; label: string }) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      );
    case 'dateRange':
      return <RangePicker style={{ width: '100%' }} />;
    default:
      return <Input placeholder={`请输入${field.label}`} allowClear />;
  }
};

const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  fields,
  onFilter,
  onReset,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleFilter = () => {
    const values = form.getFieldsValue();
    const processedValues: Record<string, any> = {};

    Object.keys(values).forEach((key) => {
      const val = values[key];
      if (val === undefined || val === null || val === '') {
        return;
      }
      if (Array.isArray(val) && val.length === 2 && dayjs.isDayjs(val[0]) && dayjs.isDayjs(val[1])) {
        processedValues[key] = [
          (val[0] as Dayjs).format('YYYY-MM-DD'),
          (val[1] as Dayjs).format('YYYY-MM-DD'),
        ];
      } else {
        processedValues[key] = val;
      }
    });

    onFilter(processedValues);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form
      form={form}
      layout="inline"
      style={{ rowGap: 16, marginBottom: 16 }}
      onFinish={handleFilter}
    >
      {fields.map((field) => (
        <Form.Item key={field.name} name={field.name} label={field.label}>
          {renderFieldItem(field)}
        </Form.Item>
      ))}
      <Form.Item>
        <Space>
          <Button onClick={handleFilter} loading={loading}>
            搜索
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={handleFilter}
            loading={loading}
          >
            一键过滤
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default QuickFilterBar;
