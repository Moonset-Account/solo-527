import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound = ({ code = '404', message = '页面不存在' }) => {
  const navigate = useNavigate();

  return (
    <Result
      status={code}
      title={code}
      subTitle={message}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      }
    />
  );
};

export default NotFound;
