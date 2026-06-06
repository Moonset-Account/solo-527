import React from 'react';
import { Alert } from 'antd';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { ValidationResult } from '../../data/types';

interface DataQualityAlertProps {
  validation: ValidationResult;
}

export const DataQualityAlert: React.FC<DataQualityAlertProps> = ({ validation }) => {
  if (validation.warnings.length === 0 && !validation.hasMissingValues && !validation.hasAnomalies) {
    return null;
  }
  
  const alertType = validation.hasAnomalies ? 'error' : validation.hasMissingValues ? 'warning' : 'info';
  const icon = validation.hasAnomalies ? <AlertTriangle size={18} /> : validation.hasMissingValues ? <AlertCircle size={18} /> : <Info size={18} />;
  
  return (
    <Alert
      type={alertType}
      showIcon
      icon={icon}
      message="数据质量提示"
      description={
        <ul className="list-disc list-inside text-sm space-y-0.5">
          {validation.warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      }
      className="mb-4"
    />
  );
};
