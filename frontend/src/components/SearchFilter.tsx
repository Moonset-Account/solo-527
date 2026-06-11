import React from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export interface SearchFilterValues {
  keyword?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
}

interface SearchFilterProps {
  keywordPlaceholder?: string;
  statusOptions?: { label: string; value: string }[];
  showStatus?: boolean;
  onSearch: (values: SearchFilterValues) => void;
  onReset?: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  keywordPlaceholder = '请输入关键字搜索',
  statusOptions = [],
  showStatus = true,
  onSearch,
  onReset,
}) => {
  const [form] = Form.useForm();

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const result: SearchFilterValues = {
      keyword: values.keyword,
      status: values.status,
    };
    if (values.dateRange && values.dateRange.length === 2) {
      result.startTime = values.dateRange[0].startOf('day').toISOString();
      result.endTime = values.dateRange[1].endOf('day').toISOString();
    }
    onSearch(result);
  };

  const handleReset = () => {
    form.resetFields();
    onReset?.();
    onSearch({});
  };

  return (
    <Form form={form} layout="inline" style={{ marginBottom: 16 }} onFinish={handleSearch}>
      <Row gutter={16} style={{ width: '100%' }}>
        <Col>
          <Form.Item name="keyword">
            <Input placeholder={keywordPlaceholder} allowClear style={{ width: 240 }} />
          </Form.Item>
        </Col>
        {showStatus && statusOptions.length > 0 && (
          <Col>
            <Form.Item name="status">
              <Select placeholder="状态" allowClear style={{ width: 160 }} options={statusOptions} />
            </Form.Item>
          </Col>
        )}
        <Col>
          <Form.Item name="dateRange">
            <RangePicker showTime />
          </Form.Item>
        </Col>
        <Col>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};

export default SearchFilter;
