import React from 'react';
import { Select, Tag } from 'antd';
import type { SelectProps } from 'antd';
import type { EnumType } from '../../types';

interface EnumSelectOption {
  value: string;
  label: string;
  color: string;
}

interface EnumSelectProps extends Omit<SelectProps, 'mode' | 'options'> {
  enumType: EnumType;
  multiple?: boolean;
}

const batchStatusOptions: EnumSelectOption[] = [
  { value: 'Pending', label: '待采收', color: 'default' },
  { value: 'Harvesting', label: '采收中', color: 'processing' },
  { value: 'Completed', label: '已完成', color: 'success' },
  { value: 'Cancelled', label: '已取消', color: 'error' },
];

const alertLevelOptions: EnumSelectOption[] = [
  { value: 'Info', label: '信息', color: 'blue' },
  { value: 'Warning', label: '警告', color: 'orange' },
  { value: 'Critical', label: '严重', color: 'red' },
];

const alertStatusOptions: EnumSelectOption[] = [
  { value: 'Active', label: '活跃', color: 'red' },
  { value: 'Acknowledged', label: '已确认', color: 'orange' },
  { value: 'Resolved', label: '已解决', color: 'green' },
];

const materialStatusOptions: EnumSelectOption[] = [
  { value: 'Missing', label: '缺失', color: 'default' },
  { value: 'Submitted', label: '已提交', color: 'processing' },
  { value: 'Approved', label: '已通过', color: 'success' },
  { value: 'Rejected', label: '已驳回', color: 'error' },
];

const orderStatusOptions: EnumSelectOption[] = [
  { value: 'Created', label: '已创建', color: 'default' },
  { value: 'Fulfilling', label: '履约中', color: 'processing' },
  { value: 'Fulfilled', label: '已履约', color: 'success' },
  { value: 'Overdue', label: '已逾期', color: 'error' },
];

const userRoleOptions: EnumSelectOption[] = [
  { value: 'Admin', label: '管理员', color: 'purple' },
  { value: 'Technician', label: '农技员', color: 'blue' },
  { value: 'Operator', label: '操作员', color: 'cyan' },
  { value: 'Manager', label: '运营经理', color: 'geekblue' },
];

const enumOptionsMap: Record<EnumType, EnumSelectOption[]> = {
  batchStatus: batchStatusOptions,
  alertLevel: alertLevelOptions,
  alertStatus: alertStatusOptions,
  materialStatus: materialStatusOptions,
  orderStatus: orderStatusOptions,
  userRole: userRoleOptions,
};

const renderTag = (props: { label: React.ReactNode; value: string; color?: string }) => {
  const { label, value, color } = props;
  const option = (color ? { color } : null) as EnumSelectOption | null;
  const displayColor = option?.color || 'default';
  return (
    <Tag color={displayColor} key={value}>
      {label}
    </Tag>
  );
};

const EnumSelect: React.FC<EnumSelectProps> = ({ enumType, multiple, ...rest }) => {
  const options = enumOptionsMap[enumType];

  return (
    <Select
      mode={multiple ? 'multiple' : undefined}
      options={options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        color: opt.color,
      }))}
      tagRender={multiple ? (props) => {
        const option = options.find((o) => o.value === props.value);
        return renderTag({ label: props.label, value: props.value, color: option?.color });
      } : undefined}
      optionRender={(option) => {
        const opt = options.find((o) => o.value === option.value);
        return (
          <Tag color={opt?.color || 'default'}>
            {option.label}
          </Tag>
        );
      }}
      {...rest}
    />
  );
};

export default EnumSelect;
