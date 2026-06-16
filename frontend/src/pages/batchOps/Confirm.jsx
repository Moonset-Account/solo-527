import React from 'react';
import { Card, Typography } from 'antd';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

export default function Confirm() {
  const { id } = useParams();
  return (
    <Card>
      <Title level={4}>批量操作确认 - {id}</Title>
      <p>页面开发中...</p>
    </Card>
  );
}
