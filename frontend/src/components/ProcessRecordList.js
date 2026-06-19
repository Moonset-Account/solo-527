import React from 'react';
import { Empty } from 'antd';
import { formatDateTime } from '../utils/helpers';

const ProcessRecordList = ({ records }) => {
  if (!records || records.length === 0) {
    return <Empty description="暂无处理记录" />;
  }

  return (
    <div>
      {records.map((record, index) => (
        <div key={index} className="process-record-item">
          <div className="record-header">
            <span className="record-operator">
              {record.operator_name || record.operator?.username || '系统'}
            </span>
            <span className="record-time">
              {formatDateTime(record.processed_at)}
            </span>
          </div>
          <div className="record-content">{record.content}</div>
          {record.remark && (
            <div className="record-remark">备注：{record.remark}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProcessRecordList;
