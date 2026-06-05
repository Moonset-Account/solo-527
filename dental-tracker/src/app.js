const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const packRoutes = require('./routes/packs');
const batchRoutes = require('./routes/batches');
const autoclaveRoutes = require('./routes/autoclaves');
const departmentRoutes = require('./routes/departments');
const recallRoutes = require('./routes/recall');
const kanbanRoutes = require('./routes/kanban');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/autoclaves', autoclaveRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/recall', recallRoutes);
app.use('/api/kanban', kanbanRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;
