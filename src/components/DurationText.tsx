import React from 'react';

interface DurationTextProps {
  seconds?: number;
}

export const DurationText: React.FC<DurationTextProps> = ({ seconds }) => {
  if (!seconds) return <span style={{ color: '#8c8c8c' }}>--</span>;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let text = '';
  if (hours > 0) text += `${hours}小时`;
  if (minutes > 0) text += `${minutes}分钟`;
  if (hours === 0 && minutes === 0) text += `${secs}秒`;

  return <span>{text}</span>;
};

export default DurationText;
