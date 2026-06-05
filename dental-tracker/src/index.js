require('dotenv').config();
const app = require('./app');
const { startNotificationRetryTask } = require('./tasks/notification-retry');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`口腔诊所器械消毒追踪系统已启动: http://localhost:${PORT}`);
  startNotificationRetryTask();
});
