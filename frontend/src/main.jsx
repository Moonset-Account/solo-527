
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  &lt;React.StrictMode&gt;
    &lt;ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#13c2c2' } }}&gt;
      &lt;App /&gt;
    &lt;/ConfigProvider&gt;
  &lt;/React.StrictMode&gt;,
)
