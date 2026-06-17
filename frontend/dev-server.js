const express = require('express');
const httpProxy = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 4200;
const API_TARGET = 'http://localhost:3002';
const DIST = path.join(__dirname, 'dist', 'summit-frontend');

app.use('/api', httpProxy.createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  logLevel: 'warn',
}));

app.use(express.static(DIST, { index: false, extensions: ['html'] }));

app.get('/*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 开发服务器已启动: http://localhost:${PORT}`);
  console.log(`🔐 管理登录:    http://localhost:${PORT}/admin/login`);
  console.log(`🌐 参会端首页:  http://localhost:${PORT}/`);
  console.log(`⚙️  API 代理:    /api → ${API_TARGET}\n`);
});
