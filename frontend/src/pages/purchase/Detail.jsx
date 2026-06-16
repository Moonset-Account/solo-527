import React from 'react';
import { Card, Typography } from 'antd';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

export default function Detail() {
  const { id } = useParams();
  return (
    <Card>
      <Title level={4}>采购订单详情 - {id}</Title>
      <p>页面开发中...</p>
    </Card>
  );
}
