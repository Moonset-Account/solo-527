import React from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { downloadBlob, handleApiError } from '../utils/helpers';

const DataExportButton = ({ exportAPI, filename, params = {}, children }) => {
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await exportAPI(params);
      const disposition = response.headers['content-disposition'];
      let exportFilename = filename;
      if (disposition) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches) {
          exportFilename = matches[1];
        }
      }
      downloadBlob(response.data, exportFilename);
      message.success('导出成功');
    } catch (error) {
      message.error(handleApiError(error, '导出失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={handleExport}
      loading={loading}
    >
      {children || '导出数据'}
    </Button>
  );
};

export default DataExportButton;
