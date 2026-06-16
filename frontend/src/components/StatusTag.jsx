import React from 'react';
import { Tag } from 'antd';
import {
  PURCHASE_STATUS,
  INBOUND_STATUS,
  OUTBOUND_STATUS,
  EXCEPTION_STATUS,
  BATCH_STATUS,
  BATCH_OP_STATUS,
  QC_STATUS,
  EXCEPTION_TYPE,
  ALERT_TYPE,
} from '../utils/constants.js';

const STATUS_MAP = {
  PURCHASE_STATUS,
  INBOUND_STATUS,
  OUTBOUND_STATUS,
  EXCEPTION_STATUS,
  BATCH_STATUS,
  BATCH_OP_STATUS,
  QC_STATUS,
  EXCEPTION_TYPE,
  ALERT_TYPE,
};

export default function StatusTag({ statusKey, value, ...rest }) {
  const dict = STATUS_MAP[statusKey];
  if (!dict || !value) {
    return <Tag color="default" {...rest}>{value || '-'}</Tag>;
  }
  const cfg = dict[value];
  if (!cfg) {
    return <Tag color="default" {...rest}>{value}</Tag>;
  }
  return (
    <Tag color={cfg.color || 'default'} {...rest}>
      {cfg.label || value}
    </Tag>
  );
}
