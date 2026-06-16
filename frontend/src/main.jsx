import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import App from './App.jsx';
import './styles/global.less';

dayjs.locale('zh-cn');

const themeConfig = {
  algorithm: [theme.defaultAlgorithm],
  token: {
    colorPrimary: '#1677ff',
    colorInfo: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
    fontSize: 14,
  },
  components: {
    Layout: { headerBg: '#001529', headerHeight: 56, siderBg: '#001529' },
    Menu: { darkItemBg: '#001529', darkSubMenuItemBg: '#000c17', darkItemSelectedBg: '#1677ff' },
    Table: { headerBg: '#fafafa', headerSortActiveBg: '#e6f4ff', borderColor: '#f0f0f0' },
    Card: { borderRadiusLG: 10 },
    Button: { controlHeight: 34, borderRadius: 6 },
    Input: { controlHeight: 34 },
    Select: { controlHeight: 34 },
    DatePicker: { controlHeight: 34 },
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN} theme={themeConfig} dayjsLocale={zhCN}>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
