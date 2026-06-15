import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Input,
  Select,
  message,
  Modal,
} from 'antd';
import { SearchOutlined, UserAddOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPublicSeaLeads,
  claimPublicSeaLead,
  fetchLeadSources,
} from '../../store/slices/leadsSlice';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const PublicSea = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { leads, sources, loading } = useSelector(state => state.leads);
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState(null);
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    loadData();
    dispatch(fetchLeadSources());
  }, [dispatch]);

  const loadData = () => {
    const params = { is_public_sea: true };
    if (searchText) params.search = searchText;
    if (sourceFilter) params.source = sourceFilter;
    dispatch(fetchPublicSeaLeads(params));
  };

  const handleClaim = (record) => {
    setSelectedLead(record);
    setClaimModalVisible(true);
  };

  const confirmClaim = async () => {
    if (selectedLead) {
      const result = await dispatch(claimPublicSeaLead(selectedLead.id));
      if (claimPublicSeaLead.fulfilled.match(result)) {
        message.success('领取成功');
        setClaimModalVisible(false);
        loadData();
      } else {
        message.error('领取失败');
      }
    }
  };

  const getQualityColor = (quality) => {
    const colors = { high: 'green', medium: 'gold', low: 'red' };
    return colors[quality] || 'default';
  };

  const getQualityText = (quality) => {
    const texts = { high: '高质量', medium: '中质量', low: '低质量' };
    return texts[quality] || quality;
  };

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/leads/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
    },
    {
      title: '线索来源',
      dataIndex: 'source_name',
      key: 'source_name',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status_name',
      key: 'status_name',
      render: (text) => <Tag>{text || '新线索'}</Tag>,
    },
    {
      title: '质量等级',
      dataIndex: 'quality',
      key: 'quality',
      render: (quality) => (
        <Tag color={getQualityColor(quality)}>
          {getQualityText(quality)}
        </Tag>
      ),
    },
    {
      title: '质量评分',
      dataIndex: 'quality_score',
      key: 'quality_score',
      render: (score) => `${score}分`,
    },
    {
      title: '预计金额',
      dataIndex: 'expected_amount',
      key: 'expected_amount',
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
    },
    {
      title: '入池时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => navigate(`/leads/${record.id}`)}>查看</a>
          <Button type="primary" size="small" onClick={() => handleClaim(record)}>
            领取
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="搜索客户姓名/电话"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={(value) => {
              setSearchText(value);
              loadData();
            }}
            style={{ width: 300 }}
          />
          <Select
            placeholder="线索来源"
            allowClear
            style={{ width: 180 }}
            onChange={(value) => {
              setSourceFilter(value);
              loadData();
            }}
          >
            {sources.map(source => (
              <Option key={source.id} value={source.id}>{source.name}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <ShopOutlined />
            公海线索池
          </Space>
        }
        extra={
          <Tag color="blue">
            共 {leads.length} 条公海线索
          </Tag>
        }
      >
        <Table
          columns={columns}
          dataSource={leads}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="确认领取"
        open={claimModalVisible}
        onOk={confirmClaim}
        onCancel={() => setClaimModalVisible(false)}
        okText="确认领取"
        cancelText="取消"
      >
        <p>确定要领取此线索吗？领取后该线索将归属您管理。</p>
        {selectedLead && (
          <p>
            客户：<strong>{selectedLead.customer_name}</strong>
          </p>
        )}
      </Modal>
    </div>
  );
};

export default PublicSea;
