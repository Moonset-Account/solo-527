import { Button, Card, Descriptions, Divider, Space } from 'antd';
import { ArrowLeftOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const BatchDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/batches')}>
          返回列表
        </Button>
      </Space>
      <Card
        title={`批次详情 #${id}`}
        extra={
          <Space>
            <Button icon={<QrcodeOutlined />}>查看二维码</Button>
            <Button type="primary" icon={<EditOutlined />}>
              编辑
            </Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="批次编号">-</Descriptions.Item>
          <Descriptions.Item label="状态">-</Descriptions.Item>
          <Descriptions.Item label="地块">-</Descriptions.Item>
          <Descriptions.Item label="品种">-</Descriptions.Item>
          <Descriptions.Item label="种植日期">-</Descriptions.Item>
          <Descriptions.Item label="预计采收">-</Descriptions.Item>
          <Descriptions.Item label="实际采收">-</Descriptions.Item>
          <Descriptions.Item label="产量(kg)">-</Descriptions.Item>
          <Descriptions.Item label="技术员">-</Descriptions.Item>
          <Descriptions.Item label="创建时间">-</Descriptions.Item>
        </Descriptions>
        <Divider orientation="left">环境数据</Divider>
        <p style={{ color: '#999' }}>暂无环境数据...</p>
        <Divider orientation="left">申报材料</Divider>
        <p style={{ color: '#999' }}>暂无申报材料...</p>
        <Divider orientation="left">关联订单</Divider>
        <p style={{ color: '#999' }}>暂无关联订单...</p>
      </Card>
    </div>
  );
};

export default BatchDetail;
